import * as fs from "fs";
import * as path from "path";

export interface SparqlHarvestTask {
  id: string;
  domain: string;
  category: string;
  sparql: string;
  predicateName: string;
  propertyId: string;
  difficulty: "easy" | "medium" | "hard";
  promptTemplateFr: (subject: string) => string;
}

const WIKIMEDIA_USER_AGENT = "IQArenaBot/2.0 (https://kenatst.github.io/rival-mind/; contact@kenatst.com)";

export const HIGH_DENSITY_TASKS: SparqlHarvestTask[] = [
  // 1. Geography & Countries
  { id: "geo-capitals", domain: "geography", category: "Géographie", propertyId: "P36", predicateName: "CAPITAL_OF", difficulty: "easy", sparql: "SELECT ?item ?val WHERE { ?item wdt:P31 wd:Q6256 ; wdt:P36 ?val . } LIMIT 1000", promptTemplateFr: (s) => `Quelle est la capitale officielle de ${s} ?` },
  { id: "geo-cities-country", domain: "geography", category: "Géographie", propertyId: "P17", predicateName: "LOCATED_IN_COUNTRY", difficulty: "easy", sparql: "SELECT ?item ?val WHERE { ?item wdt:P31 wd:Q515 ; wdt:P17 ?val . } LIMIT 5000", promptTemplateFr: (s) => `Dans quel pays se situe la ville de ${s} ?` },
  { id: "geo-rivers-mouth", domain: "geography", category: "Géographie", propertyId: "P206", predicateName: "MOUTH_OF_RIVER", difficulty: "medium", sparql: "SELECT ?item ?val WHERE { ?item wdt:P31 wd:Q4022 ; wdt:P206 ?val . } LIMIT 2000", promptTemplateFr: (s) => `Dans quelle étendue d'eau le fleuve ${s} se jette-t-il ?` },
  { id: "geo-mountains-country", domain: "geography", category: "Géographie", propertyId: "P17", predicateName: "MOUNTAIN_COUNTRY", difficulty: "medium", sparql: "SELECT ?item ?val WHERE { ?item wdt:P31 wd:Q8502 ; wdt:P17 ?val . } LIMIT 3000", promptTemplateFr: (s) => `Dans quel pays se trouve le sommet ${s} ?` },

  // 2. Cinema & Directors
  { id: "cinema-directors", domain: "cinema", category: "Cinéma", propertyId: "P57", predicateName: "DIRECTED_BY", difficulty: "easy", sparql: "SELECT ?item ?val WHERE { ?item wdt:P31 wd:Q11424 ; wdt:P57 ?val . } LIMIT 5000", promptTemplateFr: (s) => `Qui a réalisé le film ${s} ?` },
  { id: "cinema-composers", domain: "cinema", category: "Cinéma", propertyId: "P86", predicateName: "MUSIC_BY", difficulty: "medium", sparql: "SELECT ?item ?val WHERE { ?item wdt:P31 wd:Q11424 ; wdt:P86 ?val . } LIMIT 3000", promptTemplateFr: (s) => `Qui a composé la bande originale du film ${s} ?` },
  { id: "cinema-screenwriters", domain: "cinema", category: "Cinéma", propertyId: "P58", predicateName: "SCREENPLAY_BY", difficulty: "medium", sparql: "SELECT ?item ?val WHERE { ?item wdt:P31 wd:Q11424 ; wdt:P58 ?val . } LIMIT 3000", promptTemplateFr: (s) => `Qui a écrit le scénario du film ${s} ?` },

  // 3. Literature & Writers
  { id: "lit-books-author", domain: "literature", category: "Littérature", propertyId: "P50", predicateName: "AUTHOR", difficulty: "easy", sparql: "SELECT ?item ?val WHERE { ?item wdt:P31 wd:Q571 ; wdt:P50 ?val . } LIMIT 5000", promptTemplateFr: (s) => `Qui est l'auteur du livre ${s} ?` },
  { id: "lit-writers-country", domain: "literature", category: "Littérature", propertyId: "P27", predicateName: "CITIZENSHIP", difficulty: "easy", sparql: "SELECT ?item ?val WHERE { ?item wdt:P106 wd:Q36180 ; wdt:P27 ?val . } LIMIT 5000", promptTemplateFr: (s) => `De quelle nationalité était l'écrivain ${s} ?` },
  { id: "lit-writers-movement", domain: "literature", category: "Littérature", propertyId: "P135", predicateName: "MOVEMENT", difficulty: "medium", sparql: "SELECT ?item ?val WHERE { ?item wdt:P106 wd:Q36180 ; wdt:P135 ?val . } LIMIT 2000", promptTemplateFr: (s) => `À quel mouvement littéraire se rattache ${s} ?` },

  // 4. Music & Bands
  { id: "music-albums-artist", domain: "music", category: "Musique", propertyId: "P175", predicateName: "PERFORMER", difficulty: "easy", sparql: "SELECT ?item ?val WHERE { ?item wdt:P31 wd:Q482994 ; wdt:P175 ?val . } LIMIT 5000", promptTemplateFr: (s) => `Quel artiste ou groupe a sorti l'album ${s} ?` },
  { id: "music-bands-country", domain: "music", category: "Musique", propertyId: "P495", predicateName: "ORIGIN_COUNTRY", difficulty: "easy", sparql: "SELECT ?item ?val WHERE { ?item wdt:P31 wd:Q215380 ; wdt:P495 ?val . } LIMIT 3000", promptTemplateFr: (s) => `De quel pays est originaire le groupe ${s} ?` },
  { id: "music-bands-formation", domain: "music", category: "Musique", propertyId: "P740", predicateName: "FORMATION_PLACE", difficulty: "medium", sparql: "SELECT ?item ?val WHERE { ?item wdt:P31 wd:Q215380 ; wdt:P740 ?val . } LIMIT 2000", promptTemplateFr: (s) => `Dans quelle ville le groupe ${s} s'est-il formé ?` },

  // 5. Video Games & Tech
  { id: "gaming-developer", domain: "gaming", category: "Jeux Vidéo", propertyId: "P178", predicateName: "DEVELOPER", difficulty: "easy", sparql: "SELECT ?item ?val WHERE { ?item wdt:P31 wd:Q7889 ; wdt:P178 ?val . } LIMIT 5000", promptTemplateFr: (s) => `Quel studio a développé le jeu vidéo ${s} ?` },
  { id: "gaming-publisher", domain: "gaming", category: "Jeux Vidéo", propertyId: "P123", predicateName: "PUBLISHER", difficulty: "medium", sparql: "SELECT ?item ?val WHERE { ?item wdt:P31 wd:Q7889 ; wdt:P123 ?val . } LIMIT 3000", promptTemplateFr: (s) => `Quel éditeur a publié le jeu ${s} ?` },
  { id: "tech-languages-creator", domain: "technology", category: "Technologie", propertyId: "P178", predicateName: "CREATOR", difficulty: "easy", sparql: "SELECT ?item ?val WHERE { ?item wdt:P31 wd:Q9143 ; wdt:P178 ?val . } LIMIT 1000", promptTemplateFr: (s) => `Qui a conçu le langage de programmation ${s} ?` },

  // 6. Sciences & Discoveries
  { id: "science-physicists-awards", domain: "science", category: "Sciences", propertyId: "P166", predicateName: "AWARD_RECEIVED", difficulty: "hard", sparql: "SELECT ?item ?val WHERE { ?item wdt:P106 wd:Q169470 ; wdt:P166 ?val . } LIMIT 2000", promptTemplateFr: (s) => `Quelle récompense majeure a été décernée au physicien ${s} ?` },
  { id: "science-chemists-country", domain: "science", category: "Sciences", propertyId: "P27", predicateName: "CITIZENSHIP", difficulty: "medium", sparql: "SELECT ?item ?val WHERE { ?item wdt:P106 wd:Q593644 ; wdt:P27 ?val . } LIMIT 2000", promptTemplateFr: (s) => `De quelle nationalité était le chimiste ${s} ?` },
  { id: "science-planets-star", domain: "science", category: "Sciences", propertyId: "P397", predicateName: "PARENT_STAR", difficulty: "easy", sparql: "SELECT ?item ?val WHERE { ?item wdt:P31 wd:Q634 ; wdt:P397 ?val . } LIMIT 500", promptTemplateFr: (s) => `Autour de quelle étoile gravite la planète ${s} ?` },
  { id: "science-moons-planet", domain: "science", category: "Sciences", propertyId: "P397", predicateName: "PARENT_PLANET", difficulty: "medium", sparql: "SELECT ?item ?val WHERE { ?item wdt:P31 wd:Q2537 ; wdt:P397 ?val . } LIMIT 500", promptTemplateFr: (s) => `Autour de quelle planète orbite la lune ${s} ?` },

  // 7. Art & Painters
  { id: "art-painters-movement", domain: "art", category: "Art", propertyId: "P135", predicateName: "MOVEMENT", difficulty: "medium", sparql: "SELECT ?item ?val WHERE { ?item wdt:P106 wd:Q1028181 ; wdt:P135 ?val . } LIMIT 3000", promptTemplateFr: (s) => `À quel mouvement artistique appartient le peintre ${s} ?` },
  { id: "art-paintings-location", domain: "art", category: "Art", propertyId: "P276", predicateName: "LOCATION", difficulty: "medium", sparql: "SELECT ?item ?val WHERE { ?item wdt:P31 wd:Q3305213 ; wdt:P276 ?val . } LIMIT 3000", promptTemplateFr: (s) => `Dans quel musée est conservé le tableau ${s} ?` },
];

export async function runDirectWikidataHarvest(): Promise<void> {
  const outputDir = path.resolve("data", "raw");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const rawOutPath = path.join(outputDir, "GENUINE_OPEN_DATA_TRIPLES.ndjson");
  const writeStream = fs.createWriteStream(rawOutPath, { flags: "a" });

  console.log("================================================================");
  console.log("🚀 HIGH-YIELD DIRECT WIKIDATA HARVEST ENGINE");
  console.log(`🚀 Tasks configured: ${HIGH_DENSITY_TASKS.length} high-density domain queries`);
  console.log("================================================================\n");

  let totalHarvested = 0;
  const startTime = Date.now();

  for (const t of HIGH_DENSITY_TASKS) {
    const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(t.sparql)}&format=json`;

    try {
      const res = await fetch(url, { headers: { "User-Agent": WIKIMEDIA_USER_AGENT } });
      if (!res.ok) continue;

      const data = await res.json();
      const bindings = data?.results?.bindings || [];
      if (bindings.length === 0) continue;

      // Collect QIDs to resolve labels
      const qids = new Set<string>();
      for (const b of bindings) {
        const itemQid = b.item?.value?.split("/").pop();
        const valRaw = b.val?.value;
        const valQid = valRaw?.startsWith("http://www.wikidata.org/entity/Q") ? valRaw.split("/").pop() : null;

        if (itemQid && itemQid.startsWith("Q")) qids.add(itemQid);
        if (valQid && valQid.startsWith("Q")) qids.add(valQid);
      }

      // Parallel batch label resolver using compliant Wikimedia headers
      const labelMap = new Map<string, string>();
      const qidArray = Array.from(qids);
      const chunkSize = 50;
      const chunks: string[][] = [];

      for (let i = 0; i < qidArray.length; i += chunkSize) {
        chunks.push(qidArray.slice(i, i + chunkSize));
      }

      const fetchChunk = async (chunk: string[]) => {
        const encodedIds = encodeURIComponent(chunk.join("|"));
        const apiUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${encodedIds}&props=labels&languages=fr|en&format=json`;
        try {
          const apiRes = await fetch(apiUrl, { headers: { "User-Agent": WIKIMEDIA_USER_AGENT } });
          if (!apiRes.ok) return;
          const apiJson = await apiRes.json();
          const entities = apiJson?.entities || {};

          for (const [id, ent] of Object.entries<any>(entities)) {
            const label = ent?.labels?.fr?.value || ent?.labels?.en?.value;
            if (label && !label.startsWith("Q")) {
              labelMap.set(id, label);
            }
          }
        } catch {}
      };

      for (let i = 0; i < chunks.length; i += 6) {
        const parallelChunks = chunks.slice(i, i + 6);
        await Promise.all(parallelChunks.map(fetchChunk));
      }

      let categoryCount = 0;
      for (const b of bindings) {
        const itemQid = b.item?.value?.split("/").pop();
        const valRaw = b.val?.value;
        const valQid = valRaw?.startsWith("http://www.wikidata.org/entity/Q") ? valRaw.split("/").pop() : null;

        const subLabel = labelMap.get(itemQid);
        const objLabel = valQid ? labelMap.get(valQid) : valRaw;

        if (!itemQid || !subLabel || !objLabel || subLabel.startsWith("Q") || objLabel.startsWith("Q")) {
          continue;
        }

        const triple = {
          source_name: "wikidata",
          statement_id: `wdt:${itemQid}:${t.propertyId}:${encodeURIComponent(objLabel)}`,
          subject_id: itemQid,
          subject_label: subLabel,
          predicate_id: t.propertyId,
          predicate_label: t.predicateName,
          object_value: objLabel,
          domain: t.domain,
          category: t.category,
          difficulty: t.difficulty,
          license: "CC0",
          confidence: 0.99,
          prompt_fr: t.promptTemplateFr(subLabel),
          explanation_fr: `Proposition vérifiée par Wikidata (Réponse: ${objLabel}).`,
        };

        writeStream.write(JSON.stringify(triple) + "\n");
        categoryCount++;
        totalHarvested++;
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`  ✓ Harvested ${categoryCount.toLocaleString()} triples for [${t.category} / ${t.predicateName}] (Total: ${totalHarvested.toLocaleString()} [${elapsed}s])`);
    } catch (err: any) {
      console.warn(`  ⚠️ Error on [${t.category} / ${t.predicateName}]:`, err.message);
    }
  }

  writeStream.end();
  console.log(`\n🎉 HARVEST RUN COMPLETE: ${totalHarvested.toLocaleString()} genuine propositions added to ${rawOutPath}`);
}

async function main() {
  await runDirectWikidataHarvest();
}

if (import.meta.main) {
  main().catch(console.error);
}
