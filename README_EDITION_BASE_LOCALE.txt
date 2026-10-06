Mes notes — corriger les fiches (mode admin)

MODE ADMIN
- J'ouvre le jeu avec ?admin=1 au bout de l'adresse : le mode admin reste ensuite mémorisé sur cet appareil.
- Pour en sortir : « Quitter le mode admin » dans Affichage, ou ?admin=0.
- Ce n'est pas une vraie protection : ça cache seulement les outils aux autres joueur·ses.

CORRIGER UNE FICHE
- Dans la fiche ACU ou PHARMA : « ✎ Corriger la fiche », puis je modifie les champs.
  Chaque champ s'enregistre tout seul quand je le quitte.
- « Publier » envoie mes corrections dans fiches-corrections.js, sur le dépôt : tout le monde les voit.
- Avant de pousser quelque chose depuis mon ordinateur, je récupère d'abord le dépôt (git pull),
  parce que le jeu a peut-être publié des corrections entre-temps.

EXPORTER / IMPORTER
- Le bouton 🗃️ (seulement en mode admin) exporte toute la base avec mes corrections,
  ou réimporte un fichier JSON corrigé.
- Ne jamais renommer les identifiants des points ni des substances.

CHAMP ASSOCIATIONS (POINTS ACU)
- Il existe pour tous les points, même vide.
- Je peux le corriger dans la fiche et dans le panneau Comparaison ; il part avec l'export.

SOUTIENS (« PROJET SOUTENU PAR : … MERCI ! » EN BAS DU MENU)
- Les donateur·ices écrivent leur prénom dans la note PayPal (le jeu le leur demande).
- En mode admin : Menu → Réglages → Soutiens. Je modifie la liste (prénoms séparés par des virgules),
  le jeu publie soutiens.js tout seul avec ma clé GitHub (la même que pour publier les fiches).
- Sinon, je peux aussi modifier soutiens.js directement sur GitHub (crayon « Edit »).
