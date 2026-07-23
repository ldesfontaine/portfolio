# Déploiement

Ce document décrit la construction de l'image sur GitHub, son installation sur
un serveur et la persistance des données.

## Image publiée par GitHub

Le workflow `.github/workflows/docker.yml` se déclenche lors de l'envoi d'un tag
Git commençant par `v`. Il :

1. construit l'image pour `linux/amd64` ;
2. la publie dans GitHub Container Registry ;
3. ajoute un tag de version et un tag lié au commit ;
4. signe l'image avec Cosign.

Exemple pour publier la version `0.0.5` :

```bash
git tag -a v0.0.5 -m "portfolio v0.0.5"
git push origin v0.0.5
```

Une fois le workflow terminé, l'image versionnée est disponible sous cette
forme :

```text
ghcr.io/ldesfontaine/portfolio:0.0.5
```

Utiliser un tag exact en production évite qu'un redéploiement récupère une
version différente sans décision explicite.

Le workflow construit actuellement uniquement une image AMD64. Un serveur ARM
nécessiterait l'ajout d'un runner ARM64 natif avant publication.

## Préparer le serveur

Prérequis :

- Docker Engine avec le plugin Compose ;
- un serveur AMD64 ;
- un reverse proxy TLS pour exposer le site ;
- deux volumes persistants pour les bases et les médias.

Si le paquet GHCR est privé, connecter Docker avec un token GitHub ayant
uniquement la permission `read:packages` :

```bash
echo "$GHCR_TOKEN" | docker login ghcr.io -u ldesfontaine --password-stdin
```

Cette connexion n'est pas nécessaire si le paquet est public.

Créer un fichier `.env` sur le serveur :

```dotenv
PORTFOLIO_VERSION=0.0.5
PAYLOAD_SECRET=une-valeur-longue-generee-avec-openssl
SITE_URL=https://portfolio.example.com
GOATCOUNTER_VHOST=portfolio.example.com
```

Le secret peut être généré avec :

```bash
openssl rand -base64 48
```

Il ne doit jamais être ajouté au dépôt.

## Compose minimal

```yaml
services:
  portfolio:
    image: ghcr.io/ldesfontaine/portfolio:${PORTFOLIO_VERSION}
    container_name: portfolio
    restart: unless-stopped
    read_only: true
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    environment:
      NODE_ENV: production
      HOSTNAME: 0.0.0.0
      PAYLOAD_SECRET: ${PAYLOAD_SECRET}
      DATABASE_URI: file:/data/payload.db
      SITE_URL: ${SITE_URL}
      GOATCOUNTER_VHOST: ${GOATCOUNTER_VHOST}
    volumes:
      - portfolio-data:/data
      - portfolio-media:/app/media
    tmpfs:
      - /tmp
      - /app/.next/cache
    ports:
      - "127.0.0.1:3000:3000"
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://0.0.0.0:3000/"]
      interval: 30s
      timeout: 3s
      start_period: 30s
      retries: 3

volumes:
  portfolio-data:
  portfolio-media:
```

Le port n'écoute ici que sur la boucle locale du serveur. Un reverse proxy
installé sur l'hôte peut ensuite publier le site en HTTPS. Avec Traefik dans
Docker, remplacer `ports` par un réseau partagé et ajouter les labels adaptés à
l'infrastructure.

Protéger `/admin`, `/api` et le dashboard `/stats` au niveau du reverse proxy
ou d'un VPN ajoute une défense utile à l'authentification Payload. Les endpoints
`/stats/count` et `/stats/count.js` doivent rester publics pour enregistrer les
visites.

## Démarrer et mettre à jour

```bash
docker compose pull
docker compose up -d
docker compose logs -f portfolio
```

Pour mettre à jour, changer `PORTFOLIO_VERSION`, puis relancer les deux premières
commandes. Ne pas supprimer les volumes lors d'une mise à jour.

## Données persistantes

L'image ne contient aucune donnée personnelle du portfolio :

- `/data/payload.db` contient le contenu Payload ;
- `/data/goatcounter.sqlite3` contient les statistiques ;
- `/data/backups/` contient les sauvegardes de schéma ;
- `/app/media` contient les médias envoyés depuis Payload.

Ces chemins sont montés dans les volumes `portfolio-data` et
`portfolio-media`. Le fichier `.dockerignore` exclut également les `.env`, les
bases SQLite et le dossier local `media` du contexte de build.

Au démarrage, le conteneur contrôle le plan de schéma avant de l'appliquer. Une
sauvegarde SQLite est créée avant toute suppression explicitement autorisée ;
une suppression inconnue arrête le démarrage.

## Sauvegarder et restaurer

La carte **Sauvegarde & restauration** du dashboard Payload télécharge une
archive contenant :

- la base Payload ;
- la base GoatCounter lorsqu'elle existe ;
- les médias.

La restauration vérifie l'archive et les signatures SQLite, conserve une copie
de l'état précédent, puis redémarre le conteneur.

Une sauvegarde n'est réellement protégée que si une copie quitte le serveur.
Conserver au moins une copie chiffrée sur un autre stockage.

## Premier démarrage

Sur une base vide, ouvrir `/admin` pour créer le premier utilisateur Payload.
GoatCounter est provisionné automatiquement. Son mot de passe technique est
généré dans `/data/goatcounter-admin-password`, mais l'accès courant au
dashboard passe par la session Payload.
