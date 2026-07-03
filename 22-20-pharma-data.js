/* === Pharmacopée chinoise : données extraites de SM PHARMA_Tableaux.xlsx ===
   Bucket 2 : données seulement. Le moteur de jeu PHARMA sera ajouté dans un bucket suivant. */
(function(){
  "use strict";

  const PHARMA_CLASSES = [
  {
    "code": "A",
    "nom": "SM astringentes",
    "count": 9,
    "prioritaires": 1,
    "codes": [
      "A1",
      "A2",
      "A3",
      "A4",
      "A5",
      "A6",
      "A7",
      "A8",
      "A9"
    ]
  },
  {
    "code": "AF",
    "nom": "SM qui apaisent le Foie",
    "count": 10,
    "prioritaires": 8,
    "codes": [
      "AF1",
      "AF2",
      "AF3",
      "AF4",
      "AF5",
      "AF6",
      "AF7",
      "AF8",
      "AF9",
      "AF10"
    ]
  },
  {
    "code": "AH",
    "nom": "SM aromatiques qui transforment l’Humidité",
    "count": 6,
    "prioritaires": 2,
    "codes": [
      "AH1",
      "AH2",
      "AH3",
      "AH4",
      "AH5",
      "AH6"
    ]
  },
  {
    "code": "AS",
    "nom": "SM qui arrêtent le Sang",
    "count": 12,
    "prioritaires": 10,
    "codes": [
      "AS1",
      "AS2",
      "AS3",
      "AS4",
      "AS5",
      "AS6",
      "AS7",
      "AS8",
      "AS9",
      "AS10",
      "AS11",
      "AS12"
    ]
  },
  {
    "code": "CE",
    "nom": "SM qui enrichissent le Cœur et calment l’Esprit",
    "count": 4,
    "prioritaires": 2,
    "codes": [
      "CE1",
      "CE2",
      "CE3",
      "CE4"
    ]
  },
  {
    "code": "CF",
    "nom": "SM qui clarifient la Chaleur et purgent le Feu",
    "count": 7,
    "prioritaires": 7,
    "codes": [
      "CF1",
      "CF2",
      "CF3",
      "CF4",
      "CF5",
      "CF6",
      "CF7"
    ]
  },
  {
    "code": "CHU",
    "nom": "SM qui clarifient la Chaleur et assèchent l’Humidité",
    "count": 5,
    "prioritaires": 3,
    "codes": [
      "CHU1",
      "CHU2",
      "CHU3",
      "CHU4",
      "CHU5"
    ]
  },
  {
    "code": "CS",
    "nom": "SM qui clarifient la Chaleur et rafraîchissent le Sang",
    "count": 5,
    "prioritaires": 3,
    "codes": [
      "CS1",
      "CS2",
      "CS3",
      "CS4",
      "CS5"
    ]
  },
  {
    "code": "CSS",
    "nom": "SM qui activent la circulation sanguine et éliminent la stase de Sang",
    "count": 14,
    "prioritaires": 14,
    "codes": [
      "CSS1",
      "CSS2",
      "CSS3",
      "CSS4",
      "CSS5",
      "CSS6",
      "CSS7",
      "CSS8",
      "CSS9",
      "CSS10",
      "CSS11",
      "CSS12",
      "CSS13",
      "CSS14"
    ]
  },
  {
    "code": "CT",
    "nom": "SM qui clarifient la Chaleur et éliminent la Toxine",
    "count": 8,
    "prioritaires": 6,
    "codes": [
      "CT1",
      "CT2",
      "CT3",
      "CT4",
      "CT5",
      "CT6",
      "CT7",
      "CT8"
    ]
  },
  {
    "code": "CV",
    "nom": "SM qui clarifient et font baisser la Chaleur Vide",
    "count": 2,
    "prioritaires": 1,
    "codes": [
      "CV1",
      "CV2"
    ]
  },
  {
    "code": "EH",
    "nom": "SM qui favorisent l’élimination de l’Eau et font s’excréter l’Humidité",
    "count": 10,
    "prioritaires": 7,
    "codes": [
      "EH1",
      "EH2",
      "EH3",
      "EH4",
      "EH5",
      "EH6",
      "EH7",
      "EH8",
      "EH9",
      "EH10"
    ]
  },
  {
    "code": "FD",
    "nom": "SM qui favorisent la digestion",
    "count": 5,
    "prioritaires": 0,
    "codes": [
      "FD1",
      "FD2",
      "FD3",
      "FD4",
      "FD5"
    ]
  },
  {
    "code": "LD",
    "nom": "SM qui lubrifient et font descendre",
    "count": 2,
    "prioritaires": 0,
    "codes": [
      "LD1",
      "LD2"
    ]
  },
  {
    "code": "LE",
    "nom": "SM lourdes qui pacifient et calment l’Esprit",
    "count": 2,
    "prioritaires": 1,
    "codes": [
      "LE1",
      "LE2"
    ]
  },
  {
    "code": "NY",
    "nom": "SM qui nourrissent le Yīn",
    "count": 10,
    "prioritaires": 4,
    "codes": [
      "NY1",
      "NY2",
      "NY3",
      "NY4",
      "NY5",
      "NY6",
      "NY7",
      "NY8",
      "NY9",
      "NY10"
    ]
  },
  {
    "code": "OO",
    "nom": "SM qui ouvrent les orifices",
    "count": 3,
    "prioritaires": 1,
    "codes": [
      "OO1",
      "OO2",
      "OO3"
    ]
  },
  {
    "code": "PE",
    "nom": "SM qui purgent drastiquement et chassent l’Eau",
    "count": 4,
    "prioritaires": 0,
    "codes": [
      "PE1",
      "PE2",
      "PE3",
      "PE4"
    ]
  },
  {
    "code": "PF",
    "nom": "SM piquantes et fraîches qui libèrent la Surface et clarifient la Chaleur",
    "count": 8,
    "prioritaires": 2,
    "codes": [
      "PF1",
      "PF2",
      "PF3",
      "PF4",
      "PF5",
      "PF6",
      "PF7",
      "PF8"
    ]
  },
  {
    "code": "PT",
    "nom": "SM piquantes et tièdes qui libèrent la Surface et dispersent le Froid",
    "count": 13,
    "prioritaires": 4,
    "codes": [
      "PT1",
      "PT2",
      "PT3",
      "PT4",
      "PT5",
      "PT6",
      "PT7",
      "PT8",
      "PT9",
      "PT10",
      "PT11",
      "PT12",
      "PT13"
    ]
  },
  {
    "code": "PUF",
    "nom": "SM qui purgent avec force et désobstruent les selles",
    "count": 3,
    "prioritaires": 2,
    "codes": [
      "PUF1",
      "PUF2",
      "PUF3"
    ]
  },
  {
    "code": "RQ",
    "nom": "SM qui régularisent la circulation du Qì",
    "count": 8,
    "prioritaires": 4,
    "codes": [
      "RQ1",
      "RQ2",
      "RQ3",
      "RQ4",
      "RQ5",
      "RQ6",
      "RQ7",
      "RQ8"
    ]
  },
  {
    "code": "TE",
    "nom": "SM qui tonifient le Qì",
    "count": 11,
    "prioritaires": 6,
    "codes": [
      "TE1",
      "TE2",
      "TE3",
      "TE4",
      "TE5",
      "TE6",
      "TE7",
      "TE8",
      "TE9",
      "TE10",
      "TE11"
    ]
  },
  {
    "code": "TI",
    "nom": "SM qui tiédissent l’interne",
    "count": 8,
    "prioritaires": 2,
    "codes": [
      "TI1",
      "TI2",
      "TI3",
      "TI4",
      "TI5",
      "TI6",
      "TI7",
      "TI8"
    ]
  },
  {
    "code": "TS",
    "nom": "SM qui tonifient le Sang",
    "count": 6,
    "prioritaires": 2,
    "codes": [
      "TS1",
      "TS2",
      "TS3",
      "TS4",
      "TS5",
      "TS6"
    ]
  },
  {
    "code": "TTD",
    "nom": "SM qui transforment le Tán, arrêtent la toux et apaisent la dyspnée",
    "count": 15,
    "prioritaires": 12,
    "codes": [
      "TTD1",
      "TTD2",
      "TTD3",
      "TTD4",
      "TTD5",
      "TTD6",
      "TTD7",
      "TTD8",
      "TTD9",
      "TTD10",
      "TTD11",
      "TTD12",
      "TTD13",
      "TTD14",
      "TTD15"
    ]
  },
  {
    "code": "TY",
    "nom": "SM qui tonifient le Yáng",
    "count": 9,
    "prioritaires": 0,
    "codes": [
      "TY1",
      "TY2",
      "TY3",
      "TY4",
      "TY5",
      "TY6",
      "TY7",
      "TY8",
      "TY9"
    ]
  },
  {
    "code": "V",
    "nom": "SM vomitives",
    "count": 1,
    "prioritaires": 0,
    "codes": [
      "V1"
    ]
  },
  {
    "code": "VH",
    "nom": "SM qui chassent le Vent-Humidité",
    "count": 6,
    "prioritaires": 2,
    "codes": [
      "VH1",
      "VH2",
      "VH3",
      "VH4",
      "VH5",
      "VH6"
    ]
  }
];

  const PHARMA_HERBS = [
  {
    "id": "A1",
    "code": "A1",
    "classCode": "A",
    "classe": "SM astringentes",
    "classeIndex": "ASTRINGENTES",
    "pinyin": "Fù pén zǐ",
    "pinyinSansTons": "Fu Pen Zi",
    "hanzi": "覆盆子",
    "nom": "Framboise chinoise séchée",
    "nature": "Tiède",
    "saveur": "Doux, Acide",
    "tropisme": "Foie, Reins, Vessie",
    "posologie": "5 à 10g",
    "actions": [
      "Tonifier le Foie",
      "Eclaircir les yeux",
      "Tonifier les Reins",
      "Assister le Yang",
      "Affermir le Jing",
      "Diminuer les urines"
    ],
    "esprit": "urine, sperme, vision",
    "prioritaire": false,
    "source": {
      "workbookSheet": "A",
      "detailTable": "A"
    }
  },
  {
    "id": "A2",
    "code": "A2",
    "classCode": "A",
    "classe": "SM astringentes",
    "classeIndex": "ASTRINGENTES",
    "pinyin": "Hǎi piāo xiāo",
    "pinyinSansTons": "Hai Piao Xiao",
    "hanzi": "海螵蛸",
    "nom": "Os plat interne de seiche",
    "nature": "Tiède",
    "saveur": "Salé, Astringent",
    "tropisme": "Rate, \nReins",
    "posologie": "1,5 à 30g",
    "actions": [
      "Affermir le Jing",
      "Rassembler le Sang",
      "Arrêter les saignements",
      "Arrêter les leucorrhées",
      "Restreindre l'acidité",
      "Arrêter la douleur",
      "Assécher l'Humidité",
      "Refermer les plaies"
    ],
    "esprit": "",
    "prioritaire": false,
    "source": {
      "workbookSheet": "A",
      "detailTable": "A"
    }
  },
  {
    "id": "A3",
    "code": "A3",
    "classCode": "A",
    "classe": "SM astringentes",
    "classeIndex": "ASTRINGENTES",
    "pinyin": "Lián zǐ",
    "pinyinSansTons": "Lian Zi",
    "hanzi": "莲子",
    "nom": "Graine de lotus d'Orient ou lotus sacré",
    "nature": "Neutre / Equilibré",
    "saveur": "Doux, Astringent",
    "tropisme": "Cœur, Rate, Estomac, Foie, Reins, Vessie",
    "posologie": "6 à 15g",
    "actions": [
      "Soutenir les Reins",
      "Affermir le Jing",
      "Tonifier la Rate",
      "Arrêter la diarrhée",
      "Enrichir le coeur",
      "Calmer le Shen"
    ],
    "esprit": "shen, pompe cardiaque, diarree",
    "prioritaire": false,
    "source": {
      "workbookSheet": "A",
      "detailTable": "A"
    }
  },
  {
    "id": "A4",
    "code": "A4",
    "classCode": "A",
    "classe": "SM astringentes",
    "classeIndex": "ASTRINGENTES",
    "pinyin": "Qiàn shí",
    "pinyinSansTons": "Qian Shi",
    "hanzi": "芡实",
    "nom": "Graine mûre et séchée du nénuphar épineux",
    "nature": "Neutre / Equilibré",
    "saveur": "Doux, Astringent",
    "tropisme": "Rate, \nReins",
    "posologie": "15 à 30g",
    "actions": [
      "Soutenir les Reins",
      "Affermir le Jing",
      "Arrêter les leucorrhées",
      "Chasser l'Humidité",
      "Tonifier la Rate",
      "Arrêter la diarrhée"
    ],
    "esprit": "",
    "prioritaire": false,
    "source": {
      "workbookSheet": "A",
      "detailTable": "A"
    }
  },
  {
    "id": "A5",
    "code": "A5",
    "classCode": "A",
    "classe": "SM astringentes",
    "classeIndex": "ASTRINGENTES",
    "pinyin": "Ròu dòu kòu",
    "pinyinSansTons": "Rou Dou Kou",
    "hanzi": "肉豆蔻",
    "nom": "Noix de muscade",
    "nature": "Tiède",
    "saveur": "Piquant, Amer",
    "tropisme": "Rate, Estomac, GI",
    "posologie": "1,5 à 6g",
    "actions": [
      "Tiédir le Centre",
      "Mobiliser le Qi",
      "Arrêter la diarrhée",
      "Dissiper les aliments",
      "Resserrer les Intestins"
    ],
    "esprit": "",
    "prioritaire": false,
    "source": {
      "workbookSheet": "A",
      "detailTable": "A"
    }
  },
  {
    "id": "A6",
    "code": "A6",
    "classCode": "A",
    "classe": "SM astringentes",
    "classeIndex": "ASTRINGENTES",
    "pinyin": "Sāng piāo xiāo",
    "pinyinSansTons": "Sang Piao Xiao",
    "hanzi": "桑螵蛸",
    "nom": "Œuf de mante chinoise",
    "nature": "Neutre / Equilibré",
    "saveur": "Doux, salé",
    "tropisme": "Foie, \nReins",
    "posologie": "3 à 10g",
    "actions": [
      "Tonifier les Reins",
      "Assister le Yang",
      "Affermir le Jing",
      "Diminuer les urines"
    ],
    "esprit": "",
    "prioritaire": false,
    "source": {
      "workbookSheet": "A",
      "detailTable": "A"
    }
  },
  {
    "id": "A7",
    "code": "A7",
    "classCode": "A",
    "classe": "SM astringentes",
    "classeIndex": "ASTRINGENTES",
    "pinyin": "Shān zhū yú",
    "pinyinSansTons": "Shan Zhu Yu",
    "hanzi": "山茱萸",
    "nom": "Chair de cornouille mûre",
    "nature": "Légèrement tiède",
    "saveur": "Acide, Astringent",
    "tropisme": "Foie, \nReins",
    "posologie": "5 à 10g",
    "actions": [
      "Tonifier le Foie",
      "Tonifier les Reins",
      "Réfréner le Jing et le Qi",
      "Consolider le vide et le collapsus"
    ],
    "esprit": "",
    "prioritaire": false,
    "source": {
      "workbookSheet": "A",
      "detailTable": "A"
    }
  },
  {
    "id": "A8",
    "code": "A8",
    "classCode": "A",
    "classe": "SM astringentes",
    "classeIndex": "ASTRINGENTES",
    "pinyin": "Wū méi",
    "pinyinSansTons": "Wu Mei",
    "hanzi": "乌梅",
    "nom": "Fruit vert presque mûr et séché de l'abricotier du Japon",
    "nature": "Neutre / Equilibré",
    "saveur": "Acide, Astringent",
    "tropisme": "Foie, Rate, Poumon, GI",
    "posologie": "6 à 12g",
    "actions": [
      "Arrêter les saignements",
      "Arrêter la diarrhée",
      "Resserrer les Intestins",
      "Rassembler le Poumon",
      "Arrêter la toux",
      "Produire les liquides",
      "Calmer les ascaris"
    ],
    "esprit": "",
    "prioritaire": false,
    "source": {
      "workbookSheet": "A",
      "detailTable": "A"
    }
  },
  {
    "id": "A9",
    "code": "A9",
    "classCode": "A",
    "classe": "SM astringentes",
    "classeIndex": "ASTRINGENTES",
    "pinyin": "Wǔ wèi zǐ",
    "pinyinSansTons": "Wu Wei Zi",
    "hanzi": "五味子",
    "nom": "Fruit mûr et séché schisandra sinensis",
    "nature": "Tiède",
    "saveur": "Acide",
    "tropisme": "Poumon, Cœur, Reins",
    "posologie": "1 à 6g",
    "actions": [
      "Tonifier les Reins",
      "Soutenir le Qi",
      "Tranquilliser le Cœur",
      "Produire les liquides",
      "Rassembler et collecter par l'astringence"
    ],
    "esprit": "diabete, toxine alcool, hepatite, double vide rn et P, transpi spontanée, insomnie",
    "prioritaire": true,
    "source": {
      "workbookSheet": "A",
      "detailTable": "A"
    },
    "classeEssentielle": "SM astringentes"
  },
  {
    "id": "AF1",
    "code": "AF1",
    "classCode": "AF",
    "classe": "SM qui apaisent le Foie",
    "classeIndex": "APAISENT LE FOIE",
    "pinyin": "Cì jí lí",
    "pinyinSansTons": "Ci Ji Li",
    "hanzi": "刺蒺藜",
    "nom": "Fruit mûr et séché de la tribule terrestre",
    "nature": "Légèrement Tiède, Légèrement toxique",
    "saveur": "Piquent, Amer",
    "tropisme": "Foie",
    "posologie": "6 à 9g",
    "actions": [
      "Equilibrer le Foie",
      "Libérer de lasurpression",
      "Activer le Sang",
      "Expulser le Vent",
      "Eclaircir les yeux",
      "Arrêter les démangeaisons"
    ],
    "esprit": "Vent (plénitude, stagnation, chaleur)",
    "prioritaire": false,
    "source": {
      "workbookSheet": "AF",
      "detailTable": "AF"
    }
  },
  {
    "id": "AF2",
    "code": "AF2",
    "classCode": "AF",
    "classe": "SM qui apaisent le Foie",
    "classeIndex": "APAISENT LE FOIE",
    "pinyin": "Dì lóng",
    "pinyinSansTons": "Di Long",
    "hanzi": "地龙",
    "nom": "Ver de terre pheretima séché",
    "nature": "Froid",
    "saveur": "Salé (Piquant selon certain.es)",
    "tropisme": "Foie, Rate, Vessie (Poumon)",
    "posologie": "5 à 20g",
    "actions": [
      "Equilibrer le Foie",
      "Clarifier les gestes",
      "Arrêter les spasmes",
      "Clarifier la Chaleur",
      "Eteindre le Vent",
      "Désobstruer les canaux",
      "Activer les liaisons",
      "Equilibrer la dyspnée",
      "Faire s'écouler l'urine"
    ],
    "esprit": "Vent (clarifie la chaleur)\nRamollissement des masses et obstructions",
    "prioritaire": false,
    "source": {
      "workbookSheet": "AF",
      "detailTable": "AF"
    }
  },
  {
    "id": "AF3",
    "code": "AF3",
    "classCode": "AF",
    "classe": "SM qui apaisent le Foie",
    "classeIndex": "APAISENT LE FOIE",
    "pinyin": "Gōu téng",
    "pinyinSansTons": "Gou Teng",
    "hanzi": "钩藤",
    "nom": "Tige et épines séchées du gambier",
    "nature": "Frais",
    "saveur": "Doux",
    "tropisme": "Foie, Cœur, EC",
    "posologie": "3 à 12g",
    "actions": [
      "Equilibrer le Foie",
      "Arrêter les spasmes",
      "Clarifier la Chaleur",
      "Eteindre le Vent",
      "Apaiser la frayeur"
    ],
    "esprit": "Vent (chaleur plénitude ou vide)\nMaux de tête avec hypertension (montée du yang du foie, feu\ndu foie)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "AF",
      "detailTable": "AF"
    },
    "classeEssentielle": "SM qui apaisent le foie"
  },
  {
    "id": "AF4",
    "code": "AF4",
    "classCode": "AF",
    "classe": "SM qui apaisent le Foie",
    "classeIndex": "APAISENT LE FOIE",
    "pinyin": "Mǔ lì",
    "pinyinSansTons": "Mu Li",
    "hanzi": "牡蛎",
    "nom": "Coquilles de 3 espèces d'huîtres",
    "nature": "Légèrement Froid",
    "saveur": "Salé",
    "tropisme": "Foie, Reins",
    "posologie": "15 à 30g",
    "actions": [
      "Equilibrer le Foie",
      "Rassembler le Yin",
      "Cacher le Yang",
      "Arrêter les transpirations",
      "Contenir le Jing",
      "Transformer les mucosités",
      "Ramollir les indurations",
      "Disperser la nouure",
      "Resserrer et faire l'astringence"
    ],
    "esprit": "Apaisement (vent, yáng du foie, shén)\nFuite des liquides physiologiques par vide de rein\nNodules, masses\nHyperacidité gastrique",
    "prioritaire": true,
    "source": {
      "workbookSheet": "AF",
      "detailTable": "AF"
    },
    "classeEssentielle": "SM qui apaisent le foie"
  },
  {
    "id": "AF5",
    "code": "AF5",
    "classCode": "AF",
    "classe": "SM qui apaisent le Foie",
    "classeIndex": "APAISENT LE FOIE",
    "pinyin": "Quán xiē",
    "pinyinSansTons": "Quan Xie",
    "hanzi": "全蝎",
    "nom": "Scorpion doré de Mandchourie séché",
    "nature": "Neutre / équilibré, Toxique",
    "saveur": "Piquant",
    "tropisme": "Foie",
    "posologie": "0,5 à 2g",
    "actions": [
      "Arrêter les spasmes",
      "Eteindre le Vent",
      "Désobstruer les liaisons",
      "Disperser la nouure",
      "Neutraliser la toxine",
      "Arrêter la douleur"
    ],
    "esprit": "Vent (toutes causes sauf vide de sang)\nObstructions bi (vent humidité)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "AF",
      "detailTable": "AF"
    },
    "classeEssentielle": "SM qui apaisent le foie"
  },
  {
    "id": "AF6",
    "code": "AF6",
    "classCode": "AF",
    "classe": "SM qui apaisent le Foie",
    "classeIndex": "APAISENT LE FOIE",
    "pinyin": "Shí jué míng",
    "pinyinSansTons": "Shi Jue Ming",
    "hanzi": "石决明",
    "nom": "Coquilles séchées de différentes espèces d'ormeaux",
    "nature": "Froid",
    "saveur": "Salé",
    "tropisme": "Foie, Reins",
    "posologie": "10 à 30g",
    "actions": [
      "Equilibrer le Foie",
      "Clarifier la Chaleur",
      "Clarifier le Foie",
      "Cacher le Yang",
      "Eclaircir les yeux"
    ],
    "esprit": "Hyperactivité du yang du foie\nYeux (chaleur plénitude ou vide)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "AF",
      "detailTable": "AF"
    },
    "classeEssentielle": "SM qui apaisent le foie"
  },
  {
    "id": "AF7",
    "code": "AF7",
    "classCode": "AF",
    "classe": "SM qui apaisent le Foie",
    "classeIndex": "APAISENT LE FOIE",
    "pinyin": "Tiān má",
    "pinyinSansTons": "Tian Ma",
    "hanzi": "天麻",
    "nom": "Tubercule séché de gastrodie",
    "nature": "Neutre / équilibré",
    "saveur": "Doux",
    "tropisme": "Foie",
    "posologie": "1 à 10g",
    "actions": [
      "Equilibrer le Foie",
      "Expulser le Vent",
      "Arrêter les spasmes",
      "Eteindre le Vent",
      "Désobstruer les liaisons",
      "Cacher le Yang"
    ],
    "esprit": "Vent et montée de yang du foie (par nutrition et relâchement)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "AF",
      "detailTable": "AF"
    },
    "classeEssentielle": "SM qui apaisent le foie"
  },
  {
    "id": "AF8",
    "code": "AF8",
    "classCode": "AF",
    "classe": "SM qui apaisent le Foie",
    "classeIndex": "APAISENT LE FOIE",
    "pinyin": "Wú gōng",
    "pinyinSansTons": "Wu Gong",
    "hanzi": "蜈蚣",
    "nom": "Corps séché de la scolopendre",
    "nature": "Tiède, Toxique",
    "saveur": "Piquant",
    "tropisme": "Foie",
    "posologie": "0,5 à 5g",
    "actions": [
      "Arrêter les spasmes",
      "Eteindre le Vent",
      "Désobstruer les liaisons",
      "Disperser la nouure",
      "Neutraliser la toxine",
      "Arrêter la douleur"
    ],
    "esprit": "Cas graves et symptômes tenaces\nVent (toutes causes sauf vide de sang)\nObstructions bi (vent humidité)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "AF",
      "detailTable": "AF"
    },
    "classeEssentielle": "SM qui apaisent le foie"
  },
  {
    "id": "AF9",
    "code": "AF9",
    "classCode": "AF",
    "classe": "SM qui apaisent le Foie",
    "classeIndex": "APAISENT LE FOIE",
    "pinyin": "Zhēn zhū mǔ",
    "pinyinSansTons": "Zhen Zhu Mu",
    "hanzi": "珍珠母",
    "nom": "Nacre (de moules et d'huîtres perlières d'eau douce et salé)",
    "nature": "Froid",
    "saveur": "Doux, salé",
    "tropisme": "Foie, Cœur",
    "posologie": "1,5 à 30g",
    "actions": [
      "Equilibrer le Foie",
      "Apaiser la frayeur",
      "Cacher le Yang",
      "Calmer le Shen",
      "Arrêter le Sang"
    ],
    "esprit": "Montée du yang du foie\nChaleur (cœur et foie)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "AF",
      "detailTable": "AF"
    },
    "classeEssentielle": "SM qui apaisent le foie"
  },
  {
    "id": "AF10",
    "code": "AF10",
    "classCode": "AF",
    "classe": "SM qui apaisent le Foie",
    "classeIndex": "APAISENT LE FOIE",
    "pinyin": "Zhēn zhū",
    "pinyinSansTons": "Zhen Zhu",
    "hanzi": "珍珠",
    "nom": "Perles d'huîtres et/ou de moules",
    "nature": "Froid",
    "saveur": "Doux, salé",
    "tropisme": "Cœur, Foie",
    "posologie": "0,1 à 0,3 g par prise en poudre fine ; ne pas faire décocter. Usage externe : quantité appropriée.",
    "actions": [
      "Clarifier la Chaleur",
      "Eteindre le Vent",
      "Nourrir le Yin",
      "Transformer les mucosités",
      "Neutraliser la toxine",
      "Eclaircir les yeux",
      "Calmer le Shen",
      "Apaiser le cœur",
      "Chasser les taies",
      "Régénérer les tissus"
    ],
    "esprit": "Chaleur (cœur et foie)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "AF",
      "detailTable": "AF"
    },
    "classeEssentielle": "SM qui apaisent le foie",
    "incompleteFields": []
  },
  {
    "id": "AH1",
    "code": "AH1",
    "classCode": "AH",
    "classe": "SM aromatiques qui transforment l’Humidité",
    "classeIndex": "AROMATIQUES QUI TRANSFORMENT L'HUMIDITE",
    "pinyin": "Bái dòu kòu",
    "pinyinSansTons": "Bai Dou Kou",
    "hanzi": "白豆蔻",
    "nom": "Fruit mûr et séché de la cardamome du Cambodge",
    "nature": "Tiède",
    "saveur": "Piquant",
    "tropisme": "Poumon, Rate, Estomac",
    "posologie": "1,5 à 6g",
    "actions": [
      "Transformer l'Humidité",
      "Mobiliser le Qi",
      "Tiédir le centre",
      "Arrêter les vomissements",
      "Ouvrir l'Estomac",
      "Dissiper les aliments"
    ],
    "esprit": "Humidité dans le foyer central (mobilisation du qi)",
    "prioritaire": false,
    "source": {
      "workbookSheet": "AH",
      "detailTable": "AH"
    }
  },
  {
    "id": "AH2",
    "code": "AH2",
    "classCode": "AH",
    "classe": "SM aromatiques qui transforment l’Humidité",
    "classeIndex": "AROMATIQUES QUI TRANSFORMENT L'HUMIDITE",
    "pinyin": "Cāng zhú",
    "pinyinSansTons": "Cang Zhu",
    "hanzi": "苍术",
    "nom": "Rhizome séché d'une atractyle",
    "nature": "Tiède",
    "saveur": "Piquant, Amer",
    "tropisme": "Rate, Estomac, Foie",
    "posologie": "3 à 9g",
    "actions": [
      "Renforcer la Rate",
      "Assécher l'Humidité",
      "Libérer la surpression",
      "Expurger le putride"
    ],
    "esprit": "Humidité (assèchement)",
    "prioritaire": false,
    "source": {
      "workbookSheet": "AH",
      "detailTable": "AH"
    }
  },
  {
    "id": "AH3",
    "code": "AH3",
    "classCode": "AH",
    "classe": "SM aromatiques qui transforment l’Humidité",
    "classeIndex": "AROMATIQUES QUI TRANSFORMENT L'HUMIDITE",
    "pinyin": "Cǎo dòu kòu",
    "pinyinSansTons": "Cao Dou Kou",
    "hanzi": "草豆蔻",
    "nom": "Graine presque mûre d'un alpinia",
    "nature": "Tiède",
    "saveur": "Piquant",
    "tropisme": "Rate, Estomac",
    "posologie": "3 à 6g",
    "actions": [
      "Mobiliser le Qi",
      "Tiédir le centre",
      "Tiédir l'Estomac",
      "Arrêter les vomissements",
      "Assécher l'Humidité",
      "Expulser le Froid"
    ],
    "esprit": "Froid humidité (foyer central)",
    "prioritaire": false,
    "source": {
      "workbookSheet": "AH",
      "detailTable": "AH"
    }
  },
  {
    "id": "AH4",
    "code": "AH4",
    "classCode": "AH",
    "classe": "SM aromatiques qui transforment l’Humidité",
    "classeIndex": "AROMATIQUES QUI TRANSFORMENT L'HUMIDITE",
    "pinyin": "Guǎng huò xiāng",
    "pinyinSansTons": "Guang Huo Xiang",
    "hanzi": "广藿香",
    "nom": "Partie aérienne du patchouli",
    "nature": "Légèrement tiède",
    "saveur": "Piquant",
    "tropisme": "Rate, Esto., Poumon",
    "posologie": "5 à 10g",
    "actions": [
      "Transformer l'Humidité",
      "Arrêter les vomissements",
      "Harmoniser l'Estomac",
      "Expulser la Canicule",
      "Libérer la Surface"
    ],
    "esprit": "Humidité (foyer central)\nVomissements\n(Canicule)",
    "prioritaire": false,
    "source": {
      "workbookSheet": "AH",
      "detailTable": "AH"
    }
  },
  {
    "id": "AH5",
    "code": "AH5",
    "classCode": "AH",
    "classe": "SM aromatiques qui transforment l’Humidité",
    "classeIndex": "AROMATIQUES QUI TRANSFORMENT L'HUMIDITE",
    "pinyin": "Hòu pò",
    "pinyinSansTons": "Hou Po",
    "hanzi": "厚朴",
    "nom": "Ecorce des tiges, branches et racines du magnolia officinal",
    "nature": "Tiède",
    "saveur": "Amer, Piquant",
    "tropisme": "Rate, Esto, Poumon, GI",
    "posologie": "3 à 10g",
    "actions": [
      "Tiédir le centre",
      "Assécher l'Humidité",
      "Faire descendre le Qi",
      "Dissiper les mucosités"
    ],
    "esprit": "Humidité et stagnations (poumon, système digestif)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "AH",
      "detailTable": "AH"
    },
    "classeEssentielle": "SM aromatiques qui transforment l'humidité"
  },
  {
    "id": "AH6",
    "code": "AH6",
    "classCode": "AH",
    "classe": "SM aromatiques qui transforment l’Humidité",
    "classeIndex": "AROMATIQUES QUI TRANSFORMENT L'HUMIDITE",
    "pinyin": "Shā rén",
    "pinyinSansTons": "Sha Ren",
    "hanzi": "砂仁",
    "nom": "Fruit mûr et séché d'une cardamome",
    "nature": "Tiède",
    "saveur": "Piquant",
    "tropisme": "Rate, Esto, Rein",
    "posologie": "3 à 6g",
    "actions": [
      "Transformer l'Humidité",
      "Tiédir la Rate",
      "Ouvrir l'Estomac",
      "Arrêter la diarrhée",
      "Mettre en ordre le Qi",
      "Calmer le fœtus"
    ],
    "esprit": "Humidité (foyer central)\nMenace de fausse couche (stagnation de qi)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "AH",
      "detailTable": "AH"
    },
    "classeEssentielle": "SM aromatiques qui transforment l’humidité"
  },
  {
    "id": "AS1",
    "code": "AS1",
    "classCode": "AS",
    "classe": "SM qui arrêtent le Sang",
    "classeIndex": "ARRETENT LE SANG",
    "pinyin": "Ài yè",
    "pinyinSansTons": "Ai Ye",
    "hanzi": "艾叶",
    "nom": "Feuille séchée de l'armoise de Chine",
    "nature": "Tiède, Légèrement Toxique",
    "saveur": "Piquant, Amer",
    "tropisme": "Foie, rate, Reins",
    "posologie": "3 à 10g",
    "actions": [
      "Tiédir les canaux",
      "Arrêter le saignement",
      "Disperser le Froid",
      "Arrêter la douleur",
      "Calmer le fœtus"
    ],
    "esprit": "Saignements par froid-vide\nFroid vide du foyer inférieur (avec ou sans humidité)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "AS",
      "detailTable": "AS"
    },
    "classeEssentielle": "SM qui arrêtent le sang"
  },
  {
    "id": "AS2",
    "code": "AS2",
    "classCode": "AS",
    "classe": "SM qui arrêtent le Sang",
    "classeIndex": "ARRETENT LE SANG",
    "pinyin": "Bái jí",
    "pinyinSansTons": "Bai Ji",
    "hanzi": "白芨",
    "nom": "Tubercule de l'orchidée jacinthe",
    "nature": "Légèrement Froid",
    "saveur": "Amer, Doux, Astringent",
    "tropisme": "Poumon, Foie, Estomac",
    "posologie": "1,5 à 10g",
    "actions": [
      "Arrêter le saignement",
      "Rassembler le Sang",
      "Réduire le gonflement",
      "Engendrer les tissus"
    ],
    "esprit": "Saignements par chaleur plénitude ou vide (poumon, estomac)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "AS",
      "detailTable": "AS"
    },
    "classeEssentielle": "SM qui arrêtent le sang"
  },
  {
    "id": "AS3",
    "code": "AS3",
    "classCode": "AS",
    "classe": "SM qui arrêtent le Sang",
    "classeIndex": "ARRETENT LE SANG",
    "pinyin": "Bái máo gēn",
    "pinyinSansTons": "Bai Mao Gen",
    "hanzi": "白茅根",
    "nom": "Rhizome de l'impérate cylindrique",
    "nature": "Froid",
    "saveur": "Doux",
    "tropisme": "Poumon, Estomac, Cœur, Vessie",
    "posologie": "10 à 60g",
    "actions": [
      "Arrêter le saignement",
      "Rafraîchir le sang",
      "Clarifier la Chaleur",
      "Engendrer les liquides",
      "Favoriser les urines",
      "Dégager la strangurie"
    ],
    "esprit": "Saignements par chaleur, lésion des liquides",
    "prioritaire": true,
    "source": {
      "workbookSheet": "AS",
      "detailTable": "AS"
    },
    "classeEssentielle": "SM qui arrêtent le sang"
  },
  {
    "id": "AS4",
    "code": "AS4",
    "classCode": "AS",
    "classe": "SM qui arrêtent le Sang",
    "classeIndex": "ARRETENT LE SANG",
    "pinyin": "Cè bǎi yè",
    "pinyinSansTons": "Ce Bai Ye",
    "hanzi": "侧柏叶",
    "nom": "Jeunes rameaux feuillus séchés du thuya de Chine",
    "nature": "Froid",
    "saveur": "Amer, Astringent",
    "tropisme": "Poumon, Foie, Rate, GI",
    "posologie": "6 à 15g",
    "actions": [
      "Arrêter le saignement",
      "Rafraîchir le sang",
      "Expulser le Vent Humidité",
      "Expulser les mucosités",
      "Arrêter la toux",
      "Disperser la tuméfaction",
      "Disperser la toxine"
    ],
    "esprit": "Saignements par chaleur",
    "prioritaire": true,
    "source": {
      "workbookSheet": "AS",
      "detailTable": "AS"
    },
    "classeEssentielle": "SM qui arrêtent le sang"
  },
  {
    "id": "AS5",
    "code": "AS5",
    "classCode": "AS",
    "classe": "SM qui arrêtent le Sang",
    "classeIndex": "ARRETENT LE SANG",
    "pinyin": "Dì yú",
    "pinyinSansTons": "Di Yu",
    "hanzi": "地榆",
    "nom": "Racine séchée de la grande pimprenelle",
    "nature": "Froid",
    "saveur": "Amer, Acide",
    "tropisme": "Foie, Poumon, Reins, Estomac, GI",
    "posologie": "6 à 120g",
    "actions": [
      "Arrêter le saignement",
      "Refermer la plaie",
      "Rafraîchir le sang",
      "Clarifier la Chaleur",
      "Disperser la tuméfaction",
      "Disperser la toxine"
    ],
    "esprit": "Saignements par chaleur (foyer inférieur)\nBrûlures",
    "prioritaire": true,
    "source": {
      "workbookSheet": "AS",
      "detailTable": "AS"
    },
    "classeEssentielle": "SM qui arrêtent le sang"
  },
  {
    "id": "AS6",
    "code": "AS6",
    "classCode": "AS",
    "classe": "SM qui arrêtent le Sang",
    "classeIndex": "ARRETENT LE SANG",
    "pinyin": "Ǒu jié",
    "pinyinSansTons": "Ou Jie",
    "hanzi": "藕节",
    "nom": "Nœud du rhizome de lotus d'Orient ou sacré",
    "nature": "Neutre / Equilibré",
    "saveur": "Doux, Astringent",
    "tropisme": "Foie, Poumon, Estomac",
    "posologie": "10 à 60g",
    "actions": [
      "Arrêter le saignement",
      "Disperser la Stase"
    ],
    "esprit": "Saignements (remède d’appoint)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "AS",
      "detailTable": "AS"
    },
    "classeEssentielle": "SM qui arrêtent le sang"
  },
  {
    "id": "AS7",
    "code": "AS7",
    "classCode": "AS",
    "classe": "SM qui arrêtent le Sang",
    "classeIndex": "ARRETENT LE SANG",
    "pinyin": "Pào jiāng",
    "pinyinSansTons": "Pao Jiang",
    "hanzi": "炮姜",
    "nom": "Rhizome du gingembre torréfié",
    "nature": "Chaud",
    "saveur": "Piquant (Amer, Astringent selon certain.es)",
    "tropisme": "Rate, Estomac, Reins, Cœur, Poumon, Foie",
    "posologie": "3 à 6g",
    "actions": [
      "Tiédir les canaux",
      "Arrêter le saignement",
      "Disperser le Froid",
      "Arrêter la douleur",
      "Tiédir le centre"
    ],
    "esprit": "Saignements par froid-vide\nDouleur abdominale, diarrhée par froid-vide",
    "prioritaire": false,
    "source": {
      "workbookSheet": "AS",
      "detailTable": "AS"
    }
  },
  {
    "id": "AS8",
    "code": "AS8",
    "classCode": "AS",
    "classe": "SM qui arrêtent le Sang",
    "classeIndex": "ARRETENT LE SANG",
    "pinyin": "Pú huáng",
    "pinyinSansTons": "Pu Huang",
    "hanzi": "蒲黄",
    "nom": "Pollen séché de la massette à feuilles étroites",
    "nature": "Neutre / Equilibré",
    "saveur": "Doux",
    "tropisme": "Foie, EC",
    "posologie": "5 à 10g",
    "actions": [
      "Arrêter le saignement",
      "Rafraîchir le sang",
      "Activer le Sang",
      "Réduire la Stase"
    ],
    "esprit": "Saignements par stase de sang",
    "prioritaire": false,
    "source": {
      "workbookSheet": "AS",
      "detailTable": "AS"
    }
  },
  {
    "id": "AS9",
    "code": "AS9",
    "classCode": "AS",
    "classe": "SM qui arrêtent le Sang",
    "classeIndex": "ARRETENT LE SANG",
    "pinyin": "Qiàn cǎo",
    "pinyinSansTons": "Qian Cao",
    "hanzi": "茜草",
    "nom": "Racine et rhizome séché.es de la garance indienne",
    "nature": "Froid",
    "saveur": "Amer",
    "tropisme": "Foie",
    "posologie": "3 à 9g",
    "actions": [
      "Désobstruer les canaux",
      "Arrêter le saignement",
      "Rafraîchir le sang",
      "Disperser la Stase",
      "Activer le Sang"
    ],
    "esprit": "Saignements par chaleur et stase de sang",
    "prioritaire": true,
    "source": {
      "workbookSheet": "AS",
      "detailTable": "AS"
    },
    "classeEssentielle": "SM qui arrêtent le sang"
  },
  {
    "id": "AS10",
    "code": "AS10",
    "classCode": "AS",
    "classe": "SM qui arrêtent le Sang",
    "classeIndex": "ARRETENT LE SANG",
    "pinyin": "Sān qī",
    "pinyinSansTons": "San Qi",
    "hanzi": "三七",
    "nom": "Racine séchée de Notoginseng",
    "nature": "Tiède",
    "saveur": "Doux, Légèrement Amer",
    "tropisme": "Foie, Estomac, GI",
    "posologie": "1 à 9g",
    "actions": [
      "Arrêter le saignement",
      "Arrêter la douleur",
      "Réduire le gonflement",
      "Disperser la Stase",
      "Activer le Sang"
    ],
    "esprit": "Saignements avec stase de sang\nBlessures traumatiques avec stase de sang",
    "prioritaire": true,
    "source": {
      "workbookSheet": "AS",
      "detailTable": "AS"
    },
    "classeEssentielle": "SM qui arrêtent le sang"
  },
  {
    "id": "AS11",
    "code": "AS11",
    "classCode": "AS",
    "classe": "SM qui arrêtent le Sang",
    "classeIndex": "ARRETENT LE SANG",
    "pinyin": "Xiān hè cǎo",
    "pinyinSansTons": "Xian He Cao",
    "hanzi": "仙鹤草",
    "nom": "Partie aérienne de l'Aigremoine poilue",
    "nature": "Neutre / Equilibré",
    "saveur": "Amer, Astringent",
    "tropisme": "Cœur, Foie, Rate, Poumon",
    "posologie": "9 à 15g",
    "actions": [
      "Arrêter le saignement",
      "Rassembler le Sang",
      "Neutrealiser la toxine",
      "Tonifier le vide",
      "Stopper le paludisme",
      "Arrêter la dysenterie",
      "Tuer les parasites"
    ],
    "esprit": "Saignements (tous types de tableaux pathologiques)\nDysenterie, diarrhée chroniques",
    "prioritaire": true,
    "source": {
      "workbookSheet": "AS",
      "detailTable": "AS"
    },
    "classeEssentielle": "SM qui arrêtent le sang"
  },
  {
    "id": "AS12",
    "code": "AS12",
    "classCode": "AS",
    "classe": "SM qui arrêtent le Sang",
    "classeIndex": "ARRETENT LE SANG",
    "pinyin": "Xiǎo jì",
    "pinyinSansTons": "Xiao Ji",
    "hanzi": "小蓟",
    "nom": "Partie aérienne et/ou racine du chardon des champs ou petit chardon",
    "nature": "Frais",
    "saveur": "Doux, Amer",
    "tropisme": "Cœur, Foie",
    "posologie": "5 à 60g",
    "actions": [
      "Arrêter le saignement",
      "Réduire le gonflement",
      "Rafraîchir le sang",
      "Neutrealiser la toxine",
      "Disperser la Stase",
      "Dissiper l'abcès"
    ],
    "esprit": "Saignements par chaleur\nInflammations cutanées par chaleur toxique",
    "prioritaire": true,
    "source": {
      "workbookSheet": "AS",
      "detailTable": "AS"
    },
    "classeEssentielle": "SM qui arrêtent le sang"
  },
  {
    "id": "CE1",
    "code": "CE1",
    "classCode": "CE",
    "classe": "SM qui enrichissent le Cœur et calment l’Esprit",
    "classeIndex": "ENRICHISSENT LE CŒUR ET CALMENT L'ESPRIT",
    "pinyin": "Bǎi zǐ rén",
    "pinyinSansTons": "Bai Zi Ren",
    "hanzi": "柏子仁",
    "nom": "Graine de Thuya de Chine",
    "nature": "Neutre/Equilibré",
    "saveur": "Doux",
    "tropisme": "Cœur, Reins, Gros Intestin, (Foie, Rate)",
    "posologie": "10 à 15 g",
    "actions": [
      "Humidifier les intestins",
      "Désobstruer les selles",
      "Calmer l'Esprit/le Shen",
      "Nourrir le Cœur"
    ],
    "esprit": "VIDE — nourrir coeur, calmer shen: insomnie, memoire\nsursauts, palpitations, transpirations nocturnes — constipation secheresse vide sang yin\nsheng: constipation secheresse\nshuang (dégraissée): coeur vide yin sang\nattention selles molles, abondances mucosités",
    "prioritaire": false,
    "source": {
      "workbookSheet": "CE",
      "detailTable": "CE"
    }
  },
  {
    "id": "CE2",
    "code": "CE2",
    "classCode": "CE",
    "classe": "SM qui enrichissent le Cœur et calment l’Esprit",
    "classeIndex": "ENRICHISSENT LE CŒUR ET CALMENT L'ESPRIT",
    "pinyin": "Hé huān pí",
    "pinyinSansTons": "He Huan Pi",
    "hanzi": "合欢皮",
    "nom": "Ecorce de l'Albizia",
    "nature": "Neutre/Equilibré",
    "saveur": "Doux",
    "tropisme": "Cœur, Foie",
    "posologie": "10 à 15 g",
    "actions": [
      "Libérer la surpression",
      "Calmer l'Esprit/le Shen",
      "Activer le Sang",
      "Réduire le gonflement"
    ],
    "esprit": "SURPRESSION — stagnation foie (colere, insomnie, depression) -\nblessures gonflements stase de sang — abcés (+poumon) inflammations cutanées int et ext",
    "prioritaire": false,
    "source": {
      "workbookSheet": "CE",
      "detailTable": "CE"
    }
  },
  {
    "id": "CE3",
    "code": "CE3",
    "classCode": "CE",
    "classe": "SM qui enrichissent le Cœur et calment l’Esprit",
    "classeIndex": "ENRICHISSENT LE CŒUR ET CALMENT L'ESPRIT",
    "pinyin": "Suān zǎo rén",
    "pinyinSansTons": "Suan Zao Ren",
    "hanzi": "酸枣仁",
    "nom": "Amande du noyau de la jujube",
    "nature": "Neutre/Equilibré",
    "saveur": "Doux",
    "tropisme": "Cœur, Rate, Foie, Vésicule Biliaire",
    "posologie": "6 à 15 g",
    "actions": [
      "Calmer l'Esprit/le Shen",
      "Tranquiliser le cœur",
      "Nourrir le Foie",
      "Retenir la transpiration"
    ],
    "esprit": "VIDE — Esprit (nourrir foie, calmer coeur), transpiration\npar déficience\nsheng: coeur foie esprit sang yin\nchao huang: transpiration vide yin qi",
    "prioritaire": true,
    "source": {
      "workbookSheet": "CE",
      "detailTable": "CE"
    },
    "classeEssentielle": "SM qui enrichissent le cœur et calment l'esprit"
  },
  {
    "id": "CE4",
    "code": "CE4",
    "classCode": "CE",
    "classe": "SM qui enrichissent le Cœur et calment l’Esprit",
    "classeIndex": "ENRICHISSENT LE CŒUR ET CALMENT L'ESPRIT",
    "pinyin": "Yuǎn zhì",
    "pinyinSansTons": "Yuan Zhi",
    "hanzi": "远志",
    "nom": "Racine séchée de la Polygala Ténuifolia",
    "nature": "Tiède",
    "saveur": "Amer, Piquant",
    "tropisme": "Cœur, Rein, Poumon",
    "posologie": "3 à 10 g",
    "actions": [
      "Calmer l'Esprit/le Shen",
      "Favoriser l'intellect",
      "Dissiper la tuméfaction",
      "Chasser les mucosités"
    ],
    "esprit": "MUCOSITES — calmer esprit, favoriser intellect, chasser\nmucosités (toux, manies), abcés furoncles\ngan cao zhi yuan zhi: shen vide coeur sang, mucosités orifices, dysharmonie rein coeur\nmi zhi yuan zhi: Poumon calmer toux mucosités",
    "prioritaire": true,
    "source": {
      "workbookSheet": "CE",
      "detailTable": "CE"
    },
    "classeEssentielle": "SM qui enrichissent le cœur et calment l'esprit"
  },
  {
    "id": "CF1",
    "code": "CF1",
    "classCode": "CF",
    "classe": "SM qui clarifient la Chaleur et purgent le Feu",
    "classeIndex": "CLARIFIENT LA CHALEUR ET PURGENT LE FEU [CF]",
    "pinyin": "Jué míng zǐ",
    "pinyinSansTons": "Jue Ming Zi",
    "hanzi": "决明子",
    "nom": "Graine mûre et séchée de 2 espèces de Sénée",
    "nature": "Froid, Neutre",
    "saveur": "Amer, Doux, (Salé)",
    "tropisme": "Foie, GI, \n(VB, Reins)",
    "posologie": "9 à 15g",
    "actions": [
      "Clarifier le Foie",
      "Eclaircir les yeux",
      "Faire s'écouler l'eau",
      "Désobstruer les selles"
    ],
    "esprit": "Clarifie la chaleur (foie et gros intestin)\nTroubles oculaires (foie)\nConstipation (gros intestin)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "CF",
      "detailTable": "CF"
    },
    "classeEssentielle": "SM qui clarifient la chaleur et purgent le feu"
  },
  {
    "id": "CF2",
    "code": "CF2",
    "classCode": "CF",
    "classe": "SM qui clarifient la Chaleur et purgent le Feu",
    "classeIndex": "CLARIFIENT LA CHALEUR ET PURGENT LE FEU [CF]",
    "pinyin": "Lú gēn",
    "pinyinSansTons": "Lu Gen",
    "hanzi": "芦根",
    "nom": "Rhizome frais ou séché du roseau",
    "nature": "Froid",
    "saveur": "Doux",
    "tropisme": "Poumon, Estomac, Vessie",
    "posologie": "15 à 120g",
    "actions": [
      "Clarifier la Chaleur",
      "Engendrer les liquides",
      "Eliminer la dysphorie",
      "Arrêter les vomissements"
    ],
    "esprit": "Clarifie la chaleur (couche du qi, poumon, estomac, vessie)\nEngendre les liquides",
    "prioritaire": true,
    "source": {
      "workbookSheet": "CF",
      "detailTable": "CF"
    },
    "classeEssentielle": "SM qui clarifient la chaleur et purgent le feu"
  },
  {
    "id": "CF3",
    "code": "CF3",
    "classCode": "CF",
    "classe": "SM qui clarifient la Chaleur et purgent le Feu",
    "classeIndex": "CLARIFIENT LA CHALEUR ET PURGENT LE FEU [CF]",
    "pinyin": "Shí gāo",
    "pinyinSansTons": "Shi Gao",
    "hanzi": "石膏",
    "nom": "Gypse \n(calcium sulfate)",
    "nature": "Froid",
    "saveur": "Piquant, Doux",
    "tropisme": "Poumon, Estomac",
    "posologie": "15 à 60g",
    "actions": [
      "Clarifier la Chaleur",
      "Libérer les muscles (cru)",
      "Purger le Feu",
      "Eliminer la dysphorie",
      "Arrêter le soif",
      "Rassembler et produire les chairs (en externe)",
      "Engendrer les muscles et refermer les plaies \n(calciné en externe)"
    ],
    "esprit": "Clarifie la chaleur (couche du qi, poumon, estomac)\nPurge le feu (poumon, estomac)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "CF",
      "detailTable": "CF"
    },
    "classeEssentielle": "SM qui clarifient la chaleur et purgent le feu"
  },
  {
    "id": "CF4",
    "code": "CF4",
    "classCode": "CF",
    "classe": "SM qui clarifient la Chaleur et purgent le Feu",
    "classeIndex": "CLARIFIENT LA CHALEUR ET PURGENT LE FEU [CF]",
    "pinyin": "Tiān huā fěn",
    "pinyinSansTons": "Tian hua fen",
    "hanzi": "天花粉",
    "nom": "Racine séchée \ndu trichosanthes",
    "nature": "Frais",
    "saveur": "Doux, Amer, (Acide)",
    "tropisme": "Poumon, Estomac",
    "posologie": "9 à 15g",
    "actions": [
      "Clarifier la Chaleur",
      "Engendrer les liquides",
      "Arrêter le soif",
      "Faire descendre le Feu",
      "Clarifier le Poumon",
      "Humecter la sécheresse",
      "Dissiper la tuméfaction",
      "Expulser le pus"
    ],
    "esprit": "Clarifie la chaleur (couche du qi, poumon, estomac)\nEngendre les liquides\nArrête la soif",
    "prioritaire": true,
    "source": {
      "workbookSheet": "CF",
      "detailTable": "CF"
    },
    "classeEssentielle": "SM qui clarifient la chaleur et purgent le feu"
  },
  {
    "id": "CF5",
    "code": "CF5",
    "classCode": "CF",
    "classe": "SM qui clarifient la Chaleur et purgent le Feu",
    "classeIndex": "CLARIFIENT LA CHALEUR ET PURGENT LE FEU [CF]",
    "pinyin": "Xià kū cǎo",
    "pinyinSansTons": "Xia Ku Cao",
    "hanzi": "夏枯草",
    "nom": "Epi séché \nde brunelle commune",
    "nature": "Froid",
    "saveur": "Amer, Piquant",
    "tropisme": "Foie, VB",
    "posologie": "6 à 30g",
    "actions": [
      "Clarifier le Foie",
      "Disperser le surpression et la nouure"
    ],
    "esprit": "Tête, yeux (feu du foie)\nCou (feu du foie et mucosités)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "CF",
      "detailTable": "CF"
    },
    "classeEssentielle": "SM qui clarifient la chaleur et purgent le feu"
  },
  {
    "id": "CF6",
    "code": "CF6",
    "classCode": "CF",
    "classe": "SM qui clarifient la Chaleur et purgent le Feu",
    "classeIndex": "CLARIFIENT LA CHALEUR ET PURGENT LE FEU [CF]",
    "pinyin": "Zhī mǔ",
    "pinyinSansTons": "Zhi Mu",
    "hanzi": "知母",
    "nom": "Rhizome d'Amenarrhena",
    "nature": "Froid",
    "saveur": "Amer, Doux",
    "tropisme": "Poumon, Estomac, Reins",
    "posologie": "6 à 12g",
    "actions": [
      "Lubrifier les intestins",
      "Clarifier la Chaleur",
      "Purger le Feu",
      "Humecter la sécheresse",
      "Nourrir le Yin"
    ],
    "esprit": "Clarifie la chaleur (couche du qi, poumon, estomac, reins)\nEngendre les liquides\nHumidifie les intestins",
    "prioritaire": true,
    "source": {
      "workbookSheet": "CF",
      "detailTable": "CF"
    },
    "classeEssentielle": "SM qui clarifient la chaleur et purgent le feu"
  },
  {
    "id": "CF7",
    "code": "CF7",
    "classCode": "CF",
    "classe": "SM qui clarifient la Chaleur et purgent le Feu",
    "classeIndex": "CLARIFIENT LA CHALEUR ET PURGENT LE FEU [CF]",
    "pinyin": "Zhī zǐ",
    "pinyinSansTons": "Zhi Zi",
    "hanzi": "栀子",
    "nom": "Fruit mûr et séché \ndu Gardenia",
    "nature": "Froid",
    "saveur": "Amer",
    "tropisme": "Cœur, Foie, Poumon, Estomac, TF",
    "posologie": "5 à 10g",
    "actions": [
      "Faire s'écouler l'Humidité",
      "Clarifier la Chaleur",
      "Purger le Feu",
      "Eliminer la dysphorie",
      "Dissiper la tuméfaction",
      "Arrêter la douleur",
      "Neutraliser la toxicité",
      "Rafraîchir le Sang"
    ],
    "esprit": "Clarifie la chaleur (couche du qi)\nClarifie la chaleur/feu (cœur, foie, estomac)\nJaunisse (chaleur humidité VB)\nSyndrome lin (chaleur humidité vessie)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "CF",
      "detailTable": "CF"
    },
    "classeEssentielle": "SM qui clarifient la chaleur et purgent le feu"
  },
  {
    "id": "CHU1",
    "code": "CHU1",
    "classCode": "CHU",
    "classe": "SM qui clarifient la Chaleur et assèchent l’Humidité",
    "classeIndex": "CLARIFIENT LA CHALEUR ET\nASSÈCHENT L’HUMIDITÉ",
    "pinyin": "Huáng bǎi",
    "pinyinSansTons": "Huang Bai",
    "hanzi": "黄柏",
    "nom": "Écorce d'arbre au liege de l'amour",
    "nature": "Froid",
    "saveur": "Amer",
    "tropisme": "Reins, Vessie, Gros Intestin",
    "posologie": "3 à 9 g",
    "actions": [
      "Clarifier la chaleur",
      "Assécher l’humidité",
      "Purger le feu",
      "Neutraliser la toxicité"
    ],
    "esprit": "Clarifie la chaleur, assèche l'humidité (surtout foyer inférieur)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "CHU",
      "detailTable": "CHU"
    },
    "classeEssentielle": "SM qui clarifient la chaleur et assèchent l'humidité"
  },
  {
    "id": "CHU2",
    "code": "CHU2",
    "classCode": "CHU",
    "classe": "SM qui clarifient la Chaleur et assèchent l’Humidité",
    "classeIndex": "CLARIFIENT LA CHALEUR ET\nASSÈCHENT L’HUMIDITÉ",
    "pinyin": "Huáng lián",
    "pinyinSansTons": "Huang Lian",
    "hanzi": "黄连",
    "nom": "Rhizome séché de coptide chinoise",
    "nature": "Froid",
    "saveur": "Amer ++",
    "tropisme": "Cœur, Foie, Estomac, Gros Intestin",
    "posologie": "1,5-3 g décoction,\n0,3 0,3 g poudre fine",
    "actions": [
      "Assécher l’humidité",
      "Purger le feu",
      "Neutraliser la toxicité",
      "Tuer les parasites"
    ],
    "esprit": "Clarifie la chaleur, assèche l'humidité (action générale et plus\nparticulièrement système digestif)\nClarifie le feu (cœur, foie)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "CHU",
      "detailTable": "CHU"
    },
    "classeEssentielle": "SM qui clarifient la chaleur et assèchent l'humidité"
  },
  {
    "id": "CHU3",
    "code": "CHU3",
    "classCode": "CHU",
    "classe": "SM qui clarifient la Chaleur et assèchent l’Humidité",
    "classeIndex": "CLARIFIENT LA CHALEUR ET\nASSÈCHENT L’HUMIDITÉ",
    "pinyin": "Huáng qín",
    "pinyinSansTons": "Huang Qin",
    "hanzi": "黄芩",
    "nom": "Racine séchée de la scutellaire du Baïkal",
    "nature": "Froid",
    "saveur": "Amer",
    "tropisme": "Poumon, VB, Estomac, Rate, Gros Intestin, Intestin Grele",
    "posologie": "3 - 9 g",
    "actions": [
      "Clarifier la chaleur",
      "Assécher l’humidité",
      "Purger le feu",
      "Neutraliser la toxicité",
      "Rafraichir le sang et arrêter les saignements",
      "Calmer le fœtus"
    ],
    "esprit": "Clarifie la chaleur, assèche l'humidité (action générale et plus\nparticulièrement foyer supérieur)\nSyndrome Shaoyang avec alternance fièvre/frissons",
    "prioritaire": true,
    "source": {
      "workbookSheet": "CHU",
      "detailTable": "CHU"
    },
    "classeEssentielle": "SM qui clarifient la chaleur et assèchent l'humidité"
  },
  {
    "id": "CHU4",
    "code": "CHU4",
    "classCode": "CHU",
    "classe": "SM qui clarifient la Chaleur et assèchent l’Humidité",
    "classeIndex": "CLARIFIENT LA CHALEUR ET\nASSÈCHENT L’HUMIDITÉ",
    "pinyin": "Kǔ shēn",
    "pinyinSansTons": "Ku Shen",
    "hanzi": "苦参",
    "nom": "Racine séchée du sophora à fleurs jaunes",
    "nature": "Froid",
    "saveur": "Amer",
    "tropisme": "Foie, Reins, Vessie, Gros Intestin, Estomac, Cœur",
    "posologie": "3 -10 g",
    "actions": [
      "Clarifier la chaleur",
      "Assécher l’humidité",
      "Tuer les parasites",
      "Faire s’écouler les urines"
    ],
    "esprit": "Clarifie la chaleur, assèche l'humidité (action générale\npuissante)",
    "prioritaire": false,
    "source": {
      "workbookSheet": "CHU",
      "detailTable": "CHU"
    }
  },
  {
    "id": "CHU5",
    "code": "CHU5",
    "classCode": "CHU",
    "classe": "SM qui clarifient la Chaleur et assèchent l’Humidité",
    "classeIndex": "CLARIFIENT LA CHALEUR ET\nASSÈCHENT L’HUMIDITÉ",
    "pinyin": "Lóng dǎn cǎo",
    "pinyinSansTons": "Long Dan Cao",
    "hanzi": "龙胆草",
    "nom": "Racine séché de gentiane",
    "nature": "Froid",
    "saveur": "Amer",
    "tropisme": "Foie, VB, Vessie",
    "posologie": "3 à 6 g en décoction.",
    "actions": [
      "Clarifier la chaleur",
      "Assécher l’humidité",
      "Purger le feu du foie et de la vésicule biliaire",
      "Éliminer l’humidité chaleur du foyer inférieur"
    ],
    "esprit": "Clarifie la chaleur, assèche l'humidité (Foie, VB)",
    "prioritaire": false,
    "source": {
      "workbookSheet": "CHU",
      "detailTable": "CHU"
    },
    "incompleteFields": []
  },
  {
    "id": "CS1",
    "code": "CS1",
    "classCode": "CS",
    "classe": "SM qui clarifient la Chaleur et rafraîchissent le Sang",
    "classeIndex": "CLARIFIENT LA CHALEUR ET RAFRAICHISSENT LE SANG",
    "pinyin": "Chì sháo",
    "pinyinSansTons": "Chi Shao",
    "hanzi": "赤芍",
    "nom": "Racine séchée de Pivoine de Chine et de Veitch",
    "nature": "Légèrement Froid",
    "saveur": "Amer",
    "tropisme": "Foie",
    "posologie": "4 à 10g",
    "actions": [
      "Clarifier la Chaleur",
      "Rafraîchir le Sang",
      "Disperser la Stase",
      "Arrêter la douleur",
      "Réduire le gonflement"
    ],
    "esprit": "Chaleur du sang avec stase de sang\nYeux rouges",
    "prioritaire": true,
    "source": {
      "workbookSheet": "CS",
      "detailTable": "CS"
    },
    "classeEssentielle": "SM qui clarifient la chaleur et rafraichissent le sang"
  },
  {
    "id": "CS2",
    "code": "CS2",
    "classCode": "CS",
    "classe": "SM qui clarifient la Chaleur et rafraîchissent le Sang",
    "classeIndex": "CLARIFIENT LA CHALEUR ET RAFRAICHISSENT LE SANG",
    "pinyin": "Mǔ dān pí",
    "pinyinSansTons": "Mu Dan Pi",
    "hanzi": "牡丹皮",
    "nom": "Ecorce de la racine séchée de la pivoine arbustive",
    "nature": "Légèrement Froid",
    "saveur": "Amer, Piquant",
    "tropisme": "Cœur, Foie, Reins",
    "posologie": "6 à 9g",
    "actions": [
      "Clarifier la Chaleur",
      "Rafraîchir le Sang",
      "Disperser la Stase",
      "Activer le Sang"
    ],
    "esprit": "Chaleur du sang avec stase de sang\nChaleur vide",
    "prioritaire": true,
    "source": {
      "workbookSheet": "CS",
      "detailTable": "CS"
    },
    "classeEssentielle": "SM qui clarifient la chaleur et rafraichissent le sang"
  },
  {
    "id": "CS3",
    "code": "CS3",
    "classCode": "CS",
    "classe": "SM qui clarifient la Chaleur et rafraîchissent le Sang",
    "classeIndex": "CLARIFIENT LA CHALEUR ET RAFRAICHISSENT LE SANG",
    "pinyin": "Shēng dì huáng",
    "pinyinSansTons": "Sheng Di Huang",
    "hanzi": "生地黄",
    "nom": "Racine fraîche ou séchée de Rhemmania glutinosa",
    "nature": "Froid",
    "saveur": "Doux, Amer",
    "tropisme": "Cœur, Foie, Reins",
    "posologie": "10 à 30g",
    "actions": [
      "Clarifier la Chaleur",
      "Rafraîchir le Sang",
      "Nourrir le Yin",
      "Engendrer les liquides",
      "Tonifier le Sang"
    ],
    "esprit": "Chaleur (plénitude, vide, sang)\nNutrition (yin, liquides, sang)",
    "prioritaire": false,
    "source": {
      "workbookSheet": "CS",
      "detailTable": "CS"
    }
  },
  {
    "id": "CS4",
    "code": "CS4",
    "classCode": "CS",
    "classe": "SM qui clarifient la Chaleur et rafraîchissent le Sang",
    "classeIndex": "CLARIFIENT LA CHALEUR ET RAFRAICHISSENT LE SANG",
    "pinyin": "Xuán shēn",
    "pinyinSansTons": "Xuan Shen",
    "hanzi": "玄参",
    "nom": "Racine séchée de la scrofulaire de Ningbo",
    "nature": "Froid",
    "saveur": "Doux, Amer, Salé",
    "tropisme": "Poumon, Estomac, Reins",
    "posologie": "9 à 15g",
    "actions": [
      "Clarifier la Chaleur",
      "Rafraîchir le Sang",
      "Nourrir le Yin",
      "Engendrer les liquides",
      "Neutraliser la toxine",
      "Assouplir la gorge",
      "Purger le Feu",
      "Eliminer la dysphorie"
    ],
    "esprit": "Gorge (chaleur toxique et masse douloureuse)\nChaleur vide (poumon, estomac, reins)",
    "prioritaire": false,
    "source": {
      "workbookSheet": "CS",
      "detailTable": "CS"
    }
  },
  {
    "id": "CS5",
    "code": "CS5",
    "classCode": "CS",
    "classe": "SM qui clarifient la Chaleur et rafraîchissent le Sang",
    "classeIndex": "CLARIFIENT LA CHALEUR ET RAFRAICHISSENT LE SANG",
    "pinyin": "Zǐ cǎo",
    "pinyinSansTons": "Zi Cao",
    "hanzi": "紫草",
    "nom": "Racine séchée du Grémil",
    "nature": "Froid",
    "saveur": "Amer",
    "tropisme": "EC, Foie",
    "posologie": "3 à 9g",
    "actions": [
      "Clarifier la Chaleur",
      "Rafraîchir le Sang",
      "Activer le Sang",
      "Neutraliser la toxine"
    ],
    "esprit": "Dermatoses (chaleur du sang)\nBrûlures",
    "prioritaire": true,
    "source": {
      "workbookSheet": "CS",
      "detailTable": "CS"
    },
    "classeEssentielle": "SM qui clarifient la chaleur et rafraichissent le sang"
  },
  {
    "id": "CSS1",
    "code": "CSS1",
    "classCode": "CSS",
    "classe": "SM qui activent la circulation sanguine et éliminent la stase de Sang",
    "classeIndex": "ACTIVENT LA CIRCULATION SANGUINE ET ELIMINENT LA STASE DE SANG",
    "pinyin": "Chuān xiōng",
    "pinyinSansTons": "Chuan Xiong",
    "hanzi": "川芎",
    "nom": "Rhizome séché de la livèche du Sichuan",
    "nature": "Tiède",
    "saveur": "Piquant",
    "tropisme": "Foie, VB, EC",
    "posologie": "1 à 10g",
    "actions": [
      "Activer le Sang",
      "Arrêter la douleur",
      "Mobiliser le Qi",
      "Ouvrir la surpression",
      "Expulser le Vent",
      "Assécher l'Humidité"
    ],
    "esprit": "Stases de sang en général\nCéphalées, cerveau (stase de sang)\nObstructions bì (vent froid humidité)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "CSS",
      "detailTable": "CSS"
    },
    "classeEssentielle": "SM qui activent la circulation sanguine"
  },
  {
    "id": "CSS2",
    "code": "CSS2",
    "classCode": "CSS",
    "classe": "SM qui activent la circulation sanguine et éliminent la stase de Sang",
    "classeIndex": "ACTIVENT LA CIRCULATION SANGUINE ET ELIMINENT LA STASE DE SANG",
    "pinyin": "Dán shēn",
    "pinyinSansTons": "Dan Shen",
    "hanzi": "丹参",
    "nom": "Racine et rhizome séchés de la sauge rouge ou chinoise",
    "nature": "Légèrement froid",
    "saveur": "Amer",
    "tropisme": "Cœur, EC, Foie",
    "posologie": "9 à 15g",
    "actions": [
      "Activer le Sang",
      "Arrêter la douleur",
      "Expulser la Stase",
      "Harmoniser les règles",
      "Rafraîchir le Sang",
      "Dissiper l'abcès",
      "Clarifier le Cœur",
      "Calmer le Shen",
      "Eliminer la dysphorie"
    ],
    "esprit": "Stases de sang (chaleur)\nCœur-esprit (chaleur)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "CSS",
      "detailTable": "CSS"
    },
    "classeEssentielle": "SM qui activent la circulation sanguine"
  },
  {
    "id": "CSS3",
    "code": "CSS3",
    "classCode": "CSS",
    "classe": "SM qui activent la circulation sanguine et éliminent la stase de Sang",
    "classeIndex": "ACTIVENT LA CIRCULATION SANGUINE ET ELIMINENT LA STASE DE SANG",
    "pinyin": "É zhú",
    "pinyinSansTons": "E Zhu",
    "hanzi": "莪术",
    "nom": "Rhizome du curcuma zéodaire",
    "nature": "Tiède",
    "saveur": "Piquant, Amer",
    "tropisme": "Foie, Rate",
    "posologie": "3 à 10g",
    "actions": [
      "Arrêter la douleur",
      "Mobiliser le Qi",
      "Expulser la Stase",
      "Casser le Sang",
      "Réduire la masse"
    ],
    "esprit": "Masses abdominales\nDésordres gynécologiques et digestifs (stagnation de qi, stase\nde sang)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "CSS",
      "detailTable": "CSS"
    },
    "classeEssentielle": "SM qui activent la circulation sanguine"
  },
  {
    "id": "CSS4",
    "code": "CSS4",
    "classCode": "CSS",
    "classe": "SM qui activent la circulation sanguine et éliminent la stase de Sang",
    "classeIndex": "ACTIVENT LA CIRCULATION SANGUINE ET ELIMINENT LA STASE DE SANG",
    "pinyin": "Hóng huā",
    "pinyinSansTons": "Hong Hua",
    "hanzi": "红花",
    "nom": "Fleur séchée de carthame",
    "nature": "Tiède",
    "saveur": "Piquant",
    "tropisme": "Cœur, Foie",
    "posologie": "3 à 10g",
    "actions": [
      "Activer le Sang",
      "Arrêter la douleur",
      "Expulser la Stase",
      "Débloquer les règles"
    ],
    "esprit": "Stases de sang en général\nDésordres gynécologiques (stase de sang)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "CSS",
      "detailTable": "CSS"
    },
    "classeEssentielle": "SM qui activent la circulation sanguine"
  },
  {
    "id": "CSS5",
    "code": "CSS5",
    "classCode": "CSS",
    "classe": "SM qui activent la circulation sanguine et éliminent la stase de Sang",
    "classeIndex": "ACTIVENT LA CIRCULATION SANGUINE ET ELIMINENT LA STASE DE SANG",
    "pinyin": "Jī xuè téng",
    "pinyinSansTons": "Ji Xue Teng",
    "hanzi": "鸡血藤",
    "nom": "Tige de spatholobus suberectus",
    "nature": "Tiède",
    "saveur": "Amer, Légèrement doux",
    "tropisme": "Cœur, Rate, Foie",
    "posologie": "10 à 30g",
    "actions": [
      "Mobiliser le Sang",
      "Tonifier le Sang",
      "Enrichir le Sang",
      "Harmoniser les règles",
      "Détendre les tendons",
      "Activer les liaisons"
    ],
    "esprit": "Stase de sang avec vide de sang",
    "prioritaire": true,
    "source": {
      "workbookSheet": "CSS",
      "detailTable": "CSS"
    },
    "classeEssentielle": "SM qui activent la circulation sanguine"
  },
  {
    "id": "CSS6",
    "code": "CSS6",
    "classCode": "CSS",
    "classe": "SM qui activent la circulation sanguine et éliminent la stase de Sang",
    "classeIndex": "ACTIVENT LA CIRCULATION SANGUINE ET ELIMINENT LA STASE DE SANG",
    "pinyin": "Jiāng huáng",
    "pinyinSansTons": "Jiang Huang",
    "hanzi": "姜黄",
    "nom": "Rhizome du curcuma long ou safran des îles",
    "nature": "Tiède",
    "saveur": "Piquant, Amer",
    "tropisme": "Rate, Foie",
    "posologie": "3 à 10g",
    "actions": [
      "Arrêter la douleur",
      "Mobiliser le Qi",
      "Casser le Sang",
      "Désobstruer les canaux"
    ],
    "esprit": "Stases de sang dans tout le tronc\nEpaule, bras (obstruction bi par froid humidité)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "CSS",
      "detailTable": "CSS"
    },
    "classeEssentielle": "SM qui activent la circulation sanguine"
  },
  {
    "id": "CSS7",
    "code": "CSS7",
    "classCode": "CSS",
    "classe": "SM qui activent la circulation sanguine et éliminent la stase de Sang",
    "classeIndex": "ACTIVENT LA CIRCULATION SANGUINE ET ELIMINENT LA STASE DE SANG",
    "pinyin": "Mò yào",
    "pinyinSansTons": "Mo Yao",
    "hanzi": "没药",
    "nom": "Myrrhe",
    "nature": "Neutre / Equilibré",
    "saveur": "Amer",
    "tropisme": "Foie, Cœur, Rate",
    "posologie": "3 à 10g",
    "actions": [
      "Activer le Sang",
      "Arrêter la douleur",
      "Expulser la Stase",
      "Disperser le Sang",
      "Réduire le gonflement",
      "Régénérer les tissus"
    ],
    "esprit": "Stases de sang (traumatismes, régénération tissulaire)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "CSS",
      "detailTable": "CSS"
    },
    "classeEssentielle": "SM qui activent la circulation sanguine"
  },
  {
    "id": "CSS8",
    "code": "CSS8",
    "classCode": "CSS",
    "classe": "SM qui activent la circulation sanguine et éliminent la stase de Sang",
    "classeIndex": "ACTIVENT LA CIRCULATION SANGUINE ET ELIMINENT LA STASE DE SANG",
    "pinyin": "Niú xī",
    "pinyinSansTons": "Niu Xi",
    "hanzi": "牛膝",
    "nom": "Racine d'Achyrantes Bidentata",
    "nature": "Neutre / Equilibré",
    "saveur": "Amer, Acide",
    "tropisme": "Foie, Rein",
    "posologie": "5 à 15g",
    "actions": [
      "Activer le Sang",
      "Expulser la Stase",
      "Renforcer les tendons",
      "Renforcer les os",
      "Tonifier le Foie",
      "Tonifier les Reins",
      "Favoriser les urines",
      "Dégager la strangurie",
      "Faire descendre le Feu et le Sang"
    ],
    "esprit": "Douleurs dans le bas du corps (stases de sang, vide du foie et\ndes reins)\nHémorragies dans le haut du corps (chaleur)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "CSS",
      "detailTable": "CSS"
    },
    "classeEssentielle": "SM qui activent la circulation sanguine"
  },
  {
    "id": "CSS9",
    "code": "CSS9",
    "classCode": "CSS",
    "classe": "SM qui activent la circulation sanguine et éliminent la stase de Sang",
    "classeIndex": "ACTIVENT LA CIRCULATION SANGUINE ET ELIMINENT LA STASE DE SANG",
    "pinyin": "Rǔ xiāng",
    "pinyinSansTons": "Ru Xiang",
    "hanzi": "乳香",
    "nom": "Ecorce de l'arbre à encens",
    "nature": "Légèrement tiède",
    "saveur": "Piquant, Amer",
    "tropisme": "Cœur, Foie",
    "posologie": "3 à 10g",
    "actions": [
      "Activer le Sang",
      "Arrêter la douleur",
      "Mobiliser le Qi",
      "Réduire le gonflement",
      "Régénérer les tissus",
      "Neutraliser la toxine"
    ],
    "esprit": "Stases de sang (douleurs, traumatismes, régénération tissulaire)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "CSS",
      "detailTable": "CSS"
    },
    "classeEssentielle": "SM qui activent la circulation sanguine"
  },
  {
    "id": "CSS10",
    "code": "CSS10",
    "classCode": "CSS",
    "classe": "SM qui activent la circulation sanguine et éliminent la stase de Sang",
    "classeIndex": "ACTIVENT LA CIRCULATION SANGUINE ET ELIMINENT LA STASE DE SANG",
    "pinyin": "Sān léng",
    "pinyinSansTons": "San Leng",
    "hanzi": "三棱",
    "nom": "Tubercule séché du sparganium stoloniferum",
    "nature": "Neutre / Equilibré",
    "saveur": "Amer, Piquant",
    "tropisme": "Rate, Foie",
    "posologie": "5 à 10g",
    "actions": [
      "Arrêter la douleur",
      "Mobiliser le Qi",
      "Casser le Sang",
      "Dissiper l'accumulation"
    ],
    "esprit": "Système digestif (stagnation de qi et/ou d’aliments, stase de, sang)\nUtérus (stagnation de qi, stase de sang)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "CSS",
      "detailTable": "CSS"
    },
    "classeEssentielle": "SM qui activent la circulation sanguine"
  },
  {
    "id": "CSS11",
    "code": "CSS11",
    "classCode": "CSS",
    "classe": "SM qui activent la circulation sanguine et éliminent la stase de Sang",
    "classeIndex": "ACTIVENT LA CIRCULATION SANGUINE ET ELIMINENT LA STASE DE SANG",
    "pinyin": "Táo rén",
    "pinyinSansTons": "Tao Ren",
    "hanzi": "桃仁",
    "nom": "Amande séchée du noyau de pêche",
    "nature": "Neutre / Equilibré, Légèrement toxique",
    "saveur": "Doux, Amer",
    "tropisme": "Cœur, Foie, Poumon, GI",
    "posologie": "4,5 à 9g",
    "actions": [
      "Activer le Sang",
      "Expulser la Stase",
      "Humidifier la Sécheresse",
      "Humecter les Intestins",
      "Désobstruer les selles"
    ],
    "esprit": "Stases de sang\nPoumon et gros intestin\nConstipation (vide de sang)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "CSS",
      "detailTable": "CSS"
    },
    "classeEssentielle": "SM qui activent la circulation sanguine"
  },
  {
    "id": "CSS12",
    "code": "CSS12",
    "classCode": "CSS",
    "classe": "SM qui activent la circulation sanguine et éliminent la stase de Sang",
    "classeIndex": "ACTIVENT LA CIRCULATION SANGUINE ET ELIMINENT LA STASE DE SANG",
    "pinyin": "Yán hú suǒ",
    "pinyinSansTons": "Yan Hu Suo",
    "hanzi": "延胡索",
    "nom": "Tubercule séché de la corydale yanhusuo",
    "nature": "Tiède",
    "saveur": "Piquant, Amer",
    "tropisme": "Foie, Esto., Rate, Cœur, Poumon",
    "posologie": "5 à 9g",
    "actions": [
      "Activer le Sang",
      "Arrêter la douleur",
      "Mobiliser le Qi",
      "Expulser la Stase"
    ],
    "esprit": "Douleurs (stase de sang)\nPuissant antalgique",
    "prioritaire": true,
    "source": {
      "workbookSheet": "CSS",
      "detailTable": "CSS"
    },
    "classeEssentielle": "SM qui activent la circulation sanguine"
  },
  {
    "id": "CSS13",
    "code": "CSS13",
    "classCode": "CSS",
    "classe": "SM qui activent la circulation sanguine et éliminent la stase de Sang",
    "classeIndex": "ACTIVENT LA CIRCULATION SANGUINE ET ELIMINENT LA STASE DE SANG",
    "pinyin": "Yì mǔ cǎo",
    "pinyinSansTons": "Yi Mu Cao",
    "hanzi": "益母草",
    "nom": "Partie aérienne de l'Agripaume du Japon",
    "nature": "Légèrement froid",
    "saveur": "Piquant, Amer",
    "tropisme": "Foie, EC, Cœur, Vessie",
    "posologie": "10 à 15g",
    "actions": [
      "Activer le Sang",
      "Expulser la Stase",
      "Harmoniser les règles",
      "Réduire le gonflement",
      "Favoriser les urines"
    ],
    "esprit": "Stases de sang, gynécologie, œdèmes avec chaleur",
    "prioritaire": true,
    "source": {
      "workbookSheet": "CSS",
      "detailTable": "CSS"
    },
    "classeEssentielle": "SM qui activent la circulation sanguine"
  },
  {
    "id": "CSS14",
    "code": "CSS14",
    "classCode": "CSS",
    "classe": "SM qui activent la circulation sanguine et éliminent la stase de Sang",
    "classeIndex": "ACTIVENT LA CIRCULATION SANGUINE ET ELIMINENT LA STASE DE SANG",
    "pinyin": "Yù jīn",
    "pinyinSansTons": "Yu Jin",
    "hanzi": "郁金",
    "nom": "Racines tubéreuses de plusieurs curcuma",
    "nature": "Froid",
    "saveur": "Piquant, Amer",
    "tropisme": "Cœur, Foie, VB",
    "posologie": "3 à 10g",
    "actions": [
      "Activer le Sang",
      "Arrêter la douleur",
      "Mobiliser le Qi",
      "Rafraîchir le Sang",
      "Clarifier le Cœur",
      "Libérer la surpression",
      "Favoriser la VB et faire reculer le jaune"
    ],
    "esprit": "Douleur RTL, gynécologie (stagnation de qi et stase de sang\navec chaleur)\nHémorragies (chaleur avec ou sans stase)\nIctère yang (humidité chaleur F/VB)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "CSS",
      "detailTable": "CSS"
    },
    "classeEssentielle": "SM qui activent la circulation sanguine"
  },
  {
    "id": "CT1",
    "code": "CT1",
    "classCode": "CT",
    "classe": "SM qui clarifient la Chaleur et éliminent la Toxine",
    "classeIndex": "CLARIFIENT LA CHALEUR ET ELIMINENT LA TOXINE",
    "pinyin": "Bái tóu wēng",
    "pinyinSansTons": "Bai Tou Weng",
    "hanzi": "白头翁",
    "nom": "Racine séchée de la pulsatile chinoise",
    "nature": "Froid",
    "saveur": "Amer",
    "tropisme": "Estomac, GI",
    "posologie": "15 à 30g",
    "actions": [
      "Clarifier la Chaleur",
      "Neutraliser la toxine",
      "Rafraîchir le Sang",
      "Arrêter la dysenterie"
    ],
    "esprit": "Diarrhée, dysenterie, troubles cutanés (humidité\nchaleur/chaleur toxique)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "CT",
      "detailTable": "CT"
    },
    "classeEssentielle": "SM qui clarifient la chaleur et éliminent la toxine"
  },
  {
    "id": "CT2",
    "code": "CT2",
    "classCode": "CT",
    "classe": "SM qui clarifient la Chaleur et éliminent la Toxine",
    "classeIndex": "CLARIFIENT LA CHALEUR ET ELIMINENT LA TOXINE",
    "pinyin": "Bǎn lán gēn",
    "pinyinSansTons": "Ban Lan Gen",
    "hanzi": "板蓝根",
    "nom": "Racine séchée de la Guède",
    "nature": "Froid",
    "saveur": "Amer",
    "tropisme": "Cœur, Estomac",
    "posologie": "15 à 120g",
    "actions": [
      "Clarifier la Chaleur",
      "Neutraliser la toxine",
      "Rafraîchir le Sang",
      "Assouplir la gorge"
    ],
    "esprit": "Gorge, tête, visage (chaleur toxique)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "CT",
      "detailTable": "CT"
    },
    "classeEssentielle": "SM qui clarifient la chaleur et éliminent la toxine"
  },
  {
    "id": "CT3",
    "code": "CT3",
    "classCode": "CT",
    "classe": "SM qui clarifient la Chaleur et éliminent la Toxine",
    "classeIndex": "CLARIFIENT LA CHALEUR ET ELIMINENT LA TOXINE",
    "pinyin": "Jīn yín huā",
    "pinyinSansTons": "Jin Yin Hua",
    "hanzi": "金银花",
    "nom": "Bourgeon ou 1ère fleur de 4 esp. De chèvrefeuille",
    "nature": "Froid",
    "saveur": "Doux",
    "tropisme": "Poumon, Estomac, Cœur, (GI)",
    "posologie": "10 à 20g",
    "actions": [
      "Clarifier la Chaleur",
      "Neutraliser la toxicité",
      "Disperser le Vent Chaleur",
      "Libérer la Canicule"
    ],
    "esprit": "Maladies de la chaleur (tous les stades)\nPeau, gorge, gros intestin (chaleur toxique)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "CT",
      "detailTable": "CT"
    },
    "classeEssentielle": "SM qui clarifient la chaleur et éliminent la toxine"
  },
  {
    "id": "CT4",
    "code": "CT4",
    "classCode": "CT",
    "classe": "SM qui clarifient la Chaleur et éliminent la Toxine",
    "classeIndex": "CLARIFIENT LA CHALEUR ET ELIMINENT LA TOXINE",
    "pinyin": "Lián qiào",
    "pinyinSansTons": "Lian Qiao",
    "hanzi": "连翘",
    "nom": "Fruit séché du Forsythia à fleurs pendantes",
    "nature": "Légèrement Froid",
    "saveur": "Amer",
    "tropisme": "Poumon, Cœur, IG, VB",
    "posologie": "6 à 15g",
    "actions": [
      "Clarifier la Chaleur",
      "Neutraliser la toxicité",
      "Disperser le Vent Chaleur",
      "Dissiper l'abcès",
      "Dissiper le gonflement",
      "Disperser la nouure"
    ],
    "esprit": "Nodules, masses, tumeurs, abcès (chaleur toxique)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "CT",
      "detailTable": "CT"
    },
    "classeEssentielle": "SM qui clarifient la chaleur et éliminent la toxine"
  },
  {
    "id": "CT5",
    "code": "CT5",
    "classCode": "CT",
    "classe": "SM qui clarifient la Chaleur et éliminent la Toxine",
    "classeIndex": "CLARIFIENT LA CHALEUR ET ELIMINENT LA TOXINE",
    "pinyin": "Pú gōng yīng",
    "pinyinSansTons": "Pu Gong Ying",
    "hanzi": "蒲公英",
    "nom": "Plante entière séchée du pissenlit Mongol",
    "nature": "Froid",
    "saveur": "Amer, Doux",
    "tropisme": "Foie, Estomac",
    "posologie": "10 à 60g",
    "actions": [
      "Clarifier la Chaleur",
      "Neutraliser la toxicité",
      "Disperser la nouure",
      "Favoriser les urines"
    ],
    "esprit": "Inflammations cutanées, abcès internes et externes (chaleur\ntoxine)\nIctère, troubles urinaires (humidité chaleur)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "CT",
      "detailTable": "CT"
    },
    "classeEssentielle": "SM qui clarifient la chaleur et éliminent la toxine"
  },
  {
    "id": "CT6",
    "code": "CT6",
    "classCode": "CT",
    "classe": "SM qui clarifient la Chaleur et éliminent la Toxine",
    "classeIndex": "CLARIFIENT LA CHALEUR ET ELIMINENT LA TOXINE",
    "pinyin": "Shè gān",
    "pinyinSansTons": "She Gan",
    "hanzi": "射干",
    "nom": "Rhizome séché de la fleur de léopard",
    "nature": "Froid",
    "saveur": "Amer",
    "tropisme": "Poumon, Foie",
    "posologie": "5 à 10g",
    "actions": [
      "Neutraliser la toxine",
      "Purger le Feu",
      "Disperser le Sang",
      "Dissiper les mucosités"
    ],
    "esprit": "Gorge, poumon (chaleur toxine avec mucosités)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "CT",
      "detailTable": "CT"
    },
    "classeEssentielle": "SM qui clarifient la chaleur et éliminent la toxine"
  },
  {
    "id": "CT7",
    "code": "CT7",
    "classCode": "CT",
    "classe": "SM qui clarifient la Chaleur et éliminent la Toxine",
    "classeIndex": "CLARIFIENT LA CHALEUR ET ELIMINENT LA TOXINE",
    "pinyin": "Yú xīng cǎo",
    "pinyinSansTons": "Yu Xing Cao",
    "hanzi": "鱼腥草",
    "nom": "Partie aérienne ou fraîche de l'herbe à poivre",
    "nature": "Froid",
    "saveur": "Piquant",
    "tropisme": "Foie, Poumon, (GI)",
    "posologie": "15 à 25g",
    "actions": [
      "Clarifier la Chaleur",
      "Neutraliser la toxicité",
      "Dissiper l'abcès",
      "Favoriser les urines",
      "Dégager la strangurie",
      "Expulser le pus"
    ],
    "esprit": "Abcès du poumon\nSécrétions du foyer inférieur (chaleur (humidité) toxique)",
    "prioritaire": false,
    "source": {
      "workbookSheet": "CT",
      "detailTable": "CT"
    }
  },
  {
    "id": "CT8",
    "code": "CT8",
    "classCode": "CT",
    "classe": "SM qui clarifient la Chaleur et éliminent la Toxine",
    "classeIndex": "CLARIFIENT LA CHALEUR ET ELIMINENT LA TOXINE",
    "pinyin": "Zǐ huā dì dīng",
    "pinyinSansTons": "Zi Hua Di Ding",
    "hanzi": "紫花地丁",
    "nom": "Plante entière séchée d'une violette",
    "nature": "Froid",
    "saveur": "Amer, Piquant",
    "tropisme": "Cœur, Foie",
    "posologie": "15 à 30g",
    "actions": [
      "Clarifier la Chaleur",
      "Rafraîchir le Sang",
      "Neutraliser la toxicité",
      "Dissiper l'abcès",
      "Dissiper le gonflement",
      "Disperser la nouure"
    ],
    "esprit": "Affections cutanées (chaleur toxine dans la couche du sang)",
    "prioritaire": false,
    "source": {
      "workbookSheet": "CT",
      "detailTable": "CT"
    }
  },
  {
    "id": "CV1",
    "code": "CV1",
    "classCode": "CV",
    "classe": "SM qui clarifient et font baisser la Chaleur Vide",
    "classeIndex": "CLARIFIENT ET FONT BAISSER LA CHALEUR VIDE [CV]",
    "pinyin": "Dì gǔ pí",
    "pinyinSansTons": "Di Gu Pi",
    "hanzi": "地骨皮",
    "nom": "Ecorce de la racine du lyciet (Goji)",
    "nature": "Froid",
    "saveur": "Doux, Fade / insipide",
    "tropisme": "Poumon, Reins, Foie",
    "posologie": "9 à 30g",
    "actions": [
      "Clarfier la Chaleur vide",
      "Clarifier le Poumon",
      "Faire descendre le Feu",
      "Rafraîchir le Sang",
      "Faire reculer l'évapration des os"
    ],
    "esprit": "Chaleur (vide de yin)\nSaignements (chaleur du sang)\nToux (chaleur du poumon)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "CV",
      "detailTable": "CV"
    },
    "classeEssentielle": "SM qui clarifient la chaleur vide"
  },
  {
    "id": "CV2",
    "code": "CV2",
    "classCode": "CV",
    "classe": "SM qui clarifient et font baisser la Chaleur Vide",
    "classeIndex": "CLARIFIENT ET FONT BAISSER LA CHALEUR VIDE [CV]",
    "pinyin": "Qīng hāo",
    "pinyinSansTons": "Qing Hao",
    "hanzi": "青蒿",
    "nom": "Partie aérienne de 2 armoises",
    "nature": "Froid",
    "saveur": "Amer, Légèrement piquant",
    "tropisme": "Foie, VB",
    "posologie": "6 à 15g",
    "actions": [
      "Clarifier la Chaleur",
      "Faire reculer l'évapration des os",
      "Libérer la canicule",
      "Stopper le paludisme"
    ],
    "esprit": "Paludisme avec alternance fièvre/frissons\nCanicule\nJaunisse (humidité chaleur F/VB ou Rt/E)\nLésion des liquides (chaleur)",
    "prioritaire": false,
    "source": {
      "workbookSheet": "CV",
      "detailTable": "CV"
    }
  },
  {
    "id": "EH1",
    "code": "EH1",
    "classCode": "EH",
    "classe": "SM qui favorisent l’élimination de l’Eau et font s’excréter l’Humidité",
    "classeIndex": "FAVORISENT L'ELIMINATION DE L'EAU ET FONT S'EXCRETER L'HUMIDITE",
    "pinyin": "Chē qián zǐ",
    "pinyinSansTons": "Che Qian Zi",
    "hanzi": "车前子",
    "nom": "Graine mûre du plantain asiatique",
    "nature": "Froid",
    "saveur": "Doux",
    "tropisme": "Rein, Vessie, Foie, Poumon",
    "posologie": "5 à 15g",
    "actions": [
      "Faire s'écouler l'eau",
      "Dégager a strangurie",
      "Exsuder l'Hulidité",
      "Arrêter la diarrhée",
      "Clarifier le Foie",
      "Eclaircir les yeux",
      "Clarifier le Poumon",
      "Transformer l'Humidité"
    ],
    "esprit": "Clarifie la chaleur, fait s'écouler l’humidité (vessie, GI, poumon, yeux)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "EH",
      "detailTable": "EH"
    },
    "classeEssentielle": "SM qui favorisent [l'élimination de] l'eau et font s'excréter l'humidité"
  },
  {
    "id": "EH2",
    "code": "EH2",
    "classCode": "EH",
    "classe": "SM qui favorisent l’élimination de l’Eau et font s’excréter l’Humidité",
    "classeIndex": "FAVORISENT L'ELIMINATION DE L'EAU ET FONT S'EXCRETER L'HUMIDITE",
    "pinyin": "Chì xiǎo dòu",
    "pinyinSansTons": "Chi Xiao Dou",
    "hanzi": "赤小豆",
    "nom": "Haricot Azuki",
    "nature": "Neutre / Equilibré",
    "saveur": "Doux, Acide",
    "tropisme": "Cœur, IG",
    "posologie": "10 à 30g",
    "actions": [
      "Faire s'écouler l'eau",
      "Eliminer l'Humidité",
      "Harmoniser le Sang",
      "Expulser le pus",
      "Réduire la tuméfaction",
      "Neutraliser la toxicité"
    ],
    "esprit": "Humidité peau (œdème, jaunisse, abcès, furoncles)\nAbcès intestinal",
    "prioritaire": true,
    "source": {
      "workbookSheet": "EH",
      "detailTable": "EH"
    },
    "classeEssentielle": "SM qui favorisent [l'élimination de] l'eau et font s'excréter l'humidité"
  },
  {
    "id": "EH3",
    "code": "EH3",
    "classCode": "EH",
    "classe": "SM qui favorisent l’élimination de l’Eau et font s’excréter l’Humidité",
    "classeIndex": "FAVORISENT L'ELIMINATION DE L'EAU ET FONT S'EXCRETER L'HUMIDITE",
    "pinyin": "Fú líng",
    "pinyinSansTons": "Fu Ling",
    "hanzi": "茯苓",
    "nom": "Partie blanche du champignon pachyme",
    "nature": "Neutre / Equilibré",
    "saveur": "Doux, Fade/Insipide",
    "tropisme": "Cœur, Rate, Poumon, Rein",
    "posologie": "10 à 15g",
    "actions": [
      "Faire s'écouler l'eau",
      "Exsuder l'Hulidité",
      "Soutenir la Rate",
      "Harmoniser l'Estomac",
      "Tranquiliser le cœur",
      "Calmer le Shen"
    ],
    "esprit": "Humidité dans tout le corps (et/ou mucosités)\nRate, Esprit",
    "prioritaire": true,
    "source": {
      "workbookSheet": "EH",
      "detailTable": "EH"
    },
    "classeEssentielle": "SM qui favorisent [l'élimination de] l'eau et font s'excréter l'humidité"
  },
  {
    "id": "EH4",
    "code": "EH4",
    "classCode": "EH",
    "classe": "SM qui favorisent l’élimination de l’Eau et font s’excréter l’Humidité",
    "classeIndex": "FAVORISENT L'ELIMINATION DE L'EAU ET FONT S'EXCRETER L'HUMIDITE",
    "pinyin": "Huá shí",
    "pinyinSansTons": "Hua Shi",
    "hanzi": "滑石",
    "nom": "Talc",
    "nature": "Froid",
    "saveur": "Doux, Fade/Insipide",
    "tropisme": "Vessie, Poumon, Estomac",
    "posologie": "10 à 20g",
    "actions": [
      "Faire s'écouler l'eau",
      "Dégager a strangurie",
      "Clarifier la Chaleur",
      "Libérer la Canicule",
      "Rassembler l'Humidité",
      "Refermer la plaie"
    ],
    "esprit": "Humidité chaleur (urines, selles, peau)\nCanicule (pervers humidité chaleur)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "EH",
      "detailTable": "EH"
    },
    "classeEssentielle": "SM qui favorisent [l'élimination de] l'eau et font s'excréter l'humidité"
  },
  {
    "id": "EH5",
    "code": "EH5",
    "classCode": "EH",
    "classe": "SM qui favorisent l’élimination de l’Eau et font s’excréter l’Humidité",
    "classeIndex": "FAVORISENT L'ELIMINATION DE L'EAU ET FONT S'EXCRETER L'HUMIDITE",
    "pinyin": "Mù tōng",
    "pinyinSansTons": "Mu Tong",
    "hanzi": "木通",
    "nom": "Tige sans écorce de l'Akébie à 5 feuilles",
    "nature": "Frais",
    "saveur": "Amer",
    "tropisme": "Cœur, IG, Vessie",
    "posologie": "3 à 6g",
    "actions": [
      "Purger le Feu",
      "Mobiliser l'eau",
      "Désobstruer les vaisseaux sanguins",
      "Favoriser les vaisseaux sanguins"
    ],
    "esprit": "Humidité chaleur de la vessie (par feu du cœur)\nHypogalactie",
    "prioritaire": true,
    "source": {
      "workbookSheet": "EH",
      "detailTable": "EH"
    },
    "classeEssentielle": "SM qui favorisent [l'élimination de] l'eau et font s'excréter l'humidité"
  },
  {
    "id": "EH6",
    "code": "EH6",
    "classCode": "EH",
    "classe": "SM qui favorisent l’élimination de l’Eau et font s’excréter l’Humidité",
    "classeIndex": "FAVORISENT L'ELIMINATION DE L'EAU ET FONT S'EXCRETER L'HUMIDITE",
    "pinyin": "Tōng cǎo",
    "pinyinSansTons": "Tong Cao",
    "hanzi": "通草",
    "nom": "Moelle des tiges de l'arabie à papier de Chine",
    "nature": "Légèrement Froid",
    "saveur": "Doux, Fade/Insipide",
    "tropisme": "Poumon, Estomac",
    "posologie": "3 à 6g",
    "actions": [
      "Clarifier la Chaleur",
      "Drainer le Poumon",
      "Faire s'écouler l'urine",
      "Désobstruer le Qi",
      "Favoriser la lactation"
    ],
    "esprit": "Humidité chaleur de la vessie\nAgalactie, hypogalactie",
    "prioritaire": false,
    "source": {
      "workbookSheet": "EH",
      "detailTable": "EH"
    }
  },
  {
    "id": "EH7",
    "code": "EH7",
    "classCode": "EH",
    "classe": "SM qui favorisent l’élimination de l’Eau et font s’excréter l’Humidité",
    "classeIndex": "FAVORISENT L'ELIMINATION DE L'EAU ET FONT S'EXCRETER L'HUMIDITE",
    "pinyin": "Yì yǐ rén",
    "pinyinSansTons": "Yi Yi Ren",
    "hanzi": "薏苡仁",
    "nom": "Graine mûre et séchée des larmes de Job",
    "nature": "Légèrement Froid",
    "saveur": "Doux, Fade/Insipide",
    "tropisme": "Rate, Poumon, Rein",
    "posologie": "10 à 30g",
    "actions": [
      "Faire s'écouler l'Humidité",
      "Clarifier la Chaleur",
      "Renforcer la Rate",
      "Tonifier le Poumon"
    ],
    "esprit": "Humidité (interne ou externe)",
    "prioritaire": false,
    "source": {
      "workbookSheet": "EH",
      "detailTable": "EH"
    }
  },
  {
    "id": "EH8",
    "code": "EH8",
    "classCode": "EH",
    "classe": "SM qui favorisent l’élimination de l’Eau et font s’excréter l’Humidité",
    "classeIndex": "FAVORISENT L'ELIMINATION DE L'EAU ET FONT S'EXCRETER L'HUMIDITE",
    "pinyin": "Yīn chén hāo",
    "pinyinSansTons": "Yin Chen Hao",
    "hanzi": "茵陈蒿",
    "nom": "Jeune pousse de l'armoise capillaire",
    "nature": "Légèrement Froid",
    "saveur": "Amer, Piquant",
    "tropisme": "Rate, Estomac, Foie, VB",
    "posologie": "10 à 15g",
    "actions": [
      "Faire s'écouler l'Humidité",
      "Clarifier la Chaleur",
      "Favoriser la Vésicule Biliaire",
      "Faire reculer le jaune"
    ],
    "esprit": "Ictère yang",
    "prioritaire": false,
    "source": {
      "workbookSheet": "EH",
      "detailTable": "EH"
    }
  },
  {
    "id": "EH9",
    "code": "EH9",
    "classCode": "EH",
    "classe": "SM qui favorisent l’élimination de l’Eau et font s’excréter l’Humidité",
    "classeIndex": "FAVORISENT L'ELIMINATION DE L'EAU ET FONT S'EXCRETER L'HUMIDITE",
    "pinyin": "Zé xiè",
    "pinyinSansTons": "Ze Xie",
    "hanzi": "泽泻",
    "nom": "Rhizome séché du plantain d'eau",
    "nature": "Froid",
    "saveur": "Doux",
    "tropisme": "Rein, Vessie",
    "posologie": "6 à 12g",
    "actions": [
      "Faire s'écouler l'eau",
      "Dégager a strangurie",
      "Exsuder l'Hulidité",
      "Purger la Chaleur"
    ],
    "esprit": "Humidité chaleur du FI",
    "prioritaire": true,
    "source": {
      "workbookSheet": "EH",
      "detailTable": "EH"
    },
    "classeEssentielle": "SM qui favorisent [l'élimination de] l'eau et font s'excréter l'humidité"
  },
  {
    "id": "EH10",
    "code": "EH10",
    "classCode": "EH",
    "classe": "SM qui favorisent l’élimination de l’Eau et font s’excréter l’Humidité",
    "classeIndex": "FAVORISENT L'ELIMINATION DE L'EAU ET FONT S'EXCRETER L'HUMIDITE",
    "pinyin": "Zhū líng",
    "pinyinSansTons": "Zhu Ling",
    "hanzi": "猪苓",
    "nom": "Champignon polypore en ombrelle ou poule des bois ou tripe de chêne",
    "nature": "Neutre / Equilibré",
    "saveur": "Doux, Fade/Insipide",
    "tropisme": "Rate, Rein, Poumon, Vessie",
    "posologie": "10 à 15g",
    "actions": [
      "Exsuder l'Hulidité",
      "Faire s'écouler l'urine"
    ],
    "esprit": "Humidité dans tout le corps",
    "prioritaire": true,
    "source": {
      "workbookSheet": "EH",
      "detailTable": "EH"
    },
    "classeEssentielle": "SM qui favorisent [l'élimination de] l'eau et font s'excréter l'humidité"
  },
  {
    "id": "FD1",
    "code": "FD1",
    "classCode": "FD",
    "classe": "SM qui favorisent la digestion",
    "classeIndex": "FAVORISENT LA DIGESTION",
    "pinyin": "Jī nèi jīn",
    "pinyinSansTons": "Ji Nei Jin",
    "hanzi": "鸡内金",
    "nom": "Membrane interne jaune du gésier de poulet",
    "nature": "Neutre / Equilibré",
    "saveur": "Doux",
    "tropisme": "Rate, Estomac, Reins, Vessie",
    "posologie": "1,5 à 10g",
    "actions": [
      "Renforcer l'Estomac",
      "Dissiper les aliments",
      "Affermir le Jing",
      "Arrêter la spermathorrée"
    ],
    "esprit": "",
    "prioritaire": false,
    "source": {
      "workbookSheet": "FD",
      "detailTable": "FD"
    }
  },
  {
    "id": "FD2",
    "code": "FD2",
    "classCode": "FD",
    "classe": "SM qui favorisent la digestion",
    "classeIndex": "FAVORISENT LA DIGESTION",
    "pinyin": "Lái fú zǐ",
    "pinyinSansTons": "Lai Fu Zi",
    "hanzi": "莱菔子",
    "nom": "Graine mûre et séchée du radis",
    "nature": "Neutre / Equilibré",
    "saveur": "Piquant, Doux",
    "tropisme": "Rate, Estomac, Poumon, GI",
    "posologie": "5 à 10g",
    "actions": [
      "Dissiper les aliments",
      "Faire descendre le Qi",
      "Apaiser la dyspnée",
      "Transformer les mucosités"
    ],
    "esprit": "",
    "prioritaire": false,
    "source": {
      "workbookSheet": "FD",
      "detailTable": "FD"
    }
  },
  {
    "id": "FD3",
    "code": "FD3",
    "classCode": "FD",
    "classe": "SM qui favorisent la digestion",
    "classeIndex": "FAVORISENT LA DIGESTION",
    "pinyin": "Mài yá",
    "pinyinSansTons": "Mai Ya",
    "hanzi": "麦芽",
    "nom": "Graine germée mûre et séchée de l'orge",
    "nature": "Neutre / Equilibré",
    "saveur": "Doux",
    "tropisme": "Rate, Estomac",
    "posologie": "10 à 120g",
    "actions": [
      "Ouvrir l'Estomac",
      "Renforcer la Rate",
      "Dissiper les aliments",
      "Mobiliser le Qi",
      "Diminuer le lait maternel",
      "Réduire la distension"
    ],
    "esprit": "",
    "prioritaire": false,
    "source": {
      "workbookSheet": "FD",
      "detailTable": "FD"
    }
  },
  {
    "id": "FD4",
    "code": "FD4",
    "classCode": "FD",
    "classe": "SM qui favorisent la digestion",
    "classeIndex": "FAVORISENT LA DIGESTION",
    "pinyin": "Shān zhā",
    "pinyinSansTons": "Shan Zha",
    "hanzi": "山楂",
    "nom": "Fruit mûr et séché de l'azerolier de Chine (espèce d'aubépine)",
    "nature": "Légèrement tiède",
    "saveur": "Acide, Doux",
    "tropisme": "Rate, Estomac, Foie",
    "posologie": "3 à 10g",
    "actions": [
      "Renforcer l'Estomac",
      "Dissiper les aliments",
      "Mobiliser le Qi",
      "Disperser la Stase",
      "Expulser le ténia"
    ],
    "esprit": "",
    "prioritaire": false,
    "source": {
      "workbookSheet": "FD",
      "detailTable": "FD"
    }
  },
  {
    "id": "FD5",
    "code": "FD5",
    "classCode": "FD",
    "classe": "SM qui favorisent la digestion",
    "classeIndex": "FAVORISENT LA DIGESTION",
    "pinyin": "Shén qū",
    "pinyinSansTons": "Shen Qu",
    "hanzi": "神曲",
    "nom": "Pâte médicinale fermentée de farine ou son de blé et de plantes",
    "nature": "Tiède",
    "saveur": "Doux, Piquant",
    "tropisme": "Rate, Estomac",
    "posologie": "10 à 15g",
    "actions": [
      "Harmoniser l'Estomac",
      "Renforcer la Rate",
      "Dissiper les aliments",
      "Régulariser le centre"
    ],
    "esprit": "",
    "prioritaire": false,
    "source": {
      "workbookSheet": "FD",
      "detailTable": "FD"
    }
  },
  {
    "id": "LD1",
    "code": "LD1",
    "classCode": "LD",
    "classe": "SM qui lubrifient et font descendre",
    "classeIndex": "LUBRIFIENT ET FONT DESCENDRE",
    "pinyin": "Huǒ má rén",
    "pinyinSansTons": "Huo Ma Ren",
    "hanzi": "火麻仁",
    "nom": "Graine de cannabis",
    "nature": "Neutre / Equilibré",
    "saveur": "Doux",
    "tropisme": "Rate, Estomac, GI",
    "posologie": "10 à 15 g",
    "actions": [
      "Humecter la sécheresse",
      "Lubrifier les intestins",
      "Faire s'écouler l'eau",
      "Dégager la strangurie",
      "Activer la circulation du Sang"
    ],
    "esprit": "Constipation (vide de sang/liquide)",
    "prioritaire": false,
    "source": {
      "workbookSheet": "LD",
      "detailTable": "LD"
    }
  },
  {
    "id": "LD2",
    "code": "LD2",
    "classCode": "LD",
    "classe": "SM qui lubrifient et font descendre",
    "classeIndex": "LUBRIFIENT ET FONT DESCENDRE",
    "pinyin": "Yù lǐ rén",
    "pinyinSansTons": "Yu Li Ren",
    "hanzi": "郁李仁",
    "nom": "Amande séchée du prunier du Japon",
    "nature": "Neutre / Equilibré",
    "saveur": "Piquant, Amer, Doux",
    "tropisme": "Rate, GI, IG",
    "posologie": "3 à 10 g",
    "actions": [
      "Humecter la sécheresse",
      "Lubrifier les intestins",
      "Faire s'écouler l'eau",
      "Faire descendre le Qi"
    ],
    "esprit": "Constipation (vide de sang/liquide, plénitude)",
    "prioritaire": false,
    "source": {
      "workbookSheet": "LD",
      "detailTable": "LD"
    }
  },
  {
    "id": "LE1",
    "code": "LE1",
    "classCode": "LE",
    "classe": "SM lourdes qui pacifient et calment l’Esprit",
    "classeIndex": "LOURDES",
    "pinyin": "Cí shí",
    "pinyinSansTons": "Ci Shi",
    "hanzi": "磁石",
    "nom": "Magnétite",
    "nature": "Neutre / Equilibré",
    "saveur": "Piquant, Salé",
    "tropisme": "Cœur, Reins, Foie, (Poumon)",
    "posologie": "10 à 30 g",
    "actions": [
      "Calmer le Yang (Foie ou Cœur)",
      "Recevoir le Qi (Na Qi)",
      "Equilibrer le Foie",
      "Tranquiliser la frayeur",
      "Calmer l'Esprit",
      "Affiner l'ouïe",
      "Eclaircir la vue",
      "Equilibrer la dyspnée"
    ],
    "esprit": "cacher yang foie coeur, instabilité coeur, epilespsie, syndrome maniaco depressif, vertiges yang\nfoie, acouphenes, surdité, vision faible par vide foie rein, dyspnée reins\nsheng: coeur foie psy, vertiges, insomnies....\ncu cui (vinaigre): reins: asthme na qi, oreilles, vertiges, vision par vide yin foie rein",
    "prioritaire": false,
    "source": {
      "workbookSheet": "LE",
      "detailTable": "LE"
    }
  },
  {
    "id": "LE2",
    "code": "LE2",
    "classCode": "LE",
    "classe": "SM lourdes qui pacifient et calment l’Esprit",
    "classeIndex": "LOURDES",
    "pinyin": "Lóng gǔ",
    "pinyinSansTons": "Long Gu",
    "hanzi": "龙骨",
    "nom": "Os fossilisés de mammifères vertébrés",
    "nature": "Neutre / Equilibré",
    "saveur": "Astringent, Doux",
    "tropisme": "Cœur, Foie, Reins, GI",
    "posologie": "15 à 30 g",
    "actions": [
      "Calmer le Yang (Foie ou Cœur)",
      "Equilibrer le Foie",
      "Tranquiliser la frayeur",
      "Calmer l'Esprit",
      "Retenir la transpiration",
      "Affermir le Jing",
      "Arrêter les saignements",
      "Resserer les intestins",
      "Régénérer les tissus",
      "Refermer les plaies"
    ],
    "esprit": "- Calmer esprit, frayeur, cacher yang foie (epilepsie, psychose, vertiges...)\n- Retient transpi, affermit jing, incontinence\n- Demangeaisons, eczema, referme plaies\nAttention H/C, pervers plenitude\nsheng: esprit foie\nduan: astringent urines transpi selles leucorrhées sperme plaies",
    "prioritaire": true,
    "source": {
      "workbookSheet": "LE",
      "detailTable": "LE"
    },
    "classeEssentielle": "SM qui apaisent le foie"
  },
  {
    "id": "NY1",
    "code": "NY1",
    "classCode": "NY",
    "classe": "SM qui nourrissent le Yīn",
    "classeIndex": "NOURRISSENT LE YIN",
    "pinyin": "Bǎi hé",
    "pinyinSansTons": "Bai He",
    "hanzi": "百合",
    "nom": "Ecaille séchée d'un bulbe de lys",
    "nature": "Légèrement Froid",
    "saveur": "Doux, Amer",
    "tropisme": "Cœur, Poumon",
    "posologie": "6 à 12g",
    "actions": [
      "Enrichir le YIN",
      "Humecter le Poumon",
      "Arrêter la toux sèche",
      "Clarifier le Cœur",
      "Calmer le Shen"
    ],
    "esprit": "Tonifie le Yin du Poumon et favorise les liquides — Nourrit le Yin de l'Estomac, clarifie la chaleur du coeur, calme le shen",
    "prioritaire": false,
    "source": {
      "workbookSheet": "NY",
      "detailTable": "NY"
    }
  },
  {
    "id": "NY2",
    "code": "NY2",
    "classCode": "NY",
    "classe": "SM qui nourrissent le Yīn",
    "classeIndex": "NOURRISSENT LE YIN",
    "pinyin": "Běi shā shēn",
    "pinyinSansTons": "Bei Sha Shen",
    "hanzi": "北沙参",
    "nom": "Racine séchée de Glehnia littoralis",
    "nature": "Frais",
    "saveur": "Doux, Amer",
    "tropisme": "Poumon, Rate",
    "posologie": "5 à 10g",
    "actions": [
      "Enrichir le YIN",
      "Humecter le Poumon",
      "Arrêter la toux sèche",
      "Chasser les mucosités chaleur",
      "Soutenir l'Estomac",
      "Produire les liquides"
    ],
    "esprit": "Nourrit le Yin de l'Estomac",
    "prioritaire": true,
    "source": {
      "workbookSheet": "NY",
      "detailTable": "NY"
    },
    "classeEssentielle": "SM qui nourrissent le yīn"
  },
  {
    "id": "NY3",
    "code": "NY3",
    "classCode": "NY",
    "classe": "SM qui nourrissent le Yīn",
    "classeIndex": "NOURRISSENT LE YIN",
    "pinyin": "Biē jiǎ",
    "pinyinSansTons": "Bie Jia",
    "hanzi": "鳖甲",
    "nom": "Carapace dorsale de tortue molle",
    "nature": "Légèrement Froid",
    "saveur": "Salé",
    "tropisme": "Foie, Reins",
    "posologie": "10 à 30g",
    "actions": [
      "Enrichir le YIN",
      "Clarifier la Chaleur",
      "Equilibrer le Foie",
      "Eteindre le Vent",
      "Ramollir les indurations",
      "Disperser la nouure"
    ],
    "esprit": "Nourrit le Yin et ancre le Yang — Clarifie la chaleur vide, ramolli le dur et les nodules",
    "prioritaire": true,
    "source": {
      "workbookSheet": "NY",
      "detailTable": "NY"
    },
    "classeEssentielle": "SM qui nourrissent le yīn"
  },
  {
    "id": "NY4",
    "code": "NY4",
    "classCode": "NY",
    "classe": "SM qui nourrissent le Yīn",
    "classeIndex": "NOURRISSENT LE YIN",
    "pinyin": "Gǒu qǐ zǐ",
    "pinyinSansTons": "Gou Qi Zi",
    "hanzi": "枸杞子",
    "nom": "Baie du lyciet / de gojie",
    "nature": "Neutre / Equilibré",
    "saveur": "Doux",
    "tropisme": "Foie, Reins, Poumon",
    "posologie": "5 à 15g",
    "actions": [
      "Humecter le Poumon",
      "Tonifier le Foie",
      "Enrichir le Foie",
      "Nourrir les Reins",
      "Enrichir le Jing",
      "Eclaircir les yeux"
    ],
    "esprit": "Tonifie le Yin du Foie et des Reins — Nourrit le Foie, benefique pour les yeux",
    "prioritaire": true,
    "source": {
      "workbookSheet": "NY",
      "detailTable": "NY"
    },
    "classeEssentielle": "SM qui nourrissent le yīn"
  },
  {
    "id": "NY5",
    "code": "NY5",
    "classCode": "NY",
    "classe": "SM qui nourrissent le Yīn",
    "classeIndex": "NOURRISSENT LE YIN",
    "pinyin": "Guī bǎn",
    "pinyinSansTons": "Gui Ban",
    "hanzi": "龟板",
    "nom": "Plastron de tortue des rizières",
    "nature": "Légèrement Froid",
    "saveur": "Salé, Doux",
    "tropisme": "Foie, Reins, Cœur",
    "posologie": "9 à 24g",
    "actions": [
      "Enrichir le YIN",
      "Cacher le Yang",
      "Tonifier le Cœur",
      "Tonifier les Reins",
      "Renforcer les os",
      "Enrichir le Sang",
      "Affermir les menstruations",
      "Arrêter le Sang"
    ],
    "esprit": "Nourrit le Yin des Reins pour solidifier les os, arrête le saignement",
    "prioritaire": false,
    "source": {
      "workbookSheet": "NY",
      "detailTable": "NY"
    }
  },
  {
    "id": "NY6",
    "code": "NY6",
    "classCode": "NY",
    "classe": "SM qui nourrissent le Yīn",
    "classeIndex": "NOURRISSENT LE YIN",
    "pinyin": "Huáng jīng",
    "pinyinSansTons": "Huang Jing",
    "hanzi": "黄精",
    "nom": "Rhizome séché de sceau de salomon polygonatum sibiricum",
    "nature": "Neutre / Equilibré",
    "saveur": "Doux",
    "tropisme": "Rate, Poumon, Reins",
    "posologie": "9 à 24g",
    "actions": [
      "Enrichir le YIN",
      "Humecter le Poumon",
      "Nourrir les Reins",
      "Enrichir le Jing",
      "Tonifier la Rate",
      "Soutenir le jing"
    ],
    "esprit": "Tonifie la Rate, accroit le Jing",
    "prioritaire": true,
    "source": {
      "workbookSheet": "NY",
      "detailTable": "NY"
    },
    "classeEssentielle": "SM qui nourrissent le yīn"
  },
  {
    "id": "NY7",
    "code": "NY7",
    "classCode": "NY",
    "classe": "SM qui nourrissent le Yīn",
    "classeIndex": "NOURRISSENT LE YIN",
    "pinyin": "Mài dōng",
    "pinyinSansTons": "Mai Dong",
    "hanzi": "麦冬",
    "nom": "Racine tubéreuse séchée du muguet du Japon",
    "nature": "Légèrement Froid",
    "saveur": "Doux, Amer",
    "tropisme": "Cœur, Poumon, Estomac",
    "posologie": "6 à 15g",
    "actions": [
      "Enrichir le YIN",
      "Humecter le Poumon",
      "Clarifier le Cœur",
      "Eliminer la dysphorie",
      "Soutenir l'Estomac",
      "Produire les liquides"
    ],
    "esprit": "Nourrit le Yin du Cour et de l'Estomac",
    "prioritaire": false,
    "source": {
      "workbookSheet": "NY",
      "detailTable": "NY"
    }
  },
  {
    "id": "NY8",
    "code": "NY8",
    "classCode": "NY",
    "classe": "SM qui nourrissent le Yīn",
    "classeIndex": "NOURRISSENT LE YIN",
    "pinyin": "Nán shā shēn",
    "pinyinSansTons": "Nan Sha Shen",
    "hanzi": "南沙参",
    "nom": "Racine séchée de l'Adenophora",
    "nature": "Légèrement Froid",
    "saveur": "Doux",
    "tropisme": "Poumon, Estomac",
    "posologie": "9 à 15g",
    "actions": [
      "Enrichir le YIN",
      "Clarifier le Poumon",
      "Arrêter la toux sèche",
      "Chasser les mucosités chaleur",
      "Soutenir l'Estomac",
      "Produire les liquides"
    ],
    "esprit": "Nourrit le Yin de l'Estomac",
    "prioritaire": false,
    "source": {
      "workbookSheet": "NY",
      "detailTable": "NY"
    }
  },
  {
    "id": "NY9",
    "code": "NY9",
    "classCode": "NY",
    "classe": "SM qui nourrissent le Yīn",
    "classeIndex": "NOURRISSENT LE YIN",
    "pinyin": "Nǚ zhēn zǐ",
    "pinyinSansTons": "Nu Zhen Zi",
    "hanzi": "女贞子",
    "nom": "Fruit mûr du Troene",
    "nature": "Frais",
    "saveur": "Doux, Amer",
    "tropisme": "Foie, Reins",
    "posologie": "6 à 15g",
    "actions": [
      "Enrichir le YIN",
      "Clarifier la Chaleur",
      "Tonifier le Foie",
      "Tonifier les Reins",
      "Renforcer les lombes et les genoux",
      "Noircir les cheveux",
      "Eclaircir les yeux"
    ],
    "esprit": "Clarifie la chaleur, éclaircit les yeux",
    "prioritaire": false,
    "source": {
      "workbookSheet": "NY",
      "detailTable": "NY"
    }
  },
  {
    "id": "NY10",
    "code": "NY10",
    "classCode": "NY",
    "classe": "SM qui nourrissent le Yīn",
    "classeIndex": "NOURRISSENT LE YIN",
    "pinyin": "Yù zhú",
    "pinyinSansTons": "Yu Zhu",
    "hanzi": "玉竹",
    "nom": "Rhizome séché d'un sceau de salomon odorant",
    "nature": "Neutre / Equilibré",
    "saveur": "Doux",
    "tropisme": "Poumon, Estomac",
    "posologie": "6 à 12g",
    "actions": [
      "Enrichir le YIN",
      "Humidifier la sècheresse",
      "Eliminer la dysphorie",
      "Produire les liquides",
      "Arrêter la soif"
    ],
    "esprit": "Nourrit le Yin du Poumon et de l'Estomac, arrête la soif",
    "prioritaire": false,
    "source": {
      "workbookSheet": "NY",
      "detailTable": "NY"
    }
  },
  {
    "id": "OO1",
    "code": "OO1",
    "classCode": "OO",
    "classe": "SM qui ouvrent les orifices",
    "classeIndex": "OUVRENT LES ORIFICES",
    "pinyin": "Bīng piàn",
    "pinyinSansTons": "Bing Pian",
    "hanzi": "冰片",
    "nom": "Cristallisation de résine de Sambong",
    "nature": "Légèrement Froid",
    "saveur": "Piquant, Amer",
    "tropisme": "Cœur, Rate, Poumon",
    "posologie": "0,15 à 0,3 g",
    "actions": [
      "Ouvrir les orifices",
      "Réveiller l'Esprit",
      "Disperser la Chaleur",
      "Arrêter la douleur",
      "Eclaircir les yeux",
      "Enlever les taies de l'œil"
    ],
    "esprit": "Perte de connaissance (obstruction de chaleur)",
    "prioritaire": false,
    "source": {
      "workbookSheet": "OO",
      "detailTable": "OO"
    }
  },
  {
    "id": "OO2",
    "code": "OO2",
    "classCode": "OO",
    "classe": "SM qui ouvrent les orifices",
    "classeIndex": "OUVRENT LES ORIFICES",
    "pinyin": "Shè xiāng",
    "pinyinSansTons": "She Xiang",
    "hanzi": "麝香",
    "nom": "Sécrétions de poches sous-ombilicales de Cerf à musc",
    "nature": "Tiède",
    "saveur": "Piquant",
    "tropisme": "Cœur, Rate",
    "posologie": "0,03 à 0,1 g",
    "actions": [
      "Ouvrir les orifices",
      "Réveiller l'Esprit",
      "Arrêter la douleur",
      "Expurger le putride",
      "Activer le Sang",
      "Désobstruer les liaisons",
      "Disperser la stase",
      "Déclencher l'accouchement"
    ],
    "esprit": "Obstructions",
    "prioritaire": false,
    "source": {
      "workbookSheet": "OO",
      "detailTable": "OO"
    }
  },
  {
    "id": "OO3",
    "code": "OO3",
    "classCode": "OO",
    "classe": "SM qui ouvrent les orifices",
    "classeIndex": "OUVRENT LES ORIFICES",
    "pinyin": "Shí chāng pú",
    "pinyinSansTons": "Shi Chang Pu",
    "hanzi": "石菖蒲",
    "nom": "Rhizome de l'acore",
    "nature": "Légèrement tiède",
    "saveur": "Piquant, Amer",
    "tropisme": "Cœur, Foie, Rate",
    "posologie": "3 à 6 g",
    "actions": [
      "Ouvrir les orifices",
      "Activer le Sang",
      "Fixer le Shen",
      "Eparpiller les mucosités",
      "Transformer l'Humidité",
      "Harmoniser l'Estomac",
      "Mettre en ordre le Qi",
      "Disperser le vent"
    ],
    "esprit": "Obstructions par mucosités humidité (shén, orifices du cœur\ncentre, articulations)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "OO",
      "detailTable": "OO"
    },
    "classeEssentielle": "SM qui ouvrent les orifices"
  },
  {
    "id": "PE1",
    "code": "PE1",
    "classCode": "PE",
    "classe": "SM qui purgent drastiquement et chassent l’Eau",
    "classeIndex": "PURGENT DRASTIQUEMENT ET CHASSENT L'EAU",
    "pinyin": "Bā dòu",
    "pinyinSansTons": "Ba Dou",
    "hanzi": "巴豆",
    "nom": "Graine du croton des pharmaciens",
    "nature": "Chaud, Très toxique",
    "saveur": "Piquant",
    "tropisme": "Estomac, GI",
    "posologie": "0,1 à 0,03 g",
    "actions": [
      "Purger les accumulations de Froid",
      "Désobstruer les orifices",
      "Expulser les mucosités",
      "Faire circuler l'eau",
      "Tuer les parasites"
    ],
    "esprit": "Amas de type froid plénitude",
    "prioritaire": false,
    "source": {
      "workbookSheet": "PE",
      "detailTable": "PE"
    }
  },
  {
    "id": "PE2",
    "code": "PE2",
    "classCode": "PE",
    "classe": "SM qui purgent drastiquement et chassent l’Eau",
    "classeIndex": "PURGENT DRASTIQUEMENT ET CHASSENT L'EAU",
    "pinyin": "Gān suì",
    "pinyinSansTons": "Gan Sui",
    "hanzi": "甘遂",
    "nom": "Racine de l'euphorbia kansui",
    "nature": "Froid, Toxique",
    "saveur": "Amer",
    "tropisme": "Rate, Poumon, Rein, Vessie, GI, IG",
    "posologie": "0,5 à 1 g",
    "actions": [
      "Faire s'écouler les mucosités Yin",
      "Casser les accumulations",
      "Désobstruer les selles et les urines"
    ],
    "esprit": "Œdème et mucosités-yīn (foyers supérieur et médian)",
    "prioritaire": false,
    "source": {
      "workbookSheet": "PE",
      "detailTable": "PE"
    }
  },
  {
    "id": "PE3",
    "code": "PE3",
    "classCode": "PE",
    "classe": "SM qui purgent drastiquement et chassent l’Eau",
    "classeIndex": "PURGENT DRASTIQUEMENT ET CHASSENT L'EAU",
    "pinyin": "Jīng dà jǐ",
    "pinyinSansTons": "Jing Da Ji",
    "hanzi": "京大戟",
    "nom": "Racine de l'euphorbia pekinensis",
    "nature": "Froid, Toxique",
    "saveur": "Amer",
    "tropisme": "Poumon, Rate, Reins",
    "posologie": "0,5 à 3 g",
    "actions": [
      "Faire circuler l'eau",
      "Faire s'écouler les mucosités Yin",
      "Réduire le gonflement",
      "Disperser la nouure"
    ],
    "esprit": "Œdème et mucosités-yīn (foyer supérieur avec action plus\nmodérée que gān suì)",
    "prioritaire": false,
    "source": {
      "workbookSheet": "PE",
      "detailTable": "PE"
    }
  },
  {
    "id": "PE4",
    "code": "PE4",
    "classCode": "PE",
    "classe": "SM qui purgent drastiquement et chassent l’Eau",
    "classeIndex": "PURGENT DRASTIQUEMENT ET CHASSENT L'EAU",
    "pinyin": "Yuán huā",
    "pinyinSansTons": "Yuan Hua",
    "hanzi": "芫花",
    "nom": "Boutons floraux de Daphne Genkwa",
    "nature": "Tiède, Toxique",
    "saveur": "Amer, Piquant",
    "tropisme": "Poumon, Rate",
    "posologie": "0,6 à 3 g",
    "actions": [
      "Expulser les mucosités",
      "Faire circuler l'eau",
      "Faire s'écouler les mucosités Yin",
      "Arrêter la toux",
      "Tuer les parasites",
      "Soigner les ulcérations"
    ],
    "esprit": "Œdème et mucosités-yīn (foyer supérieur avec action plus\nmodérée que gān suì et jīng dà jǐ)",
    "prioritaire": false,
    "source": {
      "workbookSheet": "PE",
      "detailTable": "PE"
    }
  },
  {
    "id": "PF1",
    "code": "PF1",
    "classCode": "PF",
    "classe": "SM piquantes et fraîches qui libèrent la Surface et clarifient la Chaleur",
    "classeIndex": "PIQUANTES ET FRAICHES\nLIBERENT LA SURFACE ET CLARIFIENT LA CHALEUR",
    "pinyin": "Bò hé",
    "pinyinSansTons": "Bo He",
    "hanzi": "薄荷",
    "nom": "Branche et feuille de menthe chinoise",
    "nature": "Frais",
    "saveur": "Piquant",
    "tropisme": "Poumon, Foie",
    "posologie": "3 à 6 g",
    "actions": [
      "Clarifier la tête et les yeux",
      "Faire percer l'éruption",
      "Assouplir la gorge",
      "Neutraliser la toxicité",
      "Diffuser et disperser le Vent-Chaleur",
      "Disperser le Foie",
      "Libérer la surpression du Foie",
      "Expurger le putride"
    ],
    "esprit": "Vent chaleur externe\nTête, gorge, peau (vent chaleur externe, chaleur interne)",
    "prioritaire": false,
    "source": {
      "workbookSheet": "PF",
      "detailTable": "PF"
    }
  },
  {
    "id": "PF2",
    "code": "PF2",
    "classCode": "PF",
    "classe": "SM piquantes et fraîches qui libèrent la Surface et clarifient la Chaleur",
    "classeIndex": "PIQUANTES ET FRAICHES\nLIBERENT LA SURFACE ET CLARIFIENT LA CHALEUR",
    "pinyin": "Chái hú",
    "pinyinSansTons": "Chai Hu",
    "hanzi": "柴胡",
    "nom": "Racine de 2 buplèvres",
    "nature": "Légèrement Froid",
    "saveur": "Amer, Piquant",
    "tropisme": "Foie, Rate, Vésicule Biliaire",
    "posologie": "3 à 10 g",
    "actions": [
      "Faire monter le Yang",
      "Elever l'affaissement",
      "Disperser le Foie",
      "Libérer la surpression du Foie",
      "Harmoniser et libérer l'interne et la surface",
      "Faire reculer la fièvre"
    ],
    "esprit": "Syndrome shào yáng\nStagnation du qì du foie\nAffaissement du qì de la rate",
    "prioritaire": true,
    "source": {
      "workbookSheet": "PF",
      "detailTable": "PF"
    },
    "classeEssentielle": "SM qui libèrent la superficie"
  },
  {
    "id": "PF3",
    "code": "PF3",
    "classCode": "PF",
    "classe": "SM piquantes et fraîches qui libèrent la Surface et clarifient la Chaleur",
    "classeIndex": "PIQUANTES ET FRAICHES\nLIBERENT LA SURFACE ET CLARIFIENT LA CHALEUR",
    "pinyin": "Chán tuì",
    "pinyinSansTons": "Chan Tui",
    "hanzi": "蝉蜕",
    "nom": "Mue de cigale",
    "nature": "Fraîche (voire Froid)",
    "saveur": "Doux, Salé",
    "tropisme": "Poumon, Foie",
    "posologie": "3 à 6 g",
    "actions": [
      "Faire percer l'éruption",
      "Arrêter les démangeaisons",
      "Diffuser le Poumon",
      "Diffuser et disperser le Vent-Chaleur",
      "Faire disparaître les taies (néphélions)",
      "Eclaircir les yeux",
      "Apaiser les spasmes et convulsions",
      "Aider à déclencher l'accouchement"
    ],
    "esprit": "Vent, spasmes, démangeaisons",
    "prioritaire": false,
    "source": {
      "workbookSheet": "PF",
      "detailTable": "PF"
    }
  },
  {
    "id": "PF4",
    "code": "PF4",
    "classCode": "PF",
    "classe": "SM piquantes et fraîches qui libèrent la Surface et clarifient la Chaleur",
    "classeIndex": "PIQUANTES ET FRAICHES\nLIBERENT LA SURFACE ET CLARIFIENT LA CHALEUR",
    "pinyin": "Gě gēn",
    "pinyinSansTons": "Ge Gen",
    "hanzi": "葛根",
    "nom": "Racine de Kudzu",
    "nature": "Frais (voire neutre/équilibré)",
    "saveur": "Doux, Piquant",
    "tropisme": "Rate, Estomac, Poumon, Vessie",
    "posologie": "10 à 20 g",
    "actions": [
      "Faire percer l'éruption",
      "Faire monter le Yang",
      "Libérer les muscles",
      "Arrêter la diarrhée",
      "Eliminer la dysphorie",
      "Arrêter la soif"
    ],
    "esprit": "Nuque, épaule, trapèzes (atteinte externe avec ou sans chaleur\ninterne)\nDiarrhée, soif (chaleur, vide de qi)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "PF",
      "detailTable": "PF"
    },
    "classeEssentielle": "SM qui libèrent la superficie"
  },
  {
    "id": "PF5",
    "code": "PF5",
    "classCode": "PF",
    "classe": "SM piquantes et fraîches qui libèrent la Surface et clarifient la Chaleur",
    "classeIndex": "PIQUANTES ET FRAICHES\nLIBERENT LA SURFACE ET CLARIFIENT LA CHALEUR",
    "pinyin": "Jú huā",
    "pinyinSansTons": "Ju Hua",
    "hanzi": "菊花",
    "nom": "Fleur du chrysanthème",
    "nature": "Légèrement Froid",
    "saveur": "Doux, Piquant, Amer",
    "tropisme": "Poumon, Foie",
    "posologie": "10 à 15 g",
    "actions": [
      "Neutraliser la toxicité",
      "Disperser le Vent",
      "Clarifier la Chaleur",
      "Eclaircir les yeux",
      "Calmer leYang du Foie",
      "Clarifier le Feu du Foie"
    ],
    "esprit": "Yeux rouges et douloureux",
    "prioritaire": false,
    "source": {
      "workbookSheet": "PF",
      "detailTable": "PF"
    }
  },
  {
    "id": "PF6",
    "code": "PF6",
    "classCode": "PF",
    "classe": "SM piquantes et fraîches qui libèrent la Surface et clarifient la Chaleur",
    "classeIndex": "PIQUANTES ET FRAICHES\nLIBERENT LA SURFACE ET CLARIFIENT LA CHALEUR",
    "pinyin": "Niú bàng zǐ",
    "pinyinSansTons": "Niu Bang Zi",
    "hanzi": "牛蒡子",
    "nom": "Fruit de la grande bardane",
    "nature": "Froid (Frais selon certain.es)",
    "saveur": "Amer, Piquant",
    "tropisme": "Poumon, Estomac",
    "posologie": "5 à 10 g",
    "actions": [
      "Faire percer l'éruption",
      "Diffuser le Poumon",
      "Assouplir la gorge",
      "Dissiper la tuméfaction",
      "Neutraliser la toxicité",
      "Diffuser et disperser le Vent-Chaleur"
    ],
    "esprit": "Gorge (très) douloureuse (avec ou sans gonflement)",
    "prioritaire": false,
    "source": {
      "workbookSheet": "PF",
      "detailTable": "PF"
    }
  },
  {
    "id": "PF7",
    "code": "PF7",
    "classCode": "PF",
    "classe": "SM piquantes et fraîches qui libèrent la Surface et clarifient la Chaleur",
    "classeIndex": "PIQUANTES ET FRAICHES\nLIBERENT LA SURFACE ET CLARIFIENT LA CHALEUR",
    "pinyin": "Sāng yè",
    "pinyinSansTons": "Sang Ye",
    "hanzi": "桑叶",
    "nom": "Feuille de mûrier blanc",
    "nature": "Froid",
    "saveur": "Amer, Doux",
    "tropisme": "Poumon, Foie",
    "posologie": "4,5 à 9 g",
    "actions": [
      "Disperser le Vent",
      "Clarifier la Chaleur",
      "Eclaircir les yeux",
      "Clarifier le Poumon",
      "Clarifier le Foie",
      "Humidifier la sécheresse",
      "Rafraîchir le Sang"
    ],
    "esprit": "Toux (chaleur du poumon)\nTroubles oculaires, céphalées, vertiges (chaleur du foie, vent\nchaleur externe)",
    "prioritaire": false,
    "source": {
      "workbookSheet": "PF",
      "detailTable": "PF"
    }
  },
  {
    "id": "PF8",
    "code": "PF8",
    "classCode": "PF",
    "classe": "SM piquantes et fraîches qui libèrent la Surface et clarifient la Chaleur",
    "classeIndex": "PIQUANTES ET FRAICHES\nLIBERENT LA SURFACE ET CLARIFIENT LA CHALEUR",
    "pinyin": "Shēng má",
    "pinyinSansTons": "Sheng Ma",
    "hanzi": "升麻",
    "nom": "Rhizome de cimicaire",
    "nature": "Frais (Légèrement Froid selon certain.es",
    "saveur": "Doux, Piquant, Légèrement Amer",
    "tropisme": "Poumon, Rate, Estomac, GI\nYANG MING",
    "posologie": "3 à 9 g",
    "actions": [
      "Faire percer l'éruption",
      "Neutraliser la toxicité",
      "Faire monter le Yang",
      "Clarifier la Chaleur",
      "Libérer la surface"
    ],
    "esprit": "Chaleur toxine (vent chaleur externe, yáng míng)\nStade initial des maladies éruptives\nEffondrement du qì de la rate",
    "prioritaire": false,
    "source": {
      "workbookSheet": "PF",
      "detailTable": "PF"
    }
  },
  {
    "id": "PT1",
    "code": "PT1",
    "classCode": "PT",
    "classe": "SM piquantes et tièdes qui libèrent la Surface et dispersent le Froid",
    "classeIndex": "PIQUANTES ET TIEDES\nLIBERENT LA SURFACE ET DISPERSENT LE FROID",
    "pinyin": "Bái zhǐ",
    "pinyinSansTons": "Bai Zhi",
    "hanzi": "白芷",
    "nom": "Racine de l'Angélique",
    "nature": "Tiéde (ou neutre, équilibrée)",
    "saveur": "Piquant",
    "tropisme": "Poumon, Rate, Estomac",
    "posologie": "3 à 10 g",
    "actions": [
      "Disperser le Froid",
      "Désobstruer les orifices du nez",
      "Disperser / Chasser le Vent",
      "Transformer / Eliminer / \nAssécher l'Humidité",
      "Arrêter la douleur",
      "Dissiper la tuméfaction",
      "Enlever le pus"
    ],
    "esprit": "Maux de tête, de dents (vent froid externe)\nLeucorrhées",
    "prioritaire": false,
    "source": {
      "workbookSheet": "PT",
      "detailTable": "PT"
    }
  },
  {
    "id": "PT2",
    "code": "PT2",
    "classCode": "PT",
    "classe": "SM piquantes et tièdes qui libèrent la Surface et dispersent le Froid",
    "classeIndex": "PIQUANTES ET TIEDES\nLIBERENT LA SURFACE ET DISPERSENT LE FROID",
    "pinyin": "Cāng ěr zǐ",
    "pinyinSansTons": "Cang Er Zi",
    "hanzi": "苍耳子",
    "nom": "Fruit de Lampourdre de Sibérie",
    "nature": "Tiède \n(Faible toxicité)",
    "saveur": "Piquant Amer",
    "tropisme": "Poumon",
    "posologie": "3 à 10 g",
    "actions": [
      "Désobstruer les orifices du nez",
      "Disperser / Chasser le Vent",
      "Transformer / Eliminer / \nAssécher l'Humidité",
      "Arrêter la douleur"
    ],
    "esprit": "Congestion nasale (vent froid externe ou autre)\nDouleurs (vent froid humidité)",
    "prioritaire": false,
    "source": {
      "workbookSheet": "PT",
      "detailTable": "PT"
    }
  },
  {
    "id": "PT3",
    "code": "PT3",
    "classCode": "PT",
    "classe": "SM piquantes et tièdes qui libèrent la Surface et dispersent le Froid",
    "classeIndex": "PIQUANTES ET TIEDES\nLIBERENT LA SURFACE ET DISPERSENT LE FROID",
    "pinyin": "Fáng fēng",
    "pinyinSansTons": "Fang Feng",
    "hanzi": "防风",
    "nom": "Racine de Silère",
    "nature": "Légèrement tiède",
    "saveur": "Piquant Doux",
    "tropisme": "Vessie, Foie, Rate",
    "posologie": "5 à 10 g",
    "actions": [
      "Disperser / Chasser le Vent",
      "Transformer / Eliminer / \nAssécher l'Humidité",
      "Arrêter la douleur",
      "Libérer la surface",
      "Arrêter les spasmes",
      "Arrêter la diarrhée"
    ],
    "esprit": "Vent en surface",
    "prioritaire": false,
    "source": {
      "workbookSheet": "PT",
      "detailTable": "PT"
    }
  },
  {
    "id": "PT4",
    "code": "PT4",
    "classCode": "PT",
    "classe": "SM piquantes et tièdes qui libèrent la Surface et dispersent le Froid",
    "classeIndex": "PIQUANTES ET TIEDES\nLIBERENT LA SURFACE ET DISPERSENT LE FROID",
    "pinyin": "Guì zhī",
    "pinyinSansTons": "Gui Zhi",
    "hanzi": "桂枝",
    "nom": "Rameau du Cannelier de Chine",
    "nature": "Tiède",
    "saveur": "Piquant Doux",
    "tropisme": "Cœur, Poumon, Vessie",
    "posologie": "3 à 15 g",
    "actions": [
      "Désobstruer / \nTiédir les canaux et vaisseaux",
      "Libérer la surface",
      "Induire la transpiration",
      "Dégager le Yang",
      "Transformer le Qi"
    ],
    "esprit": "Libère la surface (surface vide)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "PT",
      "detailTable": "PT"
    },
    "classeEssentielle": "SM qui libèrent la superficie"
  },
  {
    "id": "PT5",
    "code": "PT5",
    "classCode": "PT",
    "classe": "SM piquantes et tièdes qui libèrent la Surface et dispersent le Froid",
    "classeIndex": "PIQUANTES ET TIEDES\nLIBERENT LA SURFACE ET DISPERSENT LE FROID",
    "pinyin": "Jīng jiè",
    "pinyinSansTons": "Jing Jie",
    "hanzi": "荆芥",
    "nom": "Partie aérienne de l'herbe à chat du Japon",
    "nature": "Tiède",
    "saveur": "Piquant",
    "tropisme": "Poumon, Foie",
    "posologie": "3 à 10 g",
    "actions": [
      "Faire percer l'éruption",
      "Disperser / Chasser le Vent",
      "Libérer la surface",
      "Mettre en ordre le Sang",
      "Arrêter les saignements",
      "Arrêter les démangeaisons"
    ],
    "esprit": "Surface avec démangeaisons (vent, vent froid ou vent chaleur\nexterne)\nArrête les saignements",
    "prioritaire": false,
    "source": {
      "workbookSheet": "PT",
      "detailTable": "PT"
    }
  },
  {
    "id": "PT6",
    "code": "PT6",
    "classCode": "PT",
    "classe": "SM piquantes et tièdes qui libèrent la Surface et dispersent le Froid",
    "classeIndex": "PIQUANTES ET TIEDES\nLIBERENT LA SURFACE ET DISPERSENT LE FROID",
    "pinyin": "Má huáng",
    "pinyinSansTons": "Ma Huang",
    "hanzi": "麻黄",
    "nom": "Tige d'éphèdre",
    "nature": "Tiède",
    "saveur": "Piquant Légèrement Amer",
    "tropisme": "Poumon, Vessie",
    "posologie": "3 à 18 g",
    "actions": [
      "Diffuser le Poumon / \nEquilibrer la dyspnée",
      "Faire circuler/s'écouler l'eau",
      "Dissiper l'oedème",
      "Libérer la surface",
      "Induire la transpiration"
    ],
    "esprit": "Libère la surface (surface plénitude)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "PT",
      "detailTable": "PT"
    },
    "classeEssentielle": "SM qui libèrent la superficie"
  },
  {
    "id": "PT7",
    "code": "PT7",
    "classCode": "PT",
    "classe": "SM piquantes et tièdes qui libèrent la Surface et dispersent le Froid",
    "classeIndex": "PIQUANTES ET TIEDES\nLIBERENT LA SURFACE ET DISPERSENT LE FROID",
    "pinyin": "Qiāng huó",
    "pinyinSansTons": "Qiang Huo",
    "hanzi": "羌活",
    "nom": "Rhizome du Notopterygium",
    "nature": "Tiède",
    "saveur": "Piquant Amer",
    "tropisme": "Vessie, Reins",
    "posologie": "3 à 10 g",
    "actions": [
      "Disperser le Froid",
      "Disperser / Chasser le Vent",
      "Transformer / Eliminer / \nAssécher l'Humidité",
      "Arrêter la douleur",
      "Libérer la surface"
    ],
    "esprit": "Douleurs de type vent-froid-humidité (tropisme plus marqué\npour le haut du corps)",
    "prioritaire": false,
    "source": {
      "workbookSheet": "PT",
      "detailTable": "PT"
    }
  },
  {
    "id": "PT8",
    "code": "PT8",
    "classCode": "PT",
    "classe": "SM piquantes et tièdes qui libèrent la Surface et dispersent le Froid",
    "classeIndex": "PIQUANTES ET TIEDES\nLIBERENT LA SURFACE ET DISPERSENT LE FROID",
    "pinyin": "Shēng jiāng",
    "pinyinSansTons": "Sheng Jiang",
    "hanzi": "生姜",
    "nom": "Gingembre frais",
    "nature": "Légèrement tiède",
    "saveur": "Piquant",
    "tropisme": "Poumon, Rate, Estomac",
    "posologie": "3 à 15 g",
    "actions": [
      "Disperser le Froid",
      "Libérer la surface",
      "Arrêter les vomissements",
      "Transformer les mucosités"
    ],
    "esprit": "Libère la surface (vent/vent-froid externe)\nPanacée pour les vomissements",
    "prioritaire": true,
    "source": {
      "workbookSheet": "PT",
      "detailTable": "PT"
    },
    "classeEssentielle": "SM qui libèrent la superficie"
  },
  {
    "id": "PT9",
    "code": "PT9",
    "classCode": "PT",
    "classe": "SM piquantes et tièdes qui libèrent la Surface et dispersent le Froid",
    "classeIndex": "PIQUANTES ET TIEDES\nLIBERENT LA SURFACE ET DISPERSENT LE FROID",
    "pinyin": "Xì xīn",
    "pinyinSansTons": "Xi Xin",
    "hanzi": "细辛",
    "nom": "Asaret",
    "nature": "Tiède (ou chaud), Faible toxicité",
    "saveur": "Piquant",
    "tropisme": "Poumon, Rein, Cœur, IG, VB, Rate",
    "posologie": "0,5 à 9 g",
    "actions": [
      "Disperser le Froid",
      "Ouvrir les orifices",
      "Désobstruer les orifices du nez",
      "Faire circuler/s'écouler l'eau",
      "Disperser / Chasser le Vent",
      "Arrêter la douleur",
      "Transformer les mucosités",
      "Tiédir le Poumon",
      "Traiter les inflammations buccales (bains de bouche)"
    ],
    "esprit": "Douleur (tête, articulations), Nez",
    "prioritaire": true,
    "source": {
      "workbookSheet": "PT",
      "detailTable": "PT"
    },
    "classeEssentielle": "SM qui libèrent la superficie"
  },
  {
    "id": "PT10",
    "code": "PT10",
    "classCode": "PT",
    "classe": "SM piquantes et tièdes qui libèrent la Surface et dispersent le Froid",
    "classeIndex": "PIQUANTES ET TIEDES\nLIBERENT LA SURFACE ET DISPERSENT LE FROID",
    "pinyin": "Xiāng rú",
    "pinyinSansTons": "Xiang Ru",
    "hanzi": "香薷",
    "nom": "Mosla chinois",
    "nature": "Légèrement tiède",
    "saveur": "Piquant",
    "tropisme": "Poumon, Rate, Estomac, [canaux VB, Rate, Cœur]",
    "posologie": "3 à 15 g",
    "actions": [
      "Faire circuler/s'écouler l'eau",
      "Dissiper l'oedème",
      "Transformer / Eliminer / \nAssécher l'Humidité",
      "Libérer la surface",
      "Induire la transpiration",
      "Régulariser / \nHarmoniser le centre",
      "Chasser la Canicule"
    ],
    "esprit": "Vent froid en surface et canicule interne",
    "prioritaire": false,
    "source": {
      "workbookSheet": "PT",
      "detailTable": "PT"
    }
  },
  {
    "id": "PT11",
    "code": "PT11",
    "classCode": "PT",
    "classe": "SM piquantes et tièdes qui libèrent la Surface et dispersent le Froid",
    "classeIndex": "PIQUANTES ET TIEDES\nLIBERENT LA SURFACE ET DISPERSENT LE FROID",
    "pinyin": "Xīn yí huā",
    "pinyinSansTons": "Xin Yi Hua",
    "hanzi": "辛夷花",
    "nom": "Bouton des fleurs de Magnolias",
    "nature": "Tiède",
    "saveur": "Piquant",
    "tropisme": "Poumon, Estomac",
    "posologie": "3 à 10 g",
    "actions": [
      "Disperser le Froid",
      "Désobstruer les orifices du nez",
      "Disperser / Chasser le Vent"
    ],
    "esprit": "Congestion nasale (vent froid externe ou autre)",
    "prioritaire": false,
    "source": {
      "workbookSheet": "PT",
      "detailTable": "PT"
    }
  },
  {
    "id": "PT12",
    "code": "PT12",
    "classCode": "PT",
    "classe": "SM piquantes et tièdes qui libèrent la Surface et dispersent le Froid",
    "classeIndex": "PIQUANTES ET TIEDES\nLIBERENT LA SURFACE ET DISPERSENT LE FROID",
    "pinyin": "Zǐ sū yè",
    "pinyinSansTons": "Zi Su Ye",
    "hanzi": "紫苏叶",
    "nom": "Feuille du basilic chinois",
    "nature": "Tiède",
    "saveur": "Piquant",
    "tropisme": "Poumon, Rate",
    "posologie": "5 à 10 g",
    "actions": [
      "Disperser le Froid",
      "Libérer la surface",
      "Mobiliser le Qi",
      "Harmoniser l'Estomac"
    ],
    "esprit": "Vend froid externe\nVend froid externe avec stagnation de qì (poitrine, système\ndigestif)",
    "prioritaire": false,
    "source": {
      "workbookSheet": "PT",
      "detailTable": "PT"
    }
  },
  {
    "id": "PT13",
    "code": "PT13",
    "classCode": "PT",
    "classe": "SM piquantes et tièdes qui libèrent la Surface et dispersent le Froid",
    "classeIndex": "PIQUANTES ET TIEDES\nLIBERENT LA SURFACE ET DISPERSENT LE FROID",
    "pinyin": "Zǐ sū gěng",
    "pinyinSansTons": "Zi Su Geng",
    "hanzi": "紫苏梗",
    "nom": "Tige du basilic chinois",
    "nature": "Légèrement Chaud",
    "saveur": "Doux Piquant",
    "tropisme": "Rate, Estomac, Poumon",
    "posologie": "5 à 10 g en décoction.",
    "actions": [
      "Arrêter la douleur",
      "Régulariser / \nHarmoniser le centre",
      "Mobiliser le Qi",
      "Mettre en ordre le Qi",
      "Détendre la surpression",
      "Calmer le fœtus"
    ],
    "esprit": "",
    "prioritaire": false,
    "source": {
      "workbookSheet": "PT",
      "detailTable": "PT"
    },
    "incompleteFields": []
  },
  {
    "id": "PUF1",
    "code": "PUF1",
    "classCode": "PUF",
    "classe": "SM qui purgent avec force et désobstruent les selles",
    "classeIndex": "PURGENT AVEC FORCE ET DESOBSTRUENT LES SELLES",
    "pinyin": "Dà huáng",
    "pinyinSansTons": "Da Huang",
    "hanzi": "大黄",
    "nom": "Racine et/ou rhizome de rhubarbes",
    "nature": "Froid",
    "saveur": "Amer",
    "tropisme": "Estomac, GI, Foie",
    "posologie": "3 à 30 g",
    "actions": [
      "Purger la Chaleur Toxique",
      "Briser l'accumulation et la stagnation",
      "Faire circuler la stase de Sang"
    ],
    "esprit": "Purgatif général de la chaleur",
    "prioritaire": true,
    "source": {
      "workbookSheet": "PUF",
      "detailTable": "PUF"
    },
    "classeEssentielle": "SM qui purgent vers le bas"
  },
  {
    "id": "PUF2",
    "code": "PUF2",
    "classCode": "PUF",
    "classe": "SM qui purgent avec force et désobstruent les selles",
    "classeIndex": "PURGENT AVEC FORCE ET DESOBSTRUENT LES SELLES",
    "pinyin": "Fān xiè yè",
    "pinyinSansTons": "Fan Xie Ye",
    "hanzi": "番泻叶",
    "nom": "Feuille séchée de Séné",
    "nature": "Froid, Frais",
    "saveur": "Doux, Amer",
    "tropisme": "GI",
    "posologie": "3 à 6 g",
    "actions": [
      "Briser l'accumulation et la stagnation",
      "Purger la Chaleur",
      "Désobstruer les selles",
      "Arrêter les saignements"
    ],
    "esprit": "Constipation (chaleur)",
    "prioritaire": false,
    "source": {
      "workbookSheet": "PUF",
      "detailTable": "PUF"
    }
  },
  {
    "id": "PUF3",
    "code": "PUF3",
    "classCode": "PUF",
    "classe": "SM qui purgent avec force et désobstruent les selles",
    "classeIndex": "PURGENT AVEC FORCE ET DESOBSTRUENT LES SELLES",
    "pinyin": "Máng xiāo",
    "pinyinSansTons": "Mang Xiao",
    "hanzi": "芒硝",
    "nom": "Mirabilite ou sel de Glauber",
    "nature": "Froid",
    "saveur": "Salé, Amer",
    "tropisme": "Estomac, GI",
    "posologie": "6 à 12g",
    "actions": [
      "Purger la Chaleur",
      "Arrête la lactation",
      "Humidifier la Sécheresse",
      "Ramollir le dur"
    ],
    "esprit": "Constipation (chaleur sécheresse)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "PUF",
      "detailTable": "PUF"
    },
    "classeEssentielle": "SM qui purgent vers le bas"
  },
  {
    "id": "RQ1",
    "code": "RQ1",
    "classCode": "RQ",
    "classe": "SM qui régularisent la circulation du Qì",
    "classeIndex": "REGULARISENT LA CIRCULATION DU QI",
    "pinyin": "Chén pí",
    "pinyinSansTons": "Chen Pi",
    "hanzi": "陈皮",
    "nom": "Ecorce de mandarine mûre",
    "nature": "Tiède",
    "saveur": "Amer, Piquant",
    "tropisme": "Poumon, Rate",
    "posologie": "3 à 9g",
    "actions": [
      "Régulariser le QI",
      "Harmoniser le Centre",
      "Assécher l'Humidité",
      "Transformer les mucosités"
    ],
    "esprit": "Stagnation de qi, inversion par stagnation de qi, humidité (Rt, P)",
    "prioritaire": false,
    "source": {
      "workbookSheet": "RQ",
      "detailTable": "RQ"
    }
  },
  {
    "id": "RQ2",
    "code": "RQ2",
    "classCode": "RQ",
    "classe": "SM qui régularisent la circulation du Qì",
    "classeIndex": "REGULARISENT LA CIRCULATION DU QI",
    "pinyin": "Chuān liàn zǐ",
    "pinyinSansTons": "Chuan Lian Zi",
    "hanzi": "川楝子",
    "nom": "Fruit mûr du lilas de Chine",
    "nature": "Froid, Légèrement toxique",
    "saveur": "Amer",
    "tropisme": "Foie, Esto., IG, Vessie",
    "posologie": "3 à 10g",
    "actions": [
      "Détendre le Foie",
      "Mobiliser le Qi",
      "Arrêter la douleur",
      "Expulser et tuer les parasites"
    ],
    "esprit": "Troubles shan, digestifs par stagnation de qi dans le système\ndu foie (organe + canal) avec chaleur",
    "prioritaire": false,
    "source": {
      "workbookSheet": "RQ",
      "detailTable": "RQ"
    }
  },
  {
    "id": "RQ3",
    "code": "RQ3",
    "classCode": "RQ",
    "classe": "SM qui régularisent la circulation du Qì",
    "classeIndex": "REGULARISENT LA CIRCULATION DU QI",
    "pinyin": "Fó shǒu",
    "pinyinSansTons": "Fo Shou",
    "hanzi": "佛手",
    "nom": "Cédrat \"main de Bouddha\"",
    "nature": "Tiède",
    "saveur": "Piquant, Amer, Acide",
    "tropisme": "Foie, Rate, Poumon",
    "posologie": "3 à 10g",
    "actions": [
      "Régulariser le QI",
      "Harmoniser l'Estomac",
      "Transformer les mucosités",
      "Détendre le Foie"
    ],
    "esprit": "Stagnation de qi (foie, rate)\nToux (mucosités humidité)",
    "prioritaire": false,
    "source": {
      "workbookSheet": "RQ",
      "detailTable": "RQ"
    }
  },
  {
    "id": "RQ4",
    "code": "RQ4",
    "classCode": "RQ",
    "classe": "SM qui régularisent la circulation du Qì",
    "classeIndex": "REGULARISENT LA CIRCULATION DU QI",
    "pinyin": "Mù xiāng",
    "pinyinSansTons": "Mu Xiang",
    "hanzi": "木香",
    "nom": "Racine séchée d'Aucklandialappa",
    "nature": "Tiède",
    "saveur": "Piquant, Amer",
    "tropisme": "VB, TF, Rate, Esto., Poumon, GI",
    "posologie": "3 à 10g",
    "actions": [
      "Tiédir le Centre",
      "Harmoniser l'Estomac",
      "Mobiliser le Qi",
      "Arrêter la douleur"
    ],
    "esprit": "Stagnation du qi dans le système digestif et intestinal (Rt, E, GI\nF, VB)",
    "prioritaire": false,
    "source": {
      "workbookSheet": "RQ",
      "detailTable": "RQ"
    }
  },
  {
    "id": "RQ5",
    "code": "RQ5",
    "classCode": "RQ",
    "classe": "SM qui régularisent la circulation du Qì",
    "classeIndex": "REGULARISENT LA CIRCULATION DU QI",
    "pinyin": "Shì dì",
    "pinyinSansTons": "Shi Di",
    "hanzi": "柿蒂",
    "nom": "Calice du fruit du plaqueminier ou Kaki",
    "nature": "Neutre / Equilibré",
    "saveur": "Amer, Astringent",
    "tropisme": "Estomac",
    "posologie": "5 à 10g",
    "actions": [
      "Abaisser l'inversion",
      "Faire descendre le QI",
      "Arrêter le hoquet"
    ],
    "esprit": "Hoquet",
    "prioritaire": true,
    "source": {
      "workbookSheet": "RQ",
      "detailTable": "RQ"
    },
    "classeEssentielle": "SM qui régularisent la circulation du qì"
  },
  {
    "id": "RQ6",
    "code": "RQ6",
    "classCode": "RQ",
    "classe": "SM qui régularisent la circulation du Qì",
    "classeIndex": "REGULARISENT LA CIRCULATION DU QI",
    "pinyin": "Xiāng fù",
    "pinyinSansTons": "Xiang Fu",
    "hanzi": "香附",
    "nom": "Rhizome séché du souchet rond",
    "nature": "Neutre / Equilibré",
    "saveur": "Piquant, Légèrement amer, Légèrement doux",
    "tropisme": "Foie, Rate, TF",
    "posologie": "5 à 10g",
    "actions": [
      "Régulariser le QI",
      "Détendre le Foie",
      "Arrêter la douleur",
      "Libérer la surpression",
      "Régulariser les règles"
    ],
    "esprit": "Syndrome de surpression et stagnation de qi du foie\nTroubles gynécologiques, digestifs par stagnation du qi du foie",
    "prioritaire": true,
    "source": {
      "workbookSheet": "RQ",
      "detailTable": "RQ"
    },
    "classeEssentielle": "SM qui régularisent la circulation du qì"
  },
  {
    "id": "RQ7",
    "code": "RQ7",
    "classCode": "RQ",
    "classe": "SM qui régularisent la circulation du Qì",
    "classeIndex": "REGULARISENT LA CIRCULATION DU QI",
    "pinyin": "Xiè bái",
    "pinyinSansTons": "Xie Bai",
    "hanzi": "薤白",
    "nom": "Bulbes séchés de 2 espèces d'aulx",
    "nature": "Tiède",
    "saveur": "Piquant, Amer",
    "tropisme": "Poumon, Cœur, Esto., GI",
    "posologie": "5 à 60g",
    "actions": [
      "Régulariser le QI",
      "Mobiliser le Qi",
      "Désobstruer le Yang",
      "Disperser la nouure",
      "Détendre la poitrine",
      "Conduire la stagnation"
    ],
    "esprit": "Stagnation du qi (obstruction thoracique (xiong bi), système\ndigestif) avec froid",
    "prioritaire": true,
    "source": {
      "workbookSheet": "RQ",
      "detailTable": "RQ"
    },
    "classeEssentielle": "SM qui régularisent la circulation du qì"
  },
  {
    "id": "RQ8",
    "code": "RQ8",
    "classCode": "RQ",
    "classe": "SM qui régularisent la circulation du Qì",
    "classeIndex": "REGULARISENT LA CIRCULATION DU QI",
    "pinyin": "Zhǐ shí",
    "pinyinSansTons": "Zhi Shi",
    "hanzi": "枳实",
    "nom": "Orange amère verte",
    "nature": "Froid",
    "saveur": "Amer, Piquant",
    "tropisme": "Rate, Esto., GI",
    "posologie": "3 à 10g",
    "actions": [
      "Casser le Qi",
      "Dissiper l'accumulation",
      "Transformer les mucosités",
      "Eliminer l'amas"
    ],
    "esprit": "Stagnation de qi (foyer central et inférieur) avec chaleur\nCasse le qi et les masses",
    "prioritaire": true,
    "source": {
      "workbookSheet": "RQ",
      "detailTable": "RQ"
    },
    "classeEssentielle": "SM qui régularisent la circulation du qì"
  },
  {
    "id": "TE1",
    "code": "TE1",
    "classCode": "TE",
    "classe": "SM qui tonifient le Qì",
    "classeIndex": "TONIFIENT L'ENERGIE",
    "pinyin": "Bái zhú",
    "pinyinSansTons": "Bai Zhu",
    "hanzi": "白术",
    "nom": "Racine séchée d'une atractyle",
    "nature": "Tiède",
    "saveur": "Doux, Amer",
    "tropisme": "Rate, Estomac",
    "posologie": "3 à 15g",
    "actions": [
      "Tonifier la Rate",
      "Soutenir l'Estomac",
      "Assécher l'Humidité",
      "Harmoniser le Centre",
      "Calmer le fœtus"
    ],
    "esprit": "humidité + vide de rate\nmenace d'avortement, leicorhée, sialorhée\nTypologie Bai Zhu: teint pâle\njaunâtre, terne +\npoches sous les yeux surtout les mtains",
    "prioritaire": true,
    "source": {
      "workbookSheet": "TE",
      "detailTable": "TE"
    },
    "classeEssentielle": "SM qui tonifient le qì"
  },
  {
    "id": "TE2",
    "code": "TE2",
    "classCode": "TE",
    "classe": "SM qui tonifient le Qì",
    "classeIndex": "TONIFIENT L'ENERGIE",
    "pinyin": "Dà zǎo",
    "pinyinSansTons": "Da Zao",
    "hanzi": "大枣",
    "nom": "Fruit mûr et séché du jujubier",
    "nature": "Tiède",
    "saveur": "Doux",
    "tropisme": "Rate, Estomac",
    "posologie": "9 à 15g",
    "actions": [
      "Tonifier la Rate",
      "Soutenir l'Estomac",
      "Soutenir le Qi",
      "Engendrer les liquides",
      "Harmoniser Ying Qi et Wei Qi",
      "Neutraliser la toxine des médicaments"
    ],
    "esprit": "harmonisation\nvide de qi et de sang\nying<3wei\nTypologie Da Zao: anorexie",
    "prioritaire": true,
    "source": {
      "workbookSheet": "TE",
      "detailTable": "TE"
    },
    "classeEssentielle": "SM qui tonifient le qì"
  },
  {
    "id": "TE3",
    "code": "TE3",
    "classCode": "TE",
    "classe": "SM qui tonifient le Qì",
    "classeIndex": "TONIFIENT L'ENERGIE",
    "pinyin": "Dǎng shēn",
    "pinyinSansTons": "Dang Shen",
    "hanzi": "党参",
    "nom": "Racine séchée de codonopsis pilosula \"ginseng des pauvres\"",
    "nature": "Neutre / Equilibré",
    "saveur": "Doux",
    "tropisme": "Rate, Poumon",
    "posologie": "6 à 15g",
    "actions": [
      "Harmoniser le Centre",
      "Soutenir le Qi",
      "Engendrer les liquides",
      "Enrichir le Sang",
      "Soutenir le Poumon"
    ],
    "esprit": "vide de qi et du sang\ntai yin\nplutot vide de yin\nginseng des pauvres\ntypologie : essoufflement\nballonnement, peu d’appétit\nfatigue, conjonctives pâles\nlangue pâle, fine, indentée",
    "prioritaire": true,
    "source": {
      "workbookSheet": "TE",
      "detailTable": "TE"
    },
    "classeEssentielle": "SM qui tonifient le qì"
  },
  {
    "id": "TE4",
    "code": "TE4",
    "classCode": "TE",
    "classe": "SM qui tonifient le Qì",
    "classeIndex": "TONIFIENT L'ENERGIE",
    "pinyin": "Fēng mì",
    "pinyinSansTons": "Feng Mi",
    "hanzi": "蜂蜜",
    "nom": "Miel de l'abeille asiatique",
    "nature": "Neutre/Equilibré",
    "saveur": "Doux",
    "tropisme": "Poumon, Rate, GI",
    "posologie": "15 à 30g",
    "actions": [
      "Tonifier le Centre",
      "Humidifier la sècheresse",
      "Arrêter la douleur",
      "Neutraliser la toxine"
    ],
    "esprit": "Amène les liquides + douceur\nneutralise toxines",
    "prioritaire": false,
    "source": {
      "workbookSheet": "TE",
      "detailTable": "TE"
    }
  },
  {
    "id": "TE5",
    "code": "TE5",
    "classCode": "TE",
    "classe": "SM qui tonifient le Qì",
    "classeIndex": "TONIFIENT L'ENERGIE",
    "pinyin": "Gān cǎo",
    "pinyinSansTons": "Gan Cao",
    "hanzi": "甘草",
    "nom": "Racine séchée d'une réglisse",
    "nature": "Neutre / Equilibré",
    "saveur": "Doux",
    "tropisme": "Rate, Estomac, Poumon",
    "posologie": "2 à 60g",
    "actions": [
      "Harmoniser le Centre",
      "Harmoniser les remèdes médicinaux",
      "Humidifier le Poumon",
      "Neutraliser la toxine",
      "Relâcher la tension"
    ],
    "esprit": "harmonise ttlmonde\ntoxine\ngorge\ncoeur\nspasme",
    "prioritaire": true,
    "source": {
      "workbookSheet": "TE",
      "detailTable": "TE"
    },
    "classeEssentielle": "SM qui tonifient le qì"
  },
  {
    "id": "TE6",
    "code": "TE6",
    "classCode": "TE",
    "classe": "SM qui tonifient le Qì",
    "classeIndex": "TONIFIENT L'ENERGIE",
    "pinyin": "Huáng qí",
    "pinyinSansTons": "Huang Qi",
    "hanzi": "黄芪",
    "nom": "Racine de l'astragale",
    "nature": "Tiède",
    "saveur": "Doux",
    "tropisme": "Rate, Poumon",
    "posologie": "9 à 30g",
    "actions": [
      "Tonifier le Qi",
      "Faire monter le Yang",
      "Soutenir le Poumon",
      "Affermir la surface",
      "Favoriser l'écoulement de l'eau et des urines",
      "Dissiper la tuméfaction (oedemes)",
      "Déloger la toxine",
      "Expulser le pus",
      "Refermer les plaies et régénérer les tissus"
    ],
    "esprit": "transpiration par vide de Qi\ncicatrisation de la peau\neffondrements, surface vide\nTypologie Huáng qí :\n-transpiration ++, jaunâtre, odorante, collante (transpire en\nmangeant) -vide de Qi, teint pâle, jaunâtre, fatigue\n-Gan mao fréquent avec crainte du vent, regard terne\n-tendance obésité comme ballon, corps lourd\n-musculature molle, relâchement musculaire\n-œdème, godet, rétention d’eau, abdomen gonflé, nombril profond\n-tendance à l’ulcère + affections cutanées chroniques qui\ns’enfoncent",
    "prioritaire": true,
    "source": {
      "workbookSheet": "TE",
      "detailTable": "TE"
    },
    "classeEssentielle": "SM qui tonifient le qì"
  },
  {
    "id": "TE7",
    "code": "TE7",
    "classCode": "TE",
    "classe": "SM qui tonifient le Qì",
    "classeIndex": "TONIFIENT L'ENERGIE",
    "pinyin": "Líng zhī",
    "pinyinSansTons": "Ling Zhi",
    "hanzi": "灵芝",
    "nom": "Fructification séchée du ganoderm luisant (Reishi)",
    "nature": "Neutre / Equilibré",
    "saveur": "Doux",
    "tropisme": "Poumon, Cœur, Rate, Reins",
    "posologie": "2 à 15g",
    "actions": [
      "Tonifier le Centre",
      "Soutenir le Qi",
      "Soutenir le Sang",
      "Calmer le Cœur et le Shen"
    ],
    "esprit": "seul qui nourrit tai yin — shao yin, shen\nanti-tumoral\n- Action de tonification sur les\nTrois Foyers (donc sur le corps)\n+ stimule l’acquis et l’inné",
    "prioritaire": false,
    "source": {
      "workbookSheet": "TE",
      "detailTable": "TE"
    }
  },
  {
    "id": "TE8",
    "code": "TE8",
    "classCode": "TE",
    "classe": "SM qui tonifient le Qì",
    "classeIndex": "TONIFIENT L'ENERGIE",
    "pinyin": "Rén shēn",
    "pinyinSansTons": "Ren Shen",
    "hanzi": "人参",
    "nom": "Racine séchée du ginseng",
    "nature": "Tiède",
    "saveur": "Doux, Légèrement amer",
    "tropisme": "Rate, Poumon",
    "posologie": "3 à 30g",
    "actions": [
      "Tonifier la Rate",
      "Engendrer les liquides",
      "Arrêter la soif",
      "Tonifier le Poumon",
      "Affermir l'échappement",
      "Calmer le Cœur et le Shen",
      "Tonifier fortement le Yuan Qi",
      "Renforcer l'intellect"
    ],
    "esprit": "Maître absolu de la tonification du Qi\népuisement du Qi et des liquides\nyuan qi, shen",
    "prioritaire": true,
    "source": {
      "workbookSheet": "TE",
      "detailTable": "TE"
    },
    "classeEssentielle": "SM qui tonifient le qì"
  },
  {
    "id": "TE9",
    "code": "TE9",
    "classCode": "TE",
    "classe": "SM qui tonifient le Qì",
    "classeIndex": "TONIFIENT L'ENERGIE",
    "pinyin": "Shān yào",
    "pinyinSansTons": "Shan Yao",
    "hanzi": "山药",
    "nom": "Rhizome séché de l'igname de Chine",
    "nature": "Neutre / Equilibré",
    "saveur": "Doux",
    "tropisme": "Poumon, Rate, Reins",
    "posologie": "15 à 250g",
    "actions": [
      "Tonifier la Rate",
      "Enrichir l'Estomac",
      "Engendrer les liquides",
      "Soutenir le Poumon",
      "Soutenir les Reins",
      "Réfréner le Jing"
    ],
    "esprit": "vide yin\nvide Rn\ndiabete",
    "prioritaire": false,
    "source": {
      "workbookSheet": "TE",
      "detailTable": "TE"
    }
  },
  {
    "id": "TE10",
    "code": "TE10",
    "classCode": "TE",
    "classe": "SM qui tonifient le Qì",
    "classeIndex": "TONIFIENT L'ENERGIE",
    "pinyin": "Tài zǐ shēn",
    "pinyinSansTons": "Tai Zhi Shen",
    "hanzi": "太子参",
    "nom": "Racine tubéreuse de pseudostellaria heterophylla \"Prince Ginseng\"",
    "nature": "Légèrement tiède",
    "saveur": "Doux, Amer",
    "tropisme": "Cœur, Rate, Poumon",
    "posologie": "9 à 30g",
    "actions": [
      "Tonifier la Rate",
      "Soutenir le Qi",
      "Engendrer les liquides",
      "Humidifier le Poumon"
    ],
    "esprit": "fievre de l'aprem\npervers qui reste coincé\nconvalescence",
    "prioritaire": false,
    "source": {
      "workbookSheet": "TE",
      "detailTable": "TE"
    }
  },
  {
    "id": "TE11",
    "code": "TE11",
    "classCode": "TE",
    "classe": "SM qui tonifient le Qì",
    "classeIndex": "TONIFIENT L'ENERGIE",
    "pinyin": "Xī yáng shēn",
    "pinyinSansTons": "Xi Yang Shen",
    "hanzi": "西洋参",
    "nom": "Racine séchée du ginseng américain",
    "nature": "Froid",
    "saveur": "Doux, Légèrement Amer",
    "tropisme": "Poumon, Estomac, Cœur, Reins",
    "posologie": "3 à 6g",
    "actions": [
      "Tonifier le Qi",
      "Engendrer les liquides",
      "Arrêter la soif",
      "Enrichir le Yin",
      "Soutenir le Yin du Poumon",
      "Clarifier le Feu vide"
    ],
    "esprit": "vide de qi avec chaleur\nsecheresse P",
    "prioritaire": false,
    "source": {
      "workbookSheet": "TE",
      "detailTable": "TE"
    }
  },
  {
    "id": "TI1",
    "code": "TI1",
    "classCode": "TI",
    "classe": "SM qui tiédissent l’interne",
    "classeIndex": "TIEDISSENT L'INTERNE",
    "pinyin": "Fù zǐ",
    "pinyinSansTons": "Fu Zi",
    "hanzi": "附子",
    "nom": "Racine secondaire de l'Aconit",
    "nature": "Chaud, Toxique",
    "saveur": "Piquant, Doux",
    "tropisme": "Cœur, Rate, Reins",
    "posologie": "3 à 30 g",
    "actions": [
      "Faire revenir le Yang",
      "Délivrer de l'inversion",
      "Tonifier le Feu",
      "Assister le Yang",
      "Disperser le Froid",
      "Eliminer l'Humidité",
      "Arrêter la douleur"
    ],
    "esprit": "Revenir yang ++, Collapsus yang, vide yang, froid humidité, obstruction bi",
    "prioritaire": true,
    "source": {
      "workbookSheet": "TI",
      "detailTable": "TI"
    },
    "classeEssentielle": "SM qui réchauffent l'intérieur et expulsent le froid"
  },
  {
    "id": "TI2",
    "code": "TI2",
    "classCode": "TI",
    "classe": "SM qui tiédissent l’interne",
    "classeIndex": "TIEDISSENT L'INTERNE",
    "pinyin": "Gān jiāng",
    "pinyinSansTons": "Gan Jiang",
    "hanzi": "干姜",
    "nom": "Gingembre séché",
    "nature": "Chaud",
    "saveur": "Piquant",
    "tropisme": "Rate, Estomac, Cœur, Poumon",
    "posologie": "3 à 10 g",
    "actions": [
      "Faire revenir le Yang",
      "Disperser le Froid",
      "Tiédir le centre",
      "Tiédir le Poumon",
      "Expulser les mucosités",
      "Désobstruer les vaisseaux"
    ],
    "esprit": "Revenir Yang +, Froid rate estomac, epuisement yang, froid liquides poumon\nREVENIR YANG: FZ + GJ se potentialisent SI NI TANG",
    "prioritaire": true,
    "source": {
      "workbookSheet": "TI",
      "detailTable": "TI"
    },
    "classeEssentielle": "SM qui réchauffent l'intérieur et expulsent le froid"
  },
  {
    "id": "TI3",
    "code": "TI3",
    "classCode": "TI",
    "classe": "SM qui tiédissent l’interne",
    "classeIndex": "TIEDISSENT L'INTERNE",
    "pinyin": "Gāo liáng jiāng",
    "pinyinSansTons": "Gao Liang Jiang",
    "hanzi": "高良姜",
    "nom": "Galanga",
    "nature": "Chaud",
    "saveur": "Piquant",
    "tropisme": "Rate, Estomac",
    "posologie": "3 à 6 g",
    "actions": [
      "Disperser le Froid",
      "Arrêter la douleur",
      "Tiédir l'Estomac",
      "Chasser le Vent",
      "Mobiliser le Qi"
    ],
    "esprit": "Froid douleur estomac (Main sur le ventre), vomissements",
    "prioritaire": false,
    "source": {
      "workbookSheet": "TI",
      "detailTable": "TI"
    }
  },
  {
    "id": "TI4",
    "code": "TI4",
    "classCode": "TI",
    "classe": "SM qui tiédissent l’interne",
    "classeIndex": "TIEDISSENT L'INTERNE",
    "pinyin": "Hú jiāo",
    "pinyinSansTons": "Hu Jiao",
    "hanzi": "胡椒",
    "nom": "Poivre noir",
    "nature": "Chaud",
    "saveur": "Piquant",
    "tropisme": "Estomac, Gros Intestin",
    "posologie": "1 à 3g",
    "actions": [
      "Tiédir le centre",
      "Expulser les mucosités",
      "Abaisser le Qi",
      "Neutraliser la toxicité"
    ],
    "esprit": "Rechauffe estomac, stimule appetit, douleurs, vomissements, diarrhées — epilepsie mucosités, BI\nen externe",
    "prioritaire": false,
    "source": {
      "workbookSheet": "TI",
      "detailTable": "TI"
    }
  },
  {
    "id": "TI5",
    "code": "TI5",
    "classCode": "TI",
    "classe": "SM qui tiédissent l’interne",
    "classeIndex": "TIEDISSENT L'INTERNE",
    "pinyin": "Huā jiāo",
    "pinyinSansTons": "Hua Jiao",
    "hanzi": "花椒",
    "nom": "Poivre du Sichuan",
    "nature": "Tiède, Toxique",
    "saveur": "Piquant",
    "tropisme": "Rate, Poumon, Reins",
    "posologie": "3 à 6 g",
    "actions": [
      "Disperser le Froid",
      "Eliminer l'Humidité",
      "Arrêter la douleur",
      "Tiédir le centre",
      "Tuer les parasites",
      "Neutraliser les toxines des poissons"
    ],
    "esprit": "Froid humidité estomac, vomissements, diarrhées parasites, eczema prurit genitaux (ext)",
    "prioritaire": false,
    "source": {
      "workbookSheet": "TI",
      "detailTable": "TI"
    }
  },
  {
    "id": "TI6",
    "code": "TI6",
    "classCode": "TI",
    "classe": "SM qui tiédissent l’interne",
    "classeIndex": "TIEDISSENT L'INTERNE",
    "pinyin": "Ròu guì",
    "pinyinSansTons": "Rou Gui",
    "hanzi": "肉桂",
    "nom": "Ecorce séchée de cannelier de Chine",
    "nature": "Chaud",
    "saveur": "Piquant, Doux",
    "tropisme": "Reins, Cœur, Rate, Vessie",
    "posologie": "0,5 à 5 g",
    "actions": [
      "Tonifier le Feu",
      "Assister le Yang",
      "Tonifier le Yang originel",
      "Disperser le Froid",
      "Arrêter la douleur",
      "Tiédir les canaux",
      "Tiédir le centre",
      "Eliminer les accumulations de Froid",
      "Désobstruer les vaisseaux",
      "Désobstruer les vaisseaux sanguins"
    ],
    "esprit": "Vides de yang, douleurs froid partout, congestion duê au froid avec stase sang et/ou mucosités\nyang flottant Ramene feu à sa source (coeur reins), syndromes vide qi et sang, uterus (chong mai\nren mai prennent leur source dans ming men)",
    "prioritaire": false,
    "source": {
      "workbookSheet": "TI",
      "detailTable": "TI"
    }
  },
  {
    "id": "TI7",
    "code": "TI7",
    "classCode": "TI",
    "classe": "SM qui tiédissent l’interne",
    "classeIndex": "TIEDISSENT L'INTERNE",
    "pinyin": "Wú zhū yú",
    "pinyinSansTons": "Wu Zhu Yu",
    "hanzi": "吴茱萸",
    "nom": "Fruit de l'Evodia Rutaecarpa",
    "nature": "Chaud, Légèrement toxique",
    "saveur": "Piquant, Amer",
    "tropisme": "Foie, Estomac, Rate, Gros Intestin, Reins",
    "posologie": "1,5 à 5 g",
    "actions": [
      "Assister le Yang",
      "Disperser le Froid",
      "Eliminer l'Humidité",
      "Arrêter la douleur",
      "Tiédir le centre",
      "Disperser le Foie",
      "Mettre en ordre le QI",
      "Arrêter la diarrhée",
      "Arrêter les vomissements"
    ],
    "esprit": "Douleurs froid (y compris foie), vomissements froid (dysharmonie F/E)), diarrhée froid humidité\neczema ulceres exsudation",
    "prioritaire": false,
    "source": {
      "workbookSheet": "TI",
      "detailTable": "TI"
    }
  },
  {
    "id": "TI8",
    "code": "TI8",
    "classCode": "TI",
    "classe": "SM qui tiédissent l’interne",
    "classeIndex": "TIEDISSENT L'INTERNE",
    "pinyin": "Xiǎo huí xiāng",
    "pinyinSansTons": "Xiao Hui Xiang",
    "hanzi": "小茴香",
    "nom": "Fruit du fenouil",
    "nature": "Tiède",
    "saveur": "Piquant",
    "tropisme": "Foie, Reins, Rate, Estomac",
    "posologie": "3 à 9 g",
    "actions": [
      "Disperser le Froid",
      "Arrêter la douleur",
      "Harmoniser l'Estomac",
      "Mettre en ordre le QI"
    ],
    "esprit": "Mini Wu Zhu Yu\nHernie, orchidoptose, douleurs froid/ stag qi foie (yan zhi), dysménorrhées, froid et stagnation\ncentre",
    "prioritaire": false,
    "source": {
      "workbookSheet": "TI",
      "detailTable": "TI"
    }
  },
  {
    "id": "TS1",
    "code": "TS1",
    "classCode": "TS",
    "classe": "SM qui tonifient le Sang",
    "classeIndex": "TONIFIENT LE SANG",
    "pinyin": "Bái sháo",
    "pinyinSansTons": "Bai Shao",
    "hanzi": "白芍",
    "nom": "Racine séchée de la pivoine de Chine",
    "nature": "Légèrement Froid",
    "saveur": "Amer, Acide",
    "tropisme": "Foie, Rate",
    "posologie": "5 à 30g",
    "actions": [
      "Nourrir le Sang",
      "Assouplir le Foie",
      "Relâcher le Centre",
      "Arrêter la douleur",
      "Retenir le Yin",
      "Rassembler la transpiration"
    ],
    "esprit": "Sang (vide, stase, chaleur)\nHyperactivité du yang du foie avec vide de yin du foie",
    "prioritaire": true,
    "source": {
      "workbookSheet": "TS",
      "detailTable": "TS"
    },
    "classeEssentielle": "SM qui tonifient le sang"
  },
  {
    "id": "TS2",
    "code": "TS2",
    "classCode": "TS",
    "classe": "SM qui tonifient le Sang",
    "classeIndex": "TONIFIENT LE SANG",
    "pinyin": "Dāng guī",
    "pinyinSansTons": "Dang Gui",
    "hanzi": "当归",
    "nom": "Racine séchée de l'angélique chinoise",
    "nature": "Tiède",
    "saveur": "Doux, Piquant selon certain.es amer",
    "tropisme": "Foie, Cœur, Rate",
    "posologie": "6 à 12g",
    "actions": [
      "Tonifier (la production du) le Sang",
      "Activer le Sang",
      "Harmoniser les règles",
      "Arrêter les douleurs",
      "Humidifier les intestins",
      "Désobstruer les selles"
    ],
    "esprit": "Vide de sang avec ou sans stase",
    "prioritaire": true,
    "source": {
      "workbookSheet": "TS",
      "detailTable": "TS"
    },
    "classeEssentielle": "SM qui tonifient le sang"
  },
  {
    "id": "TS3",
    "code": "TS3",
    "classCode": "TS",
    "classe": "SM qui tonifient le Sang",
    "classeIndex": "TONIFIENT LE SANG",
    "pinyin": "Ē jiāo",
    "pinyinSansTons": "E Jiao",
    "hanzi": "阿胶",
    "nom": "Colle noire, gélatine à partir de peau d'âne",
    "nature": "Neutre / Equilibré",
    "saveur": "Doux",
    "tropisme": "Poumon, Foie, Reins",
    "posologie": "5 à 10g",
    "actions": [
      "Tonifier (la production du) le Sang",
      "Nourrir le Yin",
      "Humidifier la sècheresse",
      "Arrêter les saignements",
      "Calmer le fœtus"
    ],
    "esprit": "Vide de sang/yin\nHémorragies (chaleur vide)",
    "prioritaire": false,
    "source": {
      "workbookSheet": "TS",
      "detailTable": "TS"
    }
  },
  {
    "id": "TS4",
    "code": "TS4",
    "classCode": "TS",
    "classe": "SM qui tonifient le Sang",
    "classeIndex": "TONIFIENT LE SANG",
    "pinyin": "Hé shǒu wū",
    "pinyinSansTons": "He Shou Wu",
    "hanzi": "何首乌",
    "nom": "Racine tubéreuse séchée de renouée à fleurs multiples",
    "nature": "Tiède",
    "saveur": "Amer, Doux, Astringent",
    "tropisme": "Foie, Cœur, Reins",
    "posologie": "10 à 20g",
    "actions": [
      "Nourrir le Sang",
      "Expulser le Vent",
      "Tonifier le Foie",
      "Soutenir les Reins"
    ],
    "esprit": "Syndromes de vide de sang du foie et du jing des reins",
    "prioritaire": false,
    "source": {
      "workbookSheet": "TS",
      "detailTable": "TS"
    }
  },
  {
    "id": "TS5",
    "code": "TS5",
    "classCode": "TS",
    "classe": "SM qui tonifient le Sang",
    "classeIndex": "TONIFIENT LE SANG",
    "pinyin": "Lóng yǎn ròu",
    "pinyinSansTons": "Long Yan Rou",
    "hanzi": "龙眼肉",
    "nom": "Fruit mûr séché du longanier",
    "nature": "Tiède",
    "saveur": "Doux",
    "tropisme": "Cœur, Rate",
    "posologie": "10 à 60g",
    "actions": [
      "Tonifier (la production du) le Sang",
      "Tonifier le Qi",
      "Soutenir le Cœur",
      "Soutenir la Rate",
      "Calmer le Shen"
    ],
    "esprit": "Syndromes de vide de qi de la rate et de sang du cœur",
    "prioritaire": false,
    "source": {
      "workbookSheet": "TS",
      "detailTable": "TS"
    }
  },
  {
    "id": "TS6",
    "code": "TS6",
    "classCode": "TS",
    "classe": "SM qui tonifient le Sang",
    "classeIndex": "TONIFIENT LE SANG",
    "pinyin": "Shú dì huáng",
    "pinyinSansTons": "Shu Di Huang",
    "hanzi": "熟地黄",
    "nom": "Racine séchée de rhemannia",
    "nature": "Tiède",
    "saveur": "Doux",
    "tropisme": "Foie, Reins",
    "posologie": "10 à 30g",
    "actions": [
      "Tonifier (la production du) le Sang",
      "Nourrir le Yin",
      "Soutenir le jing",
      "Remplir les moelles"
    ],
    "esprit": "Sang, yin, jing (nutrition)",
    "prioritaire": false,
    "source": {
      "workbookSheet": "TS",
      "detailTable": "TS"
    }
  },
  {
    "id": "TTD1",
    "code": "TTD1",
    "classCode": "TTD",
    "classe": "SM qui transforment le Tán, arrêtent la toux et apaisent la dyspnée",
    "classeIndex": "TRANSFORMENT LE TAN, ARRETENT LA TOUX, APAISENT LA DYSPNEE",
    "pinyin": "Bàn xià",
    "pinyinSansTons": "Ban Xia",
    "hanzi": "半夏",
    "nom": "Rhizome tubéreux de Pinellia ternata",
    "nature": "tiède, toxique",
    "saveur": "piquant",
    "tropisme": "rate, estomac, poumon",
    "posologie": "Usage interne en prise orale : 3 à 9 g en décoction ; possibilité de confectionner des pilules et des poudres.\nUsage externe : quantité appropriée ; broyer le produit frais, mélanger à de l’eau, de l’alcool ou du vinaigre et enduire.",
    "actions": [
      "Assécher l’humidité et transformer les mucosités.",
      "Faire descendre l’inversion et arrêter les vomissements.",
      "Ramollir et disperser les indurations.",
      "Réduire le gonflement et arrêter la douleur en usage externe."
    ],
    "esprit": "Mucosités humidité\nNausées et vomissements (mucosités)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "INDEX PAR CLASSES",
      "detailTable": "TTD"
    },
    "missingDetailedSheet": false,
    "classeEssentielle": "SM qui transforment le tán et arrête la toux",
    "indications": "Mucosités humidité avec toux, expectorations abondantes, oppression thoracique, vertiges ou palpitations liés aux mucosités.\nInversion du qì de l’estomac avec nausées et vomissements.\nSyndrome du noyau de prune, nodosités, abcès et gonflements en usage externe.",
    "contre_indications": "Vide de yīn, lésions des liquides avec bouche sèche, syndromes du sang et mucosités sècheresse.\nIncompatible avec les substances provenant d’aconites ; également incompatible avec la viande de mouton, le sang de mouton et yí táng selon le cours.",
    "preparation": "Bàn xià cru : usage externe seulement en raison de sa toxicité.\nBàn xià préparé au gingembre : usage interne pour tiédir le centre, assécher l’humidité et transformer les mucosités.\nQīng bàn xià : préparation avec bái fán, forme très asséchante.\nFǎ bàn xià : préparation avec chaux et réglisse, utile pour renforcer la rate et harmoniser l’estomac.",
    "incompleteFields": [],
    "detailSource": "00_DOCUMENTATION_TOUT SM.pdf — section SM qui transforment le tán, arrêtent la toux et apaisent la dyspnée"
  },
  {
    "id": "TTD2",
    "code": "TTD2",
    "classCode": "TTD",
    "classe": "SM qui transforment le Tán, arrêtent la toux et apaisent la dyspnée",
    "classeIndex": "TRANSFORMENT LE TAN, ARRETENT LA TOUX, APAISENT LA DYSPNEE",
    "pinyin": "Chuān bèi mǔ",
    "pinyinSansTons": "Chuan Bei Mu",
    "hanzi": "川贝母",
    "nom": "Bulbe séché de la fritillaire cireuse",
    "nature": "légèrement froid",
    "saveur": "amer, doux",
    "tropisme": "poumon, cœur",
    "posologie": "3 à 9 g en décoction ; possibilité de confectionner des pilules et des poudres.",
    "actions": [
      "Clarifier la chaleur et transformer les mucosités.",
      "Humidifier le poumon et arrêter la toux.",
      "Disperser les nodosités et réduire le gonflement."
    ],
    "esprit": "Toux sèche (vide de yin du poumon)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "INDEX PAR CLASSES",
      "detailTable": "TTD"
    },
    "missingDetailedSheet": false,
    "classeEssentielle": "SM qui transforment le tán et arrête la toux",
    "indications": "Toux par chaleur du poumon, sécheresse du poumon ou vide de yīn avec mucosités peu abondantes, sèches ou difficiles à expectorer.\nScrofule, nodosités, abcès ou gonflements liés aux mucosités chaleur.",
    "contre_indications": "Toux par froid humidité ou mucosités froides. Incompatible avec les substances provenant d’aconites selon les règles classiques des bèi mǔ.",
    "preparation": "Aucune préparation particulière dans la fiche de base.",
    "incompleteFields": [],
    "detailSource": "00_DOCUMENTATION_TOUT SM.pdf — section SM qui transforment le tán, arrêtent la toux et apaisent la dyspnée"
  },
  {
    "id": "TTD3",
    "code": "TTD3",
    "classCode": "TTD",
    "classe": "SM qui transforment le Tán, arrêtent la toux et apaisent la dyspnée",
    "classeIndex": "TRANSFORMENT LE TAN, ARRETENT LA TOUX, APAISENT LA DYSPNEE",
    "pinyin": "Guā lóu",
    "pinyinSansTons": "Gua Lou",
    "hanzi": "栝蒌",
    "nom": "Fruit mûr et séché du concombre chinois",
    "nature": "froid",
    "saveur": "doux, légèrement amer",
    "tropisme": "poumon, estomac, gros intestin",
    "posologie": "9 à 15 g en décoction ; adapter selon la partie utilisée.",
    "actions": [
      "Clarifier la chaleur et transformer les mucosités.",
      "Détendre la poitrine et dissiper les nodosités.",
      "Humidifier les intestins et débloquer les selles."
    ],
    "esprit": "Poumon (chaleur vide ou plénitude)\nConstipation\nObstruction de la poitrine (Xiong Bi)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "INDEX PAR CLASSES",
      "detailTable": "TTD"
    },
    "missingDetailedSheet": false,
    "classeEssentielle": "SM qui transforment le tán et arrête la toux",
    "indications": "Toux par mucosités chaleur, expectorations épaisses, oppression ou douleur thoracique.\nObstruction de la poitrine, xiong bi, nodosités ou abcès du poumon / du sein.\nConstipation par sécheresse des intestins.",
    "contre_indications": "Prudence en cas de froid vide de la rate et de l’estomac ou de diarrhée.",
    "preparation": "Généralement utilisé en fruit entier ou selon les parties : guā lóu pí, guā lóu rén, quán guā lóu.",
    "incompleteFields": [],
    "detailSource": "00_DOCUMENTATION_TOUT SM.pdf — section SM qui transforment le tán, arrêtent la toux et apaisent la dyspnée"
  },
  {
    "id": "TTD4",
    "code": "TTD4",
    "classCode": "TTD",
    "classe": "SM qui transforment le Tán, arrêtent la toux et apaisent la dyspnée",
    "classeIndex": "TRANSFORMENT LE TAN, ARRETENT LA TOUX, APAISENT LA DYSPNEE",
    "pinyin": "Jié gěng",
    "pinyinSansTons": "Jie Geng",
    "hanzi": "桔梗",
    "nom": "Racine séchée de la campanule à grandes fleurs",
    "nature": "neutre",
    "saveur": "amer, piquant",
    "tropisme": "poumon",
    "posologie": "3 à 10 g en décoction.",
    "actions": [
      "Ouvrir et diffuser le qì du poumon.",
      "Chasser les mucosités et arrêter la toux.",
      "Assouplir la gorge et favoriser la voix.",
      "Expulser le pus."
    ],
    "esprit": "Poumon, gorge, toux",
    "prioritaire": true,
    "source": {
      "workbookSheet": "INDEX PAR CLASSES",
      "detailTable": "TTD"
    },
    "missingDetailedSheet": false,
    "classeEssentielle": "SM qui transforment le tán et arrête la toux",
    "indications": "Toux avec mucosités, oppression de la poitrine, douleur et gonflement de la gorge, aphonie.\nAbcès du poumon avec expectorations purulentes.",
    "contre_indications": "Prudence en cas d’hémoptysie ou de toux chronique par vide sans mucosités.",
    "preparation": "Aucune préparation particulière dans la fiche de base.",
    "incompleteFields": [],
    "detailSource": "00_DOCUMENTATION_TOUT SM.pdf — section SM qui transforment le tán, arrêtent la toux et apaisent la dyspnée"
  },
  {
    "id": "TTD5",
    "code": "TTD5",
    "classCode": "TTD",
    "classe": "SM qui transforment le Tán, arrêtent la toux et apaisent la dyspnée",
    "classeIndex": "TRANSFORMENT LE TAN, ARRETENT LA TOUX, APAISENT LA DYSPNEE",
    "pinyin": "Bái jiè zǐ",
    "pinyinSansTons": "Bai Jie Zi",
    "hanzi": "白芥子",
    "nom": "Graine mûre et séchée de 2 sortes de moutarde",
    "nature": "tiède",
    "saveur": "piquant",
    "tropisme": "poumon",
    "posologie": "3 à 6 g en décoction ; usage externe : quantité appropriée, souvent en poudre.",
    "actions": [
      "Tiédir le poumon, mettre en ordre le qì et chasser les mucosités.",
      "Mettre en ordre le qì, disperser les indurations et dissiper la tuméfaction.",
      "Désobstruer les liaisons et arrêter la douleur."
    ],
    "esprit": "Toux par mucosités froides\nObstructions bi (vent froid humidité avec mucosités)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "INDEX PAR CLASSES",
      "detailTable": "TTD"
    },
    "missingDetailedSheet": false,
    "classeEssentielle": "SM qui transforment le tán et arrête la toux",
    "indications": "Mucosités froides qui bloquent le poumon avec toux, dyspnée et expectorations claires, liquides et abondantes.\nRétention de mucosités dans le thorax et le diaphragme avec plénitude, distension ou douleur.\nAbcès froids de type yīn, scrofule, nodosités sous-cutanées, douleurs et engourdissements par mucosités dans les canaux.",
    "contre_indications": "Toux par vide du poumon, toux par chaleur ou mucosités chaleur ; prudence car la substance est piquante et dispersante.",
    "preparation": "Peut être utilisée en poudre, notamment en application externe avec vinaigre selon l’indication.",
    "incompleteFields": [],
    "detailSource": "00_DOCUMENTATION_TOUT SM.pdf — section SM qui transforment le tán, arrêtent la toux et apaisent la dyspnée"
  },
  {
    "id": "TTD6",
    "code": "TTD6",
    "classCode": "TTD",
    "classe": "SM qui transforment le Tán, arrêtent la toux et apaisent la dyspnée",
    "classeIndex": "TRANSFORMENT LE TAN, ARRETENT LA TOUX, APAISENT LA DYSPNEE",
    "pinyin": "Kǔ xìng rén",
    "pinyinSansTons": "Ku Xing Ren",
    "hanzi": "苦杏仁",
    "nom": "Amande amère mûre et séchée de plusieurs abricotiers",
    "nature": "légèrement tiède, légèrement toxique",
    "saveur": "amer",
    "tropisme": "poumon, gros intestin",
    "posologie": "5 à 10 g en décoction ; écraser avant décoction.",
    "actions": [
      "Arrêter la toux et calmer la dyspnée.",
      "Humidifier les intestins et débloquer les selles."
    ],
    "esprit": "Toux\nConstipation (sécheresse)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "INDEX PAR CLASSES",
      "detailTable": "TTD"
    },
    "missingDetailedSheet": false,
    "classeEssentielle": "SM qui transforment le tán et arrête la toux",
    "indications": "Toux et dyspnée par attaque externe ou atteinte interne, qu’elles soient de type froid, chaleur, vide ou plénitude.\nConstipation par sécheresse des intestins.",
    "contre_indications": "Prudence chez le nourrisson et en cas de diarrhée ; ne pas surdoser en raison de la toxicité potentielle.",
    "preparation": "Souvent écrasée avant décoction ; peut être utilisée préparée pour réduire l’irritation.",
    "incompleteFields": [],
    "detailSource": "00_DOCUMENTATION_TOUT SM.pdf — section SM qui transforment le tán, arrêtent la toux et apaisent la dyspnée"
  },
  {
    "id": "TTD7",
    "code": "TTD7",
    "classCode": "TTD",
    "classe": "SM qui transforment le Tán, arrêtent la toux et apaisent la dyspnée",
    "classeIndex": "TRANSFORMENT LE TAN, ARRETENT LA TOUX, APAISENT LA DYSPNEE",
    "pinyin": "Kūn bù",
    "pinyinSansTons": "Kun Bu",
    "hanzi": "昆布",
    "nom": "Grande algue brune (Thalle séché d'ecklonia kurome)",
    "nature": "froid",
    "saveur": "salé",
    "tropisme": "foie, estomac, reins",
    "posologie": "6 à 12 g en décoction.",
    "actions": [
      "Transformer les mucosités et ramollir les indurations.",
      "Favoriser l’écoulement de l’eau et dissiper l’œdème."
    ],
    "esprit": "Masses (indurations, nodosités)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "INDEX PAR CLASSES",
      "detailTable": "TTD"
    },
    "missingDetailedSheet": false,
    "classeEssentielle": "SM qui transforment le tán et arrête la toux",
    "indications": "Goitre, scrofule, nodosités et masses par accumulation de mucosités.\nŒdème, gonflement et dysurie.",
    "contre_indications": "Prudence en cas de froid vide de la rate et de l’estomac.",
    "preparation": "Aucune préparation particulière dans la fiche de base.",
    "incompleteFields": [],
    "detailSource": "00_DOCUMENTATION_TOUT SM.pdf — section SM qui transforment le tán, arrêtent la toux et apaisent la dyspnée"
  },
  {
    "id": "TTD8",
    "code": "TTD8",
    "classCode": "TTD",
    "classe": "SM qui transforment le Tán, arrêtent la toux et apaisent la dyspnée",
    "classeIndex": "TRANSFORMENT LE TAN, ARRETENT LA TOUX, APAISENT LA DYSPNEE",
    "pinyin": "Pàng dà hǎi",
    "pinyinSansTons": "Pang Da Hai",
    "hanzi": "胖大海",
    "nom": "Graine mûre et séchée de la scaphiglotte",
    "nature": "froid",
    "saveur": "doux",
    "tropisme": "poumon, gros intestin",
    "posologie": "2 à 3 pièces en infusion ou décoction légère ; souvent laissé gonfler dans l’eau chaude.",
    "actions": [
      "Clarifier et diffuser le poumon.",
      "Assouplir la gorge et ouvrir la voix.",
      "Humidifier les intestins et débloquer les selles."
    ],
    "esprit": "Douleur de la gorge, enrouement (chaleur plénitude ou vide)",
    "prioritaire": false,
    "source": {
      "workbookSheet": "INDEX PAR CLASSES",
      "detailTable": "TTD"
    },
    "missingDetailedSheet": false,
    "indications": "Douleur de gorge, aphonie, enrouement par chaleur du poumon ou sécheresse.\nToux sèche, gorge sèche.\nConstipation par chaleur ou sécheresse des intestins.",
    "contre_indications": "Prudence en cas de diarrhée ou de froid vide de la rate.",
    "preparation": "Faire gonfler dans l’eau chaude ; ne nécessite pas de décoction longue.",
    "incompleteFields": [],
    "detailSource": "00_DOCUMENTATION_TOUT SM.pdf — section SM qui transforment le tán, arrêtent la toux et apaisent la dyspnée"
  },
  {
    "id": "TTD9",
    "code": "TTD9",
    "classCode": "TTD",
    "classe": "SM qui transforment le Tán, arrêtent la toux et apaisent la dyspnée",
    "classeIndex": "TRANSFORMENT LE TAN, ARRETENT LA TOUX, APAISENT LA DYSPNEE",
    "pinyin": "Tiān nán xīng",
    "pinyinSansTons": "Tian Nan Xing",
    "hanzi": "天南星",
    "nom": "Tubercule séché de différents arisèmes",
    "nature": "tiède, toxique",
    "saveur": "amer, piquant",
    "tropisme": "poumon, foie, rate",
    "posologie": "Usage interne en prise orale : 3 à 9 g en décoction ; généralement utilisé en préparation en raison de sa toxicité ; possibilité de confectionner des pilules et des poudres (0,3 à 1 g par prise).\nUsage externe : généralement utilisé en produit cru sans préparation ; quantité appropriée ; broyer en poudre fine, mélanger à du vinaigre ou du vin puis appliquer.",
    "actions": [
      "Assécher l’humidité et transformer les mucosités.",
      "Expulser le vent et arrêter les spasmes.",
      "Disperser la nouure et réduire le gonflement."
    ],
    "esprit": "Toux (mucosités froid et/ou humidité)\nMucosités vent\nAssèche l’humidité, transforme les mucosités, expulse le vent, arrête les spasmes.\nForme crue : vent / mucosités vent / convulsions.\nPréparé bái fán + shēng jiāng : humidité et mucosités.\nPréparé avec bile : mucosités chaleur.",
    "prioritaire": true,
    "source": {
      "workbookSheet": "INDEX PAR CLASSES",
      "detailTable": "TTD"
    },
    "missingDetailedSheet": false,
    "classeEssentielle": "SM qui transforment le tán et arrête la toux",
    "indications": "Toux ou dyspnée par mucosités humidité obstruant le poumon ; obstruction du poumon par les mucosités humidité ; toux due aux mucosités chaleur ; toux due aux mucosités froid.\nSyndrome de mucosités vent, hémiplégie suite à un AVC, paralysie faciale suite à un AVC, vertiges dus aux mucosités vent, épilepsie provoquée par l’obstruction des orifices par les mucosités et l’humidité trouble, convulsions du tétanos.\nAbcès, furoncle très enraciné avec douleur et gonflement ; intoxication par une morsure de serpent.",
    "contre_indications": "Vide de yīn avec mucosités sècheresse.\nFemme enceinte.",
    "preparation": "Tiān nán xīng cru sans préparation : disperse le vent, les mucosités vent et arrête les convulsions.\nTiān nán xīng préparé avec bái fán et shēng jiāng : assèche l’humidité et transforme les mucosités.\nTiān nán xīng préparé avec bái fán et de la bile de porc : traite les mucosités chaleur.",
    "incompleteFields": [],
    "detailSource": "00_DOCUMENTATION_TOUT SM.pdf — section Tiān nán xīng, p. 29–33"
  },
  {
    "id": "TTD10",
    "code": "TTD10",
    "classCode": "TTD",
    "classe": "SM qui transforment le Tán, arrêtent la toux et apaisent la dyspnée",
    "classeIndex": "TRANSFORMENT LE TAN, ARRETENT LA TOUX, APAISENT LA DYSPNEE",
    "pinyin": "Dǎn nán xīng",
    "pinyinSansTons": "Dan Nan Xing",
    "hanzi": "胆南星",
    "nom": "Tian nan xing préparé à la bile de bœuf",
    "nature": "frais",
    "saveur": "amer, légèrement piquant",
    "tropisme": "poumon, foie, rate",
    "posologie": "3 à 6 g en décoction ; possibilité de confectionner des pilules ou des poudres ; en teinture : 0,5 à 2 ml.",
    "actions": [
      "Clarifier la chaleur et transformer les mucosités.",
      "Éteindre le vent et apaiser la frayeur."
    ],
    "esprit": "",
    "prioritaire": false,
    "source": {
      "workbookSheet": "INDEX PAR CLASSES",
      "detailTable": "TTD"
    },
    "missingDetailedSheet": false,
    "indications": "Toux avec expectorations jaunes, collantes, épaisses et abondantes par mucosités chaleur du poumon ; usage fréquent en pédiatrie.\nMucosités chaleur avec frayeur, convulsions ou agitation.",
    "contre_indications": "Prudence en cas de froid ou de mucosités froides.",
    "preparation": "Tiān nán xīng préparé avec de la bile de bœuf ou de porc ; la qualité augmente avec la durée de stockage.",
    "incompleteFields": [],
    "detailSource": "00_DOCUMENTATION_TOUT SM.pdf — section SM qui transforment le tán, arrêtent la toux et apaisent la dyspnée"
  },
  {
    "id": "TTD11",
    "code": "TTD11",
    "classCode": "TTD",
    "classe": "SM qui transforment le Tán, arrêtent la toux et apaisent la dyspnée",
    "classeIndex": "TRANSFORMENT LE TAN, ARRETENT LA TOUX, APAISENT LA DYSPNEE",
    "pinyin": "Tiān zhú huáng",
    "pinyinSansTons": "Tian Zhu Huang",
    "hanzi": "天竺黄",
    "nom": "Sucre de bambou",
    "nature": "froid",
    "saveur": "doux",
    "tropisme": "cœur, foie, vésicule biliaire",
    "posologie": "3 à 9 g en décoction ; possibilité de confectionner des pilules ou des poudres.",
    "actions": [
      "Clarifier la chaleur et transformer les mucosités.",
      "Clarifier le cœur et apaiser la frayeur.",
      "Éteindre le vent et calmer les convulsions."
    ],
    "esprit": "Obstruction des orifices du cœur (mucosités chaleur)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "INDEX PAR CLASSES",
      "detailTable": "TTD"
    },
    "missingDetailedSheet": false,
    "classeEssentielle": "SM qui transforment le tán et arrête la toux",
    "indications": "Mucosités chaleur qui troublent le cœur avec agitation, convulsions, frayeur ou délire.\nToux par mucosités chaleur.\nTroubles pédiatriques de type mucosités chaleur avec convulsions.",
    "contre_indications": "Prudence en cas de froid vide de la rate et de l’estomac.",
    "preparation": "Aucune préparation particulière dans la fiche de base.",
    "incompleteFields": [],
    "detailSource": "00_DOCUMENTATION_TOUT SM.pdf — section SM qui transforment le tán, arrêtent la toux et apaisent la dyspnée"
  },
  {
    "id": "TTD12",
    "code": "TTD12",
    "classCode": "TTD",
    "classe": "SM qui transforment le Tán, arrêtent la toux et apaisent la dyspnée",
    "classeIndex": "TRANSFORMENT LE TAN, ARRETENT LA TOUX, APAISENT LA DYSPNEE",
    "pinyin": "Xuán fù huā",
    "pinyinSansTons": "Xuan Fu Hua",
    "hanzi": "旋覆花",
    "nom": "Capitule séchée de l'inule d'Angleterre ou du Japon",
    "nature": "légèrement tiède",
    "saveur": "amer, piquant, salé",
    "tropisme": "poumon, rate, estomac, gros intestin",
    "posologie": "3 à 10 g en décoction ; envelopper dans un tissu pendant la décoction.",
    "actions": [
      "Faire descendre le qì et transformer les mucosités.",
      "Abaisser les inversions et arrêter les vomissements.",
      "Ramollir le dur.",
      "Mobiliser l’eau."
    ],
    "esprit": "Poumon (mucosités avec douleur du thorax)\nSystème digestif (mucosités avec inversion du qi de l'estomac)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "INDEX PAR CLASSES",
      "detailTable": "TTD"
    },
    "missingDetailedSheet": false,
    "classeEssentielle": "SM qui transforment le tán et arrête la toux",
    "indications": "Toux, dyspnée, expectorations abondantes et oppression thoracique par mucosités.\nNausées, vomissements, éructations et hoquet par inversion du qì de l’estomac.\nNodosités ou indurations liées aux mucosités.",
    "contre_indications": "Prudence en cas de toux par vide de yīn ou de sécheresse.",
    "preparation": "À envelopper dans un tissu pour la décoction afin d’éviter l’irritation de la gorge.",
    "incompleteFields": [],
    "detailSource": "00_DOCUMENTATION_TOUT SM.pdf — section SM qui transforment le tán, arrêtent la toux et apaisent la dyspnée"
  },
  {
    "id": "TTD13",
    "code": "TTD13",
    "classCode": "TTD",
    "classe": "SM qui transforment le Tán, arrêtent la toux et apaisent la dyspnée",
    "classeIndex": "TRANSFORMENT LE TAN, ARRETENT LA TOUX, APAISENT LA DYSPNEE",
    "pinyin": "Zhè bèi mǔ",
    "pinyinSansTons": "Zhe Bei Mu",
    "hanzi": "浙贝母",
    "nom": "Bulbe séché de la fritillaire de Thumberg",
    "nature": "froid",
    "saveur": "amer",
    "tropisme": "poumon, cœur",
    "posologie": "3 à 10 g en décoction ; usage externe : quantité appropriée en poudre fine.",
    "actions": [
      "Clarifier la chaleur et transformer les mucosités.",
      "Disperser les nodosités et réduire le gonflement."
    ],
    "esprit": "Mucosités chaleur (poumon, nodules)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "INDEX PAR CLASSES",
      "detailTable": "TTD"
    },
    "missingDetailedSheet": false,
    "classeEssentielle": "SM qui transforment le tán et arrête la toux",
    "indications": "Toux par mucosités chaleur, expectorations jaunes et épaisses.\nScrofule, nodosités, abcès, furoncles et gonflements par chaleur toxique ou mucosités chaleur.",
    "contre_indications": "Froid vide de la rate et de l’estomac. Incompatible avec les substances provenant d’aconites : cǎo wū tóu, chuān wū tóu, fù zǐ.",
    "preparation": "Aucune préparation particulière.",
    "incompleteFields": [],
    "detailSource": "00_DOCUMENTATION_TOUT SM.pdf — section SM qui transforment le tán, arrêtent la toux et apaisent la dyspnée"
  },
  {
    "id": "TTD14",
    "code": "TTD14",
    "classCode": "TTD",
    "classe": "SM qui transforment le Tán, arrêtent la toux et apaisent la dyspnée",
    "classeIndex": "TRANSFORMENT LE TAN, ARRETENT LA TOUX, APAISENT LA DYSPNEE",
    "pinyin": "Zhú lì",
    "pinyinSansTons": "Zhu Li",
    "hanzi": "竹沥",
    "nom": "Sève jaune clair de 2 bambous",
    "nature": "froid",
    "saveur": "doux",
    "tropisme": "cœur, poumon, estomac",
    "posologie": "30 à 60 ml en prise orale ; peut être intégré à une décoction après cuisson ou pris avec le liquide de décoction.",
    "actions": [
      "Clarifier la chaleur et transformer les mucosités.",
      "Clarifier le cœur et ouvrir les orifices.",
      "Arrêter les convulsions et apaiser la frayeur."
    ],
    "esprit": "Psy, système nerveux (mucosités chaleur sur cœur/estomac)",
    "prioritaire": true,
    "source": {
      "workbookSheet": "INDEX PAR CLASSES",
      "detailTable": "TTD"
    },
    "missingDetailedSheet": false,
    "classeEssentielle": "SM qui transforment le tán et arrête la toux",
    "indications": "Toux et dyspnée par mucosités chaleur avec expectorations épaisses.\nMucosités chaleur qui troublent le cœur : agitation, délire, confusion, perte de connaissance, aphasie après AVC.\nConvulsions, tétanie ou frayeur par mucosités chaleur.",
    "contre_indications": "Prudence en cas de froid vide de la rate et de l’estomac.",
    "preparation": "Jus de bambou obtenu par chauffage de tiges fraîches ; ne se décocte pas longuement.",
    "incompleteFields": [],
    "detailSource": "00_DOCUMENTATION_TOUT SM.pdf — section SM qui transforment le tán, arrêtent la toux et apaisent la dyspnée"
  },
  {
    "id": "TTD15",
    "code": "TTD15",
    "classCode": "TTD",
    "classe": "SM qui transforment le Tán, arrêtent la toux et apaisent la dyspnée",
    "classeIndex": "TRANSFORMENT LE TAN, ARRETENT LA TOUX, APAISENT LA DYSPNEE",
    "pinyin": "Zhú rú",
    "pinyinSansTons": "Zhu Ru",
    "hanzi": "竹茹",
    "nom": "Fibres de 3 espèces de bambous",
    "nature": "légèrement froid",
    "saveur": "doux",
    "tropisme": "poumon, estomac, vésicule biliaire",
    "posologie": "5 à 10 g en décoction ; usage externe : quantité appropriée en onguent.",
    "actions": [
      "Clarifier la chaleur et transformer les mucosités.",
      "Éliminer l’irritabilité.",
      "Harmoniser l’estomac et arrêter les vomissements.",
      "Rafraîchir le sang et arrêter le sang."
    ],
    "esprit": "Système digestif, vésicule biliaire (mucosités chaleur)",
    "prioritaire": false,
    "source": {
      "workbookSheet": "INDEX PAR CLASSES",
      "detailTable": "TTD"
    },
    "missingDetailedSheet": false,
    "indications": "Toux par mucosités chaleur.\nAgitation, insomnie ou irritabilité par mucosités chaleur de la vésicule biliaire et de l’estomac.\nNausées, vomissements, hoquet ou vomissements de grossesse par chaleur de l’estomac.\nHémorragies par chaleur du sang.",
    "contre_indications": "Aucune contre-indication spécifique relevée dans la fiche de base.",
    "preparation": "Zhú rú crue : clarifie le poumon et transforme les mucosités.\nZhú rú préparée au gingembre : oriente l’action vers l’estomac, harmonise et abaisse les contre-courants pour arrêter les vomissements.",
    "incompleteFields": [],
    "detailSource": "00_DOCUMENTATION_TOUT SM.pdf — section SM qui transforment le tán, arrêtent la toux et apaisent la dyspnée"
  },
  {
    "id": "TY1",
    "code": "TY1",
    "classCode": "TY",
    "classe": "SM qui tonifient le Yáng",
    "classeIndex": "TONIFIENT LE YANG",
    "pinyin": "Dōng chóng xià cǎo",
    "pinyinSansTons": "Dong Chong Xia Cao",
    "hanzi": "冬虫夏草",
    "nom": "Champignon chenille",
    "nature": "Tiède, Aromatique",
    "saveur": "Doux",
    "tropisme": "Poumon, Reins",
    "posologie": "5 à 10 g",
    "actions": [
      "Tonifier le vide",
      "Renforcer le Yang",
      "Soutenir le Jing",
      "Tonifier le Poumon",
      "Soutenir le Reins",
      "Equilibrer la dyspnée",
      "Arrêter la toux",
      "Transormer les mucsités"
    ],
    "esprit": "Toux par vide (na qi) et ou avec mucosités, impuissance, ejaculation precoce par vide rein\naffaiblissemnt maladie chronique, ming men",
    "prioritaire": false,
    "source": {
      "workbookSheet": "TY",
      "detailTable": "TY"
    }
  },
  {
    "id": "TY2",
    "code": "TY2",
    "classCode": "TY",
    "classe": "SM qui tonifient le Yáng",
    "classeIndex": "TONIFIENT LE YANG",
    "pinyin": "Dù zhòng",
    "pinyinSansTons": "Du Zhong",
    "hanzi": "杜仲",
    "nom": "Ecorce de l'Eucommia ulmoïdes (Arbre à latex)",
    "nature": "Tiède",
    "saveur": "Doux, Légèrement Piquant",
    "tropisme": "Foie, Reins",
    "posologie": "6 à 15 g",
    "actions": [
      "Tonifier le Foie",
      "Tonifier les Reins",
      "Renforcer les tendons et les os",
      "Calmer le fœtus"
    ],
    "esprit": "deficience foie rein (douleur lombaires genoux, manque de force)(+ext), menace avortement\nHTA vide rein pertes",
    "prioritaire": false,
    "source": {
      "workbookSheet": "TY",
      "detailTable": "TY"
    }
  },
  {
    "id": "TY3",
    "code": "TY3",
    "classCode": "TY",
    "classe": "SM qui tonifient le Yáng",
    "classeIndex": "TONIFIENT LE YANG",
    "pinyin": "Hé táo rén",
    "pinyinSansTons": "He Tao Ren",
    "hanzi": "核桃仁",
    "nom": "Cerneau de noix mûr et séché",
    "nature": "Tiède",
    "saveur": "Doux",
    "tropisme": "Reins, Poumon, GI",
    "posologie": "9 à 30 g",
    "actions": [
      "Equilibrer la dyspnée",
      "Tonifier les Reins",
      "Affermir le Jing",
      "Tiédir le Poumon",
      "Humidifier les intestins"
    ],
    "esprit": "Faiblesse douleur partie inf, impuissances emissions involontaires, enuresie, toux par na qi\nconstipation vide sang liquides",
    "prioritaire": false,
    "source": {
      "workbookSheet": "TY",
      "detailTable": "TY"
    }
  },
  {
    "id": "TY4",
    "code": "TY4",
    "classCode": "TY",
    "classe": "SM qui tonifient le Yáng",
    "classeIndex": "TONIFIENT LE YANG",
    "pinyin": "Lù róng",
    "pinyinSansTons": "Lu Rong",
    "hanzi": "鹿茸",
    "nom": "Corne non ossifiée (jeune bois) de Cerf",
    "nature": "Tiède",
    "saveur": "Doux, Salé",
    "tropisme": "Reins, Foie",
    "posologie": "1 à 3 g",
    "actions": [
      "Renforcer le Yang",
      "Renforcer le Yang des Reins",
      "Soutenir le Jing",
      "Soutenir les Moelles",
      "Tonifier le Qi et le Sang",
      "Renforcer les tendons et les os",
      "Harmoniser Chong Mai et Ren Mai",
      "Déloger l'abcès et les toxines"
    ],
    "esprit": "Vide yang rein, foie, qi ,sang: fractures (+ext), croissance, reproduction, vide ren mai dai mai\nchong mai menorragie, metrorragie, leucorrhées, ulcerations inflammations cutanées qui ne\nguerissent pas",
    "prioritaire": false,
    "source": {
      "workbookSheet": "TY",
      "detailTable": "TY"
    }
  },
  {
    "id": "TY5",
    "code": "TY5",
    "classCode": "TY",
    "classe": "SM qui tonifient le Yáng",
    "classeIndex": "TONIFIENT LE YANG",
    "pinyin": "Ròu cōng róng",
    "pinyinSansTons": "Rou Cong Rong",
    "hanzi": "肉苁蓉",
    "nom": "Tige de Cistanche",
    "nature": "Tiède",
    "saveur": "Doux, Salé",
    "tropisme": "Reins, Gros Intestins",
    "posologie": "10 à 15 g",
    "actions": [
      "Renforcer le Yang des Reins",
      "Soutenir le Jing et le Sang",
      "Lubrifier les Intestins",
      "Désobstruer les selles",
      "Humidifier la Sécheresse"
    ],
    "esprit": "Vide yang reins, jing, sang, membres inf lombes, constipation secheresse gi (produit humide)",
    "prioritaire": false,
    "source": {
      "workbookSheet": "TY",
      "detailTable": "TY"
    }
  },
  {
    "id": "TY6",
    "code": "TY6",
    "classCode": "TY",
    "classe": "SM qui tonifient le Yáng",
    "classeIndex": "TONIFIENT LE YANG",
    "pinyin": "Tù sī zǐ",
    "pinyinSansTons": "Tu Si Zi",
    "hanzi": "菟丝子",
    "nom": "Graine mûre et séchée d'une cuscute",
    "nature": "Neutre / Equilibré, Tiède selon certain.es",
    "saveur": "Piquant, Doux",
    "tropisme": "Foie, Reins, Rate",
    "posologie": "6 à 15 g",
    "actions": [
      "Tonifier le Foie",
      "Tonifier les Reins",
      "Nourrir le Foie",
      "Nourrir les Reins",
      "Calmer le fœtus",
      "Affermir le Jing",
      "Diminuer les urines",
      "Eclaircir les yeux",
      "Arrêter la diarrhée"
    ],
    "esprit": "Impuissance, enuresie, pertes, reproduction....Douleurs lombaires genoux, Vision, menace\navortement, meno metrorragies par vide rein foie ren mai, diarrhées, diabete vide yin, vitiligo",
    "prioritaire": false,
    "source": {
      "workbookSheet": "TY",
      "detailTable": "TY"
    }
  },
  {
    "id": "TY7",
    "code": "TY7",
    "classCode": "TY",
    "classe": "SM qui tonifient le Yáng",
    "classeIndex": "TONIFIENT LE YANG",
    "pinyin": "Xù duàn",
    "pinyinSansTons": "Xu Duan",
    "hanzi": "续断",
    "nom": "Racine séchée d'une cardère",
    "nature": "Légèrement tiède",
    "saveur": "Amer, Piquant",
    "tropisme": "Foie, Reins",
    "posologie": "6 à 15 g",
    "actions": [
      "Tonifier le Foie",
      "Tonifier les Reins",
      "Ressouder les tendons et les os",
      "Réparer les fractures et les lésions",
      "Harmoniser les vaisseaux sanguins",
      "Arrêter les métrorragies"
    ],
    "esprit": "Tendons, os, coups, blessures, menace avortement, pertes urines sperme",
    "prioritaire": false,
    "source": {
      "workbookSheet": "TY",
      "detailTable": "TY"
    }
  },
  {
    "id": "TY8",
    "code": "TY8",
    "classCode": "TY",
    "classe": "SM qui tonifient le Yáng",
    "classeIndex": "TONIFIENT LE YANG",
    "pinyin": "Yì zhì rén",
    "pinyinSansTons": "Yi Zhi Ren",
    "hanzi": "益智仁",
    "nom": "Cardamome noire",
    "nature": "Tiède",
    "saveur": "Piquant",
    "tropisme": "Rate, Reins",
    "posologie": "3 à 9 g",
    "actions": [
      "Réchauffer les Reins",
      "Réfréner le Jing",
      "Diminuer les urines",
      "Arrêter la diarrhée",
      "Tiédir la Rate",
      "Affermir le Qi"
    ],
    "esprit": "Pertes urine, sperme, emissions nocturnes, salivation excessive, diarrhée",
    "prioritaire": false,
    "source": {
      "workbookSheet": "TY",
      "detailTable": "TY"
    }
  },
  {
    "id": "TY9",
    "code": "TY9",
    "classCode": "TY",
    "classe": "SM qui tonifient le Yáng",
    "classeIndex": "TONIFIENT LE YANG",
    "pinyin": "Yín yáng huò",
    "pinyinSansTons": "Yin Yang Huo",
    "hanzi": "淫羊藿",
    "nom": "Herbe du bouc en ruth",
    "nature": "Tiède",
    "saveur": "Piquant, Doux",
    "tropisme": "Foie, Reins",
    "posologie": "3 à 9 g",
    "actions": [
      "Renforcer le Yang",
      "Tonifier les Reins",
      "Eliminer l'Humidité",
      "Expulser le Vent"
    ],
    "esprit": "Tiede, piquant, doux foie, reins\nVide yang rein, BI vide froid humidité (branche+racine)",
    "prioritaire": false,
    "source": {
      "workbookSheet": "TY",
      "detailTable": "TY"
    }
  },
  {
    "id": "V1",
    "code": "V1",
    "classCode": "V",
    "classe": "SM vomitives",
    "classeIndex": "EMETIQUES, VOMITIVES",
    "pinyin": "Guā dì",
    "pinyinSansTons": "Gua Di",
    "hanzi": "瓜蒂",
    "nom": "Pédoncule du melon",
    "nature": "Froid Toxique",
    "saveur": "Amer",
    "tropisme": "Rate, Estomac",
    "posologie": "0,3 à 5g",
    "actions": [
      "Vomir les mucosités vent",
      "Vomir les anciens aliments",
      "Faire s'écouler l'eau humidité",
      "Arrêter les mucositésYin"
    ],
    "esprit": "",
    "prioritaire": false,
    "source": {
      "workbookSheet": "V",
      "detailTable": "V"
    }
  },
  {
    "id": "VH1",
    "code": "VH1",
    "classCode": "VH",
    "classe": "SM qui chassent le Vent-Humidité",
    "classeIndex": "CHASSENT LE VENT HUMIDITE",
    "pinyin": "Dú huó",
    "pinyinSansTons": "Du Huo",
    "hanzi": "独活",
    "nom": "Racine de l'Angélique pubescente",
    "nature": "Légèrement tiède",
    "saveur": "Amer, Piquant",
    "tropisme": "Rein, Vessie, Foie",
    "posologie": "3 à 10g",
    "actions": [
      "Libérer la surface",
      "Chasser le Vent",
      "Vaincre l'Humidité",
      "Disperser le Froid",
      "Arrêter la douleur d'obstruction"
    ],
    "esprit": "Obstructions bi (aigus ou chroniques) par vent froid humidité",
    "prioritaire": true,
    "source": {
      "workbookSheet": "VH",
      "detailTable": "VH"
    },
    "classeEssentielle": "SM qui chassent le vent humidité"
  },
  {
    "id": "VH2",
    "code": "VH2",
    "classCode": "VH",
    "classe": "SM qui chassent le Vent-Humidité",
    "classeIndex": "CHASSENT LE VENT HUMIDITE",
    "pinyin": "Mù guā",
    "pinyinSansTons": "Mu Gua",
    "hanzi": "木瓜",
    "nom": "Coing de Chine",
    "nature": "Tiède",
    "saveur": "Acide",
    "tropisme": "Foie, Poumon, Rein, Rate",
    "posologie": "5 à 10g",
    "actions": [
      "Chasser le Vent",
      "Equilibrer le Foie",
      "Harmoniser l'Estomac",
      "Détendre les tendons"
    ],
    "esprit": "Humidité (obstructions bi, foyer médian) accompagnée de\ncontractures et spasmes des tendons",
    "prioritaire": true,
    "source": {
      "workbookSheet": "VH",
      "detailTable": "VH"
    },
    "classeEssentielle": "SM qui chassent le vent humidité"
  },
  {
    "id": "VH3",
    "code": "VH3",
    "classCode": "VH",
    "classe": "SM qui chassent le Vent-Humidité",
    "classeIndex": "CHASSENT LE VENT HUMIDITE",
    "pinyin": "Qín jiāo",
    "pinyinSansTons": "Qin Jiao",
    "hanzi": "秦艽",
    "nom": "Racine de gentiane à grandes feuilles",
    "nature": "Neutre / Equilibré (Légèrement froid)",
    "saveur": "Piquant, Amer",
    "tropisme": "Estomac, Foie, VB",
    "posologie": "5 à 10g",
    "actions": [
      "Chasser le Vent",
      "Vaincre l'Humidité",
      "Détendre les tendons",
      "Harmoniser le Sang",
      "Clarifier la Chaleur",
      "Faire s'écouler l'urine"
    ],
    "esprit": "Obstructions bi par vent humidité\nIctère yang",
    "prioritaire": false,
    "source": {
      "workbookSheet": "VH",
      "detailTable": "VH"
    }
  },
  {
    "id": "VH4",
    "code": "VH4",
    "classCode": "VH",
    "classe": "SM qui chassent le Vent-Humidité",
    "classeIndex": "CHASSENT LE VENT HUMIDITE",
    "pinyin": "Sāng jì shēng",
    "pinyinSansTons": "Sang Ji Sheng",
    "hanzi": "桑寄生",
    "nom": "Rameaux feuillus de Taxillus Chinensis",
    "nature": "Neutre / Equilibré",
    "saveur": "Amer, Doux",
    "tropisme": "Foie, Rein",
    "posologie": "10 à 15g",
    "actions": [
      "Chasser le Vent",
      "Vaincre l'Humidité",
      "Tonifier le Foie",
      "Tonifier les Reins",
      "Renforcer les tendons",
      "Renforcer les os",
      "Désobstruer les canaux et liaisons",
      "Enrichir le Sang",
      "Calmer le foeuts"
    ],
    "esprit": "Obstructions bi par vent humidité sur terrain de vide",
    "prioritaire": false,
    "source": {
      "workbookSheet": "VH",
      "detailTable": "VH"
    }
  },
  {
    "id": "VH5",
    "code": "VH5",
    "classCode": "VH",
    "classe": "SM qui chassent le Vent-Humidité",
    "classeIndex": "CHASSENT LE VENT HUMIDITE",
    "pinyin": "Sāng zhī",
    "pinyinSansTons": "Sang Zhi",
    "hanzi": "桑枝",
    "nom": "Jeunes rameaux du mûrier blanc ou mûrier commun",
    "nature": "Neutre / Equilibré",
    "saveur": "Légèrement Amer",
    "tropisme": "Foie",
    "posologie": "15 à 30g",
    "actions": [
      "Chasser le Vent",
      "Vaincre l'Humidité",
      "Favoriser la fluidité des articulations",
      "Mobiliser l'eau et le qi"
    ],
    "esprit": "Obstructions bi par vent humidité (plus particulièrement les\nmembres supérieurs)",
    "prioritaire": false,
    "source": {
      "workbookSheet": "VH",
      "detailTable": "VH"
    }
  },
  {
    "id": "VH6",
    "code": "VH6",
    "classCode": "VH",
    "classe": "SM qui chassent le Vent-Humidité",
    "classeIndex": "CHASSENT LE VENT HUMIDITE",
    "pinyin": "Wǔ jiā pí",
    "pinyinSansTons": "Wu Jia Pi",
    "hanzi": "五加皮",
    "nom": "Ecorce de la racine d'Acanthoponax gracilistylus",
    "nature": "Tiède",
    "saveur": "Piquant, Amer",
    "tropisme": "Foie, Rein",
    "posologie": "6 à 9g",
    "actions": [
      "Chasser le Vent",
      "Vaincre l'Humidité",
      "Renforcer les tendons",
      "Renforcer les os",
      "Activer le Sang",
      "Chasser la Stase"
    ],
    "esprit": "Humidité, articulations",
    "prioritaire": false,
    "source": {
      "workbookSheet": "VH",
      "detailTable": "VH"
    }
  }
];

  const PHARMA_AUDIT = {
  "workbook": "SM PHARMA_Tableaux.xlsx",
  "herbCount": 207,
  "classCount": 29,
  "priorityCount": 108,
  "matchedPriorities": 108,
  "unmatchedPriorities": 0,
  "classCounts": {
    "A": 9,
    "AF": 10,
    "AH": 6,
    "AS": 12,
    "CE": 4,
    "CF": 7,
    "CHU": 5,
    "CS": 5,
    "CSS": 14,
    "CT": 8,
    "CV": 2,
    "EH": 10,
    "FD": 5,
    "LD": 2,
    "LE": 2,
    "NY": 10,
    "OO": 3,
    "PE": 4,
    "PF": 9,
    "PT": 13,
    "PUF": 3,
    "RQ": 8,
    "TE": 11,
    "TI": 8,
    "TS": 6,
    "TTD": 15,
    "TY": 9,
    "V": 1,
    "VH": 6
  },
  "smallClasses": {
    "CV": 2,
    "LD": 2,
    "LE": 2,
    "OO": 3,
    "PUF": 3,
    "V": 1
  },
  "corrections": [
    {
      "substance": "Ǒu jié",
      "code": "AS6",
      "correction": "Classe retenue : SM qui arrêtent le Sang (code AS6). L’index alphabétique avait une classe incohérente."
    },
    {
      "substance": "Mài dōng",
      "code": "NY7",
      "correction": "Classe retenue : SM qui nourrissent le Yīn (code NY7)."
    },
    {
      "substance": "Mài yá",
      "code": "FD3",
      "correction": "Classe retenue : SM qui favorisent la digestion (code FD3)."
    },
    {
      "substance": "Lóng gǔ",
      "code": "LE2",
      "correction": "Classe principale retenue : SM lourdes qui pacifient et calment l’Esprit (code LE2), malgré son classement prioritaire “apaisent le Foie”."
    },
    {
      "substance": "Dàn dòu chǐ",
      "code": "PF_ESS_11",
      "correction": "Ajoutée depuis “substances essentielles”, absente des index/détails ; classe retenue : SM piquantes et fraîches qui libèrent la Surface et clarifient la Chaleur."
    }
  ],
  "duplicateDetailedTables": [
    [
      "LE1",
      "LD",
      "LE"
    ],
    [
      "LE2",
      "LD",
      "LE"
    ],
    [
      "PE1",
      "OO",
      "PE"
    ],
    [
      "PE2",
      "OO",
      "PE"
    ],
    [
      "PE3",
      "OO",
      "PE"
    ],
    [
      "PE4",
      "OO",
      "PE"
    ]
  ],
  "substancesTotal": 206,
  "substancesIndexees": 206,
  "substancesPrioritairesIntegrees": 106,
  "substancesEssentiellesManquantesDansIndex": [
    {
      "pinyin": "Dàn dòu chǐ",
      "hanzi": "淡豆豉",
      "classeEssentielle": "SM qui libèrent la superficie",
      "raison": "Présente dans la feuille substances essentielles, mais absente de l’index complet et des fiches par classe. Non ajoutée au jeu tant qu’elle n’est pas dans la base principale."
    }
  ],
  "notes": [
    "Correction 206 : les substances absentes de l’index complet ne sont pas ajoutées comme tuiles jouables; elles restent signalées dans l’audit."
  ]
};

  function getPharmaClassByCode(code){
    return PHARMA_CLASSES.find(item => item.code === code) || null;
  }

  function getPharmaHerbsByClass(code){
    return PHARMA_HERBS.filter(item => item.classCode === code);
  }

  function getPharmaPlayableClasses(){
    /* En PHARMA, toutes les classes sont jouables, même avec moins de 4 substances. */
    return PHARMA_CLASSES.filter(item => item.count > 0);
  }

  function updatePharmacologyPlaceholder(){
    const placeholder = document.getElementById("pharmacologyPlaceholder");
    if(!placeholder) return;

    const note = placeholder.querySelector(".pharmacology-placeholder-note");
    if(note){
      note.textContent = `Bucket 2 : données chargées — ${PHARMA_HERBS.length} substances / ${PHARMA_CLASSES.length} classes. Le jeu PHARMA sera activé au bucket suivant.`;
    }
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", updatePharmacologyPlaceholder);
  }else{
    updatePharmacologyPlaceholder();
  }

  window.PHARMA_CLASSES = PHARMA_CLASSES;
  window.PHARMA_HERBS = PHARMA_HERBS;
  window.PHARMA_AUDIT = PHARMA_AUDIT;
  window.getPharmaClassByCode = getPharmaClassByCode;
  window.getPharmaHerbsByClass = getPharmaHerbsByClass;
  window.getPharmaPlayableClasses = getPharmaPlayableClasses;
  window.updatePharmacologyPlaceholder = updatePharmacologyPlaceholder;
})();
