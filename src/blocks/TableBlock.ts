import type { Block } from "payload";

export const TableBlock: Block = {
  slug: "table",
  labels: {
    singular: "Tableau",
    plural: "Tableaux",
  },
  fields: [
    {
      name: "caption",
      label: "Titre ou légende",
      type: "text",
    },
    {
      name: "columns",
      label: "Colonnes",
      type: "array",
      required: true,
      minRows: 2,
      maxRows: 6,
      fields: [
        {
          name: "label",
          label: "Libellé",
          type: "text",
          required: true,
        },
        {
          name: "align",
          label: "Alignement",
          type: "select",
          required: true,
          defaultValue: "left",
          options: [
            { label: "Gauche", value: "left" },
            { label: "Centre", value: "center" },
            { label: "Droite", value: "right" },
          ],
        },
      ],
    },
    {
      name: "rows",
      label: "Lignes",
      type: "array",
      required: true,
      minRows: 1,
      fields: [
        {
          name: "cells",
          label: "Cellules",
          type: "array",
          required: true,
          fields: [
            {
              name: "value",
              label: "Valeur",
              type: "text",
              required: true,
            },
            {
              name: "tone",
              label: "Ton",
              type: "select",
              required: true,
              defaultValue: "default",
              options: [
                { label: "Neutre", value: "default" },
                { label: "Positif", value: "positive" },
                { label: "Attention", value: "warning" },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export default TableBlock;
