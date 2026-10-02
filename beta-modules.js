/* ============================================================
   beta-modules.js
   Boutons « 💬 Corrections » et « ? » des modules bêta, et textes
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
      {sel:"main section .plan, main section", title:"Texte, image et plan", text:"Pour chaque trajet : le texte du cours, l’illustration et le plan.\nClique une station du plan : le texte défile jusqu’à sa mention, surlignée. Survole une station : les autres canaux qui passent par là s’affichent."},
      {sel:".verifybtn", title:"✅ Vérifier un trajet", text:"Tu as comparé un trajet au cours et à son illustration, et il est juste ? Clique « Vérifier » à côté de son titre, puis réagis avec 👍 dans le fil qui s’ouvre. Chaque 👍 compte comme une vérification publique : « vérifié par N » s’affiche à côté du trajet."},
      {sel:"#allPlaces", title:"Correspondances", text:"L’index de tous les lieux et de tous les points. Clique un lieu pour voir tous les trajets qui y passent, regroupés par famille de zones."},
      {sel:"#netToggle", title:"Réseau global", text:"Le plan de ville de tous les canaux. Les quartiers sont les zones du corps, les carrefours les points d’intersection, les fleuves rèn mài et dū mài, les rivières les merveilleux vaisseaux. Les pointillés gris sont les relais d’un canal au suivant.\nOn y trouve aussi deux jeux : Démêler et Itinéraire."},
      {sel:"#corrBtn", title:"💬 Corrections", text:"Tu repères une erreur ? Ouvre ce panneau pour laisser un commentaire de correction sur le canal affiché (ou le réseau). Les commentaires sont publics : indique si possible ta source (page du cours, livre)."},
      {sel:"#tourBtn", title:"Revoir les explications", text:"Ce bouton relance ce tutoriel à tout moment. Bonne exploration !"}
    ],
    reseau: [
      {sel:".netmode", title:"Schéma ou plan de ville", text:"Schéma : les points d’intersection du tableau (jiāo huì), une colonne par canal, de la tête aux pieds ; un point relie les canaux qui s’y rejoignent (grand cercle = canal du point).\nPlan de ville : la version anatomique avec quartiers, relais, et les jeux Démêler et Itinéraire."},
      {sel:"nav", title:"Afficher ou masquer un canal", text:"Dans le réseau, un clic sur un canal de la barre de gauche le masque ou le réaffiche (grisé = masqué). « tout afficher » et « tout masquer » sont dans la légende."},
      {sel:".netzoom", title:"Se déplacer dans le plan", text:"Molette ou pincement : zoom. Glisser : se déplacer. ⟲ : tout voir. ◐ : fond sombre.\nClique une station pour voir ses correspondances."},
      {sel:() => isSmall() ? ".netinfo" : ".netlegend", title:"Légende", text:"Lignes pleines : branches externes ; fines : branches internes ; tirets : luò, distinct, tendineux. ⛵ point de transport, ☀ yuán, ⛓ luò, ⛏ xì, ⚓ embarcadère (point d’ouverture d’un merveilleux vaisseau)."},
      {sel:"#netGameBtn", title:"🎲 Démêler", text:"Les stations des lignes choisies sont mélangées : glisse-les jusqu’à leur place (bon quartier, bonne face, bon ordre). « Vérifier » colore chaque station : vert = bien placée, orange = bon quartier, rouge = à déplacer. « Indice » montre où va une station."},
      {sel:"#netItiBtn", title:"🚇 Itinéraire", text:"Va d’une station à une autre avec le moins de changements de ligne. Clique les stations où tu changes de ligne, puis l’arrivée. Les relais entre canaux comptent comme des correspondances. « Solution » montre le meilleur trajet."}
    ],
    formules: [
      {sel:() => isSmall() ? "#pick" : "nav", title:"Les formules", text:"Toutes les formules, rangées par catégorie. Choisis une formule pour ouvrir sa fiche."},
      {sel:"table.comp", title:"La composition", text:"Chaque substance avec son rôle (empereur, ministre, assistant, guide) et sa dose. Son nom français est sous le pinyin.\nSurvole un nom souligné pour voir la nature, la saveur et le tropisme. « hors pharmacopée du jeu » : pas encore de fiche pour cette substance."},
      {sel:"main h3 ~ h3", title:"Le reste de la fiche", text:"Préparation, actions, indications, tableau clinique, précautions, modifications et comparaisons. L’encadré « À vérifier » liste les points encore incertains."},
      {sel:"#tabGame", title:"🎲 Substance manquante", text:"Une formule s’affiche avec une substance cachée : retrouve-la parmi 4 choix (touches 1 à 4) ou en saisie libre. Le rôle et la dose servent d’indices (à décocher pour corser le jeu). « Indice » montre les actions de la formule."},
      {sel:"#tabCase", title:"🩺 Cas clinique", text:"Un patient vient te consulter. Interroge-le, examine-le, puis conseille une formule parmi trois. Moins tu demandes d’informations, plus tu marques de points."},
      {sel:"#corrBtn", title:"💬 Corrections", text:"Tu repères une erreur dans une fiche ou un cas ? Ouvre ce panneau pour laisser un commentaire de correction. Les commentaires sont publics : indique si possible ta source."},
      {sel:"#tourBtn", title:"Revoir les explications", text:"Ce bouton relance ce tutoriel à tout moment."}
    ],
    jeu: [
      {sel:"#gCat", title:"Catégorie", text:"Joue sur toutes les formules ou sur une seule catégorie."},
      {sel:"#gMode", title:"Réponse", text:"4 choix (touches 1 à 4) ou saisie libre : en saisie libre, les tons ne comptent pas et des suggestions s’affichent."},
      {sel:".gbar label:nth-of-type(3)", title:"Indices", text:"Rôle et dose de la substance cachée : décoche-les pour un défi plus difficile."},
      {sel:".score", title:"Score", text:"Bonnes réponses / questions, et ta série en cours."}
    ],
    cas: [
      {sel:"#cChat", title:"La consultation", text:"Le patient parle à la vitesse de la parole. Clique dans la conversation pour afficher tout de suite la fin de la phrase."},
      {sel:".asks.topics", title:"Interroger", text:"Choisis ta question : froid et chaleur, transpiration, tête, respiration, digestion, selles et urines, sommeil, douleurs… Le patient ne répond que sur ce point. « (encore) » : il a d’autres choses à dire sur ce sujet."},
      {sel:".asks:not(.topics)", title:"Examiner", text:"« Autre chose ? » laisse le patient raconter librement. Regarde la langue, prends le pouls, observe, palpe l’abdomen.\n« 💡 Une substance de la formule » donne un ingrédient de la bonne formule, absent des deux autres propositions."},
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
      tools.insertAdjacentHTML("beforeend", '<button type="button" class="tool" id="corrBtn" title="Laisser un commentaire de correction (public)">💬 Corrections</button>' +
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
