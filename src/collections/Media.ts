import type { CollectionConfig } from "payload";

export const Media: CollectionConfig = {
  slug: "media",
  labels: {
    singular: "Média",
    plural: "Médias",
  },
  admin: {
    useAsTitle: "filename",
    group: "Contenu",
  },
  upload: {
    staticDir: "./media",
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
    imageSizes: [
      { name: "thumbnail", width: 400 },
      { name: "card", width: 800 },
      { name: "og", width: 1200, height: 630 },
    ],
  },
  fields: [
    {
      name: "alt",
      label: "Texte alternatif",
      type: "text",
      admin: {
        description: "Description courte pour l'accessibilité.",
      },
    },
  ],
};

export default Media;
