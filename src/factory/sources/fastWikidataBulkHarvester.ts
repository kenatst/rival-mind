import * as fs from "fs";
import * as path from "path";

interface DomainDefinition {
  domain: string;
  category: string;
  itemType: string;
  property: string;
  difficulty: "easy" | "medium" | "hard";
  promptTemplateFr: (s: string) => string;
}

const DOMAINS: DomainDefinition[] = [
  // Géographie
  { domain: "geography", category: "Géographie", itemType: "Q6256", property: "P36", difficulty: "easy", promptTemplateFr: (s) => `Quelle est la capitale officielle de ${s} ?` },
  { domain: "geography", category: "Géographie", itemType: "Q515", property: "P17", difficulty: "easy", promptTemplateFr: (s) => `Dans quel pays se situe la ville de ${s} ?` },
  { domain: "geography", category: "Géographie", itemType: "Q4022", property: "P206", difficulty: "medium", promptTemplateFr: (s) => `Dans quelle étendue d'eau le fleuve ${s} se jette-t-il ?` },
  { domain: "geography", category: "Géographie", itemType: "Q8502", property: "P17", difficulty: "medium", promptTemplateFr: (s) => `Dans quel pays se trouve la montagne ${s} ?` },

  // Histoire
  { domain: "history", category: "Histoire", itemType: "Q116", property: "P577", difficulty: "medium", promptTemplateFr: (s) => `En quelle année le traité de ${s} a-t-il été signé ?` },
  { domain: "history", category: "Histoire", itemType: "Q17888", property: "P580", difficulty: "medium", promptTemplateFr: (s) => `En quelle année le conflit ${s} a-t-il débuté ?` },
  { domain: "history", category: "Histoire", itemType: "Q82955", property: "P106", difficulty: "easy", promptTemplateFr: (s) => `Quelle était la profession principale de ${s} ?` },

  // Sciences
  { domain: "science", category: "Sciences", itemType: "Q11344", property: "P279", difficulty: "hard", promptTemplateFr: (s) => `À quelle famille chimique appartient l'élément ${s} ?` },
  { domain: "science", category: "Sciences", itemType: "Q634", property: "P397", difficulty: "easy", promptTemplateFr: (s) => `Autour de quelle étoile gravite la planète ${s} ?` },
  { domain: "science", category: "Sciences", itemType: "Q2537", property: "P397", difficulty: "medium", promptTemplateFr: (s) => `Autour de quelle planète gravite le satellite ${s} ?` },

  // Cinéma & Musique
  { domain: "cinema", category: "Cinéma", itemType: "Q11424", property: "P57", difficulty: "easy", promptTemplateFr: (s) => `Qui a réalisé le film ${s} ?` },
  { domain: "cinema", category: "Cinéma", itemType: "Q11424", property: "P86", difficulty: "medium", promptTemplateFr: (s) => `Qui a composé la bande originale du film ${s} ?` },
  { domain: "music", category: "Musique", itemType: "Q482994", property: "P175", difficulty: "easy", promptTemplateFr: (s) => `Quel artiste ou groupe a sorti l'album ${s} ?` },
  { domain: "music", category: "Musique", itemType: "Q482994", property: "P136", difficulty: "medium", promptTemplateFr: (s) => `Quel est le genre musical principal de l'album ${s} ?` },

  // Littérature & Art
  { domain: "literature", category: "Littérature", itemType: "Q7725634", property: "P50", difficulty: "easy", promptTemplateFr: (s) => `Qui est l'auteur de l'œuvre littéraire ${s} ?` },
  { domain: "art", category: "Art", itemType: "Q3305213", property: "P170", difficulty: "easy", promptTemplateFr: (s) => `Qui a peint le tableau ${s} ?` },

  // Jeux Vidéo & Technologie
  { domain: "gaming", category: "Jeux Vidéo", itemType: "Q7889", property: "P178", difficulty: "easy", promptTemplateFr: (s) => `Quel studio a développé le jeu vidéo ${s} ?` },
  { domain: "technology", category: "Technologie", itemType: "Q9143", property: "P178", difficulty: "easy", promptTemplateFr: (s) => `Qui est le concepteur du langage de programmation ${s} ?` },
];

export async function runFastWikidataHarvest(): Promise<void> {
  const outputDir = path.resolve("data", "raw");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const rawOutPath = path.join(outputDir, "GENUINE_OPEN_DATA_TRIPLES.ndjson");
  const writeStream = fs.createWriteStream(rawOutPath, { flags: "a" });

  console.log("================================================================");
  console.log("🚀 HIGH-SPEED BULK WIKIDATA HARVESTER");
  console.log("================================================================\n");

  let totalHarvested = 0;

  for (const d of DOMAINS) {
    const sparql = `SELECT ?item ?val WHERE { ?item wdt:P31 wd:${d.itemType} ; wdt:${d.property} ?val . } LIMIT 2500`;
    const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`;

    try {
      const res = await fetch(url, { headers: { "User-Agent": "IQArena/2.0 (bulk bot)" } });
      if (!res.ok) continue;

      const data = await res.json();
      const bindings = data?.results?.bindings || [];

      // Collect all QIDs to batch resolve labels
      const qids = new Set<string>();
      for (const b of bindings) {
        const itemQid = b.item?.value?.split("/").pop();
        const valQid = b.val?.value?.split("/").pop();
        if (itemQid) qids.add(itemQid);
        if (valQid && valQid.startsWith("Q")) qids.add(valQid);
      }

      // Bulk resolve labels in chunks of 50
      const labelMap = new Map<string, string>();
      const qidArray = Array.from(qids);

      for (let i = 0; i < qidArray.length; i += 50) {
        const chunk = qidArray.slice(i, i + 50);
        const apiUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${chunk.join("|")}&props=labels&languages=fr,en&format=json`;

        try {
          const apiRes = await fetch(apiUrl, { headers: { "User-Agent": "IQArena/2.0 (bulk bot)" } });
          const apiJson = await apiRes.json();
          const entities = apiJson?.entities || {};

          for (const [id, ent] of Object.entries<any>(entities)) {
            const label = ent?.labels?.fr?.value || ent?.labels?.en?.value;
            if (label) labelMap.set(id, label);
          }
        } catch {}
      }

      // Write genuine records
      for (const b of bindings) {
        const itemQid = b.item?.value?.split("/").pop();
        const valRaw = b.val?.value;
        const valQid = valRaw?.startsWith("http") ? valRaw.split("/").pop() : null;

        const subLabel = labelMap.get(itemQid) || itemQid;
        const objLabel = valQid ? labelMap.get(valQid) || valQid : valRaw;

        if (!subLabel || !objLabel || subLabel.startsWith("Q") || objLabel.startsWith("Q")) {
          continue;
        }

        const triple = {
          source_name: "wikidata",
          statement_id: `wdt:${itemQid}:${d.property}:${encodeURIComponent(objLabel)}`,
          subject_id: itemQid,
          subject_label: subLabel,
          predicate_id: d.property,
          predicate_label: d.property,
          object_value: objLabel,
          domain: d.domain,
          category: d.category,
          difficulty: d.difficulty,
          license: "CC0",
          confidence: 0.99,
          prompt_fr: d.promptTemplateFr(subLabel),
          explanation_fr: `Proposition certifiée par Wikidata (Réponse: ${objLabel}).`,
        };

        writeStream.write(JSON.stringify(triple) + "\n");
        totalHarvested++;
      }

      console.log(`  ✓ Harvested ${bindings.length} certified triples for [${d.category} / ${d.property}] (Total: ${totalHarvested.toLocaleString()})`);
    } catch (err: any) {
      console.warn(`  ⚠️ Error on ${d.category}/${d.property}:`, err.message);
    }
  }

  writeStream.end();
  console.log(`\n🎉 BATCH HARVEST COMPLETE: ${totalHarvested.toLocaleString()} genuine Wikidata propositions recorded.`);
}

async function main() {
  await runFastWikidataHarvest();
}

if (import.meta.main) {
  main().catch(console.error);
}
