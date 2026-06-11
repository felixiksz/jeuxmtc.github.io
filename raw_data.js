const RAW_DATA = {
  "Categories_de_points": {
    "JING_PUITS":["IG1","V67","TF1","VB44","GI1","E45","P11","Rt1","C9","Rn1","EC9","F1"],
    "YING_JAILLISSEMENT":["IG2","V66","TF2","VB43","GI2","E44","P10","Rt2","C8","Rn2","EC8","F2"],
    "SHU_RIVIERE":["IG3","V65","TF3","VB41","GI3","E43","P9","Rt3","C7","Rn3","EC7","F3"],
    "JING_FLEUVE":["IG5","V60","TF6","VB38","GI5","E41","P8","Rt5","C4","Rn7","EC5","F4"],
    "HE_REUNION":["IG8","V40","TF10","VB34","GI11","E36","P5","Rt9","C3","Rn10","EC3","F8"],
    "Points_Yuan_Source":["IG4","V64","TF4","VB40","GI4","E42","P9","Rt3","C7","Rn3","EC7","F3","RM15","RM6"],
    "Points_Xi_Crevasse":["IG6","V63","TF7","VB36","GI7","E34","P6","Rt8","C6","Rn5","EC4","F6","Rn8","V59","Rn9","VB35"],
    "Points_Luo_Liaison":["IG7","V58","TF5","VB37","GI6","E40","P7","Rt4","C5","Rn4","EC6","F5"],
    "Points_Bei_Shu_Transport_du_dos":["V27","V28","V22","V19","V25","V21","V13","V20","V15","V23","V14","V18","V11","V17","V24","V26","V29","V30"],
    "Points_Mu_Collecteur":["RM4","RM3","RM5","VB24","E25","RM12","P1","F13","RM14","VB25","RM17","F14"],
    "Points_Xia_He_Reunion_inferieure":["E39","V40","V39","VB34","E37","E36"]
  },
    "Points_d_ouverture_des_merveilleux_vaisseaux": {
    "Chong_Mai":["Rt4"],
    "Ren_Mai":["P7"],
    "Du_Mai":["IG3"],
    "Yin_Qiao_Mai":["Rn6"],
    "Yang_Qiao_Mai":["V62"],
    "Yin_Wei_Mai":["EC6"],
    "Yang_Wei_Mai":["TF5"],
    "Dai_Mai":["VB41"]
  },

  "Points_Hui_Reunion": {
    "Organes_Fu":["RM12"],
    "Organes_Zang":["F13"],
    "Tendons":["VB34"],
    "Moelles":["VB39"],
    "Sang_Diaphragme":["V17"],
    "Os":["V11"],
    "Vaisseaux":["P9"],
    "Qi":["RM17"]
  },

  "Points_generaux": {
    "Abdomen":["E36"],
    "Lombes_et_dos":["V40"],
    "Tete_et_nuque":["P7"],
    "Face_et_bouche":["GI4"],
    "Poitrine_et_hypocondres":["EC6"],
    "Abdomen_inferieur":["Rt6"],
    "Reanimation":["DM26"]
  },

  "Les_4_mers": {
    "Mer_des_Moelles":["DM20","DM16"],
    "Mer_du_Qi_superieure":["DM14","DM15","E9"],
    "Mer_du_Qi_inferieure":["RM6"],
    "Mer_de_l_Eau_et_des_Cereales":["E30","E36"],
    "Mer_des_Canaux_Vaisseaux_Sang":["V11","E37","E39"]
  },

  "Points_fenetre_du_ciel": {
    "IG":["IG16","IG17"],
    "V":["V10"],
    "TF":["TF16"],
    "GI":["GI18"],
    "E":["E9"],
    "P":["P3"],
    "RM":["RM22"]
  },

  "Points_pour_faire_revenir_le_Yang": {
    "VB":["VB30"],
    "GI":["GI4"],
    "E":["E36"],
    "Rt":["Rt6"],
    "Rn":["Rn3"],
    "EC":["EC8"],
    "RM":["RM1","RM12"],
    "DM":["DM15"]
  }
};

const DISPLAY_NAMES = {
  "JING_PUITS":"Jǐng-Puits",
  "YING_JAILLISSEMENT":"Yíng-Jaillissement",
  "SHU_RIVIERE":"Shū-Rivière",
  "JING_FLEUVE":"Jīng-Fleuve",
  "HE_REUNION":"Hé-Réunion",
  "Points_Yuan_Source":"Points Yuán-Source",
  "Points_Xi_Crevasse":"Points Xì-Crevasse",
  "Points_Luo_Liaison":"Points Luò-Liaison",
  "Points_Bei_Shu_Transport_du_dos":"Points Bèi Shù-Transport du dos",
  "Points_Mu_Collecteur":"Points Mù-Collecteur",
  "Points_Xia_He_Reunion_inferieure":"Points Xià Hé-Réunion inférieure",
  "Points_d_ouverture_des_merveilleux_vaisseaux":"Points d’ouverture des merveilleux vaisseaux",
  "Points_Hui_Reunion":"Points Huì-Réunion",
  "Points_generaux":"Points généraux",
  "Les_4_mers":"Les 4 mers",
  "Points_fenetre_du_ciel":"Points fenêtre du ciel",
  "Points_pour_faire_revenir_le_Yang":"Points pour faire revenir le Yáng"
};

const LABEL_NAMES = {
  "Chong_Mai":"Chōng Mài",
  "Ren_Mai":"Rèn Mài",
  "Du_Mai":"Dū Mài",
  "Yin_Qiao_Mai":"Yīn Qiāo Mài",
  "Yang_Qiao_Mai":"Yáng Qiāo Mài",
  "Yin_Wei_Mai":"Yīn Wéi Mài",
  "Yang_Wei_Mai":"Yáng Wéi Mài",
  "Dai_Mai":"Dài Mài",
  "Organes_Fu":"Organes Fǔ",
  "Organes_Zang":"Organes Zàng",
  "Tendons":"Tendons",
  "Moelles":"Moelles",
  "Sang_Diaphragme":"Sang / Diaphragme",
  "Os":"Os",
  "Vaisseaux":"Vaisseaux",
  "Qi":"Qì",
  "Abdomen":"Abdomen",
  "Lombes_et_dos":"Lombes et dos",
  "Tete_et_nuque":"Tête et nuque",
  "Face_et_bouche":"Face et bouche",
  "Poitrine_et_hypocondres":"Poitrine et hypocondres",
  "Abdomen_inferieur":"Abdomen inférieur",
  "Reanimation":"Réanimation",
  "Mer_des_Moelles":"Mer des Moelles",
  "Mer_du_Qi_superieure":"Mer du Qì supérieure",
  "Mer_du_Qi_inferieure":"Mer du Qì inférieure",
  "Mer_de_l_Eau_et_des_Cereales":"Mer de l’Eau et des Céréales",
  "Mer_des_Canaux_Vaisseaux_Sang":"Mer des Canaux / Vaisseaux / Sang"
};
