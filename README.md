# Portfolio — Lucas Desfontaine

Portfolio personnel DevSecOps & Sécurité des Infrastructures.

## Stack

- **Next.js 15** App Router (React 19, TypeScript strict)
- **Payload CMS 3** intégré dans la même app (panel admin sur `/admin`)
- **SQLite** (via `@payloadcms/db-sqlite`) — single file, volume-backed
- **Tailwind CSS 4** (`@theme` dans `app/(site)/globals.css`, theming via CSS variables)
- **Sharp + libvips** pour le traitement d'images uploadées

Le panel d'admin Payload est en français. Tout le contenu (projets, parcours, certifs, métas) est édité depuis `/admin` ; le frontend lit la base via la Local API et révalide on-demand via les hooks `afterChange`.

## Structure

```
app/
├── (payload)/      # Panel admin + REST/GraphQL API (root layout = RootLayout Payload)
│   ├── admin/
│   ├── api/
│   └── layout.tsx
└── (site)/         # Site public (root layout = Nav + Footer + fonts)
    ├── a-propos/
    ├── parcours/
    ├── projets/
    └── layout.tsx

src/
├── blocks/         # Section heading, paragraph, code-block, highlight, etc.
├── collections/    # Projects, TimelineItems, Certifications, Media, Users
├── globals/        # SiteMeta, About
└── hooks/          # afterChange → revalidatePath

components/         # UI (Nav, Footer, ProjectCard, BlockRenderer…) — visuel inchangé
lib/
├── content.ts      # getSiteMeta / getAbout / getTimeline / getCertifications
├── projects.ts     # getProjects / getProjectBySlug / getProjectSlugs
└── types.ts

scripts/
├── create-admin.ts # auto-bootstrap du premier user au démarrage
├── seed.ts         # migration one-shot des anciens MDX (Étape 3)
└── backup.sh       # snapshot SQLite + tarball médias

docker/
└── entrypoint.sh
```

## Setup dev

Pré-requis : Node 22 LTS recommandé (Node 20.19 fonctionne pour Next + Payload UI mais casse les CLI `payload generate:*` à cause d'un bug undici/tsx).

```bash
git clone <repo>
cd termfolio
npm install

# Générer un secret fort
echo "PAYLOAD_SECRET=$(openssl rand -base64 48)" > .env
echo "DATABASE_URI=file:./payload.db" >> .env
echo "SITE_URL=http://localhost:3000" >> .env

npm run dev
```

- Site public : <http://localhost:3000>
- Panel admin : <http://localhost:3000/admin>

Au premier hit sur `/admin`, Payload propose la création du premier utilisateur. La base SQLite est créée automatiquement dans `./payload.db`.

### Scripts

```bash
npm run dev                  # Next + Payload sur :3000
npm run build                # build prod
npm run start                # serveur prod local
npm run typecheck            # tsc --noEmit
npm run lint                 # next lint
npm run generate:types:docker # régénère payload-types.ts dans un conteneur Node 22
npm run seed:docker          # migre legacy/content/* vers la base — idempotent
```

## Setup prod (Docker + Traefik)

Pré-requis :
- Un hôte avec Docker + un Traefik existant (réseau `traefik` external)
- Domaine pointé sur l'hôte
- (Optionnel mais recommandé) Une IP fixe ou un VPN/Tailscale pour accéder à `/admin`

### Variables d'environnement

Copie `.env.example` en `.env` et renseigne :

```bash
PAYLOAD_SECRET=$(openssl rand -base64 48)
DATABASE_URI=file:/data/payload.db
SITE_URL=https://lucasdesfontaine.dev
SITE_HOST=lucasdesfontaine.dev

# Premier admin créé automatiquement au premier boot si la base est vide
ADMIN_EMAIL=lucas@example.com
ADMIN_PASSWORD=un-mot-de-passe-fort

# IP autorisées sur /admin et /api (sinon 403 Traefik)
ADMIN_ALLOWED_IPS=1.2.3.4/32,5.6.7.8/32
```

Sans IP fixe, alternatives :
- **Tailscale** : utiliser l'IP de tunnel (`100.x.y.z/32`)
- **Cloudflare Access** : mettre une Access App devant `/admin` (auth Google/GitHub)
- **VPN** : Wireguard sur l'hôte + IP du tunnel dans l'allowlist

### Démarrage

```bash
docker compose up -d --build
docker compose logs -f portfolio
```

Le conteneur :
1. Pousse le schéma SQLite si absent (entrypoint avec `NODE_ENV=development` éphémère)
2. Crée le user admin depuis `ADMIN_EMAIL`/`ADMIN_PASSWORD` si la collection `users` est vide
3. Démarre Next en `NODE_ENV=production`

Health check `wget /` toutes les 30 s. Volumes Docker : `portfolio-data` (SQLite + backups) et `portfolio-media` (uploads Payload).

### Sécurité

Trois couches indépendantes :

1. **Réseau** : Traefik middleware `ipallowlist` filtre `/admin` et `/api` sur les CIDR de `ADMIN_ALLOWED_IPS`. Tout le reste reste public.
2. **Secret** : `PAYLOAD_SECRET` signe les sessions. Doit être généré avec `openssl rand -base64 48` et **jamais commit**.
3. **Mot de passe** : choisi long, idéalement via gestionnaire de passwords. Le reset email est désactivé (single-user).

**TOTP/2FA** : pas mis en place — pas de plugin officiel Payload stable au moment de la migration. À ajouter plus tard via `payload-totp` (community) si besoin.

## Backup et restore

### Automatique (cron sur l'hôte)

Ajoute au crontab de l'hôte :

```cron
0 3 * * * docker exec portfolio /app/scripts/backup.sh >> /var/log/portfolio-backup.log 2>&1
```

Le script :
- snapshot SQLite via `.backup` (safe pendant les writes) → `/data/backups/payload-YYYYMMDD-HHMMSS.db`
- tarball médias → `/data/backups/media-YYYYMMDD-HHMMSS.tar.gz`
- rétention locale 30 jours
- copie offsite via `rclone` si `RCLONE_REMOTE` est défini

### Offsite via rclone

`rclone` n'est pas inclus dans l'image. Deux options :

1. **Lancer rclone depuis l'hôte** sur le volume `/var/lib/docker/volumes/portfolio-data/_data/backups/`
2. Ajouter `rclone` à l'image (à voir si besoin)

### Restore

```bash
# 1. Stop le conteneur
docker compose stop portfolio

# 2. Remplacer la base
docker run --rm -v portfolio-data:/data alpine \
  sh -c 'cp /data/backups/payload-YYYYMMDD-HHMMSS.db /data/payload.db'

# 3. (Optionnel) Restaurer les médias
docker run --rm -v portfolio-data:/data -v portfolio-media:/media alpine \
  sh -c 'tar xzf /data/backups/media-YYYYMMDD-HHMMSS.tar.gz -C /media'

# 4. Restart
docker compose start portfolio
```

## Éditer du contenu

Va sur `https://{SITE_HOST}/admin`. Tu y trouves :

- **Contenu** → Projets, Médias, Items du parcours, Certifications, À propos
- **Configuration** → Utilisateurs, Métadonnées du site

Les modifications sont propagées au site public dans la seconde via les hooks `afterChange` (revalidatePath ciblé). Filet ISR `revalidate = 3600` sur chaque page si un hook foire silencieusement.

## Migration depuis l'ancien stack MDX

L'historique complet de la migration (5 étapes, écarts par rapport au brief, pièges connus) est dans [MIGRATION.md](MIGRATION.md). Les sources MDX originales sont archivées dans `legacy/content/`.

## Licence

Code perso, pas d'OSS license — me contacter avant tout réemploi.
