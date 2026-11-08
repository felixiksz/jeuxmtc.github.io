// Circuits thérapeutiques de Dr Tán, repris du cours « Les circuits thérapeutiques » (École Zhōng Lì, version du 27/10/2021).
// grid : [haut gauche, haut droite, bas gauche, bas droite] comme dans le cours (main en haut, pied en bas).
// autre : circuits qui ne reposent que sur l'équilibre dynamique (chapitre 13).
window.MTC_CIRCUITS = [
 {
  "title": "Tài yīn / yáng míng",
  "grid": [
   "P",
   "GI",
   "E",
   "Rt"
  ],
  "actions": [
   "régularise tài yīn et yáng míng",
   "régularise le transport et la transformation",
   "régularise les 4 mouvements de qì",
   "favorise la respiration, la digestion et le transit",
   "favorise la formation et la circulation du qì (wèi qì, yíng qì, zōng qì)",
   "métabolise l’humidité et la sécheresse, favorise la circulation et l’élimination par les mictions et la transpiration des liquides (jīn yè)",
   "calme le shén (ajout possible du shǒu shào yīn (canal du cœur))",
   "favorise la circulation du qì et du sang (xuè) dans les canaux du circuit"
  ],
  "indications": [
   "fatigue, asthme, toux, souffle court, rhinite, sinusites, bronchites, amygdalite, angine, rhume, troubles de la transpiration…",
   "dermatoses, herpès labial…",
   "distension abdominale, diarrhée chronique, constipation, douleur abdominale, faiblesse de l'estomac, faiblesse de digestion, ulcère de l’estomac, gastrite, colique, allergie alimentaire, œdèmes…",
   "diabète, troubles de la thyroïde, troubles du cou…",
   "fibromyalgie, faiblesse des membres…"
  ]
 },
 {
  "title": "Tài yīn / tài yáng",
  "grid": [
   "P",
   "IG",
   "V",
   "Rt"
  ],
  "actions": [
   "régularise tài yīn et tài yáng",
   "régularise le transport et la transformation",
   "favorise la respiration, la digestion",
   "favorise la formation et la circulation du qì (wèi qì, yíng qì, zōng qì)",
   "métabolise l’humidité et le froid, favorise la circulation et l’élimination par les mictions et la transpiration des liquides",
   "calme le shén",
   "favorise la circulation du qì et du sang (xuè) dans les canaux du circuit"
  ],
  "indications": [
   "céphalée occipitale, douleur de nuque, des épaules, du dos et de la colonne vertébrale…",
   "troubles oculaires…",
   "troubles des mictions…",
   "fatigue, déséquilibres respiratoires et digestifs, allergies respiratoires, petit appétit, distension abdominale, diarrhée, faiblesse du système immunitaire, œdèmes…",
   "dépression, apathie, asthénie…"
  ]
 },
 {
  "title": "Poumon (fèi), foie (gān) / tài yáng (qì/ tài yáng)",
  "grid": [
   "P",
   "IG",
   "V",
   "F"
  ],
  "actions": [
   "régularise le rythme et la circulation du qì, calme les douleurs",
   "régularise la respiration et wèi qì",
   "régularise la couche tài yáng",
   "relâche le bois (mù) et renforce la terre (tǔ), via le feu (huǒ)",
   "métabolise le froid et le vent",
   "favorise la circulation et l’élimination par les mictions et la transpiration des liquides (jīn yè)",
   "calme le shén",
   "favorise la circulation du qì et du sang (xuè) dans les canaux du circuit"
  ],
  "indications": [
   "troubles du nez, des yeux, des oreilles, de la tête, de la respiration…",
   "troubles psycho-émotionnels, tristesse, colère, psychose dépressive diān, psychose maniaque kuáng…",
   "troubles des mictions, des parties génitales, impuissance…",
   "douleur du dos, des lombes, de la nuque, de la scapula…"
  ]
 },
 {
  "title": "Métal (jīn) / eau (shuǐ)",
  "grid": [
   "P",
   "GI",
   "V",
   "Rn"
  ],
  "actions": [
   "régularise les fonctions du métal (jīn) et de l’eau (shuǐ)",
   "favorise la respiration et nà qì",
   "favorise le transit et l’évacuation",
   "favorise la formation et la circulation du qì (wèi qì, yíng qì, zōng qì)",
   "métabolise le froid, favorise la circulation et l’élimination par les mictions et la transpiration des liquides (jīn yè)",
   "favorise les orifices inférieurs",
   "calme le shén",
   "favorise la circulation du qì et du sang (xuè) dans les canaux du circuit"
  ],
  "indications": [
   "douleur lombaire…",
   "colites, constipation, mictions fréquentes, incontinence urinaire, impuissance, stérilité"
  ]
 },
 {
  "title": "Yáng míng / jué yīn",
  "grid": [
   "GI",
   "EC",
   "F",
   "E"
  ],
  "actions": [
   "régularise yáng míng et jué yīn",
   "métabolise la sécheresse et le vent",
   "clarifie la chaleur des syndromes en excès",
   "humecte la sécheresse due à la chaleur et favorise les selles",
   "harmonise les émotions et régule la digestion, le transit et évacuation",
   "régularise la circulation du qì et du sang (xuè)",
   "favorise le foyer inférieur, la face latérale",
   "calme le shén et les hún",
   "favorise la circulation du qì et du sang (xuè) dans les canaux du circuit"
  ],
  "indications": [
   "troubles de la digestion et de l’abdomen liés au stress, à l’anxiété, aux désordres émotionnels, constipation, syndrome du côlon irritable, colopathie fonctionnelle, perte de l’appétit, ulcère de l’estomac…",
   "irritabilité, colère, stress, anxiété, oppression thoracique, douleur de la région thoracique latérale dysphorie du cœur, angoisses, syndrome méi hé qì…",
   "hépatite, nausées, vomissements…"
  ]
 },
 {
  "title": "Yáng míng / reins (shèn), enveloppe du cœur (xīn bāo)",
  "grid": [
   "GI",
   "EC",
   "Rn",
   "E"
  ],
  "actions": [
   "régularise yáng míng",
   "favorise le système cardiaque, respiratoire et digestif",
   "harmonise les émotions et régule la digestion",
   "harmonise l’eau (shuǐ) et le feu (huǒ)",
   "régularise la poitrine et l’abdomen",
   "favorise le métabolisme des liquides (jīn yè) et du sang (xuè)",
   "régularise la face antérieure et centrale du corps",
   "métabolise la sécheresse",
   "tonifie le vide, tiédit le yáng",
   "tonifie le vide, nourrit le yīn, clarifie la chaleur",
   "calme le shén et renforce le zhì (ajout possible du zù jué yīn (canal du foie))",
   "favorise la circulation du qì et du sang (xuè) dans les canaux du circuit"
  ],
  "indications": [
   "nervosité, peurs multiples, anxiété, palpitations…",
   "douleur gastrique et/ ou intestinale, constipation…",
   "obstruction nasale, maux de gorge fréquents, crainte de la chaleur, soif, transpiration excessive de la tête…"
  ]
 },
 {
  "title": "Terre (tǔ) / feu ministre (xiāng huǒ)",
  "grid": [
   "EC",
   "TF",
   "E",
   "Rt"
  ],
  "actions": [
   "favorise le transport, la transformation",
   "équilibre l’humidité et la sécheresse",
   "régularise la montée et la descente",
   "favorise l’action du feu ministre (xiāng huǒ) et tiédit la terre (tǔ)",
   "régularise le qì et le sang (xuè), harmonise la terre (tǔ) et le feu (huǒ)",
   "favorise le métabolisme des liquides (jīn yè), résout l’humidité",
   "favorise la production du sang (xuè) et sa circulation",
   "calme le shén",
   "favorise la circulation du qì et du sang (xuè) dans les canaux du circuit"
  ],
  "indications": [
   "troubles de la digestion, digestion difficile, lente, petit appétit, fatigue, reflux gastro-œsophagien, diarrhée, constipation, ulcère de l’estomac…"
  ]
 },
 {
  "title": "Rate (pí), cœur (xīn) / shào yáng",
  "grid": [
   "TF",
   "C",
   "Rt",
   "VB"
  ],
  "actions": [
   "régularise shào yáng",
   "métabolise le vent, assèche l’humidité de la terre (tǔ)",
   "favorise le transport et la transformation",
   "favorise le feu ministre (xiāng huǒ) et le feu empereur (jūn huǒ)",
   "régularise la circulation du qì, du sang (xuè) et des liquides (jīn yè)",
   "nourrit le sang (xuè), disperse la stase",
   "favorise le métabolisme des liquides (jīn yè)",
   "calme le shén, calme les peurs et la frayeur",
   "favorise la circulation du qì et du sang (xuè) dans les canaux du circuit"
  ],
  "indications": [
   "stress, anxiété, agitation, sensation d’être perdu, difficulté de mémorisation et de concentration, soupirs fréquents…",
   "anémie, petit appétit, fatigue, troubles digestifs, fatigue après les repas, constipation…",
   "céphalée, tension de la nuque et des épaules, épilepsie, maladie de Parkinson…"
  ]
 },
 {
  "title": "Shào yīn / tài yáng",
  "grid": [
   "C",
   "IG",
   "V",
   "Rn"
  ],
  "actions": [
   "régularise les couches shào yīn et tài yáng",
   "harmonise la relation feu (huǒ)/ eau (shuǐ), cœur / reins, soulage la douleur lombaire",
   "régularise le jīng et le sang (xuè)",
   "nourrit le cœur, calme les palpitations, clarifie la chaleur vide",
   "favorise la digestion en régularisant les feux physiologiques",
   "régularise les urines et traite le syndrome de miction douloureuse",
   "régularise le métabolisme des liquides (jīn yè) et traite les œdèmes",
   "régularise le tri du pur et du trouble et favorise l’excrétion",
   "renforce wèi qì et régularise la transpiration",
   "calme le shén, calme la peur et la frayeur, la psychose dépressive (diān) et la psychose maniaque kuáng",
   "favorise la circulation du qì et du sang (xuè) dans les canaux du circuit"
  ],
  "indications": [
   "troubles oculaires, céphalée occipitale, douleur de nuque, des épaules, du dos et de la colonne, ostéoporose…",
   "palpitations, déséquilibres cardiaques, anémie, troubles de la mémoire, insomnie, acouphènes, syndrome des jambes sans repos…",
   "stérilité, impuissance, aménorrhée, troubles de la ménopause, pollakiurie ou oligurie, énurésie, œdèmes, hématurie…"
  ]
 },
 {
  "title": "Feu (huǒ) / bois (mù)",
  "grid": [
   "C",
   "IG",
   "VB",
   "F"
  ],
  "actions": [
   "régularise le feu (huǒ) et le bois (mù), harmonise le cœur et le foie",
   "soulage la distension de la poitrine et des hypocondres",
   "régularise la circulation du qì et du sang (xuè)",
   "apaise le shén et les hún",
   "favorise la circulation du qì et du sang (xuè) dans les canaux du circuit"
  ],
  "indications": [
   "hypertension artérielle, palpitations, céphalée…",
   "troubles psycho-émotionnels, stress, sursauts au moindre bruit, insomnie avec crainte de la chaleur, rêves abondants…",
   "entérite, hépatite…"
  ]
 },
 {
  "title": "Shào yīn / shào yáng",
  "grid": [
   "C",
   "TF",
   "VB",
   "Rn"
  ],
  "actions": [
   "régularise shào yīn et shào yáng",
   "régule le débit du qì, régule le sang (xuè) et le jīng",
   "régule et métabolise la chaleur du corps, régule l’alternance de chaud et de froid",
   "régule le métabolisme des liquides (jīn yè)",
   "calme le shén agité par stagnation de qì qui s'embrase en feu plénitude perturbant le cœur et la tête, par embrasement du feu ministre (xiāng huǒ) sur un terrain de vide troublant les émotions, le sommeil et les oreilles",
   "régule tout trouble sur le trajet de shào yáng accompagnés d'insomnies, palpitations, troubles de la mémoire et de la concentration et/ou symptômes de déficience des reins",
   "favorise la circulation du qì et du sang (xuè) dans les canaux du circuit"
  ],
  "indications": [
   "anxiété, anémie, troubles de la mémoire, palpitations, stress, anxiété, tension émotionnelle mais pas spécialement d’agitation, irritabilité, colère qui ne dure pas, pas de ressentiment, insomnie avec fatigue extrême, tourne sans arrêt dans le lit, dépression, démotivation par épuisement, pensées négatives, manque de confiance en soi…",
   "stérilité, impuissance, frigidité, bouffées de chaleur…",
   "douleur de nuque, céphalées, douleur lombaire, sciatalgie, coxalgie, douleur des genoux, troubles du système osseux…"
  ]
 },
 {
  "title": "Jué yīn / shào yáng",
  "grid": [
   "EC",
   "TF",
   "VB",
   "F"
  ],
  "actions": [
   "régularise jué yīn et shào yáng",
   "régularise la circulation de qì et calme le shén",
   "régularise la circulation de qì et harmonise la sphère génitale",
   "régularise la chaleur et le vent, traite l’alternance de chaud et de froid",
   "éteint le vent interne et abaisse le yáng",
   "calme le cœur et favorise la circulation du sang (xuè), relâche la tension et l’irritabilité",
   "favorise la circulation du qì et du sang (xuè) dans les canaux du circuit"
  ],
  "indications": [
   "troubles psycho-émotionnels, irritabilité (souvent contenue), nervosité, agitation, tension émotionnelle, cyclothymie, troubles bipolaires, anxiété, insomnie avec difficulté d’endormissement, difficulté à se détendre, difficulté à lâcher-prise, besoin du respect des règles, besoin de tout contrôler, souhaite être parfait, rigidité physique et émotionnel, prise de décision rapide ou indécision, palpitations…",
   "céphalée temporale, cervicalgie, coxalgie, oppression thoracique, douleur de la région thoracique latérale, névralgie intercostale…",
   "hyperthyroïdie, épilepsie, maladie de Parkinson, lithiase biliaire…",
   "troubles gynécologiques, dysménorrhée…"
  ]
 },
 {
  "title": "Tài yīn / foie (gān), intestin grêle (xiǎo cháng)",
  "grid": [
   "P",
   "IG",
   "Rt",
   "F"
  ],
  "actions": [
   "régularise tài yīn",
   "régularise le transport et la transformation",
   "favorise la respiration, la digestion et le tri du pur et du trouble",
   "harmonise les émotions et régule la digestion",
   "favorise la formation et la circulation du qì (wèi qì, yíng qì, zōng qì) et du sang (xuè)",
   "favorise le métabolisme des liquides (jīn yè) et du sang (xuè)",
   "relâche le bois (mù) et renforce la terre (tǔ), via le feu (huǒ)",
   "métabolise l’humidité",
   "calme le shén",
   "favorise la circulation du qì et du sang (xuè) dans les canaux du circuit"
  ],
  "indications": [
   "problèmes digestifs et respiratoires, toux, oppression thoracique, petit appétit, distension abdominale, douleur abdominale, œdèmes, diarrhée, fatigue…",
   "céphalée, hépatite, jaunisse, stress, irritabilité, tension interne, rumination mentale…",
   "douleur et tension de l'épaule et de l'omoplate…"
  ],
  "autre": true
 },
 {
  "title": "Jué yīn / gros intestin (dà cháng), reins (shèn)",
  "grid": [
   "GI",
   "EC",
   "F",
   "Rn"
  ],
  "actions": [
   "régularise jué yīn",
   "favorise la respiration, les fonctions cardiaques, le transit et l’évacuation",
   "métabolise le vent",
   "favorise la circulation et l’élimination par les mictions et les selles",
   "favorise les orifices inférieurs et le foyer inférieur",
   "favorise les parties génitales",
   "nourrit le yīn et le sang (xuè)",
   "calme le shén",
   "favorise la circulation du qì et du sang (xuè) dans les canaux du circuit"
  ],
  "indications": [
   "baisse de la libido, impuissance, frigidité, aménorrhée, stérilité…",
   "céphalée, palpitations, insomnie, stress",
   "douleur abdominale, constipation, douleur lombaire…"
  ],
  "autre": true
 },
 {
  "title": "Shào yīn / rate (pí), trois foyers (sān jiāo)",
  "grid": [
   "C",
   "TF",
   "Rt",
   "Rn"
  ],
  "actions": [
   "traite le syndrome complexe d’atteinte de l’eau (shuǐ), du feu (huǒ) et de la terre (tǔ)",
   "clarifie la chaleur",
   "favorise le métabolisme des liquides, favorise l’élimination de l’humidité",
   "régularise le sang (xuè) et le jīng, favorise la production du sang (xuè)",
   "tonifie le qì, favorise la circulation de yuán qì",
   "favorise la mémoire",
   "calme le shén",
   "favorise la circulation du qì et du sang (xuè) dans les canaux du circuit"
  ],
  "indications": [
   "douleur lombaire, œdèmes, impuissance, rétention d'eau, baisse de la libido, stérilité…",
   "petit appétit, diarrhée, distension abdominale, faiblesse de la digestion, fatigue, anémie, vertiges orthostatiques, anémie, bouffées de chaleur, transpiration nocturne, insomnie, réveil précoce, troubles de la mémoire, difficulté de concentration, acouphènes…"
  ],
  "autre": true
 }
];
