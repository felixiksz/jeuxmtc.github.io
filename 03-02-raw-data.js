/* ============================================================
   03-02-raw-data.js
   Source: ancien bloc <script> #3 (hors JSON-LD)
   id original: -
   ============================================================ */

/* === Données intégrées : raw_data.js === */
/* raw_data_restructure_v3.js
   Structure corrigée pour Connections MTC.
   - RAW_DATA reste compatible avec ton jeu actuel.
   - RAW_INDEX sert au cheatsheet imprimable avec des tableaux spécialisés.
   - Les canaux sont stockés explicitement : pas de test startsWith("V"), donc plus de confusion V / VB.
*/

const CANAUX_REGULIERS = ["IG","V","TF","VB","GI","E","P","Rt","C","Rn","EC","F"];

const RAW_INDEX = {
  Wu_Shu_Xue: {
    JING_PUITS: {
      nom: "Jǐng-Puits",
      IG:"IG1", V:"V67", TF:"TF1", VB:"VB44", GI:"GI1", E:"E45",
      P:"P11", Rt:"Rt1", C:"C9", Rn:"Rn1", EC:"EC9", F:"F1"
    },
    YING_JAILLISSEMENT: {
      nom: "Yíng-Jaillissement",
      IG:"IG2", V:"V66", TF:"TF2", VB:"VB43", GI:"GI2", E:"E44",
      P:"P10", Rt:"Rt2", C:"C8", Rn:"Rn2", EC:"EC8", F:"F2"
    },
    SHU_RIVIERE: {
      nom: "Shū-Rivière",
      IG:"IG3", V:"V65", TF:"TF3", VB:"VB41", GI:"GI3", E:"E43",
      P:"P9", Rt:"Rt3", C:"C7", Rn:"Rn3", EC:"EC7", F:"F3"
    },
    JING_FLEUVE: {
      nom: "Jīng-Fleuve",
      IG:"IG5", V:"V60", TF:"TF6", VB:"VB38", GI:"GI5", E:"E41",
      P:"P8", Rt:"Rt5", C:"C4", Rn:"Rn7", EC:"EC5", F:"F4"
    },
    HE_REUNION: {
      nom: "Hé-Réunion",
      IG:"IG8", V:"V40", TF:"TF10", VB:"VB34", GI:"GI11", E:"E36",
      P:"P5", Rt:"Rt9", C:"C3", Rn:"Rn10", EC:"EC3", F:"F8"
    }
  },

  Yuan_Source: {
    nom: "Points Yuán-Source",
    canaux_reguliers: {
      IG:"IG4", V:"V64", TF:"TF4", VB:"VB40", GI:"GI4", E:"E42",
      P:"P9", Rt:"Rt3", C:"C7", Rn:"Rn3", EC:"EC7", F:"F3",gao:"RM15", huang:"RM6"
    }
  },

  Xi_Crevasse: {
    nom: "Points Xì-Crevasse",
    canaux_reguliers: {
      IG:"IG6", V:"V63", TF:"TF7", VB:"VB36", GI:"GI7", E:"E34",
      P:"P6", Rt:"Rt8", C:"C6", Rn:"Rn5", EC:"EC4", F:"F6",
      Yin_Qiao_Mai:"Rn8",
      Yang_Qiao_Mai:"V59",
      Yin_Wei_Mai:"Rn9",
      Yang_Wei_Mai:"VB35"
    }
  },

  Luo_Liaison: {
    nom: "Points Luò-Liaison",
    canaux_reguliers: {
      IG:"IG7", V:"V58", TF:"TF5", VB:"VB37", GI:"GI6", E:"E40",
      P:"P7", Rt:"Rt4", C:"C5", Rn:"Rn4", EC:"EC6", F:"F5",
      Ren_Mai:"RM15",
      Du_Mai:"DM1",
      Grand_Luo_Rate:"Rt21"
    },
    notes: "Certaines traditions ajoutent le grand luò de l’Estomac / zú yáng míng, souvent associé à xū lǐ. À intégrer seulement si tu veux le jouer comme catégorie séparée."
  },

  Bei_Shu: {
    nom: "Points Bèi Shù-Transport du dos",
    zang_fu_actuels: {
      Poumon:"V13",
      Enveloppe_du_Coeur:"V14",
      Coeur:"V15",
      Foie:"V18",
      Vesicule_Biliaire:"V19",
      Rate:"V20",
      Estomac:"V21",
      Trois_Foyers:"V22",
      Rein:"V23",
      Gros_Intestin:"V25",
      Intestin_Grele:"V27",
      Vessie:"V28",
      Chong_Mai_et_Os:"V11",
      Du_Mai:"V16",
      Diaphragme_et_Sang:"V17",
      Qi_Hai:"V24",
      Guan_Yuan:"V26",
      Sacrum_Colonne:"V29",
      Cercle_Blanc:"V30"
    }
  },

  Mu_Collecteur: {
    nom: "Points Mù-Collecteur",
    zang_fu: {
      Intestin_Grele:"RM4",
      Vessie:"RM3",
      Trois_Foyers:"RM5",
      Vesicule_Biliaire:"VB24",
      Gros_Intestin:"E25",
      Estomac:"RM12",
      Poumon:"P1",
      Rate:"F13",
      Coeur:"RM14",
      Rein:"VB25",
      Enveloppe_du_Coeur:"RM17",
      Foie:"F14"
    }
  },

  Xia_He: {
    nom: "Points Xià Hé-Réunion inférieure",
    fu: {
      Intestin_Grele:"E39",
      Vessie:"V40",
      Trois_Foyers:"V39",
      Vesicule_Biliaire:"VB34",
      Gros_Intestin:"E37",
      Estomac:"E36"
    }
  },

  Ouverture_Merveilleux_Vaisseaux: {
    nom: "Points d’ouverture des merveilleux vaisseaux",
    vaisseaux: {
      Chong_Mai:"Rt4",
      Ren_Mai:"P7",
      Du_Mai:"IG3",
      Yin_Qiao_Mai:"Rn6",
      Yang_Qiao_Mai:"V62",
      Yin_Wei_Mai:"EC6",
      Yang_Wei_Mai:"TF5",
      Dai_Mai:"VB41"
    }
  },

  Hui_Reunion: {
    nom: "Points Huì-Réunion",
    reunions: {
      Organes_Fu:"RM12",
      Organes_Zang:"F13",
      Tendons:"VB34",
      Moelles:"VB39",
      Sang_Diaphragme:"V17",
      Os:"V11",
      Vaisseaux:"P9",
      Qi:"RM17"
    }
  },

  Points_Generaux: {
    nom: "Points généraux",
    zones: {
      Abdomen:"E36",
      Lombes_et_dos:"V40",
      Tete_et_nuque:"P7",
      Face_et_bouche:"GI4",
      Poitrine_et_hypocondres:"EC6",
      Abdomen_inferieur:"Rt6",
      Reanimation:"DM26"
    }
  },

  Quatre_Mers: {
    nom: "Les 4 mers",
    mers: {
      Mer_des_Moelles:["DM20","DM16"],
      Mer_du_Qi_superieure:["DM14","DM15","E9"],
      Mer_du_Qi_inferieure:["RM6"],
      Mer_de_l_Eau_et_des_Cereales:["E30","E36"],
      Mer_des_Canaux_Vaisseaux_Sang:["V11","E37","E39"]
    }
  },

  Fenetre_du_Ciel: {
    nom: "Points fenêtre du ciel",
    par_canal: {
      IG:["IG16","IG17"],
      V:["V10"],
      TF:["TF16"],
      GI:["GI18"],
      E:["E9"],
      P:["P3"],
      RM:["RM22"]
    }
  },

  Revenir_le_Yang: {
    nom: "Points pour faire revenir le Yáng",
    par_canal: {
      VB:["VB30"],
      GI:["GI4"],
      E:["E36"],
      Rt:["Rt6"],
      Rn:["Rn3"],
      EC:["EC8"],
      RM:["RM1","RM12"],
      DM:["DM15"]
    }
  },

  Fantomes_Sun_Si_Miao: {
    nom: "Points fantômes de Sūn Sī Miǎo",
    par_canal: {
      DM:["DM26","DM16","DM23"],
      RM:["RM24","RM1"],
      P:["P11"],
      GI:["GI11"],
      E:["E6"],
      Rt:["Rt1"],
      EC:["EC7","EC8"],
      V:["V62"]
    },
    note: "Le point sous la langue est volontairement non intégré comme tuile, car il n’a pas de code stable dans POINT_DETAILS."
  }
};

function pointsFromObject(obj){
  return Object.values(obj || {}).flat();
}

const RAW_DATA = {
  Categories_de_points: {
    JING_PUITS: pointsFromObject(RAW_INDEX.Wu_Shu_Xue.JING_PUITS).filter(p => p !== RAW_INDEX.Wu_Shu_Xue.JING_PUITS.nom),
    YING_JAILLISSEMENT: pointsFromObject(RAW_INDEX.Wu_Shu_Xue.YING_JAILLISSEMENT).filter(p => p !== RAW_INDEX.Wu_Shu_Xue.YING_JAILLISSEMENT.nom),
    SHU_RIVIERE: pointsFromObject(RAW_INDEX.Wu_Shu_Xue.SHU_RIVIERE).filter(p => p !== RAW_INDEX.Wu_Shu_Xue.SHU_RIVIERE.nom),
    JING_FLEUVE: pointsFromObject(RAW_INDEX.Wu_Shu_Xue.JING_FLEUVE).filter(p => p !== RAW_INDEX.Wu_Shu_Xue.JING_FLEUVE.nom),
    HE_REUNION: pointsFromObject(RAW_INDEX.Wu_Shu_Xue.HE_REUNION).filter(p => p !== RAW_INDEX.Wu_Shu_Xue.HE_REUNION.nom),

    Points_Yuan_Source: [
      ...pointsFromObject(RAW_INDEX.Yuan_Source.canaux_reguliers),
    ],
    Points_Xi_Crevasse: [
      ...pointsFromObject(RAW_INDEX.Xi_Crevasse.canaux_reguliers),
      ...pointsFromObject(RAW_INDEX.Xi_Crevasse.merveilleux_vaisseaux)
    ],
    Points_Luo_Liaison: [
      ...pointsFromObject(RAW_INDEX.Luo_Liaison.canaux_reguliers),
      ...pointsFromObject(RAW_INDEX.Luo_Liaison.extras_classiques)
    ],
    Points_Bei_Shu_Transport_du_dos: pointsFromObject(RAW_INDEX.Bei_Shu.zang_fu_actuels),
    Points_Mu_Collecteur: pointsFromObject(RAW_INDEX.Mu_Collecteur.zang_fu),
    Points_Xia_He_Reunion_inferieure: pointsFromObject(RAW_INDEX.Xia_He.fu)
  },

  Points_d_ouverture_des_merveilleux_vaisseaux: RAW_INDEX.Ouverture_Merveilleux_Vaisseaux.vaisseaux,
  Points_Hui_Reunion: RAW_INDEX.Hui_Reunion.reunions,
  Points_generaux: RAW_INDEX.Points_Generaux.zones,
  Les_4_mers: RAW_INDEX.Quatre_Mers.mers,
  Points_fenetre_du_ciel: RAW_INDEX.Fenetre_du_Ciel.par_canal,
  Points_pour_faire_revenir_le_Yang: RAW_INDEX.Revenir_le_Yang.par_canal,
  Points_fantomes_de_Sun_Si_Miao: {
    Points_fantomes: pointsFromObject(RAW_INDEX.Fantomes_Sun_Si_Miao.par_canal)
  }
};

const DISPLAY_NAMES = {
  JING_PUITS:"Jǐng-Puits",
  YING_JAILLISSEMENT:"Yíng-Jaillissement",
  SHU_RIVIERE:"Shū-Rivière",
  JING_FLEUVE:"Jīng-Fleuve",
  HE_REUNION:"Hé-Réunion",
  Points_Yuan_Source:"Points Yuán-Source",
  Points_Xi_Crevasse:"Points Xì-Crevasse",
  Points_Luo_Liaison:"Points Luò-Liaison",
  Points_Bei_Shu_Transport_du_dos:"Points Bèi Shù-Transport du dos",
  Points_Bei_Shu_autres_a_ne_pas_oublier:"Autres Bèi Shù à ne pas oublier",
  Points_Mu_Collecteur:"Points Mù-Collecteur",
  Points_Xia_He_Reunion_inferieure:"Points Xià Hé-Réunion inférieure",
  Points_d_ouverture_des_merveilleux_vaisseaux:"Points d’ouverture des merveilleux vaisseaux",
  Points_Hui_Reunion:"Points Huì-Réunion",
  Points_generaux:"Points généraux",
  Les_4_mers:"Les 4 mers",
  Points_fenetre_du_ciel:"Points fenêtre du ciel",
  Points_pour_faire_revenir_le_Yang:"Points pour faire revenir le Yáng",
  Points_fantomes_de_Sun_Si_Miao:"Points fantômes de Sūn Sī Miǎo"
};

const LABEL_NAMES = {
  Chong_Mai:"Chōng Mài",
  Ren_Mai:"Rèn Mài",
  Du_Mai:"Dū Mài",
  Yin_Qiao_Mai:"Yīn Qiāo Mài",
  Yang_Qiao_Mai:"Yáng Qiāo Mài",
  Yin_Wei_Mai:"Yīn Wéi Mài",
  Yang_Wei_Mai:"Yáng Wéi Mài",
  Dai_Mai:"Dài Mài",
  gao:"gāo",
  huang:"huāng",
  Organes_Fu:"Organes Fǔ",
  Organes_Zang:"Organes Zàng",
  Tendons:"Tendons",
  Moelles:"Moelle",
  Sang_Diaphragme:"Sang / Diaphragme",
  Os:"Os",
  Vaisseaux:"Vaisseaux",
  Qi:"Qì",
  Abdomen:"Abdomen",
  Lombes_et_dos:"Lombes et dos",
  Tete_et_nuque:"Tête et nuque",
  Face_et_bouche:"Face et bouche",
  Poitrine_et_hypocondres:"Poitrine et hypocondres",
  Abdomen_inferieur:"Abdomen inférieur",
  Reanimation:"Réanimation",
  Mer_des_Moelles:"Mer des Moelles",
  Mer_du_Qi_superieure:"Mer du Qì supérieure",
  Mer_du_Qi_inferieure:"Mer du Qì inférieure",
  Mer_de_l_Eau_et_des_Cereales:"Mer de l’Eau et des Céréales",
  Mer_des_Canaux_Vaisseaux_Sang:"Mer des Canaux / Vaisseaux / Sang",
  Intestin_Grele:"Intestin grêle",
  Vessie:"Vessie",
  Trois_Foyers:"Trois Foyers",
  Vesicule_Biliaire:"Vésicule biliaire",
  Gros_Intestin:"Gros Intestin",
  Estomac:"Estomac",
  Poumon:"Poumon",
  Rate:"Rate",
  Coeur:"Cœur",
  Rein:"Rein",
  Enveloppe_du_Coeur:"Enveloppe du Cœur",
  Foie:"Foie",
  Choeur:"Cœur",
  Grand_Luo_Rate:"Grand luò de la Rate",
  Chong_Mai_et_Os:"Chōng Mài + os",
  Diaphragme_et_Sang:"Diaphragme + sang",
  Qi_Hai:"Qì hǎi",
  Guan_Yuan:"Guān yuán",
  Sacrum_Colonne:"Sacrum / colonne",
  Cercle_Blanc:"Cercle blanc"
};
