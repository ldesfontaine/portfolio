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
        description: "Rendu en mono uppercase préfixé `//` dans la couleur d'accent.",
      },
    },
  ],
};

export default SectionHeading;
