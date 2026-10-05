/* ============================================================
   beta-modules.js
   Boutons « Corrections » et « ? » des modules bêta, et textes
   des tutoriels (Trajets, Formules). Chargé après beta-gate.js et
   beta-tour.js, avant le script de la page.
   mtcBetaModule("trajets" | "formules")
   ============================================================ */
(function(){
  "use strict";
  const isSmall = () => window.innerWidth < 760;

  const TOURS = {
    trajets: [
      {sel:"nav", title:"Les canaux", text:"Choisis un canal régulier ou un merveilleux vaisseau. Sa fiche s’ouvre : le texte du cours, son illustration et un plan façon métro, trajet par trajet (principal, luò, distinct, tendineux…)."},
      {sel:() => isSmall() ? "#typeToggle" : "#typeFilter", title:"Types de trajets", text:"Coche les trajets à afficher : branches externes ou internes du canal principal, luò, distinct, tendineux, merveilleux vaisseaux.\nLe choix s’applique aux plans, au réseau global et aux correspondances."},
      {sel:"main section .plan, main section", title:"Texte, image et plan", text:"Pour chaque trajet : le texte du cours, l’illustration et le plan.\nClique sur une station du plan : le texte défile jusqu’à sa mention, surlignée. Survole une station : les autres canaux qui passent par là s’affichent."},
      {sel:".verifybtn", title:"Vérifier un trajet", text:"Tu as comparé un trajet au cours et à son illustration, et il est juste ? Clique sur « Vérifier » à côté de son titre, puis réagis avec 👍 dans le fil qui s’ouvre. Chaque 👍 compte comme une vérification publique : « vérifié par N » s’affiche à côté du trajet."},
      {sel:"#allPlaces", title:"Correspondances", text:"L’index de tous les lieux et de tous les points. Clique sur un lieu pour voir tous les trajets qui y passent, regroupés par famille de zones."},
      {sel:"#netToggle", title:"Plan des intersections", text:"Le plan des points d’intersection, façon carte de métro : une colonne par canal, de la tête aux pieds, et les points où les canaux se rejoignent."},
      {sel:"#corrBtn", title:"Corrections", text:"Tu repères une erreur ? Ouvre ce panneau pour laisser un commentaire de correction sur le canal affiché (ou le plan des intersections). Les commentaires sont publics : indique si possible ta source (page du cours, livre)."},
      {sel:"#tourBtn", title:"Revoir les explications", text:"Ce bouton relance ce tutoriel à tout moment. Bonne exploration !"}
    ],
    reseau: [
      {sel:".schemasvg", title:"Le plan des intersections", text:"Chaque canal est une colonne, de la tête aux pieds. Chaque point d’intersection du tableau (jiāo huì) est une station sur la colonne de chacun de ses canaux, reliées par un trait : le grand cercle est le canal du point, les petits sont les canaux qui le rejoignent."},
      {sel:"nav", title:"Afficher ou masquer un canal", text:"Un clic sur un canal de la barre de gauche le masque ou le réaffiche (grisé = masqué) ; les colonnes se réorganisent. « tout afficher » et « tout masquer » sont au-dessus du plan."},
      {sel:".netzoom", title:"Se déplacer dans le plan", text:"Molette ou deux doigts sur le pavé tactile : défiler. Ctrl + molette ou pincement : zoom. Glisser : se déplacer. ⟲ : tout voir. ◐ : fond sombre.\nClique sur un point pour voir ses correspondances."},
      {sel:"#rtStartBtn", title:"Jeu : Itinéraire", text:"Va d’un point à un autre en voyageant le long des canaux. Les points nets sont sur ta ligne : clique sur l’un d’eux pour t’y rendre. Pour changer de ligne à un point d’intersection, clique sur la pastille colorée de la nouvelle ligne. Un bon trajet a le moins de correspondances possible. Trois niveaux (lignes principales, + merveilleux vaisseaux, + luò et canaux distincts), et en option : un arrêt imposé dans une zone du corps, ou un défi chronométré de 5 missions."},
      {sel:".nettan", title:"Les six systèmes de Dr Tán", text:"Choisis un système (1 à 6, ou 1 à 5 ensemble), puis clique sur un nom de canal en haut du plan : ses canaux couplés restent en couleur, le reste s’estompe. Les points où ils se croisent sont soulignés en or.\nLes merveilleux vaisseaux n’en font pas partie, sauf RM et DM (couplés dans le système 1)."},
      {sel:".netplain", title:"Points sans correspondance", text:"Coche cette case pour afficher tous les points de chaque canal (de VB 1 à VB 44, etc.), et pas seulement les points d’intersection. Clique sur un de ces points pour ouvrir sa fiche."}
    ],
    formules: [
      {sel:() => isSmall() ? "#pick" : "nav", title:"Les formules", text:"Toutes les formules, rangées par catégorie. Choisis une formule pour ouvrir sa fiche."},
      {sel:"table.comp", title:"La composition", text:"Chaque substance avec son rôle (jūn, chén, zuǒ, shǐ) et sa dose. Son nom français est sous le pinyin.\nSurvole un nom souligné pour voir la nature, la saveur et le tropisme. « hors pharmacopée du jeu » : pas encore de fiche pour cette substance."},
      {sel:"main h3 ~ h3", title:"Le reste de la fiche", text:"Préparation, actions, indications, tableau clinique, précautions, modifications et comparaisons. L’encadré « À vérifier » liste les points encore incertains."},
      {sel:"#tabGame", title:"Substance manquante", text:"Une formule s’affiche avec une substance cachée : retrouve-la parmi 4 choix (touches 1 à 4) ou en saisie libre. Le rôle et la dose servent d’indices (à décocher pour corser le jeu). « Indice » montre les actions de la formule."},
      {sel:"#tabCase", title:"Cas clinique", text:"Un·e patient·e vient te consulter. Interroge-læ, examine-læ, puis conseille une formule parmi trois options. Moins tu demandes d’informations, plus tu marques de points."},
      {sel:"#corrBtn", title:"Corrections", text:"Tu repères une erreur dans une fiche ou un cas ? Ouvre ce panneau pour laisser un commentaire de correction. Les commentaires sont publics : indique si possible ta source."},
      {sel:"#tourBtn", title:"Revoir les explications", text:"Ce bouton relance ce tutoriel à tout moment."}
    ],
    jeu: [
      {sel:"#gCat", title:"Catégorie", text:"Joue sur toutes les formules ou sur une seule catégorie."},
      {sel:"#gMode", title:"Réponse", text:"4 choix (touches 1 à 4) ou saisie libre : en saisie libre, les tons ne comptent pas et des suggestions s’affichent."},
      {sel:".gbar label:nth-of-type(3)", title:"Indices", text:"Rôle et dose de la substance cachée : décoche-les pour un défi plus difficile."},
      {sel:".score", title:"Score", text:"Bonnes réponses / questions, et ta série en cours."}
    ],
    cas: [
      {sel:"#cChat", title:"La consultation", text:"Læ patient·e parle à la vitesse de la parole. Clique dans la conversation pour afficher tout de suite la fin de la phrase."},
      {sel:".asks.topics", title:"Interroger", text:"Choisis ta question : froid et chaleur, transpiration, tête, respiration, digestion, selles et urines, sommeil, douleurs… Læ patient·e ne répond que sur ce point. « (encore) » : iel a d’autres choses à dire sur ce sujet."},
      {sel:".asks:not(.topics)", title:"Examiner", text:"« Autre chose ? » laisse læ patient·e raconter librement. Regarde la langue, prends le pouls, observe, palpe l’abdomen.\n« Une substance de la formule » donne un ingrédient de la bonne formule, absent des deux autres propositions."},
      {sel:".decide", title:"Conseiller une formule", text:"Décide quand tu veux. Une bonne réponse rapporte 10 points, moins 1 par information demandée au-delà de deux (au minimum 3). Ensuite : le syndrome, le tableau clinique complet et la fiche de la formule."},
      {sel:"#cSpeed", title:"Vitesse de parole", text:"Lente, normale ou rapide, selon ta vitesse de lecture."}
    ]
  };
  function steps(name){
    return TOURS[name];
  }
  const ready = () => (window.mtcIsAdminPage && window.mtcIsAdminPage()) || (window.mtcBetaConsented && window.mtcBetaConsented());
  function tour(name, force){
    if(!window.mtcTour || (!force && !ready())) return;
    window.mtcTour(steps(name), {key:"mtc_tour_" + name + "_v1", force});
  }

  function corrTarget(module){
    if(module === "trajets"){
      if(document.getElementById("netToggle") && document.getElementById("netToggle").classList.contains("on")) return ["Trajets — réseau global", "le réseau global"];
      const b = document.querySelector("nav button[data-code].on");
      const code = b ? b.dataset.code : "";
      return code ? ["Trajets — " + code, "le canal " + (b.title || code)] : ["Trajets", "le module Trajets"];
    }
    const h = decodeURIComponent(location.hash.slice(1));
    if(h === "jeu") return ["Formules — jeu Substance manquante", "le jeu « Substance manquante »"];
    if(h === "cas") return ["Formules — jeu Cas clinique", "le jeu « Cas clinique »"];
    const t = document.querySelector("main h2");
    return h ? ["Formules — " + h, "la formule " + (t ? t.childNodes[0].textContent.trim() : h)] : ["Formules", "le module Formules"];
  }

  window.mtcBetaModule = function(module){
    const tools = document.querySelector("header .tools");
    if(tools && !document.getElementById("corrBtn")){
      tools.insertAdjacentHTML("beforeend", '<button type="button" class="tool" id="corrBtn" title="Laisser un commentaire de correction (public)">Corrections</button>' +
        '<button type="button" class="tool" id="tourBtn" title="Revoir les explications" aria-label="Revoir les explications">?</button>');
      document.getElementById("corrBtn").addEventListener("click", () => { const [term, label] = corrTarget(module); window.mtcOpenCorrections(term, label); });
      document.getElementById("tourBtn").addEventListener("click", () => {
        const h = location.hash.slice(1);
        if(module === "trajets" && document.querySelector(".netsvg")) tour("reseau", true);
        else if(module === "formules" && h === "cas") tour("cas", true);
        else if(module === "formules" && h === "jeu") tour("jeu", true);
        else tour(module, true);
      });
    }
    // premier passage : tutoriel général, puis tutoriels propres au réseau, au jeu, au cas clinique
    const main = document.getElementById("main");
    let started = false;
    const check = () => {
      if(!ready()) return;
      if(!started && main && main.children.length && !main.querySelector(".msg")){ started = true; setTimeout(() => tour(module), 500); return; }
      if(!started) return;
      try{
        if(module === "trajets" && main.querySelector(".netsvg") && !localStorage.getItem("mtc_tour_reseau_v1") && localStorage.getItem("mtc_tour_trajets_v1")) setTimeout(() => tour("reseau"), 600);
        if(module === "formules" && main.querySelector("#cChat") && !localStorage.getItem("mtc_tour_cas_v1") && localStorage.getItem("mtc_tour_formules_v1")) setTimeout(() => tour("cas"), 400);
        if(module === "formules" && main.querySelector("#gCat") && !localStorage.getItem("mtc_tour_jeu_v1") && localStorage.getItem("mtc_tour_formules_v1")) setTimeout(() => tour("jeu"), 400);
      }catch(e){}
    };
    if(main) new MutationObserver(() => { if(window.mtcPaintVerify) window.mtcPaintVerify(main); clearTimeout(check.t); check.t = setTimeout(check, 300); }).observe(main, {childList:true});
    window.addEventListener("mtc-beta-accepted", check);
    setTimeout(check, 800);
  };
  window.mtcBetaTour = tour;
})();
