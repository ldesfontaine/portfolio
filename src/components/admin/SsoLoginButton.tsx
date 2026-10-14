import { readOidcSettings } from "../../auth/oidc";
import SsoLoginLink from "./SsoLoginLink";

/**
 * Sous le formulaire de login de Payload : le mot de passe reste la voie
 * normale, le SSO s'ajoute. Rien n'est affiché tant que OIDC_ISSUER est vide.
 */
export default function SsoLoginButton() {
  const oidc = readOidcSettings(process.env);
  if (oidc.kind !== "enabled") return null;
  return <SsoLoginLink label={oidc.settings.buttonLabel} />;
}
