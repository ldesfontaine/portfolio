import type { CollectionConfig } from "payload";

import { normalizeSsoIdentity } from "../auth/oidc";
import { oidcEndpoints } from "../auth/oidcEndpoints";

export const Users: CollectionConfig = {
  slug: "users",
  labels: {
    singular: "Utilisateur",
    plural: "Utilisateurs",
  },
  admin: {
    useAsTitle: "email",
    group: "Administration",
  },
  auth: {
    forgotPassword: {
      generateEmailHTML: () => "Password reset is disabled in this deployment.",
    },
  },
  // Bouton « Se connecter avec le SSO » (inactif sans OIDC_ISSUER).
  endpoints: oidcEndpoints,
  fields: [
    {
      name: "ssoIdentity",
      type: "text",
      label: "Identité SSO",
      unique: true,
      admin: {
        position: "sidebar",
        description:
          "Nom d'utilisateur chez le fournisseur SSO (Authelia). " +
          "Vide : ce compte ne s'ouvre que par mot de passe.",
      },
      hooks: {
        beforeChange: [({ value }) => normalizeSsoIdentity(value)],
      },
    },
  ],
};

export default Users;
