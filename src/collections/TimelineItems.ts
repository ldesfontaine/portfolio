import type { CollectionConfig } from "payload";

import { revalidateTimeline } from "../hooks/revalidate";
import { makeUniqueOrder } from "../hooks/uniqueOrder";

export const TimelineItems: CollectionConfig = {
  slug: "timeline-items",
  hooks: {
    afterChange: [makeUniqueOrder("timeline-items"), revalidateTimeline],
  },
  labels: {
    singular: "Item du parcours",
    plural: "Items du parcours",
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "date", "activeLabel", "order"],
    group: "Contenu",
  },
  defaultSort: "order",
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
      name: "activeLabel",
      label: "Étiquette « actif »",
      type: "text",
      admin: {
        description:
          "Si rempli, l'item est marqué comme actif (point plein sur la timeline) et le texte est affiché sous le sous-titre. Laisse vide pour un item passé.",
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
