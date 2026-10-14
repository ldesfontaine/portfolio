import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Connexion à /admin par un fournisseur OpenID Connect (Authelia), en plus du
 * mot de passe Payload. Flux « authorization code » avec PKCE, client
 * confidentiel : le navigateur ne voit jamais que le code, l'échange se fait
 * de serveur à serveur avec le secret client.
 *
 * Ce module ne fait que décider : configuration, URL d'autorisation,
 * transaction scellée, contrôle des réponses du fournisseur. Les appels réseau
 * et l'ouverture de session vivent dans `oidcEndpoints.ts`.
 */

export const OIDC_LOGIN_PATH = "/oidc/login";
export const OIDC_CALLBACK_PATH = "/oidc/callback";
/** Les endpoints sont ceux de la collection users : /api/users/oidc/... */
const USERS_API_PREFIX = "/api/users";
export const OIDC_TRANSACTION_COOKIE = "portfolio-oidc";
/** Le temps de passer le login et la 2FA du fournisseur. */
export const OIDC_TRANSACTION_TTL_SECONDS = 600;
const SCOPES = ["openid", "profile", "email", "groups"];
const MIN_CLIENT_SECRET_LENGTH = 32;
/** Tolérance d'horloge entre le fournisseur et le portfolio. */
const CLOCK_SKEW_SECONDS = 60;

export type OidcSettings = {
  issuer: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  requiredGroup: string | undefined;
  buttonLabel: string;
};

export type OidcSettingsResult =
  | { kind: "disabled" }
  | { kind: "invalid"; detail: string }
  | { kind: "enabled"; settings: OidcSettings };

type Env = Record<string, string | undefined>;

const trimmed = (value: string | undefined): string | undefined => {
  const result = value?.trim();
  return result ? result : undefined;
};

/** Une adresse https, ou http sur la machine locale pour le développement. */
function isAcceptableUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol === "https:") return true;
  return (
    url.protocol === "http:" &&
    (url.hostname === "localhost" || url.hostname === "127.0.0.1")
  );
}

/**
 * Inactif tant que OIDC_ISSUER est vide : le bouton n'apparaît pas et les
 * endpoints répondent 404. Une configuration partielle est une erreur, pas un
 * mode dégradé silencieux.
 */
export function readOidcSettings(env: Env): OidcSettingsResult {
  const issuer = trimmed(env.OIDC_ISSUER)?.replace(/\/+$/, "");
  if (!issuer) return { kind: "disabled" };

  const clientId = trimmed(env.OIDC_CLIENT_ID);
  const clientSecret = trimmed(env.OIDC_CLIENT_SECRET);
  const siteUrl = trimmed(env.SITE_URL)?.replace(/\/+$/, "");

  if (!isAcceptableUrl(issuer)) {
    return { kind: "invalid", detail: "OIDC_ISSUER doit être une adresse https" };
  }
  if (!clientId) return { kind: "invalid", detail: "OIDC_CLIENT_ID est vide" };
  if (!clientSecret || clientSecret.length < MIN_CLIENT_SECRET_LENGTH) {
    return {
      kind: "invalid",
      detail: `OIDC_CLIENT_SECRET doit faire au moins ${MIN_CLIENT_SECRET_LENGTH} caractères`,
    };
  }
  if (!siteUrl || !isAcceptableUrl(siteUrl)) {
    return { kind: "invalid", detail: "SITE_URL doit être l'adresse https du site" };
  }

  return {
    kind: "enabled",
    settings: {
      issuer,
      clientId,
      clientSecret,
      redirectUri: `${siteUrl}${USERS_API_PREFIX}${OIDC_CALLBACK_PATH}`,
      requiredGroup: trimmed(env.OIDC_REQUIRED_GROUP),
      buttonLabel: trimmed(env.OIDC_BUTTON_LABEL) ?? "Se connecter avec le SSO",
    },
  };
}

/** Comme Payload stocke les e-mails : sans espaces, en minuscules. */
export function normalizeEmail(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const result = value.trim().toLowerCase();
  return result.includes("@") ? result : undefined;
}

// ── Transaction : état, nonce et vérificateur PKCE ───────────────────────────

/** Ce que le portfolio retient entre le départ vers le fournisseur et le retour. */
export type OidcTransaction = {
  state: string;
  nonce: string;
  codeVerifier: string;
  /** Page de l'admin où revenir (paramètre « redirect » de l'écran de login). */
  returnTo: string;
  /** Instant d'expiration, en secondes depuis l'epoch. */
  expiresAt: number;
};

const base64url = (buffer: Buffer): string => buffer.toString("base64url");

function randomToken(): string {
  return base64url(randomBytes(32));
}

export function newTransaction(nowSeconds: number, returnTo: string): OidcTransaction {
  return {
    state: randomToken(),
    nonce: randomToken(),
    codeVerifier: randomToken(),
    returnTo: safeReturnPath(returnTo),
    expiresAt: nowSeconds + OIDC_TRANSACTION_TTL_SECONDS,
  };
}

/** Clé propre au cookie de transaction, dérivée du secret Payload. */
function transactionKey(secret: string): Buffer {
  return createHmac("sha256", secret).update("portfolio-oidc-transaction").digest();
}

function signature(payload: string, secret: string): string {
  return base64url(createHmac("sha256", transactionKey(secret)).update(payload).digest());
}

/**
 * Le cookie n'est pas chiffré : il ne contient que des valeurs à usage unique,
 * inutiles sans le secret client. Il est signé pour qu'un visiteur ne puisse
 * pas choisir son propre état.
 */
export function sealTransaction(transaction: OidcTransaction, secret: string): string {
  const payload = base64url(Buffer.from(JSON.stringify(transaction)));
  return `${payload}.${signature(payload, secret)}`;
}

export function openTransaction(
  sealed: string | undefined,
  secret: string,
  nowSeconds: number,
): OidcTransaction | undefined {
  if (!sealed) return undefined;
  const [payload, mac, extra] = sealed.split(".");
  if (!payload || !mac || extra !== undefined) return undefined;

  const expected = Buffer.from(signature(payload, secret));
  const received = Buffer.from(mac);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return undefined;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return undefined;
  }
  if (!isTransaction(parsed) || parsed.expiresAt <= nowSeconds) return undefined;
  return parsed;
}

function isTransaction(value: unknown): value is OidcTransaction {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.state === "string" &&
    typeof candidate.nonce === "string" &&
    typeof candidate.codeVerifier === "string" &&
    typeof candidate.returnTo === "string" &&
    typeof candidate.expiresAt === "number"
  );
}

export function sameSecret(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

// ── Fournisseur ──────────────────────────────────────────────────────────────

export type OidcDiscovery = {
  issuer: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userinfoEndpoint: string;
};

/** Lit le document /.well-known/openid-configuration ; refuse un autre émetteur. */
export function parseDiscovery(document: unknown, expectedIssuer: string): OidcDiscovery {
  if (typeof document !== "object" || document === null) {
    throw new Error("document de découverte OIDC illisible");
  }
  const doc = document as Record<string, unknown>;
  const field = (name: string): string => {
    const value = doc[name];
    if (typeof value !== "string" || !isAcceptableUrl(value)) {
      throw new Error(`document de découverte OIDC : ${name} absent ou non https`);
    }
    return value;
  };

  const issuer = field("issuer").replace(/\/+$/, "");
  if (issuer !== expectedIssuer) {
    throw new Error(`émetteur OIDC inattendu : ${issuer} (attendu ${expectedIssuer})`);
  }
  return {
    issuer,
    authorizationEndpoint: field("authorization_endpoint"),
    tokenEndpoint: field("token_endpoint"),
    userinfoEndpoint: field("userinfo_endpoint"),
  };
}

export function authorizationUrl(
  settings: OidcSettings,
  discovery: OidcDiscovery,
  transaction: OidcTransaction,
): string {
  const url = new URL(discovery.authorizationEndpoint);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", settings.clientId);
  url.searchParams.set("redirect_uri", settings.redirectUri);
  url.searchParams.set("scope", SCOPES.join(" "));
  url.searchParams.set("state", transaction.state);
  url.searchParams.set("nonce", transaction.nonce);
  url.searchParams.set(
    "code_challenge",
    base64url(createHash("sha256").update(transaction.codeVerifier).digest()),
  );
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

// ── Contrôle de la réponse ───────────────────────────────────────────────────

export type OidcRefusal =
  | "provider_error"
  | "invalid_transaction"
  | "state_mismatch"
  | "missing_code"
  | "invalid_id_token"
  | "subject_mismatch"
  | "missing_email"
  | "missing_group"
  | "unknown_identity";

/**
 * Le jeton d'identité arrive directement du point de terminaison « token »,
 * par TLS, en échange du secret client : OpenID Connect Core 1.0 (§ 3.1.3.7,
 * point 6) admet alors la validation du serveur TLS à la place de la signature.
 * Restent à contrôler l'émetteur, le destinataire, l'expiration et le nonce.
 */
export function checkIdToken(
  idToken: unknown,
  expected: { issuer: string; clientId: string; nonce: string; nowSeconds: number },
): { ok: true; subject: string } | { ok: false; detail: string } {
  if (typeof idToken !== "string") return { ok: false, detail: "id_token absent" };
  const parts = idToken.split(".");
  if (parts.length !== 3) return { ok: false, detail: "id_token mal formé" };

  let claims: Record<string, unknown>;
  try {
    claims = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    return { ok: false, detail: "id_token illisible" };
  }

  const issuer = typeof claims.iss === "string" ? claims.iss.replace(/\/+$/, "") : "";
  if (issuer !== expected.issuer) return { ok: false, detail: "iss" };

  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!audiences.includes(expected.clientId)) return { ok: false, detail: "aud" };
  if (audiences.length > 1 && claims.azp !== expected.clientId) {
    return { ok: false, detail: "azp" };
  }

  if (typeof claims.exp !== "number" || claims.exp + CLOCK_SKEW_SECONDS <= expected.nowSeconds) {
    return { ok: false, detail: "exp" };
  }
  if (typeof claims.nonce !== "string" || !sameSecret(claims.nonce, expected.nonce)) {
    return { ok: false, detail: "nonce" };
  }
  if (typeof claims.sub !== "string" || !claims.sub) return { ok: false, detail: "sub" };

  return { ok: true, subject: claims.sub };
}

/**
 * L'e-mail et les groupes viennent de userinfo : Authelia 4.39 ne les met plus
 * dans le jeton d'identité par défaut. L'e-mail fait le lien avec le compte
 * Payload : il doit être vérifié par le fournisseur (chez Authelia, c'est
 * l'administrateur qui l'écrit, l'utilisateur ne peut pas le changer).
 */
export function identityFromUserinfo(
  userinfo: unknown,
  subject: string,
  requiredGroup: string | undefined,
):
  | { ok: true; email: string }
  | { ok: false; reason: OidcRefusal; email?: string } {
  if (typeof userinfo !== "object" || userinfo === null) {
    return { ok: false, reason: "missing_email" };
  }
  const info = userinfo as Record<string, unknown>;
  if (info.sub !== subject) return { ok: false, reason: "subject_mismatch" };

  const email = normalizeEmail(info.email);
  if (!email || info.email_verified !== true) return { ok: false, reason: "missing_email" };

  if (requiredGroup) {
    const groups = Array.isArray(info.groups) ? info.groups : [];
    if (!groups.includes(requiredGroup)) {
      return { ok: false, reason: "missing_group", email };
    }
  }
  return { ok: true, email };
}

/** Le chemin interne où revenir ; tout le reste retombe sur /admin. */
export function safeReturnPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/admin") || value.startsWith("//")) return "/admin";
  if (/[\\\r\n]/.test(value)) return "/admin";
  return value;
}
