# Portfolio — Lucas Desfontaine

Portfolio personnel consacré au DevSecOps, à la sécurité des infrastructures et
aux projets que je construis pour apprendre.

Le site public s'organise autour de deux espaces :

- **Notes** : retours d'expérience, notions techniques et projets, avec des
  thèmes facultatifs pour les regrouper ;
- **Profil** : parcours, compétences, certifications et CV.

Le contenu est administré avec Payload CMS depuis `/admin`. Le site et le
back-office vivent dans la même application.

## Stack

- Next.js 16, React 19 et TypeScript strict ;
- Payload CMS 3 ;
- SQLite pour le contenu et les analytics ;
- GoatCounter auto-hébergé pour les statistiques ;
- Docker pour le déploiement.

## Lancer le projet

Prérequis : Node.js 22 et npm.

```bash
git clone https://github.com/ldesfontaine/portfolio.git
cd portfolio
npm install
cp .env.example .env
```

Remplace ensuite `PAYLOAD_SECRET` dans `.env` par une valeur générée localement :

```bash
openssl rand -base64 48
```

Puis démarre l'application :

```bash
npm run dev
```

- Site : <http://localhost:3000>
- Administration : <http://localhost:3000/admin>

Pour tester l'image complète avec ses volumes Docker :

```bash
docker compose up -d --build
```

## Vérifications

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Données et sauvegardes

Les fichiers `.env`, les bases SQLite, les médias locaux et les sauvegardes sont
ignorés par Git et exclus du contexte de l'image Docker. En production, les
données vivent dans les volumes `portfolio-data` et `portfolio-media`.

## Documentation

- [Déploiement et restauration](docs/DEPLOIEMENT.md)
- [Charte éditoriale et visuelle](docs/CHARTE-PORTFOLIO.md)
- [Exigences qualité](QUALITE.md)

## Licence

Code personnel sans licence open source. Me contacter avant tout réemploi.
