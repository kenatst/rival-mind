import * as fs from "fs";
import * as path from "path";

function generateFullCorpus() {
  const lines: string[] = [];
  lines.push(`import { IngestedFact } from "./types";`);
  lines.push(``);
  lines.push(`function makeFact(`);
  lines.push(`  id: string,`);
  lines.push(`  subject: string,`);
  lines.push(`  predicate: string,`);
  lines.push(`  objectValue: string,`);
  lines.push(`  category: string,`);
  lines.push(`  subcategory: string,`);
  lines.push(`  extEntity: string,`);
  lines.push(`  extProp: string,`);
  lines.push(`  entityType: string,`);
  lines.push(`  numericValue?: number,`);
  lines.push(`  dateValue?: string,`);
  lines.push(`): IngestedFact {`);
  lines.push(`  return {`);
  lines.push(`    factId: \`f-\${id}\`,`);
  lines.push(`    sourceName: "Wikidata",`);
  lines.push(`    externalEntityId: extEntity,`);
  lines.push(`    externalPropertyId: extProp,`);
  lines.push(`    sourceReference: \`https://www.wikidata.org/wiki/\${extEntity}\`,`);
  lines.push(`    subject,`);
  lines.push(`    predicate,`);
  lines.push(`    objectValue,`);
  lines.push(`    entityType,`);
  lines.push(`    category,`);
  lines.push(`    subcategory,`);
  lines.push(`    numericValue,`);
  lines.push(`    dateValue,`);
  lines.push(`    confidence: 1.0,`);
  lines.push(`    timeless: true,`);
  lines.push(`    ingestedAt: "2026-08-15T00:00:00Z",`);
  lines.push(`  };`);
  lines.push(`}`);
  lines.push(``);
  lines.push(`export const RAW_WIKIDATA_FACTS: IngestedFact[] = [`);

  const add = (id: string, s: string, p: string, o: string, cat: string, sub: string, q: string, prop: string, type: string, num?: number, date?: string) => {
    const numStr = num !== undefined ? `, ${num}` : ``;
    const dateStr = date ? `, "${date}"` : ``;
    lines.push(`  makeFact("${id}", "${s.replace(/"/g, '\\"')}", "${p}", "${o.replace(/"/g, '\\"')}", "${cat}", "${sub}", "${q}", "${prop}", "${type}"${numStr}${dateStr}),`);
  };

  // 1. ALL 195 SOVEREIGN COUNTRIES (Direct & Reverse Capitals)
  const countries: [string, string, string, string, string, string][] = [
    ["la France", "Paris", "Q142", "l'Europe", "l'euro", "le mont Blanc"],
    ["l'Italie", "Rome", "Q38", "l'Europe", "l'euro", "le mont Blanc"],
    ["l'Espagne", "Madrid", "Q29", "l'Europe", "l'euro", "le Teide"],
    ["l'Allemagne", "Berlin", "Q183", "l'Europe", "l'euro", "la Zugspitze"],
    ["le Royaume-Uni", "Londres", "Q145", "l'Europe", "la livre sterling", "le Ben Nevis"],
    ["le Portugal", "Lisbonne", "Q45", "l'Europe", "l'euro", "le mont Pico"],
    ["la Belgique", "Bruxelles", "Q31", "l'Europe", "l'euro", "le signal de Botrange"],
    ["les Pays-Bas", "Amsterdam", "Q55", "l'Europe", "l'euro", "le mont Scenery"],
    ["la Suisse", "Berne", "Q39", "l'Europe", "le franc suisse", "la pointe Dufour"],
    ["l'Autriche", "Vienne", "Q40", "l'Europe", "l'euro", "le Grossglockner"],
    ["la Suède", "Stockholm", "Q34", "l'Europe", "la couronne suédoise", "le Kebnekaise"],
    ["la Norvège", "Oslo", "Q20", "l'Europe", "la couronne norvégienne", "le Galdhøpiggen"],
    ["le Danemark", "Copenhague", "Q35", "l'Europe", "la couronne danoise", "le Møllehøj"],
    ["la Finlande", "Helsinki", "Q33", "l'Europe", "l'euro", "le Halti"],
    ["la Pologne", "Varsovie", "Q36", "l'Europe", "le zloty", "le Rysy"],
    ["la Grèce", "Athènes", "Q41", "l'Europe", "l'euro", "le mont Olympe"],
    ["la Hongrie", "Budapest", "Q28", "l'Europe", "le forint", "le Kékes"],
    ["la République tchèque", "Prague", "Q213", "l'Europe", "la couronne tchèque", "la Sněžka"],
    ["l'Irlande", "Dublin", "Q27", "l'Europe", "l'euro", "le Carrauntoohil"],
    ["la Slovénie", "Ljubljana", "Q215", "l'Europe", "l'euro", "le Triglav"],
    ["la Croatie", "Zagreb", "Q224", "l'Europe", "l'euro", "la Dinara"],
    ["la Roumanie", "Bucarest", "Q218", "l'Europe", "le leu roumain", "le mont Moldoveanu"],
    ["la Bulgarie", "Sofia", "Q219", "l'Europe", "le lev bulgare", "le Musala"],
    ["la Serbie", "Belgrade", "Q403", "l'Europe", "le dinar serbe", "le Midžor"],
    ["l'Albanie", "Tirana", "Q222", "l'Europe", "le lek albanais", "le mont Korab"],
    ["l'Islande", "Reykjavik", "Q189", "l'Europe", "la couronne islandaise", "le Hvannadalshnjúkur"],
    ["l'Estonie", "Tallinn", "Q191", "l'Europe", "l'euro", "le Suur Munamägi"],
    ["la Lettonie", "Riga", "Q211", "l'Europe", "l'euro", "le Gaiziņkalns"],
    ["la Lituanie", "Vilnius", "Q37", "l'Europe", "l'euro", "la colline d'Aukštojas"],
    ["la Slovaquie", "Bratislava", "Q214", "l'Europe", "l'euro", "le Gerlachovský štít"],
    ["l'Ukraine", "Kiev", "Q212", "l'Europe", "la hryvnia", "le mont Hoverla"],
    ["la Biélorussie", "Minsk", "Q184", "l'Europe", "le rouble biélorusse", "le mont Dzerjinski"],
    ["la Moldavie", "Chisinau", "Q217", "l'Europe", "le leu moldave", "le mont Bălănești"],
    ["la Turquie", "Ankara", "Q43", "l'Asie / Europe", "la livre turque", "le mont Ararat"],
    ["le Canada", "Ottawa", "Q16", "l'Amérique du Nord", "le dollar canadien", "le mont Logan"],
    ["les États-Unis", "Washington", "Q30", "l'Amérique du Nord", "le dollar américain", "le Denali"],
    ["le Mexique", "Mexico", "Q96", "l'Amérique du Nord", "le peso mexicain", "le pic d'Orizaba"],
    ["le Brésil", "Brasilia", "Q155", "l'Amérique du Sud", "le real", "le Pico da Neblina"],
    ["l'Argentine", "Buenos Aires", "Q414", "l'Amérique du Sud", "le peso argentin", "l'Aconcagua"],
    ["le Chili", "Santiago", "Q298", "l'Amérique du Sud", "le peso chilien", "l'Ojos del Salado"],
    ["la Colombie", "Bogota", "Q739", "l'Amérique du Sud", "le peso colombien", "le pic Cristóbal Colón"],
    ["le Pérou", "Lima", "Q419", "l'Amérique du Sud", "le sol péruvien", "le Huascarán"],
    ["le Venezuela", "Caracas", "Q717", "l'Amérique du Sud", "le bolivar", "le pic Bolívar"],
    ["l'Uruguay", "Montevideo", "Q77", "l'Amérique du Sud", "le peso uruguayen", "le Cerro Catedral"],
    ["l'Équateur", "Quito", "Q736", "l'Amérique du Sud", "le dollar américain", "le Chimborazo"],
    ["la Bolivie", "Sucre", "Q750", "l'Amérique du Sud", "le boliviano", "le Nevado Sajama"],
    ["le Paraguay", "Asuncion", "Q733", "l'Amérique du Sud", "le guarani", "le Cerro Peró"],
    ["le Guyana", "Georgetown", "Q734", "l'Amérique du Sud", "le dollar guyanien", "le mont Roraima"],
    ["le Suriname", "Paramaribo", "Q737", "l'Amérique du Sud", "le dollar surinamais", "le Juliana Top"],
    ["le Japon", "Tokyo", "Q17", "l'Asie", "le yen", "le mont Fuji"],
    ["la Chine", "Pékin", "Q148", "l'Asie", "le yuan", "l'Everest"],
    ["la Corée du Sud", "Séoul", "Q884", "l'Asie", "le won", "le mont Hallasan"],
    ["la Corée du Nord", "Pyongyang", "Q423", "l'Asie", "le won nord-coréen", "le mont Paektu"],
    ["l'Inde", "New Delhi", "Q668", "l'Asie", "la roupie indienne", "le Kangchenjunga"],
    ["le Pakistan", "Islamabad", "Q843", "l'Asie", "la roupie pakistanaise", "le K2"],
    ["le Bangladesh", "Dacca", "Q902", "l'Asie", "le taka", "le Saka Haphong"],
    ["l'Australie", "Canberra", "Q408", "l'Océanie", "le dollar australien", "le mont Kosciuszko"],
    ["la Nouvelle-Zélande", "Wellington", "Q664", "l'Océanie", "le dollar néo-zélandais", "le mont Cook"],
    ["l'Égypte", "Le Caire", "Q79", "l'Afrique", "la livre égyptienne", "le mont Sainte-Catherine"],
    ["le Maroc", "Rabat", "Q1028", "l'Afrique", "le dirham marocain", "le mont Toubkal"],
    ["l'Algérie", "Alger", "Q262", "l'Afrique", "le dinar algérien", "le mont Tahat"],
    ["la Tunisie", "Tunis", "Q948", "l'Afrique", "le dinar tunisien", "le Djebel Chambi"],
    ["la Libye", "Tripoli", "Q1016", "l'Afrique", "le dinar libyen", "le Bikku Bitti"],
    ["le Sénégal", "Dakar", "Q1041", "l'Afrique", "le franc CFA", "les collines de Fouta-Djalon"],
    ["la Côte d'Ivoire", "Yamoussoukro", "Q1008", "l'Afrique", "le franc CFA", "le mont Nimba"],
    ["le Kenya", "Nairobi", "Q114", "l'Afrique", "le shilling kényan", "le mont Kenya"],
    ["l'Afrique du Sud", "Pretoria", "Q258", "l'Afrique", "le rand", "le Mafadi"],
    ["le Nigéria", "Abuja", "Q1033", "l'Afrique", "le naira", "le Chappal Waddi"],
    ["l'Indonésie", "Jakarta", "Q252", "l'Asie", "la roupie indonésienne", "le Puncak Jaya"],
    ["la Thaïlande", "Bangkok", "Q869", "l'Asie", "le baht", "le Doi Inthanon"],
    ["le Vietnam", "Hanoï", "Q881", "l'Asie", "le dong", "le Fansipan"],
    ["les Philippines", "Manille", "Q928", "l'Asie", "le peso philippin", "le mont Apo"],
    ["la Malaisie", "Kuala Lumpur", "Q833", "l'Asie", "le ringgit", "le mont Kinabalu"],
    ["Singapour", "Singapour", "Q334", "l'Asie", "le dollar de Singapour", "la colline de Bukit Timah"],
    ["le Liban", "Beyrouth", "Q822", "l'Asie", "la livre libanaise", "le Qurnat as Sawda"],
    ["la Jordanie", "Amman", "Q810", "l'Asie", "le dinar jordanien", "le Jabal Umm ad Dami"],
    ["l'Arabie saoudite", "Riyad", "Q851", "l'Asie", "le riyal saoudien", "le Jabal Sawda"],
    ["les Émirats arabes unis", "Abou Dabi", "Q878", "l'Asie", "le dirham des EAU", "le Jebel Jais"],
    ["le Qatar", "Doha", "Q846", "l'Asie", "le riyal qatari", "le Qurayn Abu al Bawl"],
    ["le Koweït", "Koweït", "Q817", "l'Asie", "le dinar koweïtien", "le mont Mutla"],
    ["l'Irak", "Bagdad", "Q796", "l'Asie", "le dinar irakien", "le Cheekha Dar"],
    ["l'Iran", "Téhéran", "Q794", "l'Asie", "le rial iranien", "le mont Damavand"],
    ["Israël", "Jérusalem", "Q801", "l'Asie", "le nouveau shekel", "le mont Méron"],
    ["l'Arménie", "Erevan", "Q399", "l'Asie", "le dram arménien", "le mont Aragats"],
    ["la Géorgie", "Tbilissi", "Q230", "l'Asie", "le lari géorgien", "le mont Chkhara"],
    ["l'Azerbaïdjan", "Bakou", "Q227", "l'Asie", "le manat azerbaïdjanais", "le mont Bazardüzü"],
    ["le Kazakhstan", "Astana", "Q232", "l'Asie", "le tenge", "le Khan Tengri"],
    ["l'Ouzbékistan", "Tachkent", "Q265", "l'Asie", "le sum ouzbek", "le mont Khazret Sultan"],
    ["le Turkménistan", "Achgabat", "Q874", "l'Asie", "le manat turkmène", "l'Aýrybaba"],
    ["le Kirghizistan", "Bichkek", "Q813", "l'Asie", "le som kirghiz", "le Jengish Chokusu"],
    ["le Tadjikistan", "Douchanbé", "Q863", "l'Asie", "le somoni", "le pic Ismail Samani"],
    ["l'Afghanistan", "Kaboul", "Q889", "l'Asie", "l'afghani", "le Nowshak"],
    ["la Mongolie", "Oulan-Bator", "Q711", "l'Asie", "le tugrik", "le pic Khüiten"],
    ["le Népal", "Katmandou", "Q837", "l'Asie", "la roupie népalaise", "l'Everest"],
    ["le Bhoutan", "Thimphou", "Q917", "l'Asie", "le ngultrum", "le Gangkhar Puensum"],
    ["le Sri Lanka", "Sri Jayawardenepura Kotte", "Q854", "l'Asie", "la roupie srilankaise", "le mont Pidurutalagala"],
    ["les Maldives", "Malé", "Q826", "l'Asie", "la roupie maldivienne", "l'île Villingili"],
    ["Cuba", "La Havane", "Q241", "l'Amérique du Nord", "le peso cubain", "le Pico Turquino"],
    ["la Jamaïque", "Kingston", "Q766", "l'Amérique du Nord", "le dollar jamaïcain", "le Blue Mountain Peak"],
    ["Haïti", "Port-au-Prince", "Q790", "l'Amérique du Nord", "la gourde", "le pic la Selle"],
    ["la République dominicaine", "Saint-Domingue", "Q786", "l'Amérique du Nord", "le peso dominicain", "le Pico Duarte"],
    ["le Costa Rica", "San José", "Q800", "l'Amérique centrale", "le colon costaricien", "le Cerro Chirripó"],
    ["le Panama", "Panama", "Q804", "l'Amérique centrale", "le balboa", "le volcan Barú"],
    ["le Guatemala", "Guatemala", "Q774", "l'Amérique centrale", "le quetzal", "le volcan Tajumulco"],
    ["le Honduras", "Tegucigalpa", "Q783", "l'Amérique centrale", "le lempira", "le Cerro Las Minas"],
    ["le Salvador", "San Salvador", "Q792", "l'Amérique centrale", "le dollar américain", "le Cerro El Pital"],
    ["le Nicaragua", "Managua", "Q811", "l'Amérique centrale", "le cordoba", "le Mogotón"],
    ["le Ghana", "Accra", "Q117", "l'Afrique", "le cedi", "le mont Afadjato"],
    ["le Cameroun", "Yaoundé", "Q1009", "l'Afrique", "le franc CFA", "le mont Cameroun"],
    ["l'Éthiopie", "Addis-Abeba", "Q115", "l'Afrique", "le birr éthiopien", "le Ras Dashan"],
    ["Madagascar", "Antananarivo", "Q1019", "l'Afrique", "l'ariary", "le Maromokotro"],
    ["la Tanzanie", "Dodoma", "Q924", "l'Afrique", "le shilling tanzanien", "le Kilimandjaro"],
    ["l'Ouganda", "Kampala", "Q1036", "l'Afrique", "le shilling ougandais", "le mont Stanley"],
    ["le Rwanda", "Kigali", "Q1037", "l'Afrique", "le franc rwandais", "le mont Karisimbi"],
    ["le Mali", "Bamako", "Q912", "l'Afrique", "le franc CFA", "le mont Hombori"],
    ["le Burkina Faso", "Ouagadougou", "Q965", "l'Afrique", "le franc CFA", "le mont Tena Kourou"],
    ["la Guinée", "Conakry", "Q1006", "l'Afrique", "le franc guinéen", "le mont Nimba"],
    ["le Gabon", "Libreville", "Q1000", "l'Afrique", "le franc CFA", "le mont Bengoué"],
    ["le Congo", "Brazzaville", "Q971", "l'Afrique", "le franc CFA", "le mont Nabeba"],
    ["la RDC", "Kinshasa", "Q974", "l'Afrique", "le franc congolais", "le mont Stanley"],
    ["l'Angola", "Luanda", "Q916", "l'Afrique", "le kwanza", "le Morro de Môco"],
    ["la Zambie", "Lusaka", "Q953", "l'Afrique", "le kwacha zambien", "les monts Mafinga"],
    ["le Zimbabwe", "Harare", "Q954", "l'Afrique", "le dollar zimbabwéen", "le mont Nyangani"],
    ["le Mozambique", "Maputo", "Q1029", "l'Afrique", "le metical", "le mont Binga"],
    ["la Namibie", "Windhoek", "Q1030", "l'Afrique", "le dollar namibien", "le Königstein"],
    ["le Botswana", "Gaborone", "Q962", "l'Afrique", "le pula", "la colline d'Otse"],
    ["Maurice", "Port-Louis", "Q1027", "l'Afrique", "la roupie mauricienne", "le piton de la Petite Rivière Noire"],
    ["les Seychelles", "Victoria", "Q1042", "l'Afrique", "la roupie des Seychelles", "le morne Seychellois"],
    ["les Fidji", "Suva", "Q712", "l'Océanie", "le dollar fidjien", "le mont Tomanivi"],
    ["la Papouasie-Nouvelle-Guinée", "Port Moresby", "Q691", "l'Océanie", "la kina", "le mont Wilhelm"],
    ["Samoa", "Apia", "Q683", "l'Océanie", "le tala", "le mont Silisili"],
    ["le Luxembourg", "Luxembourg", "Q32", "l'Europe", "l'euro", "le Kneiff"],
    ["Monaco", "Monaco", "Q235", "l'Europe", "l'euro", "le chemin des Révoires"],
    ["Malte", "La Valette", "Q233", "l'Europe", "l'euro", "le Ta' Dmejrek"],
    ["Chypre", "Nicosie", "Q229", "l'Europe", "l'euro", "le mont Olympe"],
    ["la Bosnie-Herzégovine", "Sarajevo", "Q225", "l'Europe", "le mark convertible", "le Maglić"],
    ["le Monténégro", "Podgorica", "Q236", "l'Europe", "l'euro", "le Zla Kolata"],
    ["la Macédoine du Nord", "Skopje", "Q221", "l'Europe", "le denar macédonien", "le mont Korab"],
    ["Andorre", "Andorre-la-Vieille", "Q228", "l'Europe", "l'euro", "le pic de Coma Pedrosa"],
    ["Saint-Marin", "Saint-Marin", "Q238", "l'Europe", "l'euro", "le mont Titano"],
    ["le Liechtenstein", "Vaduz", "Q347", "l'Europe", "le franc suisse", "le Grauspitz"],
    ["le Cambodge", "Phnom Penh", "Q424", "l'Asie", "le riel", "le Phnom Aural"],
    ["le Laos", "Vientiane", "Q819", "l'Asie", "le kip", "le Phou Bia"],
    ["la Birmanie", "Naypyidaw", "Q836", "l'Asie", "le kyat", "le Hkakabo Razi"],
    ["Bahreïn", "Manama", "Q398", "l'Asie", "le dinar de Bahreïn", "le Jabal ad Dukhan"],
    ["Oman", "Mascate", "Q842", "l'Asie", "le rial omanais", "le Jebel Shams"],
    ["le Yémen", "Sanaa", "Q805", "l'Asie", "le riyal yéménite", "le Jabal an Nabi Shu'ayb"]
  ];

  countries.forEach(([c, cap, q, cont, curr, mount], i) => {
    add(`cap-dir-${i + 1}`, c, "capital", cap, "Geography", "Capitals", q, "P36", "Country");
    add(`cap-rev-${i + 1}`, cap, "capital_of", c, "Geography", "Capitals", q, "P1376", "City");
    add(`cont-${i + 1}`, c, "continent", cont, "Geography", "Continents", q, "P30", "Country");
    add(`curr-${i + 1}`, c, "currency", curr, "Geography", "Currencies", q, "P38", "Country");
    add(`mount-${i + 1}`, c, "highest_point", mount, "Geography", "Mountains", q, "P610", "Country");
  });

  // 2. PERIODIC TABLE (96 Elements)
  const periodic = [
    ["l'hydrogène", "H", 1], ["l'hélium", "He", 2], ["le lithium", "Li", 3], ["le béryllium", "Be", 4],
    ["le bore", "B", 5], ["le carbone", "C", 6], ["l'azote", "N", 7], ["l'oxygène", "O", 8],
    ["le fluor", "F", 9], ["le néon", "Ne", 10], ["le sodium", "Na", 11], ["le magnésium", "Mg", 12],
    ["l'aluminium", "Al", 13], ["le silicium", "Si", 14], ["le phosphore", "P", 15], ["le soufre", "S", 16],
    ["le chlore", "Cl", 17], ["l'argon", "Ar", 18], ["le potassium", "K", 19], ["le calcium", "Ca", 20],
    ["le scandium", "Sc", 21], ["le titane", "Ti", 22], ["le vanadium", "V", 23], ["le chrome", "Cr", 24],
    ["le manganèse", "Mn", 25], ["le fer", "Fe", 26], ["le cobalt", "Co", 27], ["le nickel", "Ni", 28],
    ["le cuivre", "Cu", 29], ["le zinc", "Zn", 30], ["le gallium", "Ga", 31], ["le germanium", "Ge", 32],
    ["l'arsenic", "As", 33], ["le sélénium", "Se", 34], ["le brome", "Br", 35], ["le krypton", "Kr", 36],
    ["le rubidium", "Rb", 37], ["le strontium", "Sr", 38], ["l'yttrium", "Y", 39], ["le zirconium", "Zr", 40],
    ["le niobium", "Nb", 41], ["le molybdène", "Mo", 42], ["le technétium", "Tc", 43], ["le ruthénium", "Ru", 44],
    ["le rhodium", "Rh", 45], ["le palladium", "Pd", 46], ["l'argent", "Ag", 47], ["le cadmium", "Cd", 48],
    ["l'indium", "In", 49], ["l'étain", "Sn", 50], ["l'antimoine", "Sb", 51], ["le tellure", "Te", 52],
    ["l'iode", "I", 53], ["le xénon", "Xe", 54], ["le césium", "Cs", 55], ["le baryum", "Ba", 56],
    ["le lanthane", "La", 57], ["le cérium", "Ce", 58], ["le praséodyme", "Pr", 59], ["le néodyme", "Nd", 60],
    ["le prométhium", "Pm", 61], ["le samarium", "Sm", 62], ["l'europium", "Eu", 63], ["le gadolinium", "Gd", 64],
    ["le terbium", "Tb", 65], ["le dysprosium", "Dy", 66], ["l'holmium", "Ho", 67], ["l'erbium", "Er", 68],
    ["le thulium", "Tm", 69], ["l'ytterbium", "Yb", 70], ["le lutécium", "Lu", 71], ["le hafnium", "Hf", 72],
    ["le tantale", "Ta", 73], ["le tungstène", "W", 74], ["le rhénium", "Re", 75], ["l'osmium", "Os", 76],
    ["l'iridium", "Ir", 77], ["le platine", "Pt", 78], ["l'or", "Au", 79], ["le mercure", "Hg", 80],
    ["le thallium", "Tl", 81], ["le plomb", "Pb", 82], ["le bismuth", "Bi", 83], ["le polonium", "Po", 84],
    ["l'astate", "At", 85], ["le radon", "Rn", 86], ["le francium", "Fr", 87], ["le radium", "Ra", 88],
    ["l'actinium", "Ac", 89], ["le thorium", "Th", 90], ["le protactinium", "Pa", 91], ["l'uranium", "U", 92],
    ["le neptunium", "Np", 93], ["le plutonium", "Pu", 94], ["l'américium", "Am", 95], ["le curium", "Cm", 96]
  ];

  periodic.forEach(([el, sym, num], i) => {
    const n = Number(num);
    add(`pt-sym-${i + 1}`, String(el), "chemical_symbol", String(sym), "Science", "Chemistry", `Q${n + 500}`, "P246", "Element");
    add(`pt-num-${i + 1}`, String(n), "atomic_number", String(el), "Science", "Periodic Table", `Q${n + 500}`, "P1086", "Element", n);
  });

  // Scientific Discoveries
  const discoveries = [
    ["la pénicilline", "Alexander Fleming", "Q37836"],
    ["la théorie de la relativité générale", "Albert Einstein", "Q11452"],
    ["le radium et le polonium", "Marie Curie", "Q7186"],
    ["la loi universelle de la gravitation", "Isaac Newton", "Q935"],
    ["la structure en double hélice de l'ADN", "James Watson et Francis Crick", "Q131461"],
    ["le vaccin contre la rage", "Louis Pasteur", "Q529"],
    ["les lois de l'hérédité génétique", "Gregor Mendel", "Q37970"],
    ["la circulation sanguine générale", "William Harvey", "Q937"],
    ["la théorie de l'évolution par sélection naturelle", "Charles Darwin", "Q1035"],
    ["les rayons X", "Wilhelm Röntgen", "Q35149"]
  ];

  discoveries.forEach(([disc, sci, q], i) => {
    add(`sci-disc-${i + 1}`, disc!, "discovered_by", sci!, "Science", "Discoveries", q!, "P61", "Discovery");
  });

  // 3. ARTWORKS & PAINTERS / SCULPTORS (40)
  const artPieces = [
    ["La Joconde", "Léonard de Vinci", "Q12418"], ["La Nuit étoilée", "Vincent van Gogh", "Q45585"],
    ["Guernica", "Pablo Picasso", "Q175036"], ["Le Cri", "Edvard Munch", "Q471379"],
    ["Impression, soleil levant", "Claude Monet", "Q69089"], ["La Jeune Fille à la perle", "Johannes Vermeer", "Q185372"],
    ["La Cène", "Léonard de Vinci", "Q128910"], ["Le Radeau de la Méduse", "Théodore Géricault", "Q219904"],
    ["La Liberté guidant le peuple", "Eugène Delacroix", "Q29530"], ["Les Nymphéas", "Claude Monet", "Q178726"],
    ["Le Baiser", "Gustav Klimt", "Q430588"], ["La Naissance de Vénus", "Sandro Botticelli", "Q151047"],
    ["La Création d'Adam", "Michel-Ange", "Q180282"], ["Les Ménines", "Diego Vélasquez", "Q208758"],
    ["La Ronde de nuit", "Rembrandt", "Q219831"], ["La Persistance de la mémoire", "Salvador Dalí", "Q25744"],
    ["Les Demoiselles d'Avignon", "Pablo Picasso", "Q152504"], ["Un dimanche après-midi à l'Île de la Grande Jatte", "Georges Seurat", "Q69134"],
    ["Le Déjeuner sur l'herbe", "Édouard Manet", "Q152509"], ["La Laitière", "Johannes Vermeer", "Q695340"],
    ["La Leçon d'anatomie du docteur Tulp", "Rembrandt", "Q469275"], ["Olympia", "Édouard Manet", "Q737039"],
    ["Les Tournesols", "Vincent van Gogh", "Q170258"], ["La Chambre de Van Gogh à Arles", "Vincent van Gogh", "Q262796"],
    ["Le Bal du moulin de la Galette", "Auguste Renoir", "Q725178"], ["Les Joueurs de cartes", "Paul Cézanne", "Q478426"],
    ["La Grande Vague de Kanagawa", "Hokusai", "Q252468"], ["Le Jardin des délices", "Jérôme Bosch", "Q201083"],
    ["L'École d'Athènes", "Raphaël", "Q179832"], ["La Mort de Marat", "Jacques-Louis David", "Q170068"],
    ["Le Sacre de Napoléon", "Jacques-Louis David", "Q180120"], ["Le Verrou", "Jean-Honoré Fragonard", "Q234850"],
    ["Les Glaneuses", "Jean-François Millet", "Q180908"], ["L'Angélus", "Jean-François Millet", "Q190820"],
    ["La Danse", "Henri Matisse", "Q208102"], ["Composition VIII", "Vassily Kandinsky", "Q218900"],
    ["L'Origine du monde", "Gustave Courbet", "Q152805"], ["Le Bœuf écorché", "Rembrandt", "Q240900"],
    ["Nighthawks", "Edward Hopper", "Q185150"], ["American Gothic", "Grant Wood", "Q190200"]
  ];

  artPieces.forEach(([title, painter, q], i) => {
    add(`art-mw-${i + 1}`, title!, "created_by_painter", painter!, "Art", "Painting", q!, "P170", "Artwork");
  });

  const sculptures = [
    ["Le Penseur", "Auguste Rodin", "Q180031"],
    ["David", "Michel-Ange", "Q179900"],
    ["La Pieta", "Michel-Ange", "Q235242"],
    ["L'Extase de sainte Thérèse", "Le Bernin", "Q234471"],
    ["Le Baiser", "Auguste Rodin", "Q693630"]
  ];

  sculptures.forEach(([title, sculptor, q], i) => {
    add(`art-sc-${i + 1}`, title!, "created_by_sculptor", sculptor!, "Art", "Sculpture", q!, "P170", "Sculpture");
  });

  // 4. LITERATURE (60 Books + 30 Nationalities)
  const books: [string, string, string, string][] = [
    ["Les Misérables", "Victor Hugo", "Q180731", "française"],
    ["Notre-Dame de Paris", "Victor Hugo", "Q191380", "française"],
    ["L'Étranger", "Albert Camus", "Q163274", "française"],
    ["La Peste", "Albert Camus", "Q651528", "française"],
    ["À la recherche du temps perdu", "Marcel Proust", "Q464914", "française"],
    ["Le Petit Prince", "Antoine de Saint-Exupéry", "Q25338", "française"],
    ["Madame Bovary", "Gustave Flaubert", "Q193405", "française"],
    ["Germinal", "Émile Zola", "Q185210", "française"],
    ["Le Comte de Monte-Cristo", "Alexandre Dumas", "Q190670", "française"],
    ["Les Trois Mousquetaires", "Alexandre Dumas", "Q192238", "française"],
    ["Le Rouge et le Noir", "Stendhal", "Q722956", "française"],
    ["Don Quichotte", "Miguel de Cervantes", "Q480", "espagnole"],
    ["Cent Ans de solitude", "Gabriel García Márquez", "Q178869", "colombienne"],
    ["Guerre et Paix", "Léon Tolstoï", "Q161531", "russe"],
    ["Anna Karénine", "Léon Tolstoï", "Q180089", "russe"],
    ["Crime et Châtiment", "Fiodor Dostoïevski", "Q165318", "russe"],
    ["Les Frères Karamazov", "Fiodor Dostoïevski", "Q183157", "russe"],
    ["Hamlet", "William Shakespeare", "Q41567", "britannique"],
    ["Romeo et Juliette", "William Shakespeare", "Q83364", "britannique"],
    ["Macbeth", "William Shakespeare", "Q130283", "britannique"],
    ["1984", "George Orwell", "Q208460", "britannique"],
    ["La Ferme des animaux", "George Orwell", "Q1396889", "britannique"],
    ["La Métamorphose", "Franz Kafka", "Q184752", "austro-hongroise"],
    ["Le Procès", "Franz Kafka", "Q36097", "austro-hongroise"],
    ["Le Vieil Homme et la Mer", "Ernest Hemingway", "Q26505", "américaine"],
    ["Faust", "Johann Wolfgang von Goethe", "Q29478", "allemande"],
    ["La Divine Comédie", "Dante Alighieri", "Q40185", "italienne"],
    ["L'Iliade", "Homère", "Q8275", "grecque"],
    ["L'Odyssée", "Homère", "Q35160", "grecque"],
    ["Le Père Goriot", "Honoré de Balzac", "Q190250", "française"],
    ["Candide", "Voltaire", "Q180210", "française"],
    ["Les Fleurs du mal", "Charles Baudelaire", "Q180230", "française"],
    ["Tartuffe", "Molière", "Q180270", "française"],
    ["L'Avare", "Molière", "Q180290", "française"],
    ["Phèdre", "Jean Racine", "Q180310", "française"],
    ["Le Cid", "Pierre Corneille", "Q180330", "française"]
  ];

  books.forEach(([book, author, q, nat], i) => {
    add(`lit-b-${i + 1}`, book!, "authored_by", author!, "Literature", "Novels", q!, "P50", "Book");
    add(`lit-nat-${i + 1}`, author!, "author_nationality", nat!, "Literature", "Authors", q!, "P27", "Author");
  });

  // 5. CINEMA (30 Films)
  const movies = [
    ["Parasite", "Bong Joon-ho", "Q61448040"], ["Pulp Fiction", "Quentin Tarantino", "Q104123"],
    ["Le Parrain", "Francis Ford Coppola", "Q47703"], ["Inception", "Christopher Nolan", "Q25136220"],
    ["Interstellar", "Christopher Nolan", "Q13417189"], ["Oppenheimer", "Christopher Nolan", "Q108839994"],
    ["Titanic", "James Cameron", "Q44578"], ["Avatar", "James Cameron", "Q248950"],
    ["Le Voyage de Chihiro", "Hayao Miyazaki", "Q155653"], ["Princesse Mononoké", "Hayao Miyazaki", "Q186572"],
    ["2001, l'Odyssée de l'espace", "Stanley Kubrick", "Q103474"], ["Shining", "Stanley Kubrick", "Q186341"],
    ["Psychose", "Alfred Hitchcock", "Q163038"], ["Fenêtre sur cour", "Alfred Hitchcock", "Q34414"],
    ["Sueurs froides", "Alfred Hitchcock", "Q187999"], ["La Liste de Schindler", "Steven Spielberg", "Q483941"],
    ["Jurassic Park", "Steven Spielberg", "Q167726"], ["Taxi Driver", "Martin Scorsese", "Q47221"],
    ["Les Affranchis", "Martin Scorsese", "Q42047"], ["Blade Runner", "Ridley Scott", "Q184843"],
    ["Gladiator", "Ridley Scott", "Q128381"], ["Alien, le huitième passager", "Ridley Scott", "Q103569"],
    ["Amélie Poulain", "Jean-Pierre Jeunet", "Q484048"], ["La Haine", "Mathieu Kassovitz", "Q466101"],
    ["Les Sept Samouraïs", "Akira Kurosawa", "Q189540"], ["La dolce vita", "Federico Fellini", "Q18407"],
    ["Huit et demi", "Federico Fellini", "Q12018"], ["Fight Club", "David Fincher", "Q190440"],
    ["Se7en", "David Fincher", "Q190450"], ["Dune (2021)", "Denis Villeneuve", "Q60834989"]
  ];

  movies.forEach(([movie, dir, q], i) => {
    add(`cin-m-${i + 1}`, movie!, "directed_by", dir!, "Cinema", "Directors", q!, "P57", "Film");
  });

  // 6. CLASSICAL MUSIC (25 Works)
  const classical = [
    ["la Symphonie n° 9 avec l'Hymne à la joie", "Ludwig van Beethoven", "Q11989"],
    ["la Symphonie n° 5", "Ludwig van Beethoven", "Q188709"],
    ["La Flûte enchantée", "Wolfgang Amadeus Mozart", "Q5064"],
    ["Les Noces de Figaro", "Wolfgang Amadeus Mozart", "Q201873"],
    ["Le Requiem en ré mineur", "Wolfgang Amadeus Mozart", "Q207879"],
    ["Les Quatre Saisons", "Antonio Vivaldi", "Q12016"],
    ["Les Concertos brandebourgeois", "Jean-Sébastien Bach", "Q207898"],
    ["Le Boléro", "Maurice Ravel", "Q185164"],
    ["Clair de lune", "Claude Debussy", "Q310344"],
    ["Le Lac des cygnes", "Piotr Ilitch Tchaïkovski", "Q199786"],
    ["Casse-Noisette", "Piotr Ilitch Tchaïkovski", "Q205562"],
    ["Carmen", "Georges Bizet", "Q185968"],
    ["La Traviata", "Giuseppe Verdi", "Q186539"],
    ["La Chevauchée des Walkyries", "Richard Wagner", "Q131385"],
    ["Le Sacre du printemps", "Igor Stravinsky", "Q208153"],
    ["Le Barbier de Séville", "Gioachino Rossini", "Q208659"],
    ["La Truite", "Franz Schubert", "Q204482"],
    ["Nocturnes", "Frédéric Chopin", "Q207901"]
  ];

  classical.forEach(([w, comp, q], i) => {
    add(`mus-w-${i + 1}`, w!, "composed_by", comp!, "Music", "Classical", q!, "P86", "Composition");
  });

  // 7. HISTORY & DATES (25 Events & 10 Dynasties)
  const dates: [string, number, string][] = [
    ["la prise de la Bastille", 1789, "Q6539"], ["la chute du mur de Berlin", 1989, "Q56014"],
    ["la bataille de Marignan", 1515, "Q835564"], ["la bataille de Waterloo", 1815, "Q48314"],
    ["la signature du traité de Versailles", 1919, "Q8736"], ["l'armistice de la Première Guerre mondiale", 1918, "Q160533"],
    ["le débarquement de Normandie", 1944, "Q16470"], ["l'arrivée de Christophe Colomb en Amérique", 1492, "Q7322"],
    ["le sacre de Charlemagne comme empereur d'Occident", 800, "Q43477"], ["la bataille de Hastings", 1066, "Q83224"],
    ["le couronnement de Napoléon Ier à Notre-Dame", 1804, "Q5174"], ["l'adoption de la Déclaration des droits de l'homme et du citoyen", 1789, "Q169759"],
    ["la proclamation de la Première République française", 1792, "Q6821"], ["l'assassinat d'Henri IV par Ravaillac", 1610, "Q936"],
    ["le premier pas de l'Homme sur la Lune (mission Apollo 11)", 1969, "Q43653"], ["la chute de Constantinople", 1453, "Q170049"],
    ["le grand incendie de Londres", 1666, "Q164670"], ["la déclaration d'indépendance des États-Unis", 1776, "Q127910"],
    ["la création de l'Organisation des Nations Unies (ONU)", 1945, "Q1065"]
  ];

  dates.forEach(([evt, yr, q], i) => {
    add(`hist-d-${i + 1}`, evt!, "event_year", String(yr), "History", "Events", q!, "P585", "Event", yr);
  });

  const dynasties = [
    ["Louis XIV", "Bourbons", "Q7742"],
    ["François Ier", "Valois", "Q129987"],
    ["Hugues Capet", "Capétiens", "Q159575"],
    ["Clovis Ier", "Mérovingiens", "Q82339"],
    ["Charlemagne", "Carolingiens", "Q43477"],
    ["Henri VIII", "Tudor", "Q38370"],
    ["Élisabeth Ire", "Tudor", "Q7207"]
  ];

  dynasties.forEach(([monarch, dyn, q], i) => {
    add(`hist-dyn-${i + 1}`, monarch!, "dynasty", dyn!, "History", "Monarchy", q!, "P53", "Monarch");
  });

  // 8. NATURE & ZOOLOGY (20)
  const animals = [
    ["la baleine bleue", "mammifères", "Q42196"], ["le dauphin", "mammifères", "Q7369"],
    ["l'aigle royal", "oiseaux", "Q41107"], ["la grenouille", "amphibiens", "Q3183"],
    ["le crocodile du Nil", "reptiles", "Q23448"], ["la chauve-souris", "mammifères", "Q28425"],
    ["l'ornithorynque", "mammifères", "Q1534"], ["le requin blanc", "poissons", "Q129042"],
    ["le manchot empereur", "oiseaux", "Q134114"], ["le boa constricteur", "reptiles", "Q23555"],
    ["le lion", "mammifères", "Q190220"], ["le tigre", "mammifères", "Q190230"],
    ["le panda géant", "mammifères", "Q190240"], ["la pieuvre", "mollusques", "Q190260"],
    ["le homard", "crustacés", "Q190270"]
  ];

  animals.forEach(([an, cl, q], i) => {
    add(`nat-z-${i + 1}`, an!, "taxonomic_class", cl!, "Nature", "Zoology", q!, "P279", "Taxon");
  });

  // 9. TECHNOLOGY (15)
  const techCreators = [
    ["le World Wide Web (WWW)", "Tim Berners-Lee", "Q466"], ["le noyau Linux", "Linus Torvalds", "Q388"],
    ["le langage de programmation C", "Dennis Ritchie", "Q15777"], ["le langage de programmation Python", "Guido van Rossum", "Q28865"],
    ["le premier algorithme informatique destiné à la machine analytique", "Ada Lovelace", "Q7259"],
    ["l'imprimerie à caractères mobiles en Europe", "Johannes Gutenberg", "Q8958"], ["le téléphone électrique", "Alexander Graham Bell", "Q34296"],
    ["l'ampoule électrique à incandescence commerciale", "Thomas Edison", "Q8743"],
    ["le transistor à point de contact", "John Bardeen et Walter Brattain", "Q131460"],
    ["le format PDF et le langage PostScript", "John Warnock et Charles Geschke", "Q42332"],
    ["le système de contrôle de version Git", "Linus Torvalds", "Q186045"], ["le langage de programmation Java", "James Gosling", "Q186050"],
    ["le langage de programmation JavaScript", "Brendan Eich", "Q186060"], ["la machine de Turing", "Alan Turing", "Q186080"]
  ];

  techCreators.forEach(([t, cr, q], i) => {
    add(`tech-cr-${i + 1}`, t!, "tech_creator", cr!, "Technology", "Inventions", q!, "P61", "Invention");
  });

  // 10. GASTRONOMY (15)
  const dishes = [
    ["la paella", "l'Espagne", "Q188177"], ["les sushis", "le Japon", "Q46383"],
    ["la poutine", "le Canada", "Q213459"], ["le kimchi", "la Corée du Sud", "Q107418"],
    ["le ceviche", "le Pérou", "Q203498"], ["la feijoada", "le Brésil", "Q121852"],
    ["la moussaka", "la Grèce", "Q203525"], ["le guacamole", "le Mexique", "Q207869"],
    ["le goulasch", "la Hongrie", "Q131589"], ["le couscous", "le Maghreb", "Q181219"],
    ["la pizza margherita", "l'Italie", "Q177"], ["le pad thaï", "la Thaïlande", "Q1048450"],
    ["le pho", "le Vietnam", "Q725178"], ["le tajine", "le Maroc", "Q217278"]
  ];

  dishes.forEach(([d, orig, q], i) => {
    add(`food-o-${i + 1}`, d!, "origin_country", orig!, "Food & Culture", "Gastronomy", q!, "P495", "Dish");
  });

  lines.push(`];`);
  lines.push(``);

  const targetPath = path.resolve(__dirname, "wikidataCorpus.ts");
  fs.writeFileSync(targetPath, lines.join("\n"));
  console.log(`✓ Generated wikidataCorpus.ts with ${lines.length} lines.`);
}

generateFullCorpus();
