import * as fs from "fs";
import * as path from "path";

const WIKIMEDIA_USER_AGENT = "IQArenaBot/2.0 (https://kenatst.github.io/rival-mind/; contact@kenatst.com)";

export interface DomainHarvestSpec {
  domain: string;
  category: string;
  itemTypeQid: string;
  propertyPid: string;
  predicateName: string;
  difficulty: "easy" | "medium" | "hard";
  promptTemplateFr: (subject: string) => string;
}

export const INDUSTRIAL_SPECS: DomainHarvestSpec[] = [
  // 1. GEOGRAPHY (Capitals, Countries, Continents, Mountains, Rivers, Lakes, Deserts, Islands, Languages)
  { domain: "geography", category: "Geography", itemTypeQid: "Q6256", propertyPid: "P36", predicateName: "CAPITAL_OF", difficulty: "easy", promptTemplateFr: (s) => `Quelle est la capitale de ${s} ?` },
  { domain: "geography", category: "Geography", itemTypeQid: "Q6256", propertyPid: "P30", predicateName: "CONTINENT", difficulty: "easy", promptTemplateFr: (s) => `Sur quel continent se trouve ${s} ?` },
  { domain: "geography", category: "Geography", itemTypeQid: "Q6256", propertyPid: "P37", predicateName: "OFFICIAL_LANGUAGE", difficulty: "easy", promptTemplateFr: (s) => `Quelle est la langue officielle de ${s} ?` },
  { domain: "geography", category: "Geography", itemTypeQid: "Q6256", propertyPid: "P38", predicateName: "CURRENCY", difficulty: "medium", promptTemplateFr: (s) => `Quelle est la monnaie officielle de ${s} ?` },
  { domain: "geography", category: "Geography", itemTypeQid: "Q515", propertyPid: "P17", predicateName: "LOCATED_IN_COUNTRY", difficulty: "easy", promptTemplateFr: (s) => `Dans quel pays se trouve la ville de ${s} ?` },
  { domain: "geography", category: "Geography", itemTypeQid: "Q8502", propertyPid: "P4552", predicateName: "MOUNTAIN_RANGE", difficulty: "medium", promptTemplateFr: (s) => `À quel massif appartient la montagne ${s} ?` },
  { domain: "geography", category: "Geography", itemTypeQid: "Q4022", propertyPid: "P206", predicateName: "MOUTH_OF_RIVER", difficulty: "medium", promptTemplateFr: (s) => `Où le fleuve ${s} se jette-t-il ?` },
  { domain: "geography", category: "Geography", itemTypeQid: "Q23397", propertyPid: "P17", predicateName: "LOCATED_IN_COUNTRY", difficulty: "medium", promptTemplateFr: (s) => `Dans quel pays se situe le lac ${s} ?` },
  { domain: "geography", category: "Geography", itemTypeQid: "Q23442", propertyPid: "P17", predicateName: "LOCATED_IN_COUNTRY", difficulty: "medium", promptTemplateFr: (s) => `À quel pays appartient l'île de ${s} ?` },
  { domain: "geography", category: "Geography", itemTypeQid: "Q8514", propertyPid: "P30", predicateName: "CONTINENT", difficulty: "medium", promptTemplateFr: (s) => `Sur quel continent se trouve le désert de ${s} ?` },

  // 2. HISTORY (Dynasties, Battles, Treaties, Monarchs, Inventions, Citizenships)
  { domain: "history", category: "History", itemTypeQid: "Q116", propertyPid: "P53", predicateName: "DYNASTY", difficulty: "medium", promptTemplateFr: (s) => `À quelle dynastie appartenait le souverain ${s} ?` },
  { domain: "history", category: "History", itemTypeQid: "Q178561", propertyPid: "P276", predicateName: "BATTLE_LOCATION", difficulty: "medium", promptTemplateFr: (s) => `Où s'est déroulée la bataille de ${s} ?` },
  { domain: "history", category: "History", itemTypeQid: "Q82955", propertyPid: "P27", predicateName: "CITIZENSHIP", difficulty: "easy", promptTemplateFr: (s) => `De quelle nationalité était ${s} ?` },
  { domain: "history", category: "History", itemTypeQid: "Q82955", propertyPid: "P106", predicateName: "OCCUPATION", difficulty: "easy", promptTemplateFr: (s) => `Quelle était l'activité principale de ${s} ?` },
  { domain: "history", category: "History", itemTypeQid: "Q11019", propertyPid: "P61", predicateName: "INVENTOR", difficulty: "easy", promptTemplateFr: (s) => `Qui a inventé ${s} ?` },
  { domain: "history", category: "History", itemTypeQid: "Q13156", propertyPid: "P17", predicateName: "LOCATED_IN_COUNTRY", difficulty: "medium", promptTemplateFr: (s) => `Dans quel pays a été signé le traité de ${s} ?` },

  // 3. SCIENCE (Chemical Elements, Planets, Moons, Scientists, Units)
  { domain: "science", category: "Science", itemTypeQid: "Q11344", propertyPid: "P279", predicateName: "CHEMICAL_SERIES", difficulty: "hard", promptTemplateFr: (s) => `À quelle famille appartient l'élément chimique ${s} ?` },
  { domain: "science", category: "Science", itemTypeQid: "Q169470", propertyPid: "P166", predicateName: "AWARD_RECEIVED", difficulty: "hard", promptTemplateFr: (s) => `Quelle distinction a été décernée à ${s} ?` },
  { domain: "science", category: "Science", itemTypeQid: "Q593644", propertyPid: "P166", predicateName: "AWARD_RECEIVED", difficulty: "hard", promptTemplateFr: (s) => `Quel prix prestigieux a reçu le chimiste ${s} ?` },
  { domain: "science", category: "Science", itemTypeQid: "Q634", propertyPid: "P397", predicateName: "PARENT_STAR", difficulty: "easy", promptTemplateFr: (s) => `Autour de quelle étoile gravite la planète ${s} ?` },
  { domain: "science", category: "Science", itemTypeQid: "Q2537", propertyPid: "P397", predicateName: "PARENT_PLANET", difficulty: "medium", promptTemplateFr: (s) => `Autour de quelle planète orbite ${s} ?` },

  // 4. CINEMA (Directors, Composers, Cast, Screenwriters, Awards, Country)
  { domain: "cinema", category: "Cinema", itemTypeQid: "Q11424", propertyPid: "P57", predicateName: "DIRECTED_BY", difficulty: "easy", promptTemplateFr: (s) => `Qui a réalisé le film ${s} ?` },
  { domain: "cinema", category: "Cinema", itemTypeQid: "Q11424", propertyPid: "P86", predicateName: "MUSIC_BY", difficulty: "medium", promptTemplateFr: (s) => `Qui a composé la bande originale de ${s} ?` },
  { domain: "cinema", category: "Cinema", itemTypeQid: "Q11424", propertyPid: "P161", predicateName: "CAST_MEMBER", difficulty: "easy", promptTemplateFr: (s) => `Quel acteur joue dans ${s} ?` },
  { domain: "cinema", category: "Cinema", itemTypeQid: "Q11424", propertyPid: "P166", predicateName: "AWARD_RECEIVED", difficulty: "hard", promptTemplateFr: (s) => `Quel prix a remporté le film ${s} ?` },
  { domain: "cinema", category: "Cinema", itemTypeQid: "Q11424", propertyPid: "P495", predicateName: "ORIGIN_COUNTRY", difficulty: "easy", promptTemplateFr: (s) => `De quel pays est originaire le film ${s} ?` },
  { domain: "cinema", category: "Cinema", itemTypeQid: "Q11424", propertyPid: "P58", predicateName: "SCREENPLAY_BY", difficulty: "medium", promptTemplateFr: (s) => `Qui a écrit le scénario de ${s} ?` },

  // 5. MUSIC (Performers, Genres, Formation, Instruments, Origin)
  { domain: "music", category: "Music", itemTypeQid: "Q482994", propertyPid: "P175", predicateName: "PERFORMER", difficulty: "easy", promptTemplateFr: (s) => `Quel artiste a sorti l'album ${s} ?` },
  { domain: "music", category: "Music", itemTypeQid: "Q482994", propertyPid: "P136", predicateName: "GENRE", difficulty: "easy", promptTemplateFr: (s) => `Quel est le genre musical de l'album ${s} ?` },
  { domain: "music", category: "Music", itemTypeQid: "Q215380", propertyPid: "P740", predicateName: "FORMATION_PLACE", difficulty: "medium", promptTemplateFr: (s) => `Où s'est formé le groupe ${s} ?` },
  { domain: "music", category: "Music", itemTypeQid: "Q177220", propertyPid: "P1303", predicateName: "INSTRUMENT", difficulty: "easy", promptTemplateFr: (s) => `De quel instrument joue le musicien ${s} ?` },
  { domain: "music", category: "Music", itemTypeQid: "Q215380", propertyPid: "P495", predicateName: "ORIGIN_COUNTRY", difficulty: "easy", promptTemplateFr: (s) => `De quel pays est originaire le groupe ${s} ?` },

  // 6. LITERATURE (Authors, Movements, Awards, Original Language)
  { domain: "literature", category: "Literature", itemTypeQid: "Q571", propertyPid: "P50", predicateName: "AUTHOR", difficulty: "easy", promptTemplateFr: (s) => `Qui est l'auteur du livre ${s} ?` },
  { domain: "literature", category: "Literature", itemTypeQid: "Q36180", propertyPid: "P135", predicateName: "LITERARY_MOVEMENT", difficulty: "medium", promptTemplateFr: (s) => `À quel mouvement littéraire se rattache ${s} ?` },
  { domain: "literature", category: "Literature", itemTypeQid: "Q36180", propertyPid: "P166", predicateName: "AWARD_RECEIVED", difficulty: "hard", promptTemplateFr: (s) => `Quel prix littéraire a reçu ${s} ?` },
  { domain: "literature", category: "Literature", itemTypeQid: "Q36180", propertyPid: "P27", predicateName: "CITIZENSHIP", difficulty: "easy", promptTemplateFr: (s) => `De quelle nationalité était l'écrivain ${s} ?` },

  // 7. SPORTS (Discipline, Stadiums, Nationality, Olympics)
  { domain: "sports", category: "Sports", itemTypeQid: "Q937857", propertyPid: "P641", predicateName: "SPORT_DISCIPLINE", difficulty: "easy", promptTemplateFr: (s) => `Dans quelle discipline s'illustre ${s} ?` },
  { domain: "sports", category: "Sports", itemTypeQid: "Q476028", propertyPid: "P115", predicateName: "HOME_STADIUM", difficulty: "medium", promptTemplateFr: (s) => `Quel est le stade officiel du club ${s} ?` },
  { domain: "sports", category: "Sports", itemTypeQid: "Q937857", propertyPid: "P27", predicateName: "CITIZENSHIP", difficulty: "easy", promptTemplateFr: (s) => `Quelle est la nationalité de l'athlète ${s} ?` },

  // 8. ART (Artists, Locations, Art Movement, Architects)
  { domain: "art", category: "Art", itemTypeQid: "Q3305213", propertyPid: "P170", predicateName: "CREATOR", difficulty: "easy", promptTemplateFr: (s) => `Qui a peint le tableau ${s} ?` },
  { domain: "art", category: "Art", itemTypeQid: "Q3305213", propertyPid: "P276", predicateName: "LOCATION", difficulty: "medium", promptTemplateFr: (s) => `Dans quel musée est exposé ${s} ?` },
  { domain: "art", category: "Art", itemTypeQid: "Q1028181", propertyPid: "P135", predicateName: "ART_MOVEMENT", difficulty: "medium", promptTemplateFr: (s) => `À quel courant artistique appartient le peintre ${s} ?` },

  // 9. TECHNOLOGY (Languages, Founders, Developers)
  { domain: "technology", category: "Technology", itemTypeQid: "Q9143", propertyPid: "P178", predicateName: "CREATOR", difficulty: "easy", promptTemplateFr: (s) => `Qui a conçu le langage informatique ${s} ?` },
  { domain: "technology", category: "Technology", itemTypeQid: "Q4830453", propertyPid: "P112", predicateName: "FOUNDER", difficulty: "medium", promptTemplateFr: (s) => `Qui a fondé l'entreprise technologique ${s} ?` },

  // 10. NATURE (Taxonomy, Habitats)
  { domain: "nature", category: "Nature", itemTypeQid: "Q16521", propertyPid: "P171", predicateName: "PARENT_TAXON", difficulty: "medium", promptTemplateFr: (s) => `À quel ordre ou famille appartient le taxon ${s} ?` },

  // 11. FOOD & CULTURE (Dishes, Origin)
  { domain: "gastronomy", category: "Food/Culture", itemTypeQid: "Q2095", propertyPid: "P495", predicateName: "ORIGIN_COUNTRY", difficulty: "easy", promptTemplateFr: (s) => `De quel pays est originaire la spécialité ${s} ?` },

  // 12. GAMING & POP CULTURE (Developers, Publishers, Franchises)
  { domain: "gaming", category: "Gaming/Pop", itemTypeQid: "Q7889", propertyPid: "P178", predicateName: "DEVELOPER", difficulty: "easy", promptTemplateFr: (s) => `Quel studio a développé le jeu ${s} ?` },
  { domain: "gaming", category: "Gaming/Pop", itemTypeQid: "Q7889", propertyPid: "P123", predicateName: "PUBLISHER", difficulty: "medium", promptTemplateFr: (s) => `Quel éditeur a publié le jeu ${s} ?` },
];

export async function runIndustrialHarvester(): Promise<void> {
  const outputDir = path.resolve("data", "raw");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const rawOutPath = path.join(outputDir, "GENUINE_OPEN_DATA_TRIPLES.ndjson");
  const writeStream = fs.createWriteStream(rawOutPath, { flags: "a" });

  console.log("================================================================");
  console.log("🏭 MASSIVE INDUSTRIAL OPEN-DATA HARVESTER (12 DOMAINS)");
  console.log(`🏭 Tasks configured: ${INDUSTRIAL_SPECS.length} full-spectrum extraction specs`);
  console.log("================================================================\n");

  const startTime = Date.now();
  let cumulativeNewFacts = 0;

  for (let offset = 0; offset < 50000; offset += 5000) {
    for (const spec of INDUSTRIAL_SPECS) {
      const sparql = `
        SELECT ?item ?val WHERE {
          ?item wdt:P31 wd:${spec.itemTypeQid} ;
                wdt:${spec.propertyPid} ?val .
        }
        OFFSET ${offset}
        LIMIT 5000
      `;

      const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`;

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

        // Parallel batch label resolver
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

        let taskCount = 0;
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
            statement_id: `wdt:${itemQid}:${spec.propertyPid}:${encodeURIComponent(objLabel)}`,
            subject_id: itemQid,
            subject_label: subLabel,
            predicate_id: spec.propertyPid,
            predicate_label: spec.predicateName,
            object_value: objLabel,
            domain: spec.domain,
            category: spec.category,
            difficulty: spec.difficulty,
            license: "CC0",
            confidence: 0.99,
            prompt_fr: spec.promptTemplateFr(subLabel),
            explanation_fr: `Proposition vérifiée par Wikidata (Réponse: ${objLabel}).`,
          };

          writeStream.write(JSON.stringify(triple) + "\n");
          taskCount++;
          cumulativeNewFacts++;
        }

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`  ✓ [Offset ${offset}] Harvested ${taskCount.toLocaleString()} triples for [${spec.category} / ${spec.predicateName}] (Cumulative: ${cumulativeNewFacts.toLocaleString()} [${elapsed}s])`);
      } catch (err: any) {
        console.warn(`  ⚠️ Error on [${spec.category} / ${spec.predicateName}]:`, err.message);
      }
    }
  }

  writeStream.end();
  console.log(`\n🎉 INDUSTRIAL HARVEST COMPLETE: ${cumulativeNewFacts.toLocaleString()} propositions added.`);
}

async function main() {
  await runIndustrialHarvester();
}

if (import.meta.main) {
  main().catch(console.error);
}
