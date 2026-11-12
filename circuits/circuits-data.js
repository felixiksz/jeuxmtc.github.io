// Circuits thérapeutiques de Dr Tán, repris du cours « Les circuits thérapeutiques » (École Zhōng Lì, version du 27/10/2021).
// grid : [haut gauche, haut droite, bas gauche, bas droite] comme dans le cours (main en haut, pied en bas).
// autre : circuits qui ne reposent que sur l'équilibre dynamique (chapitre 13).
// Indications et actions : base des circuits d’Assistant-MTC (acupuncture/circuits/circuits.json), enrichie des notes personnelles (circuits_perso.json).
// mots : mots-clés de l’usage le plus courant (mots_cles.json, ou ceux modifiés dans l’application).
// Fichier réécrit automatiquement par circuits-assistant-sync.js quand Assistant-MTC change.
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
   "calme le shén (ajout possible Rn + V + C ensemble)",
   "favorise la circulation du qì et du sang (xuè) dans les canaux du circuit"
  ],
  "indications": [
   "fatigue, troubles de la transpiration, œdèmes, troubles de la thyroïde, troubles du cou, fibromyalgie, faiblesse des membres",
   "troubles psycho-émotionnels, agoraphobie",
   "amenorrhée",
   "asthme, toux, souffle court, rhinite, sinusites, bronchites, amygdalite, angine, rhume, grippe, allergies, faiblesse immunitaire",
   "dermatoses, herpès labial",
   "distension abdominale, diarrhée chronique, constipation, douleur abdominale, faiblesse de l'estomac, faiblesse de digestion, ulcère de l’estomac, gastrite, colique, allergie alimentaire, diabète"
  ],
  "mots": [
   "troubles digestifs (gastro, constipation, diarrhée, ballonnements, rééquilibrage de la flore)",
   "problèmes dermatologiques",
   "boost de l'immunité (allergie, nez…)",
   "équilibre du microbiote"
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
   "dépression, apathie, asthénie…",
   "trouble de tai yang avec implication du tai yin"
  ],
  "mots": [
   "DLRS sur canal Tai Yang",
   "froid-humidité Rt/P",
   "troubles respiratoires ou digestifs",
   "accumulation d'humidité sur Tai Yang (céphalée, nez, dos, sciatalgie)"
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
   "régularise le niveau tài yáng",
   "relâche le bois (mù) et renforce la terre (tǔ), via le feu (huǒ)",
   "métabolise le froid et le vent",
   "favorise la circulation et l’élimination par les mictions et la transpiration des liquides (jīn yè)",
   "calme le shén",
   "favorise la circulation du qì et du sang (xuè) dans les canaux du circuit"
  ],
  "indications": [
   "troubles du nez, des yeux, des oreilles, de la tête, migraine au repos..",
   "troubles de la respiration, allergie, asthme, troubles du nez, mei he qi, syndrome de noyau de prune, obstruction de la gorge, allergies au changement de saison..",
   "troubles psycho-émotionnels, tristesse, colère, psychose dépressive diān, psychose maniaque kuáng, irritabilité, fatigue, irritabilité et fatigue si faim, tension émotionnelle (pénitude plutot), sujet au burn-out hyperactifs, ils poussent jusqu'au bout puis tombent malade en vacances…",
   "troubles des mictions",
   "troubles des parties génitales, impuissance…",
   "douleur du dos, des lombes, de la nuque, de la scapula…"
  ],
  "mots": [
   "réserve de Qi",
   "DLRS sur trajet Tai Yang",
   "DLRS augmentées par les émotions",
   "stagnation de Qi",
   "dorsalgie ou sciatalgie par stagnation"
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
   "grande fatigue, allergies, vide de yang chronique, surmenage",
   "lombalgie, je mange, j'ai mal au dos",
   "colites, constipation",
   "URINAIRE, EAU",
   "mictions fréquentes, incontinence urinaire, visage gonflé, l'eau qui stagne en bas",
   "GYNECO, ANDRO",
   "impuissance, stérilité"
  ],
  "mots": [
   "problèmes respiratoires",
   "excrétion de liquides",
   "favorise les liquides organiques, action sur le foyer inférieur (asthme, constipation, allergie, stérilité)"
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
   "HTA, hypertension artérielle",
   "troubles de la digestion et de l’abdomen liés au stress, à l’anxiété, aux désordres émotionnels, irritabilité, colère, stress, anxiété, insomnie avec réveil facile au bruit, névrose, agitation du vent, insécurité, overthinking, phobies, terreur, arrêt du tabac et d'autres addictions ou actions qui ne sont pas en accord avec soi",
   "constipation, syndrome du côlon irritable, colopathie fonctionnelle, perte de l’appétit, ulcère de l’estomac, syndrome méi hé qì, hépatite, nausées, vomissements, maladie de Crohn, intestin irritable, IBS, collopathie…",
   "oppression thoracique, douleur de la région thoracique latérale, dysphorie du cœur",
   "allergies avec notion émotionnelle",
   "endométriose plénitude, cystite interstitielle, vessie douloureuse (plancher pelvienne tres lié a jue yin)",
   "zona (selon les zones d'apparition)"
  ],
  "mots": [
   "ATTENTION, réseau très remuant psy",
   "troubles émotionnels avec répercussions digestives",
   "parties génitales et digestives / métabolisme",
   "ado stressé",
   "vent et sécheresse = dermatoses",
   "drama queen"
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
   "nervosité, peurs multiples, anxiété, palpitations, troubles psy…",
   "douleur gastrique et/ ou intestinale, constipation, maladie cœliaque, remontées acides",
   "obstruction nasale, maux de gorge fréquents",
   "crainte de la chaleur, soif, transpiration excessive de la tête, thyroide, amygdale, végétation, corde vocale, palpitations",
   "ulcères",
   "GYNÉCO, ANDRO",
   "troubles des organes génitaux, ménopause, bouffées de chaleur"
  ],
  "mots": [
   "bande centrale",
   "réserve eau-feu",
   "troubles digestifs + palpitations + fatigue",
   "problèmes génitaux, hormonaux avec chaleur",
   "gêne thoracique",
   "pathologies Yang Ming avec fatigue"
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
   "favorise la circulation du qì et du sang (xuè) dans les canaux du circuit",
   "stimule TF pour faire revenir yuan qi a la rate"
  ],
  "indications": [
   "fatigue",
   "troubles de la digestion, digestion difficile, lente, petit appétit, manque d'appétit,reflux gastro-œsophagien, diarrhée, constipation, ulcère de l’estomac, troubles digestifs qui affectent le cœur, oedeme",
   "prise de poids a la ménopause par vide de yuan qi a la rate et estomac, oligoménorrhée, crampes menstruelles, dysménorrhée avec troubles digestifs"
  ],
  "mots": [
   "obésité et troubles digestifs ménopause",
   "régulation hormonale féminine",
   "vide de rate → répercussion sur le cœur chez la femme",
   "œdèmes et vide de sang",
   "perturbation du cœur par déficience de rate avec humidité",
   "EC traite C"
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
   "fatigue, soupirs fréquents…",
   "stress",
   "anxiété",
   "agitation",
   "sensation d’être perdu",
   "difficulté de mémorisation",
   "difficulté de concentration",
   "pleures sans raison",
   "sauts d'humeur",
   "SPM marqués",
   "anémie",
   "petit appétit",
   "manque d'appétit",
   "troubles digestifs",
   "diabète avec soif",
   "fatigue après les repas",
   "constipation (par vide de sang)",
   "muscles tendus par vide de sang, tension de la nuque et des épaules",
   "épilepsie, maladie de Parkinson…",
   "endométriose par vide de sang, troubles hormonaux féminins",
   "céphalée",
   "POULS fin (et superficiel), surtout au loge du C",
   "LANGUE pale et gonflé (pointe rouge possible)"
  ],
  "mots": [
   "troubles digestifs YIN + troubles psy (stress, rumination)",
   "vide de sang du cœur par vide de rate",
   "montée de yang du foie",
   "ménopause"
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
   "régularise les niveaux shào yīn et tài yáng",
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
   "troubles oculaires par vide, troubles de la vision par vieillissement, céphalée occipitale, douleur de nuque, acouphènes",
   "des épaules, du dos et de la colonne, ostéoporose, syndrome d'obstruction-bi vent-froid humidité: lombalgie, sciatique, faiblesse de la face postérieur",
   "palpitations, déséquilibres cardiaques",
   "anémie",
   "troubles de la mémoire, insomnie",
   "syndrome des jambes sans repos…",
   "stérilité, impuissance, aménorrhée, troubles de la ménopause",
   "syndromes urinaires par vide, pollakiurie ou oligurie, énurésie, œdèmes, hématurie…"
  ],
  "mots": [
   "surménage",
   "grande fatigue",
   "douleurs stase de sang canal Tai Yang + signes de chaleur Shao Yin",
   "signes sur le cœur",
   "palpitations",
   "accumulation d'humidité bas du corps"
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
   "hypertension artérielle, HTA, palpitations, céphalée, chaleur dans le sang (avec ou sans humidité), Pouls rapide avec teint rouge, maladies auto-immunes",
   "troubles psycho-émotionnels, stress, sursauts au moindre bruit, insomnie avec crainte de la chaleur, rêves abondants, agitation",
   "entérite, hépatite…",
   "zona (selon les zones d'apparition), érythèmes rouge vifs"
  ],
  "mots": [
   "au feu les pompiers",
   "feu, brulures, plénitude",
   "associer le cœur au foie",
   "problèmes génitaux, céphalées…",
   "signes sur le cœur",
   "calme le Shen et clarifie la chaleur"
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
   "anxiété, troubles de la mémoire, stress, anxiété, tension émotionnelle mais pas spécialement d’agitation, irritabilité, colère qui ne dure pas, pas de ressentiment, vit dans le passé, insomnie avec fatigue extrême, tourne sans arrêt dans le lit, dépression, démotivation par épuisement, pensées négatives, manque de confiance en soi, personne frileuse-raleuse, regard vide",
   "anémie",
   "palpitations, pouls profond, teint sombre",
   "GYNÉCO, ANDRO",
   "stérilité, impuissance, frigidité, bouffées de chaleur, ménopause",
   "douleur de nuque, céphalées, douleur lombaire, sciatalgie, coxalgie, douleur des genoux, troubles du système osseux, troubles de mobilité, hanches, épaules, genoux, articulations, lombalgie nocturne, polyarthrite, sensation de marcher dans un marais avec des bottes de plomb, lourdeur"
  ],
  "mots": [
   "personne frileuse-raleuse, BEN : déséquilibre Shao Yin",
   "BIAO : signes Shao Yang + troubles émotionnels",
   "type Shao Yang nerveux qui tient sur la fatigue",
   "chaleur vide et plénitude"
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
   "donne l'impression d’être exemplaire mais fond d'épuisement, veut briller par peur de pas être assez, troubles psycho-émotionnels, irritabilité (souvent contenue), nervosité, agitation, tension émotionnelle, cyclothymie, sauts d'humeur, troubles bipolaires, anxiété, insomnie avec difficulté d’endormissement, difficulté à se détendre, difficulté à lâcher-prise, besoin du respect des règles, control freak, besoin de tout contrôler, souhaite être parfait, rigidité physique et émotionnel, prise de décision rapide ou indécision, méticuleux-se, F5 a shi, psychorigide, dure avec soi, dure avec les autres",
   "céphalée temporale, cervicalgie, coxalgie, douleur de la région thoracique latérale, névralgie intercostale, tension des trapezes, épaule relevé, carré des lombes douleureux…",
   "troubles gynécologiques, dysménorrhée…",
   "oppression thoracique, troubles région latérale, palpitations, quand assis penché d'un coté, hyperthyroïdie, épilepsie, maladie de Parkinson, fibromyalgie, lithiase biliaire…"
  ],
  "mots": [
   "wonder woman",
   "veut briller par peur de pas être assez",
   "blocage ou émotions +++",
   "ados stressés",
   "chaleur (Yang Ming organe)",
   "problèmes génitaux",
   "signes de chaleur autre que digestifs",
   "stress → migraines",
   "préparation pour compétition sportive anti-crampes"
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
  "autre": true,
  "mots": [
   "le foie agresse la rate + trajet IG (stress → toux, gorge qui gratte, nuque)",
   "alternance selles moulées / diarrhées",
   "stagnation de Qi du foie",
   "problèmes respiratoires + signes de la rate",
   "douleurs trajet IG"
  ]
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
  "autre": true,
  "mots": [
   "signes Jué Yin avec déficience des reins",
   "équilibre dynamique : EC · GI / E · Rn (+ F)"
  ]
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
  "autre": true,
  "mots": [
   "dysharmonie cœur/reins",
   "vide de sang ou vide de yin",
   "blocage de la voie de l'eau",
   "équilibre dynamique : C · TF / VB · Rt (+ Rn)"
  ]
 }
];
