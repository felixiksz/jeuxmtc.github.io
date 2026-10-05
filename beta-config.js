/* ============================================================
   beta-config.js
   Réglages des modules bêta (Trajets, Formules).
   - public : par module, false = réservé aux admins ; true = ouvert à
     tous les joueurs, après acceptation de la phase bêta et des
     commentaires de correction publics.
   - giscus : commentaires publics (Discussions du dépôt GitHub du jeu).
     Tant que categoryId est vide, le panneau « Corrections » indique
     que les commentaires ne sont pas encore activés.
   ============================================================ */
window.MTC_BETA = {
  public: {trajets: false, formules: true},
  giscus: {
    repo: "felixiksz/jeuxmtc.github.io",
    repoId: "R_kgDOS3f7kg",
    category: "Announcements",
    categoryId: "DIC_kwDOS3f7ks4DG4r7"
  }
};
