import * as fs from "fs";
import * as path from "path";

interface DomainQuery {
  domain: string;
  category: string;
  itemType: string;
  property: string;
  difficulty: "easy" | "medium" | "hard";
}

const DOMAIN_QUERIES: DomainQuery[] = [
  // Géographie
  { domain: "geography", category: "Géographie", itemType: "Q6256", property: "P36", difficulty: "easy" }, // Pays -> Capitale
  { domain: "geography", category: "Géographie", itemType: "Q515", property: "P17", difficulty: "easy" }, // Ville -> Pays
  { domain: "geography", category: "Géographie", itemType: "Q4022", property: "P206", difficulty: "medium" }, // Rivière -> Embouchure
  { domain: "geography", category: "Géographie", itemType: "Q8502", property: "P47", difficulty: "medium" }, // Montagne -> Frontière
  { domain: "geography", category: "Géographie", itemType: "Q23442", property: "P17", difficulty: "medium" }, // Île -> Pays

  // Histoire
  { domain: "history", category: "Histoire", itemType: "Q116", property: "P577", difficulty: "medium" }, // Traités -> Année
  { domain: "history", category: "Histoire", itemType: "Q17888", property: "P580", difficulty: "medium" }, // Guerres -> Début
  { domain: "history", category: "Histoire", itemType: "Q116", property: "P17", difficulty: "easy" }, // Traité -> Lieu
  { domain: "history", category: "Histoire", itemType: "Q82955", property: "P106", difficulty: "easy" }, // Personnalités historiques -> Métier

  // Sciences & Espace
  { domain: "science", category: "Sciences", itemType: "Q11344", property: "P279", difficulty: "hard" }, // Éléments chimiques -> Groupe
  { domain: "science", category: "Sciences", itemType: "Q634", property: "P397", difficulty: "easy" }, // Planètes -> Étoile parente
  { domain: "science", category: "Sciences", itemType: "Q2537", property: "P397", difficulty: "medium" }, // Lunes -> Planète
  { domain: "science", category: "Sciences", itemType: "Q11173", property: "P279", difficulty: "hard" }, // Composés chimiques -> Classe

  // Cinéma
  { domain: "cinema", category: "Cinéma", itemType: "Q11424", property: "P57", difficulty: "easy" }, // Film -> Réalisateur
  { domain: "cinema", category: "Cinéma", itemType: "Q11424", property: "P86", difficulty: "medium" }, // Film -> Compositeur
  { domain: "cinema", category: "Cinéma", itemType: "Q11424", property: "P577", difficulty: "medium" }, // Film -> Année de sortie
  { domain: "cinema", category: "Cinéma", itemType: "Q11424", property: "P166", difficulty: "hard" }, // Film -> Prix

  // Musique
  { domain: "music", category: "Musique", itemType: "Q482994", property: "P175", difficulty: "easy" }, // Album -> Artiste
  { domain: "music", category: "Musique", itemType: "Q482994", property: "P136", difficulty: "medium" }, // Album -> Genre
  { domain: "music", category: "Musique", itemType: "Q215380", property: "P740", difficulty: "medium" }, // Groupe musical -> Lieu de formation

  // Littérature
  { domain: "literature", category: "Littérature", itemType: "Q7725634", property: "P50", difficulty: "easy" }, // Livre -> Auteur
  { domain: "literature", category: "Littérature", itemType: "Q7725634", property: "P577", difficulty: "medium" }, // Livre -> Année
  { domain: "literature", category: "Littérature", itemType: "Q7725634", property: "P136", difficulty: "medium" }, // Livre -> Genre

  // Arts & Peinture
  { domain: "art", category: "Art", itemType: "Q3305213", property: "P170", difficulty: "easy" }, // Tableau -> Peintre
  { domain: "art", category: "Art", itemType: "Q3305213", property: "P276", difficulty: "medium" }, // Tableau -> Musée
  { domain: "art", category: "Art", itemType: "Q3305213", property: "P136", difficulty: "medium" }, // Tableau -> Mouvement

  // Jeux Vidéo & Technologie
  { domain: "gaming", category: "Jeux Vidéo", itemType: "Q7889", property: "P178", difficulty: "easy" }, // Jeu -> Développeur
  { domain: "gaming", category: "Jeux Vidéo", itemType: "Q7889", property: "P400", difficulty: "medium" }, // Jeu -> Plateforme
  { domain: "gaming", category: "Jeux Vidéo", itemType: "Q7889", property: "P408", difficulty: "medium" }, // Jeu -> Moteur de jeu
  { domain: "technology", category: "Technologie", itemType: "Q9143", property: "P178", difficulty: "easy" }, // Langage de programmation -> Créateur

  // Nature & Faune
  { domain: "nature", category: "Nature", itemType: "Q16521", property: "P171", difficulty: "medium" }, // Taxon -> Taxon parent
  { domain: "nature", category: "Nature", itemType: "Q16521", property: "P105", difficulty: "hard" }, // Taxon -> Rang taxinomique
];

export async function harvestAllGenuineTriples(): Promise<void> {
  const outputDir = path.resolve("data", "raw");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const rawOutPath = path.join(outputDir, "GENUINE_OPEN_DATA_TRIPLES.ndjson");
  const writeStream = fs.createWriteStream(rawOutPath, { flags: "w" });

  let totalTriples = 0;
  console.log(`🚀 Starting Multi-Domain Genuine Wikidata Extraction across ${DOMAIN_QUERIES.length} categories...`);

  for (const q of DOMAIN_QUERIES) {
    const sparql = `
      SELECT ?item ?itemLabel ?val ?valLabel WHERE {
        ?item wdt:P31/wdt:P279* wd:${q.itemType} ;
              wdt:${q.property} ?val .
        SERVICE wikibase:label { bd:serviceParam wikibase:language "fr,en". }
      }
      LIMIT 10000
    `;

    try {
      const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`;
      const res = await fetch(url, {
        headers: { "User-Agent": "IQArenaKnowledgeEngine/2.0 (open-data harvester)" },
        signal: AbortSignal.timeout(20000),
      });

      if (!res.ok) {
        console.warn(`⚠️ Query failed for ${q.domain}/${q.property} (HTTP ${res.status})`);
        continue;
      }

      const data = await res.json();
      const bindings = data?.results?.bindings || [];

      for (const b of bindings) {
        const itemUri = b.item?.value || "";
        const qid = itemUri.split("/").pop() || "";
        const itemLabel = b.itemLabel?.value || "";
        const valLabel = b.valLabel?.value || "";

        if (!qid || !itemLabel || !valLabel || itemLabel.startsWith("Q") || valLabel.startsWith("Q")) {
          continue;
        }

        const triple = {
          source_name: "wikidata",
          statement_id: `wdt:${qid}:${q.property}:${encodeURIComponent(valLabel)}`,
          subject_id: qid,
          subject_label: itemLabel,
          predicate_id: q.property,
          predicate_label: q.property,
          object_value: valLabel,
          domain: q.domain,
          category: q.category,
          difficulty: q.difficulty,
          license: "CC0",
          confidence: 0.99,
        };

        writeStream.write(JSON.stringify(triple) + "\n");
        totalTriples++;
      }

      console.log(`  ✓ Extracted ${bindings.length} certified triples for [${q.category} / ${q.property}] (Total: ${totalTriples.toLocaleString()})`);
    } catch (err: any) {
      console.warn(`⚠️ Error on ${q.domain}/${q.property}: ${err.message}`);
    }
  }

  writeStream.end();
  console.log(`\n🎉 Extracted ${totalTriples.toLocaleString()} genuine Wikidata triples to ${rawOutPath}`);
}

async function main() {
  await harvestAllGenuineTriples();
}

if (import.meta.main) {
  main().catch(console.error);
}
