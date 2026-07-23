import type { Block } from "payload";

export const ArchitectureDiagram: Block = {
  slug: "architecture-diagram",
  labels: {
    singular: "Schéma d'architecture",
    plural: "Schémas d'architecture",
  },
  fields: [
    {
      name: "title",
      label: "Titre",
      type: "text",
    },
    {
      name: "nodes",
      label: "Nœuds",
      type: "array",
      minRows: 2,
      maxRows: 12,
      fields: [
        {
          name: "key",
          label: "Identifiant court",
          type: "text",
          required: true,
          admin: {
            description: "Ex : vps, homelab, observabilite.",
          },
        },
        {
          name: "label",
          label: "Libellé",
          type: "text",
          required: true,
        },
        {
          name: "detail",
          label: "Détail",
          type: "text",
        },
        {
          name: "tone",
          label: "Couleur",
          type: "select",
          defaultValue: "default",
          options: [
            { label: "Neutre", value: "default" },
            { label: "Mauve", value: "mauve" },
            { label: "Orange", value: "orange" },
          ],
        },
      ],
    },
    {
      name: "links",
      label: "Liaisons",
      type: "array",
      maxRows: 24,
      fields: [
        {
          name: "from",
          label: "Depuis l'identifiant",
          type: "text",
          required: true,
        },
        {
          name: "to",
          label: "Vers l'identifiant",
          type: "text",
          required: true,
        },
        {
          name: "label",
          label: "Libellé du lien",
          type: "text",
        },
      ],
    },
    {
      name: "data",
      label: "Anciennes données JSON",
      type: "json",
      admin: {
        hidden: true,
        description: "Compatibilité avec les schémas créés avant les champs structurés.",
      },
    },
    {
      name: "caption",
      label: "Légende",
      type: "text",
    },
  ],
};

export default ArchitectureDiagram;
