/* ============================================================
   53-meridian-transit-data.js
   Données de connexion entre points ACU, source pour le futur
   mode de jeu "réseau de transport des méridiens" (métro/bus/
   limousine/hélicoptère). Ce fichier n'affiche rien seul : il
   expose window.MTC_TRANSIT_DATA pour 54-meridian-transit-game.js.

   Sources : cours Zhōng Lì "Les canaux réguliers" (301), "Les
   vaisseaux liaisons" (302), "Les canaux distincts" (303), et
   les points de confluence classiques des 8 vaisseaux
   extraordinaires (qí jīng bā mài).
   ============================================================ */
(function(){
  "use strict";

  // Nombre de points par canal régulier (numérotation = ordre du
  // trajet, donc les arrêts consécutifs d'une ligne de métro sont
  // simplement point N et point N+1 — pas besoin de les lister un
  // par un).
  const CHANNEL_POINT_COUNTS = {
    P:11, GI:20, E:45, Rt:21, C:9, IG:19, V:67, Rn:27,
    EC:9, TF:23, VB:44, F:14, RM:24, DM:28
  };

  const CHANNEL_NAMES = {
    P:"Poumon", GI:"Gros Intestin", E:"Estomac", Rt:"Rate",
    C:"Cœur", IG:"Intestin Grêle", V:"Vessie", Rn:"Rein",
    EC:"Enveloppe du Cœur", TF:"Trois Foyers", VB:"Vésicule Biliaire", F:"Foie",
    RM:"Rèn Mài", DM:"Dū Mài"
  };

  function stopsOf(channel){
    const count = CHANNEL_POINT_COUNTS[channel] || 0;
    const list = [];
    for(let i = 1; i <= count; i++) list.push(channel + i);
    return list;
  }

  // === MÉTRO — canaux réguliers (zhèng jīng) ==================
  // Une ligne par canal (arrêts dans l'ordre du trajet officiel).
  // Les correspondances (interchanges) relient plusieurs lignes
  // entre elles à une station commune.
  const METRO_LINES = Object.keys(CHANNEL_POINT_COUNTS).map(channel => ({
    id: channel,
    name: CHANNEL_NAMES[channel],
    stops: stopsOf(channel)
  }));

  const METRO_INTERCHANGES = [
    // --- Grande circulation du qì nourricier (yíng qì), sens unique,
    // relie la fin d'un canal au début du suivant. ---
    {id:"gc-p-gi", label:"Grande circulation", points:["P11","GI1"]},
    {id:"gc-gi-e", label:"Grande circulation", points:["GI20","E1"]},
    {id:"gc-e-rt", label:"Grande circulation", points:["E45","Rt1"]},
    {id:"gc-rt-c", label:"Grande circulation", points:["Rt21","C1"]},
    {id:"gc-c-ig", label:"Grande circulation", points:["C9","IG1"]},
    {id:"gc-ig-v", label:"Grande circulation", points:["IG19","V1"]},
    {id:"gc-v-rn", label:"Grande circulation", points:["V67","Rn1"]},
    {id:"gc-rn-ec", label:"Grande circulation", points:["Rn27","EC1"]},
    {id:"gc-ec-tf", label:"Grande circulation", points:["EC9","TF1"]},
    {id:"gc-tf-vb", label:"Grande circulation", points:["TF23","VB1"]},
    {id:"gc-vb-f", label:"Grande circulation", points:["VB44","F1"]},
    // F14 (branche interne) -> DM20 -> DM -> RM -> E12 -> P1 : bouclage
    // de la grande circulation, simplifié en une correspondance directe.
    {id:"gc-f-dm", label:"Grande circulation (branche interne)", points:["F14","DM20"]},
    {id:"gc-dm-rm", label:"Grande circulation (région génitale)", points:["DM1","RM1"]},
    {id:"gc-rm-p", label:"Grande circulation", points:["RM12","P1"]},

    // --- Connexions yáng/yáng des six niveaux, au visage. ---
    {id:"level-taiyang", label:"Niveau tài yáng (visage)", points:["IG_taiyang","V1_taiyang"], stops:["V1","IG_face"]},
    // Remplacé ci-dessous par la forme correcte (voir note) :
    {id:"level-taiyang-fixed", label:"Tài yáng — face", points:["V1"]},

    // --- Connexions yīn/yīn des six niveaux, à la poitrine. ---
    {id:"level-taiyin", label:"Tài yīn — poitrine", points:["P1","Rt1_chest"]},
  ];

  // Les niveaux yáng/yáng et yīn/yīn ne relient pas deux codes de
  // point identiques dans notre nomenclature (le "point du visage"
  // V1 EST déjà un arrêt de la ligne Vessie ; il devient une
  // correspondance simplement parce que la ligne Intestin Grêle
  // s'y arrête aussi). On les modélise donc comme des stations
  // partagées par plusieurs lignes plutôt que des paires de points.
  const METRO_SHARED_STATIONS = [
    // Six niveaux yáng — tous deux canaux/jambe et main du même niveau
    // se rejoignent au visage/œil.
    {id:"shared-taiyang", label:"Tài yáng (visage)", point:"V1", lines:["IG","V"]},
    {id:"shared-shaoyang", label:"Shào yáng (visage)", point:"VB1", lines:["TF","VB"]},
    {id:"shared-yangming", label:"Yáng míng (visage)", point:"GI20", lines:["GI","E"]},
    // Six niveaux yīn — se rejoignent à la poitrine.
    {id:"shared-taiyin", label:"Tài yīn (poitrine)", point:"P1", lines:["P","Rt"]},
    {id:"shared-shaoyin", label:"Shào yīn (poitrine)", point:"C1", lines:["C","Rn"]},
    {id:"shared-jueyin", label:"Jué yīn (poitrine)", point:"EC1", lines:["EC","F"]}
  ];

  // === BUS — vaisseaux luò-liaison (réseau luò) ================
  // Chaque canal régulier a un vaisseau luò qui se détache en un
  // point précis et rejoint le canal couplé biǎo/lǐ (relation
  // surface/interne). Modélisé comme une "ligne de bus" courte
  // reliant le point luò au premier arrêt du canal couplé.
  const BUS_ROUTES = [
    {id:"P7",  channel:"P",  name:"Bus Poumon → Gros Intestin",       from:"P7",  to:"GI1"},
    {id:"GI6", channel:"GI", name:"Bus Gros Intestin → Poumon",       from:"GI6", to:"P9"},
    {id:"E40", channel:"E",  name:"Bus Estomac → Rate",               from:"E40", to:"Rt1"},
    {id:"Rt4", channel:"Rt", name:"Bus Rate → Estomac",                from:"Rt4", to:"E42"},
    {id:"C5",  channel:"C",  name:"Bus Cœur → Intestin Grêle",         from:"C5",  to:"IG1"},
    {id:"IG7", channel:"IG", name:"Bus Intestin Grêle → Cœur",         from:"IG7", to:"C9"},
    // La vessie n'a pas de trajet vertical propre : son luò se
    // connecte uniquement au canal des reins (cas particulier,
    // relevé explicitement dans le cours).
    {id:"V58", channel:"V",  name:"Bus Vessie → Rein",                 from:"V58", to:"Rn1", special:"pas de trajet vertical propre"},
    {id:"Rn4", channel:"Rn", name:"Bus Rein → Vessie",                 from:"Rn4", to:"V67"},
    {id:"EC6", channel:"EC", name:"Bus Enveloppe du Cœur → Trois Foyers", from:"EC6", to:"TF1"},
    {id:"TF5", channel:"TF", name:"Bus Trois Foyers → Enveloppe du Cœur", from:"TF5", to:"EC9"},
    {id:"VB37",channel:"VB", name:"Bus Vésicule Biliaire → Foie",      from:"VB37",to:"F1"},
    {id:"F5",  channel:"F",  name:"Bus Foie → Vésicule Biliaire",      from:"F5",  to:"VB44"},
    {id:"RM15",channel:"RM", name:"Bus Rèn Mài (abdomen)", from:"RM15",to:"RM1", special:"se diffuse dans l'abdomen"},
    {id:"DM1", channel:"DM", name:"Bus Dū Mài (dos/tête)",from:"DM1", to:"DM20", special:"se diffuse dans le dos et la tête"},
    {id:"Rt21",channel:"Rt", name:"Grand luò de la Rate",              from:"Rt21",to:"Rt1", special:"grand luò : poitrine et flancs, rassemble le sang de tous les luò"},
    {id:"E18", channel:"E",  name:"Grand luò de l'Estomac (xū lǐ)",    from:"E18", to:"RM17", special:"grand luò unilatéral gauche : cœur, poumon, diaphragme"}
  ];

  // === LIMOUSINE — canaux distincts (jīng biè) =================
  // 12 canaux distincts, sans point d'acupuncture propre (per le
  // cours), circulant en profondeur puis remontant se réunir deux
  // par deux en 6 "unions" (liù hé) sur un point du canal yáng.
  // Modélisé comme 6 lignes "limousine" (une par union), chacune
  // reliant les deux points de séparation (lí) — quand ils sont
  // rattachables à un point d'acupuncture connu — à la station
  // d'union commune.
  const LIMOUSINE_UNIONS = [
    {
      id:"union-1", label:"Première union (yī hé)", unionPoint:"V10",
      branches:[
        {channel:"Rn", from:"Rn10", via:["V40"], note:"rejoint le zú tài yáng à V40, remonte jusqu'à V23"},
        {channel:"V",  from:"V40",  via:["V36"], note:"passe par l'anus, les reins, remonte le long des muscles paravertébraux"}
      ]
    },
    {
      id:"union-2", label:"Deuxième union (èr hé)", unionPoint:"VB1",
      branches:[
        {channel:"F",  from:"F_dos_pied", via:["RM2","F13"], note:"se sépare sur le dos du pied (seul jīng biè de jambe dans ce cas)"},
        {channel:"VB", from:"VB_cuisse",  via:["RM2","F13"], note:"se sépare à la partie supéro-externe de la cuisse"}
      ]
    },
    {
      id:"union-3", label:"Troisième union (sān hé)", unionPoint:"E9",
      branches:[
        {channel:"Rt", from:"Rt_cuisse", via:[], note:"se détache au bord antérieur de la face interne du haut de la cuisse"},
        {channel:"E",  from:"E_cuisse",  via:[], note:"se détache sur la face antérieure de la cuisse"}
      ]
    },
    {
      id:"union-4", label:"Quatrième union (sì hé)", unionPoint:"V1",
      branches:[
        {channel:"C",  from:"C1",  via:["RM23"], note:"passe par l'aisselle, VB22, puis RM23"},
        {channel:"IG", from:"IG10",via:["C1","VB22"], note:"passe par l'épaule puis rejoint C1/VB22"}
      ]
    },
    {
      id:"union-5", label:"Cinquième union (wǔ hé)", unionPoint:"TF16",
      branches:[
        {channel:"EC", from:"EC_3cun_VB22", via:[], note:"3 cùn sous VB22 (ou EC1 selon une source alternative)"},
        {channel:"TF", from:"TF_dessus_oreille", via:["DM20"], note:"passe par le vertex DM20 avant de redescendre à TF16"}
      ]
    },
    {
      id:"union-6", label:"Sixième union (liù hé)", unionPoint:"GI18",
      branches:[
        {channel:"P",  from:"P3", via:["VB22"], note:"3 cùn sous l'aisselle, entre à VB22"},
        {channel:"GI", from:"GI_main", via:["GI15","DM14"], note:"se détache à la main, passe par GI15 puis DM14"}
      ]
    }
  ];

  // === HÉLICOPTÈRE — vaisseaux extraordinaires (qí jīng bā mài) ==
  // Rèn mài et dū mài possèdent leurs propres points (déjà présents
  // comme lignes de métro RM/DM ci-dessus). Les 6 autres vaisseaux
  // n'ont pas de points propres : ils s'ouvrent chacun par un point
  // de confluence (point maître) sur un canal régulier, groupés en
  // 4 paires classiques.
  const HELICOPTER_PAIRS = [
    {id:"pair-ren-yinqiao", label:"Rèn mài + Yīn qiāo mài", points:["P7","Rn6"]},
    {id:"pair-du-yangqiao", label:"Dū mài + Yáng qiāo mài", points:["IG3","V62"]},
    {id:"pair-daimai-yangwei", label:"Dài mài + Yáng wéi mài", points:["TF5","VB41"]},
    {id:"pair-chongmai-yinwei", label:"Chōng mài + Yīn wéi mài", points:["EC6","Rt4"]}
  ];

  window.MTC_TRANSIT_DATA = {
    channelPointCounts: CHANNEL_POINT_COUNTS,
    channelNames: CHANNEL_NAMES,
    metro: {
      lines: METRO_LINES,
      sharedStations: METRO_SHARED_STATIONS,
      greatCirculation: METRO_INTERCHANGES.filter(item => item.id.indexOf("gc-") === 0)
    },
    bus: {
      routes: BUS_ROUTES
    },
    limousine: {
      unions: LIMOUSINE_UNIONS
    },
    helicoptere: {
      pairs: HELICOPTER_PAIRS
    }
  };
})();
