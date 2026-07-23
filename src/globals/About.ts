import type { GlobalConfig } from "payload";

import { Paragraph } from "../blocks/Paragraph";
import { Highlight } from "../blocks/Highlight";
import { revalidateAbout } from "../hooks/revalidate";

export const About: GlobalConfig = {
  slug: "about",
  label: "Profil",
  admin: {
    group: "Site",
    description:
      "Présentation durable, localisation publique et récit affiché avant le parcours.",
  },
  hooks: {
    afterChange: [revalidateAbout],
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "En-tête",
          description: "Éléments immédiatement visibles en haut de Profil.",
          fields: [
            {
              name: "photo",
              label: "Photo",
              type: "upload",
              relationTo: "media",
              admin: {
                hidden: true,
                description:
                  "Ancienne photo conservée pour rollback. Le Profil utilise désormais l’illustration identitaire versionnée du site.",
              },
            },
            {
              name: "intro",
              label: "Introduction du profil",
              type: "textarea",
              maxLength: 320,
              admin: {
                description:
                  "Présentation durable : expertise, façon de travailler et sujets construits.",
              },
            },
            {
              name: "specialties",
              label: "Spécialités",
              type: "array",
              maxRows: 6,
              labels: {
                singular: "Spécialité",
                plural: "Spécialités",
              },
              fields: [
                {
                  name: "value",
                  label: "Spécialité",
                  type: "text",
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
                  name: "location",
                  label: "Ville / zone actuelle",
                  type: "text",
                  admin: {
                    description:
                      "Reste volontairement approximatif et modifiable.",
                  },
                },
                {
                  name: "mobility",
                  label: "Mobilité / contexte géographique",
                  type: "text",
                  admin: {
                    description:
                      "Optionnel. Ne renseigne ni adresse précise ni déplacement incertain.",
                  },
                },
                {
                  name: "english",
                  label: "Anglais",
                  type: "text",
                },
              ],
            },
          ],
        },
        {
          label: "Histoire",
          description: "Récit personnel affiché avant la timeline.",
          fields: [
            {
              name: "sectionTitle",
              label: "Titre de la section",
              type: "text",
            },
            {
              name: "content",
              label: "Paragraphes et encarts",
              type: "blocks",
              blocks: [Paragraph, Highlight],
              admin: {
                description:
                  "Ajoute, retire et réordonne les paragraphes. Cette zone n'est pas le CV.",
              },
            },
          ],
        },
      ],
    },
  ],
};

export default About;
