import type { Block } from "payload";

export const ProjectHeader: Block = {
  slug: "project-header",
  labels: {
    singular: "En-tête du projet",
    plural: "En-têtes du projet",
  },
  fields: [
    {
      name: "showBackLink",
      label: "Afficher le lien « retour aux projets »",
      type: "checkbox",
      defaultValue: true,
    },
  ],
};

export default ProjectHeader;
