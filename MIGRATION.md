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

## Étapes suivantes (pas encore commencées)

- **Étape 3** — `scripts/seed.ts` pour migrer `content/*.ts` + `content/projects/*.mdx`.
- **Étape 4** — Refactor `lib/projects.ts` + nouveau `lib/content.ts`, adapter les pages, `components/BlockRenderer.tsx`.
- **Étape 5** — Sécu, `scripts/create-admin.ts`, Dockerfile, finitions.
