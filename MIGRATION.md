# Migration termfolio → Payload CMS 3

Suivi de la migration du portfolio statique vers Payload CMS 3 (intégré dans la même app Next.js).

---

## Étape 1 — Setup Payload (terminée)

Payload CMS 3 installé et scaffolding admin/API en place. Aucune collection métier encore, seulement `users` pour permettre la création du premier admin.

### Ce qui a changé

**Dépendances ajoutées** (npm, pas pnpm) :

- `payload`, `@payloadcms/db-sqlite`, `@payloadcms/richtext-lexical`, `@payloadcms/next`, `sharp`, `graphql`
- `next` bumpé de `^15.3.1` à `~15.4.11` (peer dep de `@payloadcms/next@3.84` : `>=15.4.11 <15.5.0`)

**Fichiers créés :**

- `payload.config.ts` — config racine (SQLite, Lexical, secret + CORS/CSRF depuis env)
- `src/collections/Users.ts` — collection auth standard (`forgotPassword` désactivé)
- `app/(payload)/layout.tsx` — wrapper Payload, importe `@payloadcms/next/css` et `custom.scss`
- `app/(payload)/custom.scss` — overrides admin (vide pour l'instant)
- `app/(payload)/admin/[[...segments]]/page.tsx` + `not-found.tsx` — routes admin
- `app/(payload)/admin/importMap.js` — placeholder (auto-régénéré par Payload au runtime)
- `app/(payload)/api/[...slug]/route.ts` — REST API Payload
- `app/(payload)/api/graphql/route.ts` + `graphql-playground/route.ts`
- `.env.example` — `PAYLOAD_SECRET`, `DATABASE_URI`, `SITE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- `.eslintrc.json` — config Next strict (le repo n'en avait jamais eu)

**Fichiers modifiés :**

- `next.config.ts` — wrappé avec `withPayload(...)`
- `tsconfig.json` — alias `@payload-config` → `./payload.config.ts`
- `package.json` — scripts `typecheck`, `generate:types`, `generate:importmap`
- `.gitignore` — ignore `payload.db`, `payload.db-journal`, `payload-types.ts`, `/media/*` (sauf `.gitkeep`)

### Commandes utiles

```bash
# Lancer dev (Next + Payload)
npm run dev
# → site sur http://localhost:3000
# → admin sur http://localhost:3000/admin

# Verifs
npm run typecheck
npm run lint

# Générer les types Payload (BLOQUÉ — voir pièges)
npm run generate:types
```

### Créer le premier admin

1. Lance `npm run dev`
2. Ouvre [http://localhost:3000/admin](http://localhost:3000/admin)
3. L'écran "Create First User" s'affiche → renseigner email + mot de passe
4. Le record est créé dans la collection `users` (SQLite, `./payload.db`)

Pas encore de script `create-admin.ts` automatisé — prévu Étape 5.

### Pièges connus

- **`payload generate:types` crash sur Node 20.19.2.** Le CLI Payload passe par `tsx/esm/api` au démarrage, ce qui déclenche l'initialisation de `undici`'s `CacheStorage` et plante avec `TypeError: Illegal constructor`. Le serveur dev Next, lui, n'est pas affecté. Workaround tenté avec `@swc-node/register` infructueux (erreurs de résolution ESM). À revoir Étape 2 quand les types deviendront critiques — probablement en bumpant à Node 22 LTS ou en attendant un patch Payload/tsx/undici.

- **`importMap.js` placeholder.** Le fichier `app/(payload)/admin/importMap.js` exporte un objet vide. Payload le réécrit au premier accès `/admin` en dev. Tant qu'aucun champ custom n'est ajouté, le placeholder suffit.

- **CORS/CSRF.** `payload.config.ts` n'autorise que `SITE_URL` (default `http://localhost:3000`). À élargir en prod via env.

- **Email adapter manquant.** Warning au démarrage : `No email adapter provided. Email will be written to console.` OK pour l'instant (forgot-password désactivé), à brancher si besoin plus tard.

### Critères d'acceptation Étape 1

- [x] `npm run dev` démarre Next + Payload sur `:3000`
- [x] `/` répond 200, titre intact (aucune régression visuelle attendue : rien n'a touché les composants ni `lib/`)
- [x] `/admin` répond 200 et affiche l'écran "Create First User"
- [x] `payload.db` créé au premier hit `/admin`, gitignored
- [x] `npm run typecheck` vert
- [x] `npm run lint` vert (config `next/core-web-vitals` ajoutée, règle `react/jsx-no-comment-textnodes` désactivée car le code utilise volontairement `// ...` en JSX child pour le style mono terminal)

---

## Étape 2 — Schéma de données (terminée)

Toutes les collections, globals et blocks déclarés. Admin entièrement en français.
Le frontend public continue de pointer sur les fichiers `content/*.ts` (intact pour cette étape) — il sera refactoré à l'Étape 4.

### Ce qui a changé

**Dépendance ajoutée :** `@payloadcms/translations` (en tant que dep directe, déjà transitive de `@payloadcms/next`) pour l'import `fr`.

**`package.json` :**
- ajout de `"type": "module"` (requis pour la résolution ESM des imports `.ts` dans `payload.config.ts` lors du `payload generate:types`).
- ajout du script `generate:types:docker` qui contourne le crash undici/tsx local en exécutant `npx payload generate:types` dans un conteneur `node:22-alpine`.

**Schéma créé :**

| Type | Fichier | Slug Payload |
| --- | --- | --- |
| Collection | `src/collections/Users.ts` | `users` |
| Collection | `src/collections/Media.ts` | `media` (uploads, tailles `thumbnail`/`card`/`og`) |
| Collection | `src/collections/Projects.ts` | `projects` (versioning + drafts, hook `beforeChange` auto-slug) |
| Collection | `src/collections/TimelineItems.ts` | `timeline-items` |
| Collection | `src/collections/Certifications.ts` | `certifications` |
| Global | `src/globals/SiteMeta.ts` | `site-meta` |
| Global | `src/globals/About.ts` | `about` |
| Block | `src/blocks/SectionHeading.ts` | `section-heading` |
| Block | `src/blocks/Paragraph.ts` | `paragraph` |
| Block | `src/blocks/CodeBlock.ts` | `code-block` |
| Block | `src/blocks/Highlight.ts` | `highlight` |
| Block | `src/blocks/ArchitectureDiagram.ts` | `architecture-diagram` |
| Block | `src/blocks/ImageBlock.ts` | `image` |

**Sidebar admin (FR) :**
- Groupe **Contenu** : Projets, Médias, Items du parcours, Certifications, À propos
- Groupe **Configuration** : Utilisateurs, Métadonnées du site

Tous les `label` de field/collection/global/block sont en français. Les `admin.description` expliquent le rôle de chaque field.

**i18n :** `fallbackLanguage: 'fr'`, `supportedLanguages: { fr }`. Titre du dashboard : « Tableau de bord - Payload ».

**`payload-types.ts` :** généré et committé. Contient `User`, `Media`, `Project`, `TimelineItem`, `Certification`, `SiteMeta`, `About` + types `*Select<>` et `Config`.

### Générer les types

```bash
npm run generate:types:docker
```

Détail de la commande : `docker run --rm -v "$(pwd):/app" -w /app node:22-alpine sh -c 'apk add --no-cache libc6-compat && npm ci --silent && npx payload generate:types'`. Compte ~30 s la première fois (image à pull + `npm ci`), ~5–10 s ensuite.

À relancer dès qu'un field/collection/global/block est modifié.

### Exemple de typage côté frontend (Étape 4 anticipée)

```ts
import type { Project, Media } from "@/payload-types";

const project: Project = await payload.findByID({ collection: "projects", id });
const cover = project.coverImage as Media | null;
```

### Critères d'acceptation Étape 2

- [x] `npm run dev` démarre sans erreur, `/admin` accessible
- [x] Sidebar admin (FR) liste Projets, Items du parcours, Certifications, Médias, Métadonnées du site, À propos
- [x] Le panneau de création de projet expose les 6 blocks dans la palette d'insertion `content`
- [x] `npm run typecheck` vert
- [x] `npm run lint` vert
- [x] `npm run generate:types:docker` produit `payload-types.ts` contenant `Project`, `TimelineItem`, `Certification`, `Media`, `User`, `SiteMeta`, `About`

> Note : le frontend public n'a pas été touché — `app/page.tsx`, `app/projets/...`, etc. lisent toujours `content/*.ts` et `content/projects/*.mdx`. Pas de régression visuelle attendue. Le refactor a lieu à l'Étape 4.

---

## Étape 3 — Seed des données legacy (terminée)

`scripts/seed.ts` migre 100% du contenu existant (`content/*.ts` + `content/projects/*.mdx`)
vers la base SQLite Payload via la Local API. Les fichiers sources sont archivés sous `legacy/`.

### Ce qui a été migré

| Source | Cible Payload | Volume |
| --- | --- | --- |
| `content/meta.ts` | global `site-meta` | 1 doc |
| `content/about.ts` | global `about` | 1 doc, paragraphes convertis en richText Lexical |
| `content/timeline.ts` | collection `timeline-items` | 8 docs |
| `content/certifications.ts` | collection `certifications` | 3 docs |
| `content/projects/*.mdx` | collection `projects` | 4 docs, body MDX → blocks |

Tous les fichiers source ont été déplacés dans `legacy/content/` (et `legacy/content/projects/`).

### Mapping mdast → blocks Payload

| mdast | block Payload |
| --- | --- |
| `heading` profondeur 2 (`## ...`) | `section-heading` |
| `paragraph` | `paragraph` (mdast → Lexical : `strong`=bold, `emphasis`=italic, `inlineCode`=code) |
| `code` (` ```lang `) | `code-block` (langue mappée sur les 9 options, fallback `bash`) |
| MDX JSX `<CodeBlock>` | `code-block` |
| MDX JSX `<Highlight>` | `highlight` |
| MDX JSX `<ArchitectureDiagram>` | `architecture-diagram` |
| autres types (list, blockquote, …) | log un warning, ignoré |

Les MDX legacy actuels ne contiennent que `heading` (depth 2) + `paragraph` avec inlines (`**bold**`, `` `code` ``). Aucun warning au seed.

### Commandes

```bash
# Local (échoue silencieusement sur Node 20.19 à cause du loader tsx)
npm run seed

# Docker (recommandé — node:22-slim, exécute en tant qu'utilisateur courant)
npm run seed:docker
```

Le seed est **idempotent**. Clés d'upsert :
- `timeline-items` : couple (`date`, `title`)
- `certifications` : `name`
- `projects` : `slug`
- globals : pas de clé (un seul doc par slug par définition)

Deuxième passage observé : 0 created, tout en updated. Pas de doublon.

### Compatibilité legacy : alias tsconfig + `lib/projects.ts` repointé

Le `app/layout.tsx` (root layout) importe `components/Footer.tsx` qui importe
`@/content/meta`. Comme la route group `(payload)` hérite du root layout, déplacer
`content/` cassait aussi `/admin` (Next 500 « Module not found »). La séparation
propre `app/(site)/` + `app/(payload)/` est du ressort de l'Étape 4.

Pour débloquer **maintenant** le `/admin` (objectif de l'Étape 3) sans toucher au
frontend :

1. `tsconfig.json` : alias `"@/content/*": ["./legacy/content/*"]` ajouté avant
   `"@/*"`. Toute import existant `@/content/foo` résout vers `legacy/content/foo`.
2. `lib/projects.ts` : `process.cwd() + "content/projects"` → `legacy/content/projects`.

Conséquence : le frontend public **continue de fonctionner**, lisant les données
de `legacy/`. La « casse runtime » mentionnée dans le brief de l'Étape 3 n'a pas
lieu — c'était un effet de bord du déplacement, pas un objectif. Lint + typecheck
restent verts.

L'Étape 4 :
- supprimera ces deux compat-shims (l'alias tsconfig et le repoint de `lib/projects.ts`)
- rebranchera les pages sur la Local API Payload via `lib/content.ts` et un
  `lib/projects.ts` réécrit
- séparera proprement les layouts `(site)` et `(payload)`

### Critères d'acceptation Étape 3

- [x] `npm run seed` (en réalité `npm run seed:docker`) passe sans erreur fatale
- [x] Dans `/admin > Projets` : 4 projets (bientot, poc-phantom, simulation-ba186, zero-trust)
- [x] Chaque projet a son champ `content` rempli de blocks (entre 11 et 18 blocks selon le projet)
- [x] Items du parcours : 8 docs, dans l'ordre original via `order` 0-7
- [x] Certifications : 3 docs, dans l'ordre original via `order` 0-2
- [x] Globals **Site Meta** et **À propos** remplis correctement
- [x] Re-lancer le seed → 0 doublon, 0 erreur, tout en « Updated »
- [x] `legacy/` contient bien meta.ts, about.ts, timeline.ts, certifications.ts, projects/*.mdx
- [x] `npm run typecheck` au vert (via les compat-shims décrits ci-dessus)
- [x] `npm run lint` au vert
- [x] `/admin`, `/`, `/parcours`, `/a-propos`, `/projets`, `/projets/[slug]` répondent tous 200

---

## Hotfix — Route group split `(site)` / `(payload)`

Bug observé après Étape 3 : `/admin` chargeait côté serveur mais crashait côté
client avec « Failed to execute 'insertBefore' on 'Node' ». Cause : deux root
layouts en conflit, `app/layout.tsx` (site, déclare `<html><body>` + Nav/Footer)
et `app/(payload)/layout.tsx` (Payload, déclare aussi `<html><body>` via
`RootLayout`). Le parent englobait le child, deux `<html>` imbriqués, React
n'arrivait pas à hydrater.

**Fix** (aurait dû être fait dès Étape 1) : deux route groups parallèles avec
chacun leur propre root layout.

```
app/
├── (payload)/   ← root layout = RootLayout @payloadcms/next
│   ├── admin/
│   ├── api/
│   └── layout.tsx
└── (site)/      ← root layout = layout.tsx du site (Nav/Footer/fonts)
    ├── a-propos/
    ├── globals.css
    ├── layout.tsx
    ├── page.tsx
    ├── parcours/
    └── projets/
```

Plus aucun `app/layout.tsx` ni `app/page.tsx` à la racine — sinon Next les
considère comme le root layout et le problème revient.

URLs publiques **inchangées** : les parenthèses dans le nom du dossier ne
participent pas au path. `/`, `/projets`, `/projets/[slug]`, `/parcours`,
`/a-propos` continuent de servir depuis le group `(site)`.

---

## Étape 4 — Frontend branché sur Payload (terminée)

Le frontend public lit désormais ses données depuis la Local API Payload via deux modules dédiés. Les compat-shims temporaires (`@/content/*` alias et `legacy/content/projects` dans `lib/projects.ts`) ont été retirés.

### Couche `lib/` — source unique des données

- `lib/projects.ts` : signatures `getProjects()`, `getProjectBySlug(slug)`, `getProjectSlugs()` désormais **async**. Filtre `_status = published`, tri par `order`, `depth: 2` pour résoudre `coverImage`. Un mapper `toMeta()` interne bridge la shape Payload (`stack: { value }[]`) vers la shape attendue par les composants visuels (`stack: string[]`) — **aucun composant n'a été modifié pour ça**.
- `lib/content.ts` (nouveau) :
  - `getSiteMeta()` → global `site-meta`, tous les champs avec fallback `""`
  - `getAbout()` → global `about` (Lexical richText conservé tel quel)
  - `getTimeline()` → collection `timeline-items` triée par `order`
  - `getCertifications()` → collection `certifications` triée par `order`

```ts
// app/(site)/page.tsx
const [siteMeta, timeline, projects] = await Promise.all([
  getSiteMeta(),
  getTimeline(),
  getProjects(),
]);
```

### `components/BlockRenderer.tsx` (nouveau)

Reçoit `blocks: Project["content"]`, fait un `switch (block.blockType)` :

| `blockType` | Rendu |
| --- | --- |
| `section-heading` | `<h2 class="mb-3 mt-10 font-mono text-[13px] uppercase">// {text}</h2>` couleur `var(--accent)` |
| `paragraph` | `<RichText>` avec converters custom (voir ci-dessous) |
| `code-block` | `<CodeBlock>` existant inchangé |
| `highlight` | `<Highlight>` existant, rendu Lexical à l'intérieur |
| `architecture-diagram` | `<ArchitectureDiagram>` existant, JSON serialisé en `<pre>` (aucun MDX legacy n'utilise ce block) |
| `image` | `<figure>` avec `next/image` |

Les **converters Lexical** (export `proseConverters` du même fichier) répliquent exactement le style de l'ancien `mdxComponents` de la page projet :
- `paragraph` → `<p class="mb-4 text-[15.5px] leading-[1.75]">` couleur `var(--n700)`
- `text` avec `format BOLD` → `<strong class="font-medium">` couleur `var(--n900)`
- `text` avec `format CODE` → `<code>` mono encadré
- italic / underline / strikethrough conservés

Ces converters sont **partagés** avec `app/(site)/a-propos/page.tsx` qui rend `about.paragraphs[]` / `about.paragraphsAfter[]`.

### Composants existants touchés (minimal)

Deux client components importaient `siteMeta` au top-level (impossible d'injecter une valeur server-side là-dedans sans prop) :
- `components/Footer.tsx` : signature passe de `() => …` à `({ siteMeta }: { siteMeta: SiteMeta }) => …`. JSX/style 100% identique.
- `components/ContactGrid.tsx` : idem. La liste `contacts` passe du scope module au scope render.

Aucun autre composant n'a été modifié.

### Revalidation on-demand

`src/hooks/revalidate.ts` exporte cinq hooks consommés par les collections et globals :

| Source | Pages revalidées |
| --- | --- |
| collection `projects` (afterChange) | `/projets/{slug}`, `/projets`, `/` |
| collection `timeline-items` (afterChange) | `/parcours`, `/` |
| collection `certifications` (afterChange) | `/parcours`, `/a-propos` |
| global `site-meta` (afterChange) | `/` (layout — touche toutes les pages qui rendent le Footer) |
| global `about` (afterChange) | `/a-propos` |

Chaque page de `app/(site)/` exporte aussi `export const revalidate = 3600` comme filet de sécurité (1h max si un hook foire silencieusement).

### Compat-shims retirés

- `tsconfig.json` : l'alias `@/content/*` → `legacy/content/*` est supprimé.
- `lib/projects.ts` : ne lit plus le filesystem, plus aucune référence à `legacy/content/projects`. Le dossier `legacy/` reste comme archive lisible (pas réimportée par le code).

### Critères d'acceptation Étape 4

- [x] `npm run dev` démarre, **toutes les routes répondent 200** : `/`, `/projets`, `/projets/{bientot,zero-trust,poc-phantom,simulation-ba186}`, `/parcours`, `/a-propos`, `/admin`
- [x] `npm run typecheck` au vert (les 12 erreurs `TS2307: Cannot find module '@/content/...'` ont disparu)
- [x] `npm run lint` au vert
- [x] `npm run generate:types:docker` toujours OK
- [x] Page projet : les sections `// Le problème`, `// L'approche`, `// La sécurité`, etc. sont rendues identiquement (h2 mono uppercase accent), les `**bold**` deviennent `<strong class="font-medium">` couleur `var(--n900)`
- [x] Page d'accueil : nom, title, description, availability lus depuis le global `site-meta`
- [x] Page parcours : timeline (8) + certifs (3) dans l'ordre `order` ascendant
- [x] À propos : paragraphes Lexical rendus avec les classes Tailwind voulues, encart `Highlight`, certifs
- [ ] **À valider visuellement de ton côté** : screenshot diff pré/post-migration sur les 5 pages publiques
- [ ] **À tester de ton côté** : modifier un projet dans `/admin`, sauver, vérifier la page publique mise à jour < 1 s plus tard sans rebuild

### Pièges connus

- **`next-mdx-remote` reste dans `dependencies`** alors qu'il n'est plus utilisé. À retirer en Étape 5 dans le cleanup, prudent ici.
- **Lexical converters basés sur les bitmasks** (`BOLD=1`, `ITALIC=2`, `CODE=16`) : valeurs hardcodées plutôt que d'importer `NodeFormat` de `@payloadcms/richtext-lexical/lexical/utils` (chemin instable). Si Lexical change les bitmasks (peu probable), à mettre à jour.

---

## Étapes suivantes (pas encore commencées)

- **Étape 5** — Sécu, `scripts/create-admin.ts`, Dockerfile, finitions.
