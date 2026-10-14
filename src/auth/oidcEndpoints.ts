import { randomUUID } from "node:crypto";

import { getFieldsToSign, jwtSign, type Endpoint, type PayloadRequest } from "payload";
import { generatePayloadCookie, parseCookies } from "payload/shared";

import {
  OIDC_CALLBACK_PATH,
  OIDC_LOGIN_PATH,
  OIDC_TRANSACTION_COOKIE,
  OIDC_TRANSACTION_TTL_SECONDS,
  authorizationUrl,
  checkIdToken,
  identityFromUserinfo,
  newTransaction,
  openTransaction,
  parseDiscovery,
  readOidcSettings,
  sameSecret,
  sealTransaction,
  type OidcDiscovery,
  type OidcRefusal,
  type OidcSettings,
} from "./oidc";

/**
 * Les deux endpoints du bouton « Se connecter avec le SSO » :
 *   GET /api/users/oidc/login     → part vers le fournisseur (Authelia) ;
 *   GET /api/users/oidc/callback  → revient avec un code, ouvre une session
 *                                   Payload ordinaire (même cookie, même
 *                                   déconnexion que le mot de passe).
 * Aucun compte n'est créé : seul un compte dont le champ « Identité SSO »
 * porte le nom Authelia peut être ouvert.
 */

const USERS = "users";
const LOGIN_PAGE = "/admin/login";
const PROVIDER_TIMEOUT_MS = 5000;
const settingsResult = readOidcSettings(process.env);

const nowSeconds = (): number => Math.floor(Date.now() / 1000);

function enabledSettings(req: PayloadRequest): OidcSettings | undefined {
  if (settingsResult.kind === "enabled") return settingsResult.settings;
  if (settingsResult.kind === "invalid") {
    req.payload.logger.error(
      { event: "oidc_login", detail: settingsResult.detail },
      "SSO : configuration OIDC invalide, bouton désactivé",
    );
  }
  return undefined;
}

// ── Appels au fournisseur ────────────────────────────────────────────────────

let discoveryCache: Promise<OidcDiscovery> | undefined;

/** Lu une fois ; un échec n'est pas mis en cache. */
function discover(settings: OidcSettings): Promise<OidcDiscovery> {
  discoveryCache ??= fetchJson(`${settings.issuer}/.well-known/openid-configuration`)
    .then((document) => parseDiscovery(document, settings.issuer))
    .catch((error: unknown) => {
      discoveryCache = undefined;
      throw error;
    });
  return discoveryCache;
}

async function fetchJson(url: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(url, {
    ...init,
    headers: { accept: "application/json", ...init?.headers },
    redirect: "error",
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`${new URL(url).pathname} : HTTP ${response.status}`);
  }
  return response.json();
}

/** Échange du code contre les jetons, authentifié par le secret client. */
async function exchangeCode(
  settings: OidcSettings,
  discovery: OidcDiscovery,
  code: string,
  codeVerifier: string,
): Promise<{ idToken: unknown; accessToken: string }> {
  const credentials = Buffer.from(
    `${encodeURIComponent(settings.clientId)}:${encodeURIComponent(settings.clientSecret)}`,
  ).toString("base64");
  const tokens = (await fetchJson(discovery.tokenEndpoint, {
    method: "POST",
    headers: {
      authorization: `Basic ${credentials}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: settings.redirectUri,
      code_verifier: codeVerifier,
    }),
  })) as Record<string, unknown>;

  if (typeof tokens.access_token !== "string") {
    throw new Error("réponse du point de terminaison token sans access_token");
  }
  return { idToken: tokens.id_token, accessToken: tokens.access_token };
}

function fetchUserinfo(discovery: OidcDiscovery, accessToken: string): Promise<unknown> {
  return fetchJson(discovery.userinfoEndpoint, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
}

// ── Session Payload ──────────────────────────────────────────────────────────

/**
 * Ouvre la même session qu'un login par mot de passe (operations/login de
 * Payload 3.86) : une entrée dans `sessions`, un JWT signé par le secret
 * Payload qui porte son identifiant, le cookie habituel. Le verrouillage après
 * trop de mots de passe faux ne s'applique pas : il protège le mot de passe,
 * pas ce chemin, qui a sa propre 2FA chez le fournisseur.
 */
async function openPayloadSession(
  req: PayloadRequest,
  user: Record<string, unknown> & { id: number | string; email?: string },
): Promise<string> {
  const { payload } = req;
  const collection = payload.collections[USERS].config;

  let sid: string | undefined;
  if (collection.auth.useSessions) {
    sid = randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + collection.auth.tokenExpiration * 1000);
    const sessions = Array.isArray(user.sessions)
      ? (user.sessions as { expiresAt: string | Date }[]).filter(
          ({ expiresAt: expiry }) => new Date(expiry) > now,
        )
      : [];
    await payload.db.updateOne({
      id: user.id,
      collection: USERS,
      data: {
        ...user,
        sessions: [...sessions, { id: sid, createdAt: now, expiresAt }],
        // Comme Payload : ouvrir une session ne compte pas comme une modification.
        updatedAt: null,
      },
      req,
      returning: false,
    });
  }

  const fieldsToSign = getFieldsToSign({
    collectionConfig: collection,
    email: user.email ?? "",
    sid,
    user: { ...user, collection: USERS } as Parameters<typeof getFieldsToSign>[0]["user"],
  });
  const { token } = await jwtSign({
    fieldsToSign,
    secret: payload.secret,
    tokenExpiration: collection.auth.tokenExpiration,
  });
  return generatePayloadCookie({
    collectionAuthConfig: collection.auth,
    cookiePrefix: payload.config.cookiePrefix,
    token,
  }) as string;
}

// ── Réponses ─────────────────────────────────────────────────────────────────

function transactionCookie(value: string, maxAge: number): string {
  return [
    `${OIDC_TRANSACTION_COOKIE}=${value}`,
    `Path=/api/users${OIDC_CALLBACK_PATH}`,
    `Max-Age=${maxAge}`,
    "HttpOnly",
    "SameSite=Lax",
    process.env.NODE_ENV === "production" ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

function redirect(location: string, cookies: string[]): Response {
  const headers = new Headers({ location, "cache-control": "no-store" });
  for (const cookie of cookies) headers.append("set-cookie", cookie);
  return new Response(null, { status: 302, headers });
}

const notFound = (): Response => new Response("Not Found", { status: 404 });

function refuse(
  req: PayloadRequest,
  reason: OidcRefusal,
  extra: Record<string, unknown> = {},
): Response {
  req.payload.logger.warn({ event: "oidc_login", reason, ...extra }, "SSO : connexion refusée");
  return redirect(`${LOGIN_PAGE}?sso=${reason}`, [transactionCookie("", 0)]);
}

// ── Endpoints ────────────────────────────────────────────────────────────────

const login: Endpoint = {
  path: OIDC_LOGIN_PATH,
  method: "get",
  handler: async (req) => {
    const settings = enabledSettings(req);
    if (!settings) return notFound();

    let discovery: OidcDiscovery;
    try {
      discovery = await discover(settings);
    } catch (error) {
      req.payload.logger.error(
        { event: "oidc_login", err: error },
        "SSO : fournisseur OIDC injoignable",
      );
      return redirect(`${LOGIN_PAGE}?sso=provider_unreachable`, []);
    }

    const returnTo = new URL(req.url ?? "", "http://x").searchParams.get("redirect") ?? "";
    const transaction = newTransaction(nowSeconds(), returnTo);
    return redirect(authorizationUrl(settings, discovery, transaction), [
      transactionCookie(
        sealTransaction(transaction, req.payload.secret),
        OIDC_TRANSACTION_TTL_SECONDS,
      ),
    ]);
  },
};

const callback: Endpoint = {
  path: OIDC_CALLBACK_PATH,
  method: "get",
  handler: async (req) => {
    const settings = enabledSettings(req);
    if (!settings) return notFound();

    const params = new URL(req.url ?? "", "http://x").searchParams;
    if (params.get("error")) {
      return refuse(req, "provider_error", { detail: params.get("error") });
    }

    const transaction = openTransaction(
      parseCookies(req.headers).get(OIDC_TRANSACTION_COOKIE),
      req.payload.secret,
      nowSeconds(),
    );
    if (!transaction) return refuse(req, "invalid_transaction");
    if (!sameSecret(params.get("state") ?? "", transaction.state)) {
      return refuse(req, "state_mismatch");
    }
    const code = params.get("code");
    if (!code) return refuse(req, "missing_code");

    let idToken: unknown;
    let userinfo: unknown;
    try {
      const discovery = await discover(settings);
      const tokens = await exchangeCode(settings, discovery, code, transaction.codeVerifier);
      idToken = tokens.idToken;
      userinfo = await fetchUserinfo(discovery, tokens.accessToken);
    } catch (error) {
      req.payload.logger.error(
        { event: "oidc_login", err: error },
        "SSO : échange avec le fournisseur OIDC impossible",
      );
      return redirect(`${LOGIN_PAGE}?sso=provider_unreachable`, [transactionCookie("", 0)]);
    }

    const checked = checkIdToken(idToken, {
      issuer: settings.issuer,
      clientId: settings.clientId,
      nonce: transaction.nonce,
      nowSeconds: nowSeconds(),
    });
    if (!checked.ok) return refuse(req, "invalid_id_token", { detail: checked.detail });

    const identity = identityFromUserinfo(userinfo, checked.subject, settings.requiredGroup);
    if (!identity.ok) {
      return refuse(req, identity.reason, { identity: identity.username });
    }

    const user = await req.payload.db.findOne<
      Record<string, unknown> & { id: number | string; email?: string }
    >({
      collection: USERS,
      req,
      where: { ssoIdentity: { equals: identity.username } },
    });
    if (!user) return refuse(req, "unknown_identity", { identity: identity.username });

    const sessionCookie = await openPayloadSession(req, user);
    req.payload.logger.info(
      { event: "oidc_login", identity: identity.username, userId: user.id },
      "SSO : session ouverte",
    );
    return redirect(transaction.returnTo, [sessionCookie, transactionCookie("", 0)]);
  },
};

export const oidcEndpoints: Endpoint[] = [login, callback];
