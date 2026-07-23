import type { CollectionBeforeValidateHook, CollectionConfig } from "payload";

import { ArchitectureDiagram } from "../blocks/ArchitectureDiagram";
import { CodeBlock } from "../blocks/CodeBlock";
import { Highlight } from "../blocks/Highlight";
import { ImageBlock } from "../blocks/ImageBlock";
import { Paragraph } from "../blocks/Paragraph";
import { ProjectHeader } from "../blocks/ProjectHeader";
import { ProjectMeta } from "../blocks/ProjectMeta";
import { ProjectNav } from "../blocks/ProjectNav";
import { ProjectTags } from "../blocks/ProjectTags";
import { SectionHeading } from "../blocks/SectionHeading";
import { TableBlock } from "../blocks/TableBlock";
import { visibleThemesWhere } from "../editorial/themePolicy";
import { makeUniqueOrder } from "../hooks/uniqueOrder";
import { validateEditorialBlocks } from "../hooks/validateEditorialBlocks";
import { revalidateThemes } from "../hooks/revalidate";
import { slugify } from "../utils/slugify";

const prepareTheme: CollectionBeforeValidateHook = ({ data }) => {
  if (!data) return data;

  if (typeof data.title === "string" && !data.slug) {
    data.slug = slugify(data.title);
  }

  // These values only keep the pre-redesign columns valid. They are hidden,
  // never rendered publicly and remain available for a rollback of the old UI.
  data.category ??= "theme";
  data.kind ??= "case-study";
  data.cardVisual ??= "auto";
  data.description ??= "Thème de classement des Notes";
  data.stack ??= [];
  data.period ??= "Non applicable";
  data.type ??= "Thème";

  return data;
};

const hidden = { hidden: true } as const;

export const Projects: CollectionConfig = {
  slug: "projects",
  labels: {
    singular: "Thème",
    plural: "Thèmes",
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "order", "_status"],
    group: "Éditorial",
    baseFilter: () => visibleThemesWhere(),
    description:
      "Un thème sert uniquement à filtrer et regrouper des Notes. Il ne possède pas de page publique ni de contenu propre.",
  },
  defaultSort: "order",
  versions: {
    drafts: {
      autosave: false,
    },
    maxPerDoc: 10,
  },
  hooks: {
    beforeValidate: [prepareTheme, validateEditorialBlocks],
    afterChange: [makeUniqueOrder("projects"), revalidateThemes],
  },
  fields: [
    {
      name: "title",
      label: "Nom du thème",
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
        description: "Auto-généré depuis le nom si laissé vide.",
      },
    },
    {
      name: "order",
      label: "Ordre des filtres",
      type: "number",
      required: true,
      defaultValue: 0,
      admin: {
        position: "sidebar",
        description: "Plus petit = affiché en premier.",
      },
    },

    // Champs du modèle Projet conservés pour compatibilité et rollback.
    { name: "shortTitle", type: "text", maxLength: 32, admin: hidden },
    { name: "category", type: "text", required: true, admin: hidden },
    {
      name: "kind",
      type: "select",
      required: true,
      defaultValue: "case-study",
      admin: hidden,
      options: [
        { label: "Système vivant", value: "living-system" },
        { label: "Produit", value: "product" },
        { label: "Étude de cas", value: "case-study" },
        { label: "Expérimentation", value: "experiment" },
      ],
    },
    {
      name: "cardVisual",
      type: "select",
      required: true,
      defaultValue: "auto",
      admin: hidden,
      options: [
        { label: "Automatique", value: "auto" },
        { label: "Homelab / architecture", value: "homelab" },
        { label: "Simulation", value: "crisis" },
        { label: "Phantom / terminal", value: "phantom" },
        { label: "Système générique", value: "system" },
      ],
    },
    { name: "cover", type: "upload", relationTo: "media", admin: hidden },
    {
      name: "description",
      type: "textarea",
      required: true,
      maxLength: 240,
      admin: hidden,
    },
    {
      name: "stack",
      type: "array",
      required: true,
      admin: hidden,
      fields: [{ name: "value", type: "text", required: true }],
    },
    { name: "github", type: "text", admin: hidden },
    { name: "period", type: "text", required: true, admin: hidden },
    { name: "type", type: "text", required: true, admin: hidden },
    { name: "badge", type: "text", admin: hidden },
    {
      name: "featured",
      type: "checkbox",
      defaultValue: false,
      admin: hidden,
    },
    {
      name: "listedInNotes",
      type: "checkbox",
      defaultValue: false,
      admin: hidden,
    },
    { name: "publishedAt", type: "date", admin: hidden },
    {
      name: "readingTime",
      type: "number",
      min: 1,
      max: 120,
      defaultValue: 5,
      admin: hidden,
    },
    {
      name: "parentProject",
      type: "relationship",
      relationTo: "projects",
      admin: hidden,
    },
    {
      name: "relatedProjects",
      type: "relationship",
      relationTo: "projects",
      hasMany: true,
      admin: hidden,
    },
    {
      name: "content",
      label: "Ancien contenu du projet",
      type: "blocks",
      blocks: [
        ProjectHeader,
        ProjectMeta,
        SectionHeading,
        Paragraph,
        CodeBlock,
        Highlight,
        TableBlock,
        ArchitectureDiagram,
        ImageBlock,
        ProjectTags,
        ProjectNav,
      ],
      admin: {
        hidden: true,
        description:
          "Archive conservée pour rollback après migration du contenu vers Notes.",
      },
    },
  ],
};

export default Projects;
