import type { Block } from "payload";

export const ArchitectureDiagram: Block = {
  slug: "architecture-diagram",
  labels: {
    singular: "Schéma d'architecture",
    plural: "Schémas d'architecture",
  },
  fields: [
    {
      name: "data",
      label: "Données du schéma",
      type: "json",
      required: true,
      admin: {
        description:
          "Payload JSON consommé par le composant ArchitectureDiagram (noeuds, liens, légende).",
      },
    },
  ],
};

export default ArchitectureDiagram;
