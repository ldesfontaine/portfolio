# Portfolio — Lucas Desfontaine

Portfolio personnel DevSecOps & Sécurité des Infrastructures.

## Stack

- **Next.js 16.2.11** App Router (React 19, TypeScript strict)
- **Payload CMS 3.86.0** intégré dans la même app (panel admin sur `/admin`)
- **SQLite** (via `@payloadcms/db-sqlite`) — single file, volume-backed
- **Tailwind CSS 4** (`@theme` dans `app/(site)/globals.css`, theming via CSS variables)
- **Sharp + libvips** pour le traitement d'images uploadées

Le panel d'admin Payload est en français. Thèmes, Notes, profil, parcours,
certifications, médias et textes de l'accueil sont édités depuis `/admin` ; le
frontend lit la base via la Local API et révalide les pages concernées via les
hooks `afterChange`.

## Structure

```
app/
├── (payload)/      # Panel admin + REST/GraphQL API (root layout = RootLayout Payload)
│   ├── admin/
│   ├── api/
│   └── layout.tsx
└── (site)/         # Site public (root layout = Nav + Footer + fonts)
    ├── notes/
    ├── profil/
    ├── projets/
    ├── travaux/     # redirection de compatibilité vers /notes
    └── layout.tsx

src/
├── blocks/         # Texte, code, encart, tableau, schéma, image…
├── collections/    # Projects, Posts, TimelineItems, Certifications, Media, Users
├── globals/        # SiteMeta, About
└── hooks/          # afterChange → revalidatePath

components/         # UI publique et composants du dashboard Payload
lib/
├── content.ts      # getSiteMeta / getAbout / getTimeline / getCertifications
├── posts.ts        # Notes publiées et relations facultatives vers les Thèmes
├── projects.ts     # lecture des Thèmes (nom technique conservé pour la DB)
├── payload.ts      # instance Local API partagée
└── types.ts

scripts/
├── bootstrap-schema.ts # vérifie, sauvegarde et applique le schéma SQLite
├── migrate-project-writeups-to-notes.ts # reprise idempotente des anciens articles
├── prepare-editorial-v2.ts # Notes autonomes et brouillons validés Your Cloud
├── redesign-content-v1.ts # synchronisation éditoriale bornée et idempotente
├── schema-bootstrap-policy.ts # liste fermée des suppressions autorisées
└── generate-og.mjs     # génère l'image Open Graph statique

docker/
└── entrypoint.sh
```

## Setup dev

Pré-requis : Node 22 LTS recommandé (Node 20.19 fonctionne pour Next + Payload UI mais casse les CLI `payload generate:*` à cause d'un bug undici/tsx).

```bash
git clone <repo>
cd portfolio
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
npm run lint                 # ESLint (configuration plate Next.js 16)
npm test                     # tests hostiles des blocs éditoriaux
npm run generate:types       # régénère payload-types.ts
npm run generate:types:docker # régénère payload-types.ts dans un conteneur Node 22
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

1. Inspecte le plan de schéma Payload, sauvegarde la base si une suppression
   approuvée est nécessaire, puis applique et revérifie le schéma ;
2. copie une seule fois les anciens contenus vers des Notes, conserve leur
   source de rollback, sépare les Notes autonomes et prépare en brouillon le
   thème Your Cloud ainsi que sa Note d'introduction validée ;
3. provisionne GoatCounter si nécessaire ;
4. démarre Next en `NODE_ENV=production`.

Health check `wget /` toutes les 30 s. Volumes Docker : `portfolio-data` (SQLite + backups) et `portfolio-media` (uploads Payload).

Sur une base vide, le premier compte Payload se crée depuis `/admin`. Aucun mot
de passe administrateur n'est lu depuis les variables d'environnement.

### Garde de schéma au démarrage

Le bootstrap est non interactif afin qu'un redémarrage Docker ne puisse pas
laisser Next démarrer sur un schéma ancien. Les ajouts sont appliqués
automatiquement. Si une base se trouve dans un état additif intermédiaire, une
sauvegarde est créée puis seuls les champs connus du redesign sont complétés
et les tables de staging Drizzle connues sont retirées avant que Payload
recalcule son plan. Tout artefact de staging inconnu arrête le conteneur. La
seule perte de données autorisée est la suppression des sept colonnes retirées
par ce redesign (`site_meta.title`, `description`, `location`, `availability`,
`about.quick_info_rhythm`, `posts.featured` et
`_posts_v.version_featured`). Une sauvegarde SQLite cohérente est créée dans
`/data/backups/` avant leur suppression. Le plan SQL est contrôlé même lorsque
Drizzle omet une alerte sur une table vide. Ses créations d'index strictement
dupliquées sont réduites à la première occurrence ; une définition divergente
ou toute autre suppression arrête le conteneur.

La synchronisation éditoriale porte le marqueur interne `contentRevision=7`.
Elle conserve Homelab comme seul Thème publié, transforme Simulation,
Phantom et Bientôt en Notes autonomes et initialise l'introduction/spécialités
du Profil. Elle crée aussi au statut brouillon le Thème Your Cloud et sa
première Note de présentation validée, sans préparer d'autres sujets. Un
contenu déjà créé n'est jamais écrasé au redémarrage. Les démarrages suivants
relisent le marqueur et ne rejouent pas ces écritures.

Le passage de la révision 4 à la révision 5 supprime uniquement les six anciens
brouillons Your Cloud identifiés par leur slug exact lorsqu'ils sont encore au
statut brouillon. Une Note publiée ou renommée est conservée, et la sauvegarde
SQLite préalable permet de reprendre la base en cas d'échec.

La révision 6 annonce dès l'ouverture que Your Cloud reste en construction et
renomme la Note autonome « Bientôt : monitoring léger » sans la rattacher au
thème Homelab. La révision 7 propage exceptionnellement ce texte validé dans la
Note Your Cloud déjà publiée tout en conservant son statut. Les redémarrages
suivants ne réécrivent plus son contenu.

Ce choix protège le contenu et la disponibilité contre un schéma partiellement
appliqué. Une confirmation forcée de toutes les alertes et une migration SQL
aveugle ont été écartées : elles auraient accordé une portée de suppression
inutile. La liste fermée, la sauvegarde préalable et l'arrêt par défaut suivent
les principes OWASP de valeur sûre, moindre privilège et défense en profondeur,
ainsi que les mesures NIS2 proportionnées de gestion des risques, continuité et
développement sûr. Les preuves couvrent le chemin normal, une suppression non
autorisée et un second passage idempotent. Le risque résiduel est qu'une future
évolution avec renommage ambigu nécessite une migration dédiée ; le conteneur
doit alors rester arrêté jusqu'à sa revue.

### Sécurité

Trois couches indépendantes :

1. **Réseau** : Traefik middleware `ipallowlist` filtre `/admin` et `/api` sur les CIDR de `ADMIN_ALLOWED_IPS`. Tout le reste reste public.
2. **Secret** : `PAYLOAD_SECRET` signe les sessions. Doit être généré avec `openssl rand -base64 48` et **jamais commit**.
3. **Mot de passe** : choisi long, idéalement via gestionnaire de passwords. Le reset email est désactivé (single-user).

**TOTP/2FA** : pas mis en place — pas de plugin officiel Payload stable au moment de la migration. À ajouter plus tard via `payload-totp` (community) si besoin.

## Analytics auto-hébergées (GoatCounter)

Stats privacy-friendly (sans cookies tiers, sans envoi de données vers un service externe, filtrage des bots intégré). Le binaire GoatCounter est **embarqué dans la même image** que Payload/Next.js : un seul `docker pull`, un seul container, un seul cert Traefik. GoatCounter écoute uniquement en loopback (`127.0.0.1:8080`) sous `-base-path=/stats` ; Next.js fait un simple rewrite `/stats/*` vers cette loopback.

### Endpoints (servis sous `/stats/...` sur le domaine du portfolio)

| Path                  | Auth              | Rôle                                       |
| --------------------- | ----------------- | ------------------------------------------ |
| `/stats/count`        | publique          | POST des hits (script de tracking)         |
| `/stats/count.js`     | publique          | Script JS de tracking                      |
| `/stats/`             | login GoatCounter | Dashboard                                  |
| `/stats/settings/...` | login GoatCounter | Réglages du site (publicité, badges, etc.) |

L'auth est **SSO via Payload** : le proxy Next.js protège `/stats/*` derrière la session admin. Le site GoatCounter est marqué `public` au bootstrap pour désactiver son login interne — c'est le proxy qui est le seul gardien. Si tu hits `/stats/` sans cookie Payload valide, tu te fais rediriger vers `/admin/login?redirect=/stats`. Une fois loggé, tu retombes sur le dashboard directement.

Le panel Payload (`/admin`) affiche une carte **Analytics** qui montre un résumé des 7 derniers jours (total, top 5 pages) — alimentée par l'API GoatCounter via un token créé au bootstrap. La carte affiche aussi un bouton **"Ouvrir le dashboard ↗"** qui ouvre `/stats/` dans un nouvel onglet pour la vue complète. Pas d'iframe (la CSP de GoatCounter bloque l'embed côté serveur, c'est volontaire de leur côté).

### Endpoints non gatés (publics par exception)

- `/stats/count` (POST) — endpoint de tracking, doit accepter les hits anonymes
- `/stats/count.js` (GET) — script JS de tracking chargé par le site public
- `/stats/*.{css,js,svg,png,woff2,…}` — assets statiques bundlés dans le binaire GoatCounter, sans données sensibles. Les by-passer évite un round-trip auth par asset au chargement du dashboard.

### Détails techniques

- **CSRF Origin forgé** : la fetch interne `proxy → /api/users/me` passe un header `Origin` issu de `SITE_URL` pour passer le check CSRF de Payload (qui exige soit une `Origin` matchant `csrf:`, soit un `Sec-Fetch-Site=same-origin`). Sans ça, le check renvoie `user: null` et le proxy bloque même les sessions valides.
- **Token API** : créé au premier boot dans `/data/goatcounter-api-token` (lisible par l'user `nextjs` uniquement, mode `0600`). Permissions : `site_read,export` + bit `stats` (64) ajouté via SQL — la CLI `db create apitoken` de la v2.7.0 n'expose pas la perm `stats` qui est requise pour les endpoints `/api/v0/stats/*`.
- **Site public** : `UPDATE sites SET settings = json_set(settings, '$.public', 'public')` au bootstrap. Sans ça, le dashboard exigerait un second login GoatCounter, par-dessus celui de Payload.
- **Navigations Next.js** : `TrackPageView` complète le chargement initial de
  `count.js` en enregistrant les navigations client-side.
- **UI GoatCounter** : par défaut en anglais. Pour passer en français, va sur `/stats/settings/user` → Language → "Français" → Save. Préférence par-user persistée en DB.

### Ne pas se compter soi-même (auto-exclusion)

Le snippet inline avant `count.js` lit `document.cookie` et set `no_onload: true` quand le cookie `payload-token` (session Payload) est présent — autrement dit, **dès que tu es loggé sur `/admin`, tes propres visites dans le même navigateur ne sont pas comptées**. Le workflow attendu est donc : tu te logges sur `/admin` avant d'aller checker tes pages publiques.

Limites :

- **Navigateur où tu n'es pas loggé** (phone perso, navigation privée, browser jetable) : tu seras compté comme un vrai visiteur. Pour ces cas-là, soit tu te logges admin d'abord, soit tu acceptes le faux positif.
- **Pas de filtre IP par défaut.** Si tu as une IP fixe (perso, VPN, Tailscale exit-node) et que tu veux une seconde ligne de défense, tu peux ajouter `ignore_ips` côté site GoatCounter :
  ```bash
  docker exec portfolio sqlite3 /data/goatcounter.sqlite3 \
    "UPDATE sites SET settings = json_set(settings, '\$.ignore_ips', '1.2.3.4') WHERE site_id = 1;"
  ```
- **Stealth bots** : GoatCounter filtre déjà les UA bots connus. Les bots qui se font passer pour de vrais navigateurs passent à travers — impossible à détecter à 100% sans empreinte invasive.

### Premier démarrage

Sur le premier boot (DB analytics absente), le container provisionne tout seul. Une seule variable à fournir :

```bash
GOATCOUNTER_VHOST=portfolio.ldesfontaine.com   # cf. SITE_URL — hostname canonique
```

GoatCounter exige un user owner pour le site, mais comme l'auth UI passe par Payload (cf. plus bas), on ne s'en sert jamais. Du coup :

- **email** : auto-dérivé en `admin@${GOATCOUNTER_VHOST}` au bootstrap. Non configurable.
- **password** : généré aléatoirement (24 octets base64) et écrit dans `/data/goatcounter-admin-password` (mode 0600, owner `nextjs`). Si tu veux te logger dans l'UI GoatCounter pour bricoler un setting :
  ```bash
  docker exec portfolio cat /data/goatcounter-admin-password
  ```

Aux boots suivants, `GOATCOUNTER_VHOST` est ignorée (bootstrap idempotent, keyé sur `/data/goatcounter.sqlite3`).

### Multi-domaines (`ldesfontaine.com` + `portfolio.ldesfontaine.com`)

GoatCounter agrège les hits par `path`, pas par hostname. Pour éviter que deux URL `/` (apex et subdomain) ne se confondent dans le dashboard, on **canonicalise au niveau Traefik** : `ldesfontaine.com` redirige en 301 vers `portfolio.ldesfontaine.com`. Une seule install, un seul site, un dashboard propre — cf. les labels Traefik dans le compose ci-dessous.

### Compose de production (à recopier sur le serveur)

```yaml
services:
  portfolio:
    image: ghcr.io/ldesfontaine/portfolio:0.0.1
    container_name: portfolio
    restart: unless-stopped
    read_only: true
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    environment:
      - HOSTNAME=0.0.0.0
      - NODE_ENV=production
      - PAYLOAD_SECRET=${PAYLOAD_SECRET}
      - DATABASE_URI=file:/data/payload.db
      - SITE_URL=https://portfolio.ldesfontaine.com
      # Bootstrap analytics — uniquement lu au premier boot (DB vide).
      # Le user owner GoatCounter est auto-créé : email = admin@${VHOST},
      # password aléatoire dans /data/goatcounter-admin-password.
      - GOATCOUNTER_VHOST=portfolio.ldesfontaine.com
    volumes:
      - portfolio-data:/data
      - portfolio-media:/app/media
    tmpfs:
      - /tmp
      - /app/.next/cache
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://0.0.0.0:3000/"]
      interval: 30s
      timeout: 3s
      start_period: 30s
      retries: 3
    labels:
      - "traefik.enable=true"
      - "traefik.docker.network=portfolio-net"

      # ── Router 1 : apex → redirect 301 vers portfolio.* ──
      - "traefik.http.routers.portfolio-apex.rule=Host(`ldesfontaine.com`)"
      - "traefik.http.routers.portfolio-apex.entrypoints=websecure"
      - "traefik.http.routers.portfolio-apex.tls=true"
      - "traefik.http.routers.portfolio-apex.middlewares=apex-to-portfolio"
      - "traefik.http.middlewares.apex-to-portfolio.redirectregex.regex=^https?://ldesfontaine\\.com/(.*)"
      - "traefik.http.middlewares.apex-to-portfolio.redirectregex.replacement=https://portfolio.ldesfontaine.com/$${1}"
      - "traefik.http.middlewares.apex-to-portfolio.redirectregex.permanent=true"

      # ── Router 2 : portfolio.* → l'app ──
      - "traefik.http.routers.portfolio.rule=Host(`portfolio.ldesfontaine.com`)"
      - "traefik.http.routers.portfolio.entrypoints=websecure"
      - "traefik.http.routers.portfolio.tls=true"
      - "traefik.http.routers.portfolio.middlewares=default-headers@file"
      - "traefik.http.services.portfolio.loadbalancer.server.port=3000"
    networks:
      - portfolio-net

volumes:
  portfolio-data:
  portfolio-media:

networks:
  portfolio-net:
    name: portfolio-net
    internal: true
```

Le volume `portfolio-data` contient la DB Payload et la DB GoatCounter
(`/data/payload.db` + `/data/goatcounter.sqlite3`). Le dashboard Payload permet
de télécharger un snapshot unique qui contient les deux bases et les médias.

### Si tu rajoutes Pangolin plus tard

Paths à mettre derrière auth Pangolin sur `portfolio.ldesfontaine.com` :

- `/admin/*` — panel Payload
- `/stats/` et `/stats/settings/*` et `/stats/user/*` — dashboard et admin GoatCounter (auth native déjà en place, mais Pangolin = défense en profondeur)
- **À laisser publics** : `/stats/count` et `/stats/count.js` (tracking — sinon plus de stats)

### Bump de version GoatCounter

Le binaire upstream est pinné par version + SHA256 dans la stage `goatcounter-dl` du `Dockerfile`. Pour passer à une nouvelle release :

1. Mettre à jour `ARG GOATCOUNTER_VERSION=X.Y.Z`
2. Recalculer les SHA256 :
   ```bash
   for arch in amd64 arm64; do
     curl -sfL "https://github.com/arp242/goatcounter/releases/download/vX.Y.Z/goatcounter-vX.Y.Z-linux-${arch}.gz" | sha256sum
   done
   ```
3. Coller les hashs dans `SHA256_AMD64` / `SHA256_ARM64`

## Backup et restore

### Depuis le back-office

La carte **Sauvegarde & restauration** du dashboard télécharge un `.tar.gz`
contenant `payload.db`, les médias et, lorsqu'elle existe, la base GoatCounter.
La restauration valide la taille et les signatures SQLite, conserve une copie
pré-restauration puis redémarre le conteneur.

## Éditer du contenu

Va sur `https://{SITE_HOST}/admin`. Tu y trouves :

- **Site** → Identité & accueil, Profil
- **Éditorial** → Thèmes, Notes
- **Profil** → Items du parcours, Certifications
- **Médiathèque** → Médias
- **Administration** → Utilisateurs

Une **Note** est le seul contenu éditorial public. Un **Thème** comme Homelab
sert uniquement à regrouper et filtrer des Notes ; il n'a ni page publique ni
contenu propre. Le champ **Thèmes** d'une Note est facultatif : le laisser vide
n'empêche ni l'enregistrement ni la publication. La page canonique est
`/notes` et les anciennes URLs `/travaux` et `/projets/...` y redirigent.
Le bouton de prévisualisation d'une Note enregistrée en brouillon ouvre une
vue privée qui exige une session Payload active ; sans cette session, la route
renvoie une page introuvable.

La collection Payload garde le slug technique `projects` et ses anciennes
colonnes masquées pour ne pas imposer une migration destructive à la base. Le
back-office et le site parlent uniquement de Thèmes.

Les modifications sont propagées au site public via des hooks `afterChange`
qui invalident uniquement les pages concernées.

## Licence

Code perso, pas d'OSS license — me contacter avant tout réemploi.
