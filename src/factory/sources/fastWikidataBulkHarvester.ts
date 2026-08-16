import * as fs from "fs";
import * as path from "path";

interface DomainDefinition {
  domain: string;
  category: string;
  itemType: string;
  property: string;
  predicateName: string;
  difficulty: "easy" | "medium" | "hard";
  promptTemplateFr: (s: string) => string;
}

const DOMAINS: DomainDefinition[] = [
  // Géographie
  { domain: "geography", category: "Géographie", itemType: "Q6256", property: "P36", predicateName: "CAPITAL_OF", difficulty: "easy", promptTemplateFr: (s) => `Quelle est la capitale officielle de ${s} ?` },
  { domain: "geography", category: "Géographie", itemType: "Q515", property: "P17", predicateName: "LOCATED_IN_COUNTRY", difficulty: "easy", promptTemplateFr: (s) => `Dans quel pays se situe la ville de ${s} ?` },
  { domain: "geography", category: "Géographie", itemType: "Q4022", property: "P206", predicateName: "MOUTH_OF_RIVER", difficulty: "medium", promptTemplateFr: (s) => `Dans quelle étendue d'eau le fleuve ${s} se jette-t-il ?` },
  { domain: "geography", category: "Géographie", itemType: "Q8502", property: "P17", predicateName: "MOUNTAIN_COUNTRY", difficulty: "medium", promptTemplateFr: (s) => `Dans quel pays se trouve le sommet ${s} ?` },

  // Cinéma
  { domain: "cinema", category: "Cinéma", itemType: "Q11424", property: "P57", predicateName: "DIRECTED_BY", difficulty: "easy", promptTemplateFr: (s) => `Qui a réalisé le film ${s} ?` },
  { domain: "cinema", category: "Cinéma", itemType: "Q11424", property: "P86", predicateName: "MUSIC_BY", difficulty: "medium", promptTemplateFr: (s) => `Qui a composé la bande originale du film ${s} ?` },
  { domain: "cinema", category: "Cinéma", itemType: "Q11424", property: "P136", predicateName: "GENRE", difficulty: "easy", promptTemplateFr: (s) => `Quel est le genre principal du film ${s} ?` },
  { domain: "cinema", category: "Cinéma", itemType: "Q11424", property: "P495", predicateName: "ORIGIN_COUNTRY", difficulty: "easy", promptTemplateFr: (s) => `De quel pays provient le film ${s} ?` },

  // Musique
  { domain: "music", category: "Musique", itemType: "Q482994", property: "P175", predicateName: "PERFORMER", difficulty: "easy", promptTemplateFr: (s) => `Quel artiste ou groupe a créé l'album ${s} ?` },
  { domain: "music", category: "Musique", itemType: "Q482994", property: "P136", predicateName: "GENRE", difficulty: "medium", promptTemplateFr: (s) => `Quel est le genre musical de l'album ${s} ?` },
  { domain: "music", category: "Musique", itemType: "Q215380", property: "P740", predicateName: "FORMATION_PLACE", difficulty: "medium", promptTemplateFr: (s) => `Où le groupe ${s} s'est-il formé à l'origine ?` },

  // Littérature
  { domain: "literature", category: "Littérature", itemType: "Q7725634", property: "P50", predicateName: "AUTHOR", difficulty: "easy", promptTemplateFr: (s) => `Qui est l'auteur de l'ouvrage ${s} ?` },
  { domain: "literature", category: "Littérature", itemType: "Q7725634", property: "P136", predicateName: "GENRE", difficulty: "easy", promptTemplateFr: (s) => `À quel genre littéraire se rattache ${s} ?` },

  // Art & Peinture
  { domain: "art", category: "Art", itemType: "Q3305213", property: "P170", predicateName: "CREATOR", difficulty: "easy", promptTemplateFr: (s) => `Qui a peint le chef-d'œuvre ${s} ?` },
  { domain: "art", category: "Art", itemType: "Q3305213", property: "P276", predicateName: "LOCATION", difficulty: "medium", promptTemplateFr: (s) => `Dans quel musée ou lieu est conservé ${s} ?` },

  // Jeux Vidéo & Technologie
  { domain: "gaming", category: "Jeux Vidéo", itemType: "Q7889", property: "P178", predicateName: "DEVELOPER", difficulty: "easy", promptTemplateFr: (s) => `Quel studio a développé le jeu vidéo ${s} ?` },
  { domain: "technology", category: "Technologie", itemType: "Q9143", property: "P178", predicateName: "CREATOR", difficulty: "easy", promptTemplateFr: (s) => `Qui est le concepteur du langage ${s} ?` },
];

export async function runFastWikidataHarvest(): Promise<void> {
  const outputDir = path.resolve("data", "raw");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const rawOutPath = path.join(outputDir, "GENUINE_OPEN_DATA_TRIPLES.ndjson");
  const writeStream = fs.createWriteStream(rawOutPath, { flags: "w" });

  console.log("================================================================");
  console.log("🚀 ULTRA-FAST BULK WIKIDATA HARVESTER");
  console.log("================================================================\n");

  let totalHarvested = 0;
  const startTime = Date.now();

  for (const d of DOMAINS) {
    const sparql = `SELECT ?item ?val WHERE { ?item wdt:P31 wd:${d.itemType} ; wdt:${d.property} ?val . } LIMIT 5000`;
    const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`;

    try {
      const res = await fetch(url, { headers: { "User-Agent": "IQArena/2.0 (bulk-harvester)" } });
      if (!res.ok) continue;

      const data = await res.json();
      const bindings = data?.results?.bindings || [];
      if (bindings.length === 0) continue;

      // Collect all QIDs to batch resolve labels
      const qids = new Set<string>();
      for (const b of bindings) {
        const itemQid = b.item?.value?.split("/").pop();
        const valRaw = b.val?.value;
        const valQid = valRaw?.startsWith("http://www.wikidata.org/entity/Q") ? valRaw.split("/").pop() : null;

        if (itemQid && itemQid.startsWith("Q")) qids.add(itemQid);
        if (valQid && valQid.startsWith("Q")) qids.add(valQid);
      }

      // Parallel batch label resolver
      const labelMap = new Map<string, string>();
      const qidArray = Array.from(qids);
      const chunkSize = 50;
      const chunks: string[][] = [];

      for (let i = 0; i < qidArray.length; i += chunkSize) {
        chunks.push(qidArray.slice(i, i + chunkSize));
      }

      // Fetch 5 chunks concurrently
      const fetchChunk = async (chunk: string[]) => {
        const apiUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${chunk.join("|")}&props=labels&languages=fr|en&format=json`;
        try {
          const apiRes = await fetch(apiUrl, { headers: { "User-Agent": "IQArena/2.0 (bulk-label-resolver)" } });
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

      for (let i = 0; i < chunks.length; i += 5) {
        const parallelChunks = chunks.slice(i, i + 5);
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
          statement_id: `wdt:${itemQid}:${d.property}:${encodeURIComponent(objLabel)}`,
          subject_id: itemQid,
          subject_label: subLabel,
          predicate_id: d.property,
          predicate_label: d.predicateName,
          object_value: objLabel,
          domain: d.domain,
          category: d.category,
          difficulty: d.difficulty,
          license: "CC0",
          confidence: 0.99,
          prompt_fr: d.promptTemplateFr(subLabel),
          explanation_fr: `Proposition vérifiée par Wikidata (Réponse: ${objLabel}).`,
        };

        writeStream.write(JSON.stringify(triple) + "\n");
        categoryCount++;
        totalHarvested++;
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`  ✓ Harvested ${categoryCount.toLocaleString()} triples for [${d.category} / ${d.predicateName}] (Total: ${totalHarvested.toLocaleString()} [${elapsed}s])`);
    } catch (err: any) {
      console.warn(`  ⚠️ Error on ${d.category}/${d.property}:`, err.message);
    }
  }

  writeStream.end();
  console.log(`\n🎉 MASSIVE HARVEST COMPLETE: ${totalHarvested.toLocaleString()} genuine propositions written to ${rawOutPath}`);
}

async function main() {
  await runFastWikidataHarvest();
}

if (import.meta.main) {
  main().catch(console.error);
}
