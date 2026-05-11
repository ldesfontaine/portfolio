import type { CollectionConfig } from "payload";

export const Users: CollectionConfig = {
  slug: "users",
  admin: {
    useAsTitle: "email",
  },
  auth: {
    forgotPassword: {
      generateEmailHTML: () => "Password reset is disabled in this deployment.",
    },
  },
  fields: [],
};

export default Users;
