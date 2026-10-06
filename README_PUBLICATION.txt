Mes notes — publication

- Le site est publié par GitHub Pages depuis la branche main de felixiksz/jeuxmtc.github.io.
- Les fichiers CSS et JS du jeu sont à la racine, à côté de index.html (pas de dossier assets).
  Les modules ont leur propre dossier : trajets/, formules/, equilibrer/.
- Quand je modifie un fichier, je change son ?v=… dans index.html (ou dans la page du module),
  pour que les navigateurs prennent la nouvelle version.
- Ne jamais changer les clés localStorage : les stats, les séries et les notes des joueur·ses y sont gardées.
- Formules : après avoir ajouté des formules dans l'Outil diagnostique,
  relancer node tools/formules-publish.js <dossier du dépôt Assistant-MTC>, puis publier formules/formules-data.js.

Contenu : jeu ACU + PHARMA, fiches détaillées, stats locales, modes Révision douce / Examen, tutos,
grand menu (Jouer, Réviser, Suivi, Réglages), modules bêta Trajets et Formules, jeu Équilibrer,
rappel de soutien avec la goutte de sang.
