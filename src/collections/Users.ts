import type { CollectionConfig } from "payload";

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
  fields: [],
};

export default Users;
