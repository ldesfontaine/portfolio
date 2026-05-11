import type { GlobalConfig } from "payload";

import { revalidateAbout } from "../hooks/revalidate";

export const About: GlobalConfig = {
  slug: "about",
  label: "À propos",
  admin: {
    group: "Contenu",
  },
  hooks: {
    afterChange: [revalidateAbout],
  },
  fields: [
    {
      name: "sectionTitle",
      label: "Titre de section",
      type: "text",
    },
    {
      name: "paragraphs",
      label: "Paragraphes (avant l'encart)",
      type: "array",
      labels: {
        singular: "Paragraphe",
        plural: "Paragraphes",
      },
      fields: [
        {
          name: "content",
          label: "Contenu",
          type: "richText",
          required: true,
        },
      ],
    },
    {
      name: "highlight",
      label: "Encart",
      type: "textarea",
      admin: {
        description: "Bloc d'emphase intercalé entre les deux groupes de paragraphes.",
      },
    },
    {
      name: "paragraphsAfter",
      label: "Paragraphes (après l'encart)",
      type: "array",
      labels: {
        singular: "Paragraphe",
        plural: "Paragraphes",
      },
      fields: [
        {
          name: "content",
          label: "Contenu",
          type: "richText",
          required: true,
        },
      ],
    },
    {
      name: "quickInfo",
      label: "Infos rapides",
      type: "group",
      fields: [
        {
          name: "rhythm",
          label: "Rythme",
          type: "text",
        },
        {
          name: "english",
          label: "Anglais",
          type: "text",
        },
        {
          name: "location",
          label: "Localisation",
          type: "text",
        },
      ],
    },
  ],
};

export default About;
