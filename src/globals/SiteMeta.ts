import type { GlobalConfig } from "payload";

import { revalidateSiteMeta } from "../hooks/revalidate";

export const SiteMeta: GlobalConfig = {
  slug: "site-meta",
  label: "Métadonnées du site",
  admin: {
    group: "Configuration",
  },
  hooks: {
    afterChange: [revalidateSiteMeta],
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
    {
      name: "cv",
      label: "CV (PDF)",
      type: "upload",
      relationTo: "media",
      admin: {
        description:
          "Optionnel — si vide, le bouton CV n'est pas affiché sur le site.",
      },
    },
  ],
};

export default SiteMeta;
