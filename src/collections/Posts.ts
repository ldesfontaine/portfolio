import type { CollectionBeforeChangeHook, CollectionConfig } from "payload";

import { ArchitectureDiagram } from "../blocks/ArchitectureDiagram";
import { CodeBlock } from "../blocks/CodeBlock";
import { Highlight } from "../blocks/Highlight";
import { ImageBlock } from "../blocks/ImageBlock";
import { Paragraph } from "../blocks/Paragraph";
import { SectionHeading } from "../blocks/SectionHeading";
import { TableBlock } from "../blocks/TableBlock";
import { visibleThemeFilterOptions } from "../editorial/themePolicy";
import { revalidatePosts } from "../hooks/revalidate";
import { validateEditorialBlocks } from "../hooks/validateEditorialBlocks";
import { slugify } from "../utils/slugify";

const autoSlug: CollectionBeforeChangeHook = ({ data }) => {
  if (data && typeof data.title === "string" && !data.slug) {
    data.slug = slugify(data.title);
  }
  return data;
};

const getPreviewURL = (doc: Record<string, unknown>) => {
  if (typeof doc.slug !== "string" || !doc.slug) return null;

  const siteURL = (process.env.SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );

  return `${siteURL}/notes/${encodeURIComponent(doc.slug)}?preview=1`;
};

export const Posts: CollectionConfig = {
  slug: "posts",
  labels: {
    singular: "Note",
    plural: "Notes",
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "relatedProjects", "publishedAt", "_status"],
    group: "Éditorial",
    preview: getPreviewURL,
    description:
      "Tout le contenu public se publie ici. Une Note est indépendante par défaut ; un thème sert seulement à regrouper plusieurs Notes.",
  },
  defaultSort: "-publishedAt",
  versions: {
    drafts: {
      autosave: false,
    },
    maxPerDoc: 10,
  },
  hooks: {
    beforeValidate: [validateEditorialBlocks],
    beforeChange: [autoSlug],
    afterChange: [revalidatePosts],
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Publication",
          description: "Titre, résumé, date, sujets et éventuels thèmes associés.",
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
                description: "Auto-généré depuis le titre si laissé vide.",
              },
            },
            {
              name: "excerpt",
              label: "Résumé",
              type: "textarea",
              required: true,
              maxLength: 240,
            },
            {
              name: "publishedAt",
              label: "Date de publication",
              type: "date",
              required: true,
              admin: {
                position: "sidebar",
                date: {
                  pickerAppearance: "dayOnly",
                  displayFormat: "dd/MM/yyyy",
                },
              },
            },
            {
              name: "readingTime",
              label: "Temps de lecture (minutes)",
              type: "number",
              required: true,
              defaultValue: 5,
              min: 1,
              max: 120,
              admin: {
                position: "sidebar",
              },
            },
            {
              name: "cover",
              label: "Visuel de couverture",
              type: "upload",
              relationTo: "media",
            },
            {
              name: "tags",
              label: "Sujets",
              type: "array",
              maxRows: 5,
              fields: [
                {
                  name: "value",
                  label: "Sujet",
                  type: "text",
                  required: true,
                },
              ],
            },
            {
              name: "relatedProjects",
              label: "Thèmes",
              type: "relationship",
              relationTo: "projects",
              hasMany: true,
              filterOptions: visibleThemeFilterOptions,
              admin: {
                components: {
                  Cell: "/src/components/admin/NoteThemesCell",
                },
                description:
                  "Facultatif : laisse vide pour une Note indépendante. Un thème comme Homelab sert uniquement de filtre et de regroupement.",
              },
            },
          ],
        },
        {
          label: "Contenu",
          description: "Le chapitre ou la notion à publier.",
          fields: [
            {
              name: "content",
              label: "Contenu",
              type: "blocks",
              required: true,
              blocks: [
                SectionHeading,
                Paragraph,
                CodeBlock,
                Highlight,
                TableBlock,
                ArchitectureDiagram,
                ImageBlock,
              ],
              admin: {
                description:
                  "Blocs bornés et réutilisables. Le code reste du texte brut ; tableaux et schémas sont validés avant enregistrement.",
              },
            },
          ],
        },
      ],
    },
  ],
};

export default Posts;
