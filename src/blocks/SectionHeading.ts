import type { Block } from "payload";

export const SectionHeading: Block = {
  slug: "section-heading",
  labels: {
    singular: "Titre de section",
    plural: "Titres de section",
  },
  fields: [
    {
      name: "text",
      label: "Texte",
      type: "text",
      required: true,
      admin: {
        description: "Titre éditorial sobre, sans préfixe décoratif.",
      },
    },
  ],
};

export default SectionHeading;
