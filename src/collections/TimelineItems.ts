import type { CollectionConfig } from "payload";

import { revalidateTimeline } from "../hooks/revalidate";

export const TimelineItems: CollectionConfig = {
  slug: "timeline-items",
  hooks: {
    afterChange: [revalidateTimeline],
  },
  labels: {
    singular: "Item du parcours",
    plural: "Items du parcours",
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "date", "order"],
    group: "Contenu",
  },
  fields: [
    {
      name: "date",
      label: "Période",
      type: "text",
      required: true,
      admin: {
        description: "Ex : « fév. 2023 - fév. 2024 ».",
      },
    },
    {
      name: "title",
      label: "Titre",
      type: "text",
      required: true,
    },
    {
      name: "subtitle",
      label: "Sous-titre",
      type: "textarea",
      required: true,
    },
    {
      name: "status",
      label: "Statut",
      type: "select",
      options: [{ label: "Actif", value: "active" }],
      admin: {
        description: "Marque l'item comme en cours (optionnel).",
      },
    },
    {
      name: "highlight",
      label: "Étiquette",
      type: "text",
      admin: {
        description: "Badge complémentaire (« en cours », « actif », ...).",
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

export default TimelineItems;
