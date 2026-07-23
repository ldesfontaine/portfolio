import type { Payload } from "payload";

import type { Post } from "../payload-types";

const INDEPENDENT_NOTES = [
  {
    projectSlug: "simulation-ba186",
    noteSlug: "simulation-ba186-presentation",
    title: "Simulation de crise temps réel",
  },
  {
    projectSlug: "poc-phantom",
    noteSlug: "poc-phantom-presentation",
    title: "Phantom : trier un incident sans polluer la cible",
  },
  {
    projectSlug: "bientot",
    noteSlug: "bientot-presentation",
    title: "Bientôt : monitoring léger",
  },
] as const;

const LEGACY_YOUR_CLOUD_DRAFT_SLUGS = [
  "your-cloud-gerer-une-infrastructure-sans-la-rendre-opaque",
  "your-cloud-un-binaire-plusieurs-roles",
  "your-cloud-observer-sans-ouvrir-une-porte-administration",
  "your-cloud-pourquoi-separer-console-controller",
  "your-cloud-preparer-ferme-publier-en-dernier",
  "your-cloud-connecter-infrastructure-sans-gerer-wireguard",
] as const;

const richText = (...paragraphs: string[]) => ({
  root: {
    type: "root",
    children: paragraphs.map((text) => ({
      type: "paragraph",
      version: 1,
      children: [
        {
          type: "text",
          version: 1,
          detail: 0,
          format: 0,
          mode: "normal",
          style: "",
          text,
        },
      ],
      direction: null,
      format: "",
      indent: 0,
      textFormat: 0,
      textStyle: "",
    })),
    direction: null,
    format: "" as const,
    indent: 0,
    version: 1,
  },
});

type NoteSection = {
  heading: string;
  paragraphs: string[];
};

const noteContent = (sections: NoteSection[]): Post["content"] =>
  sections.flatMap((section) => [
    { blockType: "section-heading" as const, text: section.heading },
    { blockType: "paragraph" as const, text: richText(...section.paragraphs) },
  ]);

const YOUR_CLOUD_INTRODUCTION_NOTE = {
  slug: "your-cloud-administrer-sans-perdre-de-vue",
  title:
    "Your Cloud : administrer une infrastructure sans perdre de vue ce qui se passe",
  excerpt:
    "Pourquoi j’ai commencé à construire une interface commune pour gérer des machines dispersées, sans transformer la simplicité en boîte noire.",
  readingTime: 7,
  tags: ["Your Cloud", "Homelab", "Infrastructure", "Sécurité", "Open source"],
  sections: [
    {
      heading: "À chaque wipe, tout recommençait",
      paragraphs: [
        "Your Cloud n’est pas un produit fini. Le projet est encore en construction, et cette Note raconte le problème que j’essaie de résoudre plutôt qu’un ensemble de capacités déjà disponibles. Il est d’abord né pour moi : à chaque fois que je réinstallais une machine, je devais retrouver mes configurations, remonter les services, vérifier ce qui manquait et reconstruire une vue d’ensemble. Rien n’était particulièrement impossible, mais tout était dispersé et répétitif.",
        "Mon infrastructure mélangeait des VPS et des mini-PC qui ne venaient pas du même fournisseur. Chaque machine avait ses commandes, ses fichiers et parfois son interface. Aucun tableau de bord de fournisseur ne pouvait vraiment représenter l’ensemble, et je n’avais pas envie de déplacer toute mon infrastructure chez un seul acteur uniquement pour obtenir une console commune.",
      ],
    },
    {
      heading: "Le déclic des déploiements exposés",
      paragraphs: [
        "Le déclic est venu en voyant les analyses consacrées aux instances OpenClaw exposées sur Internet. Un outil très pratique pouvait se retrouver déployé trop vite, avec une interface ou des capacités sensibles accessibles au mauvais endroit. Le problème dépassait OpenClaw : l’auto-hébergement devient dangereux lorsque le chemin le plus simple contourne les protections nécessaires.",
        "Je pourrais résumer ça en disant que les gens n’ont plus envie de tout bricoler eux-mêmes. Mais la vraie question est ailleurs : si un déploiement sûr exige de connaître chaque détail réseau, de retenir plusieurs commandes et d’assembler seul toutes les protections, les erreurs deviennent prévisibles. Le chemin sûr devrait aussi être le chemin le plus simple.",
      ],
    },
    {
      heading: "Centraliser la vue, pas tous les pouvoirs",
      paragraphs: [
        "L’idée de Your Cloud est de représenter plusieurs machines dans une interface cohérente, même lorsqu’elles sont hébergées chez des fournisseurs différents. Je veux pouvoir retrouver leur état, leur supervision et les protections communes sans ouvrir cinq outils avant de comprendre ce qui se passe.",
        "Centraliser ne doit pourtant pas signifier tout confier à une boîte noire. Lorsqu’une action sera proposée, l’interface devra expliquer la cible, les changements prévus, les droits nécessaires et les limites du retour arrière. La simplicité doit réduire les manipulations inutiles, pas cacher une commande dangereuse derrière un bouton rassurant.",
      ],
    },
    {
      heading: "D’abord pour mon Homelab, puis au-delà",
      paragraphs: [
        "Le premier terrain reste mon propre Homelab. C’est un bon moyen d’apprendre à construire un vrai outil d’infrastructure, avec des machines imparfaites, peu de ressources et des contraintes qui ne disparaissent pas après une démonstration.",
        "À terme, le même principe pourrait aider quelqu’un qui débute avec deux machines, un Homelab plus important ou une petite structure qui n’a ni équipe plateforme ni budget pour empiler des solutions propriétaires. Cette ambition ne signifie pas que Your Cloud couvre déjà tous ces usages : elle indique la direction dans laquelle je veux le faire grandir.",
      ],
    },
    {
      heading: "Open source, sobre et indépendant des fournisseurs",
      paragraphs: [
        "Je veux que le projet reste open source, auto-hébergeable et suffisamment léger pour ne pas consommer une part absurde des machines qu’il doit gérer. Il ne devrait pas dépendre d’AWS, d’Azure, de Proxmox, de Kubernetes ou d’un fournisseur particulier pour remplir son rôle principal.",
        "Ces plateformes pourront devenir des intégrations, mais le cœur du produit reste plus simple : comprendre et gérer proprement plusieurs machines. Pour moi, la souveraineté commence là, avec la possibilité de choisir où tournent le Controller, les données et les services, puis de changer de fournisseur sans perdre l’outil qui représente l’infrastructure.",
      ],
    },
    {
      heading: "Où le projet en est réellement",
      paragraphs: [
        "Aujourd’hui, la chaîne d’observation des machines et la Console Linux ont été éprouvées dans le LAB. Le projet sait déjà séparer plusieurs rôles et présenter des informations issues de machines explicitement enrôlées sans ouvrir un canal d’administration général vers elles.",
        "La validation Windows de la Console reste incomplète. Les véritables actions d’administration, les déploiements de services et la gestion réseau depuis l’interface restent encore à construire et à prouver. Your Cloud n’est donc pas un produit prêt à gérer l’infrastructure d’une PME ; c’est un projet en cours dont les premières fondations sont devenues concrètes.",
      ],
    },
    {
      heading: "Ce que j’essaie vraiment de construire",
      paragraphs: [
        "Your Cloud est mon premier projet d’infrastructure de cette ampleur. C’est à la fois un outil dont j’avais besoin et un prétexte exigeant pour apprendre : conception distribuée, identité des machines, moindre privilège, observation, déploiement et reprise après échec.",
        "Mon objectif n’est pas de supprimer la technique. Je veux la rendre visible au bon moment, expliquer les conséquences d’une action et éviter que la facilité d’usage se paie par une perte de contrôle. Administrer plus simplement, oui, mais sans perdre de vue ce qui se passe.",
      ],
    },
  ] satisfies NoteSection[],
} as const;

export type EditorialPreparationResult = {
  independentNotesUpdated: number;
  legacyYourCloudDraftsDeleted: number;
  legacyYourCloudDraftsPreserved: number;
  legacyProjectsDrafted: number;
  yourCloudIntroductionCreated: boolean;
  yourCloudIntroductionExisting: boolean;
  yourCloudIntroductionPublishedUpdated: boolean;
  yourCloudIntroductionUpdated: boolean;
  yourCloudProjectCreated: boolean;
};

const findBySlug = async (
  payload: Payload,
  collection: "posts" | "projects",
  slug: string,
) => {
  const result = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  });
  return result.docs[0];
};

export async function prepareEditorialV2(
  payload: Payload,
): Promise<EditorialPreparationResult> {
  const result: EditorialPreparationResult = {
    independentNotesUpdated: 0,
    legacyYourCloudDraftsDeleted: 0,
    legacyYourCloudDraftsPreserved: 0,
    legacyProjectsDrafted: 0,
    yourCloudIntroductionCreated: false,
    yourCloudIntroductionExisting: false,
    yourCloudIntroductionPublishedUpdated: false,
    yourCloudIntroductionUpdated: false,
    yourCloudProjectCreated: false,
  };

  const homelab = await findBySlug(payload, "projects", "homelab");
  if (!homelab) {
    throw new Error("Cannot prepare editorial content without the Homelab theme.");
  }

  const homelabNote = await findBySlug(
    payload,
    "posts",
    "homelab-presentation",
  );
  if (homelabNote) {
    await payload.update({
      collection: "posts",
      id: homelabNote.id,
      draft: false,
      overrideAccess: true,
      data: {
        title: "Homelab : reprendre le contrôle de mes services",
        relatedProjects: [homelab.id],
        _status: "published",
      },
    });
  }

  for (const note of INDEPENDENT_NOTES) {
    const project = await findBySlug(payload, "projects", note.projectSlug);
    if (project) {
      await payload.update({
        collection: "projects",
        id: project.id,
        draft: true,
        overrideAccess: true,
        data: {
          featured: false,
          badge: null,
          _status: "draft",
        },
      });
      result.legacyProjectsDrafted += 1;
    }

    const post = await findBySlug(payload, "posts", note.noteSlug);
    if (post) {
      await payload.update({
        collection: "posts",
        id: post.id,
        draft: false,
        overrideAccess: true,
        data: {
          title: note.title,
          relatedProjects: [],
          _status: "published",
        },
      });
      result.independentNotesUpdated += 1;
    }
  }

  let yourCloud = await findBySlug(payload, "projects", "your-cloud");
  if (!yourCloud) {
    yourCloud = await payload.create({
      collection: "projects",
      draft: true,
      overrideAccess: true,
      data: {
        title: "Your Cloud",
        shortTitle: "Your Cloud",
        slug: "your-cloud",
        category: "infrastructure · sécurité",
        kind: "product",
        cardVisual: "auto",
        description:
          "Une interface pour représenter, observer puis faire évoluer plusieurs machines sans masquer les actions réellement exécutées.",
        stack: ["Go", "Tauri", "TypeScript", "systemd", "mTLS"].map(
          (value) => ({ value }),
        ),
        github: "https://github.com/ldesfontaine/your-cloud",
        period: "2026 — en cours",
        type: "Projet personnel",
        featured: false,
        order: 2,
        _status: "draft",
      },
    });
    result.yourCloudProjectCreated = true;
  }

  for (const slug of LEGACY_YOUR_CLOUD_DRAFT_SLUGS) {
    const legacyDraft = await findBySlug(payload, "posts", slug);
    if (!legacyDraft) continue;

    if (legacyDraft._status !== "draft") {
      result.legacyYourCloudDraftsPreserved += 1;
      continue;
    }

    await payload.delete({
      collection: "posts",
      id: legacyDraft.id,
      overrideAccess: true,
    });
    result.legacyYourCloudDraftsDeleted += 1;
  }

  const introduction = await findBySlug(
    payload,
    "posts",
    YOUR_CLOUD_INTRODUCTION_NOTE.slug,
  );
  if (introduction) {
    result.yourCloudIntroductionExisting = true;
    const introductionStatus =
      introduction._status === "published" ? "published" : "draft";
    await payload.update({
      collection: "posts",
      id: introduction.id,
      draft: introductionStatus === "draft",
      overrideAccess: true,
      data: {
        title: YOUR_CLOUD_INTRODUCTION_NOTE.title,
        excerpt: YOUR_CLOUD_INTRODUCTION_NOTE.excerpt,
        readingTime: YOUR_CLOUD_INTRODUCTION_NOTE.readingTime,
        tags: YOUR_CLOUD_INTRODUCTION_NOTE.tags.map((value) => ({ value })),
        relatedProjects: [yourCloud.id],
        content: noteContent(YOUR_CLOUD_INTRODUCTION_NOTE.sections),
        _status: introductionStatus,
      },
    });
    if (introductionStatus === "published") {
      result.yourCloudIntroductionPublishedUpdated = true;
    } else {
      result.yourCloudIntroductionUpdated = true;
    }
  } else {
    await payload.create({
      collection: "posts",
      draft: true,
      overrideAccess: true,
      data: {
        title: YOUR_CLOUD_INTRODUCTION_NOTE.title,
        slug: YOUR_CLOUD_INTRODUCTION_NOTE.slug,
        excerpt: YOUR_CLOUD_INTRODUCTION_NOTE.excerpt,
        publishedAt: "2026-07-23T00:00:00.000Z",
        readingTime: YOUR_CLOUD_INTRODUCTION_NOTE.readingTime,
        tags: YOUR_CLOUD_INTRODUCTION_NOTE.tags.map((value) => ({ value })),
        relatedProjects: [yourCloud.id],
        content: noteContent(YOUR_CLOUD_INTRODUCTION_NOTE.sections),
        _status: "draft",
      },
    });
    result.yourCloudIntroductionCreated = true;
  }

  return result;
}
