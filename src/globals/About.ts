import type { GlobalConfig } from "payload";

import { Paragraph } from "../blocks/Paragraph";
import { Highlight } from "../blocks/Highlight";
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
      name: "photo",
      label: "Photo",
      type: "upload",
      relationTo: "media",
      admin: {
        description:
          "Optionnelle — si vide, la photo n'est pas affichée sur le site.",
      },
    },
    {
      name: "quickInfo",
      label: "Infos rapides (affichées en haut de la page)",
      type: "group",
      fields: [
        {
          name: "location",
          label: "Localisation",
          type: "text",
        },
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
      ],
    },
    {
      name: "sectionTitle",
      label: "Titre de la section histoire",
      type: "text",
    },
    {
      name: "content",
      label: "Histoire (paragraphes et encarts dans l'ordre que tu veux)",
      type: "blocks",
      blocks: [Paragraph, Highlight],
      admin: {
        description:
          "Ajoute, retire, réordonne librement des paragraphes et des encarts.",
      },
    },
  ],
};

export default About;
