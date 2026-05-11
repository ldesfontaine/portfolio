import type { CollectionBeforeChangeHook, CollectionConfig } from "payload";

import { SectionHeading } from "../blocks/SectionHeading";
import { Paragraph } from "../blocks/Paragraph";
import { CodeBlock } from "../blocks/CodeBlock";
import { Highlight } from "../blocks/Highlight";
import { ArchitectureDiagram } from "../blocks/ArchitectureDiagram";
import { ImageBlock } from "../blocks/ImageBlock";

const slugify = (input: string): string =>
  input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const autoSlug: CollectionBeforeChangeHook = ({ data }) => {
  if (data && typeof data.title === "string" && !data.slug) {
    data.slug = slugify(data.title);
  }
  return data;
};

export const Projects: CollectionConfig = {
  slug: "projects",
  labels: {
    singular: "Projet",
    plural: "Projets",
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "category", "order", "_status"],
    group: "Contenu",
  },
  versions: {
    drafts: {
      autosave: false,
    },
    maxPerDoc: 10,
  },
  hooks: {
    beforeChange: [autoSlug],
  },
  fields: [
    {
      name: "title",
      label: "Titre",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      label: "Slug",
      type: "text",
      unique: true,
      index: true,
      admin: {
        position: "sidebar",
        description:
          "Auto-généré depuis le titre si laissé vide (kebab-case sans accents).",
      },
    },
    {
      name: "category",
      label: "Catégorie",
      type: "text",
      required: true,
      admin: {
        description: "Ex : « monitoring · devsecops ».",
      },
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      required: true,
      maxLength: 240,
      admin: {
        description: "Résumé court (240 caractères max) affiché sur les cartes.",
      },
    },
    {
      name: "stack",
      label: "Stack",
      type: "array",
      required: true,
      labels: {
        singular: "Techno",
        plural: "Technos",
      },
      admin: {
        description: "Badges techno affichés sur la fiche projet.",
      },
      fields: [
        {
          name: "value",
          label: "Nom",
          type: "text",
          required: true,
        },
      ],
    },
    {
      name: "github",
      label: "Lien GitHub",
      type: "text",
      admin: {
        description: "URL complète (https://...) — optionnel.",
      },
      validate: (value: unknown) => {
        if (value === undefined || value === null || value === "") return true;
        if (typeof value !== "string") return "URL invalide";
        try {
          const url = new URL(value);
          if (url.protocol !== "http:" && url.protocol !== "https:") {
            return "L'URL doit utiliser http ou https";
          }
          return true;
        } catch {
          return "URL invalide";
        }
      },
    },
    {
      name: "period",
      label: "Période",
      type: "text",
      required: true,
      admin: {
        description: "Ex : « 2024 - en cours ».",
      },
    },
    {
      name: "type",
      label: "Type",
      type: "text",
      required: true,
      admin: {
        description: "Ex : « Projet personnel », « Mission », etc.",
      },
    },
    {
      name: "badge",
      label: "Badge",
      type: "text",
      admin: {
        description: "Étiquette optionnelle (« en cours », « archivé », ...).",
      },
    },
    {
      name: "order",
      label: "Ordre",
      type: "number",
      required: true,
      defaultValue: 0,
      admin: {
        position: "sidebar",
        description: "Plus petit = affiché en premier.",
      },
    },
    {
      name: "coverImage",
      label: "Image de couverture",
      type: "upload",
      relationTo: "media",
      admin: {
        description: "Optionnelle — utilisée pour la carte et l'OG.",
      },
    },
    {
      name: "content",
      label: "Contenu du write-up",
      type: "blocks",
      blocks: [
        SectionHeading,
        Paragraph,
        CodeBlock,
        Highlight,
        ArchitectureDiagram,
        ImageBlock,
      ],
      admin: {
        description: "Assemble le write-up bloc par bloc.",
      },
    },
  ],
};

export default Projects;
