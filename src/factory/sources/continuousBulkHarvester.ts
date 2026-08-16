import * as fs from "fs";
import * as path from "path";

const WIKIMEDIA_USER_AGENT = "IQArenaBot/2.0 (https://kenatst.github.io/rival-mind/; contact@kenatst.com)";

export interface CrawlerTarget {
  domain: string;
  category: string;
  itemTypeQid: string;
  propertyPid: string;
  predicateName: string;
  difficulty: "easy" | "medium" | "hard";
  promptTemplateFr: (subject: string) => string;
}

export const CRAWLER_TARGETS: CrawlerTarget[] = [
  // Cinema
  { domain: "cinema", category: "Cinéma", itemTypeQid: "Q11424", propertyPid: "P57", predicateName: "DIRECTED_BY", difficulty: "easy", promptTemplateFr: (s) => `Qui a réalisé le film ${s} ?` },
  { domain: "cinema", category: "Cinéma", itemTypeQid: "Q11424", propertyPid: "P86", predicateName: "MUSIC_BY", difficulty: "medium", promptTemplateFr: (s) => `Qui a composé la musique du film ${s} ?` },
  { domain: "cinema", category: "Cinéma", itemTypeQid: "Q11424", propertyPid: "P161", predicateName: "CAST_MEMBER", difficulty: "easy", promptTemplateFr: (s) => `Quel acteur ou actrice joue dans ${s} ?` },
  { domain: "cinema", category: "Cinéma", itemTypeQid: "Q11424", propertyPid: "P166", predicateName: "AWARD_RECEIVED", difficulty: "hard", promptTemplateFr: (s) => `Quelle récompense le film ${s} a-t-il remportée ?` },
  { domain: "cinema", category: "Cinéma", itemTypeQid: "Q11424", propertyPid: "P495", predicateName: "ORIGIN_COUNTRY", difficulty: "easy", promptTemplateFr: (s) => `De quel pays provient le film ${s} ?` },
  { domain: "cinema", category: "Cinéma", itemTypeQid: "Q11424", propertyPid: "P58", predicateName: "SCREENPLAY_BY", difficulty: "medium", promptTemplateFr: (s) => `Qui a écrit le scénario du film ${s} ?` },

  // Music
  { domain: "music", category: "Musique", itemTypeQid: "Q482994", propertyPid: "P175", predicateName: "PERFORMER", difficulty: "easy", promptTemplateFr: (s) => `Quel artiste a sorti l'album ${s} ?` },
  { domain: "music", category: "Musique", itemTypeQid: "Q482994", propertyPid: "P136", predicateName: "GENRE", difficulty: "easy", promptTemplateFr: (s) => `Quel est le genre musical de l'album ${s} ?` },
  { domain: "music", category: "Musique", itemTypeQid: "Q215380", propertyPid: "P740", predicateName: "FORMATION_PLACE", difficulty: "medium", promptTemplateFr: (s) => `Dans quelle ville le groupe ${s} s'est-il formé ?` },
  { domain: "music", category: "Musique", itemTypeQid: "Q177220", propertyPid: "P1303", predicateName: "INSTRUMENT", difficulty: "easy", promptTemplateFr: (s) => `De quel instrument joue le musicien ${s} ?` },
  { domain: "music", category: "Musique", itemTypeQid: "Q215380", propertyPid: "P495", predicateName: "ORIGIN_COUNTRY", difficulty: "easy", promptTemplateFr: (s) => `De quel pays est originaire le groupe ${s} ?` },

  // Geography
  { domain: "geography", category: "Géographie", itemTypeQid: "Q6256", propertyPid: "P36", predicateName: "CAPITAL_OF", difficulty: "easy", promptTemplateFr: (s) => `Quelle est la capitale officielle de ${s} ?` },
  { domain: "geography", category: "Géographie", itemTypeQid: "Q6256", propertyPid: "P30", predicateName: "CONTINENT", difficulty: "easy", promptTemplateFr: (s) => `Sur quel continent se trouve ${s} ?` },
  { domain: "geography", category: "Géographie", itemTypeQid: "Q6256", propertyPid: "P37", predicateName: "OFFICIAL_LANGUAGE", difficulty: "easy", promptTemplateFr: (s) => `Quelle est la langue officielle de ${s} ?` },
  { domain: "geography", category: "Géographie", itemTypeQid: "Q515", propertyPid: "P17", predicateName: "LOCATED_IN_COUNTRY", difficulty: "easy", promptTemplateFr: (s) => `Dans quel pays se trouve la ville de ${s} ?` },
  { domain: "geography", category: "Géographie", itemTypeQid: "Q8502", propertyPid: "P4552", predicateName: "MOUNTAIN_RANGE", difficulty: "medium", promptTemplateFr: (s) => `À quelle chaîne montagneuse appartient le mont ${s} ?` },

  // History & Leaders
  { domain: "history", category: "Histoire", itemTypeQid: "Q116", propertyPid: "P53", predicateName: "DYNASTY", difficulty: "medium", promptTemplateFr: (s) => `À quelle dynastie appartenait le monarque ${s} ?` },
  { domain: "history", category: "Histoire", itemTypeQid: "Q82955", propertyPid: "P27", predicateName: "CITIZENSHIP", difficulty: "easy", promptTemplateFr: (s) => `De quel pays était originaire la personnalité ${s} ?` },
  { domain: "history", category: "Histoire", itemTypeQid: "Q11019", propertyPid: "P61", predicateName: "INVENTOR", difficulty: "easy", promptTemplateFr: (s) => `Qui a inventé ${s} ?` },

  // Literature & Philosophy
  { domain: "literature", category: "Littérature", itemTypeQid: "Q571", propertyPid: "P50", predicateName: "AUTHOR", difficulty: "easy", promptTemplateFr: (s) => `Qui est l'auteur du livre ${s} ?` },
  { domain: "literature", category: "Littérature", itemTypeQid: "Q36180", propertyPid: "P135", predicateName: "LITERARY_MOVEMENT", difficulty: "medium", promptTemplateFr: (s) => `À quel mouvement littéraire se rattache ${s} ?` },
  { domain: "literature", category: "Littérature", itemTypeQid: "Q36180", propertyPid: "P166", predicateName: "AWARD_RECEIVED", difficulty: "hard", promptTemplateFr: (s) => `Quelle distinction littéraire a été attribuée à ${s} ?` },
  { domain: "literature", category: "Littérature", itemTypeQid: "Q36180", propertyPid: "P27", predicateName: "CITIZENSHIP", difficulty: "easy", promptTemplateFr: (s) => `De quelle nationalité était l'écrivain ${s} ?` },

  // Art & Architecture
  { domain: "art", category: "Art", itemTypeQid: "Q3305213", propertyPid: "P170", predicateName: "CREATOR", difficulty: "easy", promptTemplateFr: (s) => `Qui est l'auteur de l'œuvre d'art ${s} ?` },
  { domain: "art", category: "Art", itemTypeQid: "Q3305213", propertyPid: "P276", predicateName: "LOCATION", difficulty: "medium", promptTemplateFr: (s) => `Dans quel musée se trouve le chef-d'œuvre ${s} ?` },
  { domain: "art", category: "Art", itemTypeQid: "Q1028181", propertyPid: "P135", predicateName: "ART_MOVEMENT", difficulty: "medium", promptTemplateFr: (s) => `À quel mouvement artistique appartient le peintre ${s} ?` },

  // Sports
  { domain: "sports", category: "Sport", itemTypeQid: "Q937857", propertyPid: "P641", predicateName: "SPORT_DISCIPLINE", difficulty: "easy", promptTemplateFr: (s) => `Dans quelle discipline sportive évolue ${s} ?` },
  { domain: "sports", category: "Sport", itemTypeQid: "Q476028", propertyPid: "P115", predicateName: "HOME_STADIUM", difficulty: "medium", promptTemplateFr: (s) => `Quel est le stade officiel du club de sport ${s} ?` },
  { domain: "sports", category: "Sport", itemTypeQid: "Q937857", propertyPid: "P27", predicateName: "CITIZENSHIP", difficulty: "easy", promptTemplateFr: (s) => `Quelle est la nationalité sportive de l'athlète ${s} ?` },

  // Nature & Sciences
  { domain: "nature", category: "Nature", itemTypeQid: "Q16521", propertyPid: "P171", predicateName: "PARENT_TAXON", difficulty: "medium", promptTemplateFr: (s) => `À quel ordre ou famille biologique appartient le taxon ${s} ?` },
  { domain: "science", category: "Sciences", itemTypeQid: "Q169470", propertyPid: "P166", predicateName: "AWARD_RECEIVED", difficulty: "hard", promptTemplateFr: (s) => `Quelle récompense majeure a été décernée au scientifique ${s} ?` },
  { domain: "science", category: "Sciences", itemTypeQid: "Q2537", propertyPid: "P397", predicateName: "PARENT_PLANET", difficulty: "easy", promptTemplateFr: (s) => `Autour de quelle planète orbite le satellite ${s} ?` },

  // Video Games, Tech & Gastronomy
  { domain: "gaming", category: "Jeux Vidéo", itemTypeQid: "Q7889", propertyPid: "P178", predicateName: "DEVELOPER", difficulty: "easy", promptTemplateFr: (s) => `Quel studio a développé le jeu ${s} ?` },
  { domain: "technology", category: "Technologie", itemTypeQid: "Q9143", propertyPid: "P178", predicateName: "CREATOR", difficulty: "easy", promptTemplateFr: (s) => `Qui a créé le langage de programmation ${s} ?` },
  { domain: "gastronomy", category: "Gastronomie", itemTypeQid: "Q2095", propertyPid: "P495", predicateName: "ORIGIN_COUNTRY", difficulty: "easy", promptTemplateFr: (s) => `De quel pays est originaire la recette ${s} ?` },
];

export async function runContinuousCrawler(): Promise<void> {
  const outputDir = path.resolve("data", "raw");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const rawOutPath = path.join(outputDir, "GENUINE_OPEN_DATA_TRIPLES.ndjson");
  const writeStream = fs.createWriteStream(rawOutPath, { flags: "a" });

  console.log("================================================================");
  console.log("🔄 CONTINUOUS MULTI-DOMAIN DIVERSITY CRAWLER (12 DOMAINS)");
  console.log("================================================================\n");

  const startTime = Date.now();
  let totalAdded = 0;

  for (let offset = 0; offset < 20000; offset += 2500) {
    for (const t of CRAWLER_TARGETS) {
      const sparql = `
        SELECT ?item ?val WHERE {
          ?item wdt:P31 wd:${t.itemTypeQid} ;
                wdt:${t.propertyPid} ?val .
        }
        OFFSET ${offset}
        LIMIT 2500
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
            statement_id: `wdt:${itemQid}:${t.propertyPid}:${encodeURIComponent(objLabel)}`,
            subject_id: itemQid,
            subject_label: subLabel,
            predicate_id: t.propertyPid,
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
          taskCount++;
          totalAdded++;
        }

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`  ✓ [Offset ${offset}] Harvested ${taskCount.toLocaleString()} triples for [${t.category} / ${t.predicateName}] (Cumulative: ${totalAdded.toLocaleString()} [${elapsed}s])`);
      } catch (err: any) {
        console.warn(`  ⚠️ Error on [${t.category} / ${t.predicateName}]:`, err.message);
      }
    }
  }

  writeStream.end();
  console.log(`\n🎉 CRAWLER CYCLE FINISHED: ${totalAdded.toLocaleString()} new propositions harvested.`);
}

async function main() {
  await runContinuousCrawler();
}

if (import.meta.main) {
  main().catch(console.error);
}
