"use client";

import { useSearchParams } from "next/navigation";

const LOGIN_URL = "/api/users/oidc/login";

/** Codes posés par /api/users/oidc/callback dans ?sso= ; détail dans les logs. */
const MESSAGES: Record<string, string> = {
  missing_group: "Ce compte SSO n'a pas accès à l'administration.",
  unknown_identity:
    "Aucun compte du portfolio n'est lié à ce compte SSO (champ « Identité SSO »).",
  provider_unreachable: "Le SSO ne répond pas. Réessayer, ou utiliser le mot de passe.",
  invalid_transaction: "La connexion a expiré. Réessayer.",
};
const DEFAULT_MESSAGE = "Connexion par le SSO refusée.";

export default function SsoLoginLink({ label }: { label: string }) {
  const params = useSearchParams();
  const error = params.get("sso");
  const redirect = params.get("redirect");
  const href = redirect ? `${LOGIN_URL}?redirect=${encodeURIComponent(redirect)}` : LOGIN_URL;

  return (
    <div style={{ marginTop: "calc(var(--base) * 1.5)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--base)",
          marginBottom: "var(--base)",
          color: "var(--theme-elevation-500)",
        }}
      >
        <hr style={{ flex: 1, margin: 0 }} />
        <span>ou</span>
        <hr style={{ flex: 1, margin: 0 }} />
      </div>
      {error ? (
        <p role="alert" style={{ color: "var(--theme-error-500)" }}>
          {MESSAGES[error] ?? DEFAULT_MESSAGE}
        </p>
      ) : null}
      <a
        className="btn btn--style-secondary btn--size-large"
        href={href}
        style={{ display: "block", width: "100%", textAlign: "center", margin: 0 }}
      >
        {label}
      </a>
    </div>
  );
}
