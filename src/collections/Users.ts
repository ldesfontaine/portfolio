import type { CollectionConfig } from "payload";

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
  // Le SSO ouvre le compte qui a le même e-mail : aucun champ à remplir.
  fields: [],
};

export default Users;
