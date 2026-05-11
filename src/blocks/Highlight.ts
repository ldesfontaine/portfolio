import type { Block } from "payload";

export const Highlight: Block = {
  slug: "highlight",
  labels: {
    singular: "Encart en surbrillance",
    plural: "Encarts en surbrillance",
  },
  fields: [
    {
      name: "content",
      label: "Contenu",
      type: "richText",
      required: true,
      admin: {
        description: "Bloc d'emphase rendu avec le composant Highlight (bordure colorée).",
      },
    },
  ],
};

export default Highlight;
