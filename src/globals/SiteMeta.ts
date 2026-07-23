import type { GlobalConfig } from "payload";

import { revalidateSiteMeta } from "../hooks/revalidate";

export const SiteMeta: GlobalConfig = {
  slug: "site-meta",
  label: "Identité & accueil",
  admin: {
    group: "Site",
    description: "Nom, manifeste de l'accueil, liens de contact et CV public.",
  },
  hooks: {
    afterChange: [revalidateSiteMeta],
  },
  fields: [
    {
      name: "contentRevision",
      type: "number",
      defaultValue: 0,
      admin: {
        hidden: true,
      },
    },
    {
      type: "tabs",
      tabs: [
        {
          label: "Identité & contact",
          description:
            "Informations publiques utilisées dans le profil et le pied de page.",
          fields: [
            {
              name: "name",
              label: "Nom",
              type: "text",
            },
            {
              name: "email",
              label: "Email",
              type: "email",
            },
            {
              name: "github",
              label: "GitHub",
              type: "text",
              admin: {
                description: "URL complète du profil.",
              },
            },
            {
              name: "linkedin",
              label: "LinkedIn",
              type: "text",
              admin: {
                description: "URL complète du profil.",
              },
            },
          ],
        },
        {
          label: "Accueil",
          description:
            "Texte du hero. Il décrit le travail, pas une recherche d'emploi.",
          fields: [
            {
              name: "hero",
              label: "Hero",
              type: "group",
              fields: [
                {
                  name: "eyebrow",
                  label: "Sur-titre",
                  type: "text",
                  defaultValue: "DevSecOps · Infrastructure · Sécurité",
                },
                {
                  name: "title",
                  label: "Manifeste",
                  type: "textarea",
                  defaultValue:
                    "Je construis, sécurise et documente des systèmes.",
                  maxLength: 110,
                },
                {
                  name: "description",
                  label: "Introduction",
                  type: "textarea",
                  defaultValue:
                    "Conception et exploitation de plateformes fiables : infrastructure as code, automatisation, observabilité et sécurité.",
                  maxLength: 240,
                },
              ],
            },
          ],
        },
        {
          label: "Document",
          description: "PDF public proposé depuis la page Profil.",
          fields: [
            {
              name: "cv",
              label: "CV (PDF)",
              type: "upload",
              relationTo: "media",
              admin: {
                description:
                  "Optionnel — si vide, le bouton CV n'est pas affiché sur le site.",
              },
            },
          ],
        },
      ],
    },
  ],
};

export default SiteMeta;
