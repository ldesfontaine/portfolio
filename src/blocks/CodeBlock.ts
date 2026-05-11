import type { Block } from "payload";

export const CodeBlock: Block = {
  slug: "code-block",
  labels: {
    singular: "Bloc de code",
    plural: "Blocs de code",
  },
  fields: [
    {
      name: "language",
      label: "Langage",
      type: "select",
      required: true,
      defaultValue: "bash",
      options: [
        { label: "Bash", value: "bash" },
        { label: "TypeScript", value: "ts" },
        { label: "TSX", value: "tsx" },
        { label: "Go", value: "go" },
        { label: "YAML", value: "yaml" },
        { label: "Dockerfile", value: "dockerfile" },
        { label: "Shell", value: "sh" },
        { label: "JSON", value: "json" },
        { label: "Python", value: "python" },
      ],
    },
    {
      name: "filename",
      label: "Nom de fichier",
      type: "text",
      admin: {
        description: "Optionnel — affiché en en-tête du bloc.",
      },
    },
    {
      name: "code",
      label: "Code",
      type: "textarea",
      required: true,
      admin: {
        description: "Contenu brut — pas d'interprétation Markdown.",
        rows: 12,
      },
    },
  ],
};

export default CodeBlock;
