import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import {
  authorizationUrl,
  checkIdToken,
  identityFromUserinfo,
  newTransaction,
  openTransaction,
  parseDiscovery,
  readOidcSettings,
  safeReturnPath,
  sealTransaction,
  type OidcSettings,
} from "../src/auth/oidc.ts";

const SECRET = "payload-secret-de-test";
const NOW = 1_800_000_000;
const ISSUER = "https://sso.example.com";
const SETTINGS: OidcSettings = {
  issuer: ISSUER,
  clientId: "portfolio",
  clientSecret: "x".repeat(64),
  redirectUri: "https://portfolio.example.com/api/users/oidc/callback",
  requiredGroup: "admins",
  buttonLabel: "Se connecter avec le SSO",
};
const DISCOVERY = {
  issuer: ISSUER,
  authorizationEndpoint: `${ISSUER}/api/oidc/authorization`,
  tokenEndpoint: `${ISSUER}/api/oidc/token`,
  userinfoEndpoint: `${ISSUER}/api/oidc/userinfo`,
};

const b64 = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
const idToken = (claims: Record<string, unknown>) =>
  `${b64({ alg: "RS256" })}.${b64(claims)}.signature`;
const goodClaims = {
  iss: ISSUER,
  aud: ["portfolio"],
  exp: NOW + 300,
  nonce: "le-nonce",
  sub: "uuid-lucas",
};
const expected = { issuer: ISSUER, clientId: "portfolio", nonce: "le-nonce", nowSeconds: NOW };

// ── Configuration ────────────────────────────────────────────────────────────

test("sans OIDC_ISSUER, le SSO est inactif", () => {
  assert.deepEqual(readOidcSettings({}), { kind: "disabled" });
});

test("une configuration complète donne l'adresse de retour sous SITE_URL", () => {
  const result = readOidcSettings({
    OIDC_ISSUER: "https://sso.example.com/",
    OIDC_CLIENT_ID: "portfolio",
    OIDC_CLIENT_SECRET: "s".repeat(64),
    OIDC_REQUIRED_GROUP: "admins",
    SITE_URL: "https://portfolio.example.com/",
  });
  assert.equal(result.kind, "enabled");
  if (result.kind !== "enabled") return;
  assert.equal(result.settings.issuer, ISSUER);
  assert.equal(result.settings.redirectUri, SETTINGS.redirectUri);
  assert.equal(result.settings.requiredGroup, "admins");
});

test("une configuration partielle ou en http est refusée", () => {
  const base = {
    OIDC_ISSUER: ISSUER,
    OIDC_CLIENT_ID: "portfolio",
    OIDC_CLIENT_SECRET: "s".repeat(64),
    SITE_URL: "https://portfolio.example.com",
  };
  assert.equal(readOidcSettings({ ...base, OIDC_CLIENT_SECRET: "court" }).kind, "invalid");
  assert.equal(readOidcSettings({ ...base, OIDC_CLIENT_ID: "" }).kind, "invalid");
  assert.equal(readOidcSettings({ ...base, OIDC_ISSUER: "http://sso.example.com" }).kind, "invalid");
  assert.equal(readOidcSettings({ ...base, SITE_URL: undefined }).kind, "invalid");
});

// ── Transaction ──────────────────────────────────────────────────────────────

test("une transaction scellée se rouvre telle quelle", () => {
  const transaction = newTransaction(NOW, "/admin/collections/posts");
  const opened = openTransaction(sealTransaction(transaction, SECRET), SECRET, NOW + 10);
  assert.deepEqual(opened, transaction);
});

test("une transaction modifiée, signée par un autre secret ou expirée est rejetée", () => {
  const transaction = newTransaction(NOW, "/admin");
  const sealed = sealTransaction(transaction, SECRET);
  const [, mac] = sealed.split(".");
  const forged = `${b64({ ...transaction, state: "choisi" })}.${mac}`;

  assert.equal(openTransaction(forged, SECRET, NOW), undefined);
  assert.equal(openTransaction(sealed, "autre-secret", NOW), undefined);
  assert.equal(openTransaction(sealed, SECRET, transaction.expiresAt), undefined);
  assert.equal(openTransaction(undefined, SECRET, NOW), undefined);
  assert.equal(openTransaction(`${sealed}.x`, SECRET, NOW), undefined);
});

test("le retour ne quitte jamais l'admin", () => {
  assert.equal(safeReturnPath("/admin/collections/posts"), "/admin/collections/posts");
  assert.equal(safeReturnPath("https://evil.example"), "/admin");
  assert.equal(safeReturnPath("//evil.example/admin"), "/admin");
  assert.equal(safeReturnPath("/admin\\@evil"), "/admin");
  assert.equal(safeReturnPath(null), "/admin");
});

// ── Fournisseur ──────────────────────────────────────────────────────────────

test("l'URL d'autorisation porte state, nonce et le défi PKCE S256", () => {
  const transaction = newTransaction(NOW, "/admin");
  const url = new URL(authorizationUrl(SETTINGS, DISCOVERY, transaction));
  assert.equal(url.origin + url.pathname, DISCOVERY.authorizationEndpoint);
  assert.equal(url.searchParams.get("client_id"), "portfolio");
  assert.equal(url.searchParams.get("redirect_uri"), SETTINGS.redirectUri);
  assert.equal(url.searchParams.get("state"), transaction.state);
  assert.equal(url.searchParams.get("nonce"), transaction.nonce);
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.equal(
    url.searchParams.get("code_challenge"),
    createHash("sha256").update(transaction.codeVerifier).digest("base64url"),
  );
  assert.equal(url.searchParams.get("scope"), "openid profile email groups");
});

test("la découverte refuse un autre émetteur", () => {
  const document = {
    issuer: ISSUER,
    authorization_endpoint: DISCOVERY.authorizationEndpoint,
    token_endpoint: DISCOVERY.tokenEndpoint,
    userinfo_endpoint: DISCOVERY.userinfoEndpoint,
  };
  assert.deepEqual(parseDiscovery(document, ISSUER), DISCOVERY);
  assert.throws(() => parseDiscovery({ ...document, issuer: "https://autre.example" }, ISSUER));
  assert.throws(() => parseDiscovery({ ...document, token_endpoint: "http://x" }, ISSUER));
});

// ── Réponse ──────────────────────────────────────────────────────────────────

test("un jeton d'identité conforme donne le sujet", () => {
  assert.deepEqual(checkIdToken(idToken(goodClaims), expected), {
    ok: true,
    subject: "uuid-lucas",
  });
});

test("émetteur, destinataire, expiration ou nonce faux : refus", () => {
  for (const [field, value] of [
    ["iss", "https://autre.example"],
    ["aud", ["autre-client"]],
    ["exp", NOW - 120],
    ["nonce", "rejoué"],
    ["sub", ""],
  ] as const) {
    const result = checkIdToken(idToken({ ...goodClaims, [field]: value }), expected);
    assert.equal(result.ok, false, field);
  }
  assert.equal(checkIdToken(undefined, expected).ok, false);
  assert.equal(checkIdToken("pas.un-jwt", expected).ok, false);
});

test("userinfo : nom normalisé et groupe exigé", () => {
  const info = { sub: "uuid-lucas", preferred_username: " Lucas ", groups: ["admins"] };
  assert.deepEqual(identityFromUserinfo(info, "uuid-lucas", "admins"), {
    ok: true,
    username: "lucas",
  });
  assert.deepEqual(identityFromUserinfo({ ...info, groups: ["famille"] }, "uuid-lucas", "admins"), {
    ok: false,
    reason: "missing_group",
    username: "lucas",
  });
  assert.equal(identityFromUserinfo(info, "autre-sujet", "admins").ok, false);
  assert.equal(identityFromUserinfo({ sub: "uuid-lucas" }, "uuid-lucas", undefined).ok, false);
  assert.equal(identityFromUserinfo({ ...info, groups: [] }, "uuid-lucas", undefined).ok, true);
});
