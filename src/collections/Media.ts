import type { CollectionConfig } from "payload";

export const Media: CollectionConfig = {
  slug: "media",
  labels: {
    singular: "Média",
    plural: "Médias",
  },
  // Files are referenced from the public site (photo, CV, project images),
  // so reads must be unauthenticated. Mutations stay admin-only (default).
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: "filename",
    group: "Contenu",
    description:
      "Bibliothèque centrale de tous les fichiers uploadés (images des projets, photo, CV PDF). Tout fichier ajouté ici devient sélectionnable depuis les champs « upload » des autres collections (En-tête de projet, image dans un write-up, photo de l'À propos, CV des métadonnées, etc.). La liste est vide tant que tu n'as rien uploadé.",
  },
  upload: {
    staticDir: "./media",
    mimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/svg+xml",
      "application/pdf",
    ],
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
