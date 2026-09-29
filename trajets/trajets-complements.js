/* Compléments d'après l'illustration : lieux que montre l'image du cours mais que le texte
   du trajet ne cite pas. Chacun est « à valider » jusqu'à validation
   (ou le refuse) dans la page (mode ✎ Modifier). Champs :
   - canal, section : trajet concerné ; branche : extrait du texte de la branche ;
   - lieu : identifiant du lieu ajouté ; avant / apres : lieu de la branche à côté duquel l'insérer ;
   - page : page du cours où se trouve l'illustration ; note : ce que montre l'image. */
window.MTC_TRAJETS_COMPLEMENTS = [
 {"id":"GI-tend-VB13", "canal":"GI", "section":"tendineux", "branche":"passe par la tempe", "apres":"tempe", "lieu":"pt:VB 13", "page":14, "statut":"validé",
  "note":"VB 13 est nommé sur l'image, là où la branche enveloppe la tête."},
 {"id":"E-tend-E12", "canal":"E", "section":"tendineux", "branche":"fosse sus-claviculaire", "apres":"sus-clav", "lieu":"pt:E 12", "page":16, "statut":"validé",
  "note":"E 12 est nommé sur l'image, au creux sus-claviculaire."},
 {"id":"Rt-tend-RM3", "canal":"Rt", "section":"tendineux", "branche":"au-dessus du pubis", "apres":"pubis", "lieu":"pt:RM 3", "page":17, "statut":"validé",
  "note":"RM 3 est nommé sur l'image, au-dessus du pubis."},
 {"id":"IG-tend-VB13", "canal":"IG", "section":"tendineux", "branche":"angle du front", "apres":"front", "lieu":"pt:VB 13", "page":12, "statut":"validé",
  "note":"VB 13 est nommé sur l'image, à l'angle du front."},
 {"id":"V-tend-cotes", "canal":"V", "section":"tendineux", "branche":"passe sous l", "avant":"aisselle", "lieu":"cotes", "page":14, "statut":"validé",
  "note":"Sur l'image, la branche passe sur le côté du thorax (côtes) avant l'aisselle."},
 {"id":"V-tend-front", "canal":"V", "section":"tendineux", "branche":"contourne le sommet du cr", "avant":"nez", "lieu":"front", "page":14, "statut":"validé",
  "note":"L'image montre le trajet passant par la « ligne antérieure des cheveux » (front) avant le nez."},
 {"id":"Rn-tend-jambe", "canal":"Rn", "section":"tendineux", "branche":"remonte avec le canal tendineux de la rate", "avant":"cuisse", "lieu":"jambe", "page":13, "statut":"validé",
  "note":"L'image montre le trajet le long de la face médiale de la jambe."},
 {"id":"Rn-tend-genou", "canal":"Rn", "section":"tendineux", "branche":"remonte avec le canal tendineux de la rate", "avant":"cuisse", "lieu":"genou", "page":13, "statut":"validé",
  "note":"« Condyle médial du fémur » est nommé sur l'image (genou)."},
 {"id":"Rn-tend-sacrum", "canal":"Rn", "section":"tendineux", "branche":"plonge dans l", "avant":"colonne", "lieu":"sacrum", "page":13, "statut":"validé",
  "note":"Sur l'image, le trajet passe par le bassin et le sacrum avant de longer la colonne vertébrale."},
 {"id":"EC-tend-avant-bras", "canal":"EC", "section":"tendineux", "branche":"suit le canal tendineux du poumon", "avant":"coude", "lieu":"avant-bras", "page":11, "statut":"validé",
  "note":"L'image montre le trajet sur l'avant-bras, entre le médius et le coude."},
 {"id":"EC-tend-cotes-ant", "canal":"EC", "section":"tendineux", "branche":"zone antérolatérale", "apres":"thorax", "lieu":"cotes", "page":11, "statut":"validé",
  "note":"Sur l'image, les branches se dispersent sur les côtes."},
 {"id":"EC-tend-cotes-post", "canal":"EC", "section":"tendineux", "branche":"zone postérolatérale", "apres":"thorax", "lieu":"cotes", "page":11, "statut":"validé",
  "note":"Sur l'image, les branches se dispersent sur les côtes."},
 {"id":"VB-tend-VB40", "canal":"VB", "section":"tendineux", "branche":"4ème orteil", "apres":"malleole", "lieu":"pt:VB 40", "page":16, "statut":"validé",
  "note":"VB 40 est nommé sur l'image, à la malléole latérale."},
 {"id":"VB-tend-E32", "canal":"VB", "section":"tendineux", "branche":"partie supérieure de la fibula", "apres":"cuisse", "lieu":"pt:E 32", "page":16, "statut":"validé",
  "note":"E 32 est nommé sur l'image, au bout de la branche qui va vers l'avant de la cuisse."},
 {"id":"VB-tend-E12", "canal":"VB", "section":"tendineux", "branche":"grand trochanter jusqu", "apres":"sus-clav", "lieu":"pt:E 12", "page":16, "statut":"validé",
  "note":"E 12 est nommé sur l'image, au creux sus-claviculaire."},
 {"id":"VB-tend-DM20", "canal":"VB", "section":"tendineux", "branche":"se relie au vertex", "apres":"vertex", "lieu":"pt:DM 20", "page":16, "statut":"validé",
  "note":"DM 20 est nommé sur l'image, au vertex."},
 {"id":"VB-tend-IG18", "canal":"VB", "section":"tendineux", "branche":"arcade zygomatique", "apres":"pommette", "lieu":"pt:IG 18", "page":16, "statut":"validé",
  "note":"IG 18 est nommé sur l'image, sur l'arcade zygomatique."},
 {"id":"VB-tend-VB1", "canal":"VB", "section":"tendineux", "branche":"canthus externe", "apres":"yeux", "lieu":"pt:VB 1", "page":16, "statut":"validé",
  "note":"VB 1 est nommé sur l'image, au canthus externe."},
 {"id":"F-tend-genou", "canal":"F", "section":"tendineux", "branche":"gros orteil au F 1", "avant":"cuisse", "lieu":"genou", "page":14, "statut":"validé",
  "note":"L'image montre le trajet au genou ; le texte dit « condyle médial du tibia »."}
];
