# Charte du portfolio

Ce document est la source canonique de la direction visuelle, de la structure
éditoriale et des limites du portfolio. Le contenu reste administrable dans
Payload ; l'identité visuelle et les règles de rendu restent versionnées dans
le code.

## Positionnement

Le site présente ce que Lucas construit, sécurise et documente. Il reste utile
à un recruteur ou à un manager technique, mais ne se comporte pas comme une
candidature permanente et ne met jamais une recherche d'emploi au centre de
l'accueil.

La navigation publique tient en deux entrées :

- **Notes** pour tous les contenus, filtrables par thème ;
- **Profil** pour le parcours, les compétences, les certifications et le CV.

Il n'y a ni moteur de recherche, ni raccourci `Ctrl+K`, ni flux RSS tant qu'un
besoin réel et une implémentation vérifiée ne les justifient.

## Direction visuelle

Toutes les pages publiques partagent le même fond sombre : accueil, Notes et
profil. La lecture longue se distingue par une colonne plus
étroite, des espacements plus généreux et des surfaces légèrement relevées,
pas par un passage sur fond blanc.

Navigation, grille, typographie, accents et transitions restent identiques sur
l'ensemble du site afin d'éviter toute rupture visuelle entre exploration et
lecture.

### Couleurs du site

| Rôle          | Valeur de référence | Usage                  |
| ------------- | ------------------- | ---------------------- |
| Encre prune   | `#18131f`           | fond principal et code |
| Encre relevée | `#201927`           | surfaces de lecture    |
| Mauve profond | `#69407b`           | structure et identité  |
| Mauve lisible | `#b999c7`           | accent sur fond sombre |
| Orange signal | `#d96542`           | action et état actif   |

L'orange ne concurrence jamais le mauve : il signale une action ou une
transition. Les couleurs du CV PDF restent celles du document original et ne
sont pas remplacées par la palette du site.

### Typographie et mouvement

- une famille sans-serif principale pour l'interface et la lecture ;
- une monospace réservée au code, aux dates et aux métadonnées courtes ;
- des titres amples, des textes entre 65 et 75 caractères par ligne ;
- transitions de contrôle entre 160 et 220 ms ;
- transitions de surface entre 450 et 650 ms ;
- aucun défilement forcé, loader décoratif ou mouvement bloquant ;
- `prefers-reduced-motion` désactive les mouvements non essentiels.

## Accueil

Le hero associe le manifeste « Je construis, sécurise et documente des
systèmes. » à un portrait illustré de Lucas. L'identité vient de sa photo ; la
direction graphique reste une illustration éditoriale à traits simples,
palette limitée et aplats francs, sans rendu photoréaliste ou esthétique
cyberpunk. Le cartouche nominatif reste superposé au bas de l'image.

Le bas de l'accueil affiche directement les trois **Notes** publiées les plus
récentes sous forme de petites cartes. Il ne présente aucun filtre ni thème :
le parcours éditorial complet reste réservé à `/notes`. Your Cloud n'apparaît
qu'après relecture et publication de son thème et de ses Notes. Simulation,
Phantom et Bientôt restent des Notes indépendantes.

## Homelab et Your Cloud

Homelab est un thème, pas une réalisation figée ni une page supplémentaire.
Sa présentation générale est une Note. Les sujets ciblés — Zero Trust,
sauvegardes, identité, observabilité ou retour d'incident — sont d'autres
Notes associées au même thème. Le filtre Homelab les réunit sans modifier leur
URL ni leur autonomie.

Le thème Your Cloud et sa première Note de présentation restent préparés en
brouillon après validation de leur sujet et de leur angle. Toute Note
supplémentaire sera créée individuellement selon la même règle, puis restera
invisible jusqu'à sa relecture. Cette charte fixe leur classement sans
transformer les idées provisoires en calendrier éditorial.

Les pages publiques distinguent toujours ce qui est **documenté**,
**implémenté** et **prouvé**. Elles ne publient aucune adresse, IP, clé,
inventaire privé ou topologie exploitable du Homelab.

## Modèle éditorial

Une **Note** est le seul objet à lire. Elle peut présenter un ensemble, détailler
une notion, expliquer un choix ou vivre seule. Un **Thème** n'est pas un second
format éditorial : c'est une étiquette structurée qui sert uniquement à
regrouper et filtrer des Notes.

Un thème peut regrouper une ou plusieurs Notes. Une Note reste indépendante par
défaut et peut être liée à zéro, un ou plusieurs thèmes. La relation ne crée
aucune page de thème et ne change jamais l'URL de la Note.

Les Notes partagent une bibliothèque de blocs : texte, titre de section, code,
encart, tableau, schéma et image. Les blocs ont des contrats
étroits :

- le code reste du texte brut échappé ;
- les tableaux sont structurés et rendus avec un élément HTML `table` ;
- les schémas se composent dans Payload avec des nœuds et des liaisons
  structurés et bornés ; l'ancien JSON reste seulement un format de reprise ;
- les SVG et images passent par la médiathèque ;
- aucun bloc n'accepte de HTML arbitraire.

La page publique canonique `/notes` affiche les thèmes dans un filtre latéral
puis les Notes publiées. Les nombres du filtre sont explicitement libellés
« Note » ou « Notes » : ils ne constituent pas une numérotation de section.
L'accueil possède ses propres petites cartes et ne réutilise pas cet
explorateur. Les anciennes entrées `/travaux`, `/projets` et
`/projets/[slug]` redirigent vers `/notes`, avec le thème demandé quand le slug
est disponible. L'URL d'une Note reste `/notes/[slug]`.

## Back-office Payload

Le menu d'administration reprend les mêmes responsabilités que le site :

- **Site** — identité, accueil et profil ;
- **Éditorial** — Thèmes et Notes ;
- **Profil** — parcours et certifications ;
- **Médiathèque** — images et PDF ;
- **Administration** — compte de connexion.

Un Thème contient seulement un nom, un slug, un ordre et un statut de
publication. Les contenus se créent et se publient toujours dans Notes, où la
relation « Thèmes » reste facultative. Une Note enregistrée en brouillon peut
être prévisualisée depuis le back-office ; cette vue exige la session Payload
active, échoue fermée sans authentification et demande aux robots de ne pas
l'indexer. La liste des Notes affiche directement leurs thèmes et indique
« Sans thème » lorsque la relation est vide.

Lors de la migration, les anciens write-ups de Projet sont copiés vers des
Notes de présentation sans supprimer immédiatement leur source. Cette archive
reste masquée dans l'administration et conservée pour permettre un rollback.
La collection garde le nom technique `projects` et ses anciennes colonnes pour
éviter une migration destructive ; elles ne réapparaissent ni dans le
back-office courant ni sur le site. La révision éditoriale 7 dépublie les
anciens Projets Simulation, Phantom et Bientôt, détache leurs Notes, puis
prépare le thème Your Cloud et sa première Note de présentation en brouillon
sans les exposer au public. Elle retire aussi les six anciens brouillons Your
Cloud par leur slug exact tant qu'ils n'ont été ni publiés ni renommés, annonce
que le projet reste en construction et raccourcit le titre de la Note autonome
« Bientôt : monitoring léger ». Si la Note de présentation Your Cloud a déjà
été publiée après validation humaine, cette révision propage le même texte sans
la dépublier, puis ne le réécrit plus aux démarrages suivants.

## Profil et CV

À propos et Parcours convergent vers **Profil**, sur le même fond sombre que le
reste de l'exploration. La localisation affichée est une ville ou une zone
modifiable. Aucun numéro de téléphone, âge, code postal ou adresse précise
n'est stocké dans le modèle public.

Le Profil réutilise l'illustration identitaire validée pour l'accueil avec un
recadrage carré plus serré, sans reprendre le cartouche du hero. Il ne crée pas
une seconde interprétation artificielle du portrait.

Le Profil interactif agrège déjà les données Payload (introduction, histoire,
parcours et certifications). Le PDF reste pour l'instant le CV original,
remplaçable depuis la Médiathèque ; il n'est pas encore généré depuis ces
données. La génération A4 dynamique constitue un incrément séparé : elle devra
rester proche du PDF original, conserver ses couleurs et ne jamais remplacer
le dernier PDF valide en cas d'échec.

## Justification sécurité et qualité

### Scénario et actifs

Le site publie du contenu personnel, des médias et des descriptions
d'infrastructure. Les actifs à protéger sont le compte administrateur, les
données personnelles, les médias originaux, le contenu publié et les détails
non publics du Homelab.

### Menaces et échecs traités

- injection de HTML ou de script par un bloc éditorial ;
- publication accidentelle d'une donnée privée ;
- relation ou média cassé ;
- contenu trop long qui casse un rendu ;
- génération coûteuse déclenchée par un visiteur ;
- présentation d'une intention comme une preuve réalisée.

### Alternatives et moindre privilège

Un constructeur de pages universel et l'exécution de code fourni par l'éditeur
sont écartés. Les blocs positifs et bornés réduisent la surface, les lectures
publiques restent séparées des mutations Payload, et les tâches coûteuses sont
réservées à l'administration.

Cela applique de manière proportionnée les valeurs sûres par défaut, la
réduction de surface, la séparation des responsabilités et le contrôle d'accès
recommandés par OWASP. La gestion des actifs, le développement sûr, la mesure
d'efficacité et la continuité de publication contribuent aux mesures NIS2
pertinentes sans constituer une revendication de conformité.

### Preuves attendues

- typecheck et build de production ;
- rendu desktop et mobile des cinq surfaces publiques ;
- navigation clavier et réduction des mouvements ;
- rejet d'un schéma invalide et d'un tableau incohérent ;
- échappement du code et absence de HTML arbitraire ;
- comportement explicite en cas de média ou relation absent ;
- ouverture du PDF publié et absence de lien cassé ;
- pour la future génération, vérification visuelle avant remplacement.

### Risque résiduel

Une description publique peut toujours révéler des choix techniques. La
relecture humaine reste obligatoire avant publication. Les contrôles du CMS ne
garantissent ni l'absence de vulnérabilité ni la conformité globale à OWASP ou
NIS2.
