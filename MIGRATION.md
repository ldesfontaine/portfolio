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

## Étapes suivantes (pas encore commencées)

- **Étape 2** — Définir collections (`projects`, `timeline-items`, `certifications`, `media`), globals (`site-meta`, `about`), blocks (`section-heading`, `paragraph`, `code-block`, `highlight`, `architecture-diagram`, `image`).
- **Étape 3** — `scripts/seed.ts` pour migrer `content/*.ts` + `content/projects/*.mdx`.
- **Étape 4** — Refactor `lib/projects.ts` + nouveau `lib/content.ts`, adapter les pages, `components/BlockRenderer.tsx`.
- **Étape 5** — Sécu, `scripts/create-admin.ts`, Dockerfile, finitions.
