import type { Block } from "payload";

export const Paragraph: Block = {
  slug: "paragraph",
  labels: {
    singular: "Paragraphe",
    plural: "Paragraphes",
  },
  fields: [
    {
      name: "text",
      label: "Texte",
      type: "richText",
      required: true,
      admin: {
        description: "Texte courant. Le gras (`<strong>`) est rendu en accent neutre fort.",
      },
    },
  ],
};

export default Paragraph;
