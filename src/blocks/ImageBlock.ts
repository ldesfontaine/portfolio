import type { Block } from "payload";

export const ImageBlock: Block = {
  slug: "image",
  labels: {
    singular: "Image",
    plural: "Images",
  },
  fields: [
    {
      name: "image",
      label: "Fichier",
      type: "upload",
      relationTo: "media",
      required: true,
    },
    {
      name: "caption",
      label: "Légende",
      type: "text",
      admin: {
        description: "Optionnelle — affichée sous l'image en mono petite taille.",
      },
    },
  ],
};

export default ImageBlock;
