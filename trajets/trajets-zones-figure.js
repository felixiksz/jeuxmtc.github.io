/* Zones du corps pour la figure de « Correspondance » : nom à afficher et repère sur la silhouette (viewBox 0 0 200 430).
   Chaque entrée : [nom, x, y, vue]. La zone de chaque point vient de trajets-point-zones.js (vérifiée à la main) ;
   ici on ne fait que marquer le centre de la zone sur le dessin.
   vue : 0 = de face · 1 = de dos · 2 = membre (de face ; de dos si la face du point est « postérieur ») · 3 = membre, toujours de dos.
   Pour un membre, x est celui du membre droit vu de face (à gauche du dessin) ; de dos, il est renvoyé de l'autre côté. */
window.MTC_TRAJETS_ZONE_FIG = {
 "vertex":["sommet de la tête", 100, 15, 0], "crane":["crâne", 100, 18, 0], "cheveux":["cuir chevelu", 100, 20, 0], "front":["front", 100, 25, 0],
 "angle-frontal":["angle frontal", 86, 21, 0], "tempe":["tempe", 80, 30, 0], "sourcil":["sourcil", 89, 27, 0],
 "canthus-int":["canthus interne", 95, 32, 0], "canthus-ext":["canthus externe", 83, 32, 0], "sous-orbitaire":["région sous-orbitaire", 90, 37, 0],
 "nez":["nez", 100, 38, 0], "aile-nez":["aile du nez", 95, 41, 0], "narine":["narine", 97, 43, 0], "pommette":["pommette", 83, 38, 0],
 "arcade-zyg":["arcade zygomatique", 79, 35, 0], "joue":["joue", 84, 44, 0], "bouche":["bouche", 100, 46, 0], "levres":["lèvres", 100, 46, 0],
 "gouttiere":["gouttière labiale", 100, 42, 0], "gencive-sup":["gencive supérieure", 100, 44, 0], "sillon-ml":["sillon mentolabial", 100, 50, 0],
 "mandibule":["mandibule", 86, 49, 0], "angle-mandibule":["angle de la mandibule", 81, 47, 0],
 "devant-oreille":["devant l’oreille", 77, 36, 0], "dessus-oreille":["au-dessus de l’oreille", 76, 29, 0], "apex-oreille":["sommet de l’oreille", 74, 27, 0],
 "autour-oreille":["autour de l’oreille", 73, 36, 0], "derriere-oreille":["derrière l’oreille", 76, 42, 0], "mastoide":["mastoïde", 78, 47, 0],
 "occiput":["occiput", 100, 34, 1], "nuque":["nuque", 100, 57, 1],
 "cou":["cou", 100, 60, 0], "gorge":["gorge", 100, 60, 0], "sus-clav":["creux sus-claviculaire", 90, 67, 0], "clavicule":["clavicule", 80, 71, 0],
 "trapeze":["trapèze", 84, 71, 1], "acromion":["acromion", 55, 71, 0], "epaule":["épaule", 58, 79, 2], "aisselle":["aisselle", 54, 94, 2],
 "thorax":["thorax", 100, 98, 0], "mamelon":["mamelon", 82, 112, 0], "seins":["seins", 84, 112, 0], "thorax-lat":["côté du thorax", 70, 122, 0],
 "cotes":["côtes", 72, 140, 0], "cotes-flott":["côtes flottantes", 72, 160, 0],
 "abdomen":["abdomen", 100, 150, 0], "ombilic":["ombilic", 100, 172, 0], "abdomen-inf":["bas-ventre", 100, 190, 0], "pubis":["pubis", 100, 205, 0],
 "symphyse":["symphyse pubienne", 100, 207, 0], "aine":["aine", 84, 214, 0], "perinee":["périnée", 100, 233, 0], "hanche":["hanche", 67, 212, 2],
 "supraep":["fosse supra-épineuse", 118, 85, 1], "infraep":["fosse infra-épineuse", 118, 103, 1], "dos":["dos", 100, 118, 1], "vertebres":["vertèbres", 100, 134, 1],
 "lombes":["lombes", 100, 168, 1], "lombaires":["région lombaire", 100, 168, 1], "sacrum":["sacrum", 100, 192, 1], "coccyx":["coccyx", 100, 207, 1], "fesse":["fesse", 122, 216, 1],
 "bras":["bras", 45, 108, 2], "pli-coude":["pli du coude", 39, 140, 2], "coude":["coude", 38, 142, 2], "olecrane":["olécrane", 38, 142, 2],
 "avant-bras":["avant-bras", 32, 170, 2], "poignet":["poignet", 28, 196, 2], "dos-poignet":["dos du poignet", 28, 196, 2],
 "paume":["paume", 25, 212, 2], "thenar":["thénar", 28, 208, 2], "main":["main", 25, 214, 2], "dos-main":["dos de la main", 25, 214, 2], "metacarpe":["métacarpe", 25, 212, 2],
 "pouce":["pouce", 31, 222, 2], "index":["index", 27, 232, 2], "medius":["médius", 24, 235, 2], "annulaire":["annulaire", 21, 232, 2], "petit-doigt":["petit doigt", 18, 226, 2],
 "cuisse":["cuisse", 75, 258, 2], "genou":["genou", 72, 300, 2], "poplite":["creux poplité", 72, 302, 3], "jambe":["jambe", 72, 342, 2], "gastrocnemien":["mollet", 72, 335, 3],
 "malleole":["malléole", 70, 385, 2], "malleole-int":["malléole interne", 75, 385, 2], "malleole-ext":["malléole externe", 66, 385, 2],
 "talon":["talon", 72, 395, 3], "tendon-calc":["tendon calcanéen", 72, 381, 3], "dos-pied":["dos du pied", 70, 398, 2], "tarse":["tarse", 70, 396, 2],
 "naviculaire":["naviculaire", 75, 396, 2], "metatarse":["métatarse", 70, 404, 2], "plante":["plante du pied", 70, 410, 3],
 "hallux":["gros orteil", 77, 414, 2], "orteils":["orteils", 68, 416, 2], "petit-orteil":["petit orteil", 62, 414, 2]
};
