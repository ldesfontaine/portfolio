import type { GlobalConfig } from "payload";

export const SiteMeta: GlobalConfig = {
  slug: "site-meta",
  label: "Métadonnées du site",
  admin: {
    group: "Configuration",
  },
  fields: [
    {
      name: "name",
      label: "Nom",
      type: "text",
    },
    {
      name: "title",
      label: "Titre",
      type: "text",
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
    },
    {
      name: "email",
      label: "Email",
      type: "email",
    },
    {
      name: "github",
      label: "GitHub",
      type: "text",
      admin: {
        description: "URL complète du profil.",
      },
    },
    {
      name: "linkedin",
      label: "LinkedIn",
      type: "text",
      admin: {
        description: "URL complète du profil.",
      },
    },
    {
      name: "location",
      label: "Localisation",
      type: "text",
    },
    {
      name: "availability",
      label: "Disponibilité",
      type: "text",
    },
  ],
};

export default SiteMeta;
