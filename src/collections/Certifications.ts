import type { CollectionConfig } from "payload";

import { revalidateCertifications } from "../hooks/revalidate";

export const Certifications: CollectionConfig = {
  slug: "certifications",
  hooks: {
    afterChange: [revalidateCertifications],
  },
  labels: {
    singular: "Certification",
    plural: "Certifications",
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "organization", "status", "order"],
    group: "Contenu",
  },
  fields: [
    {
      name: "name",
      label: "Nom",
      type: "text",
      required: true,
    },
    {
      name: "organization",
      label: "Organisme",
      type: "text",
      required: true,
    },
    {
      name: "status",
      label: "Statut",
      type: "select",
      required: true,
      options: [
        { label: "Obtenue", value: "obtained" },
        { label: "En cours", value: "in-progress" },
        { label: "Cours suivi seulement", value: "course-only" },
      ],
    },
    {
      name: "statusLabel",
      label: "Libellé du statut",
      type: "text",
      required: true,
      admin: {
        description: "Texte affiché sur le badge (ex : « 2024 », « en préparation »).",
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
      },
    },
  ],
};

export default Certifications;
