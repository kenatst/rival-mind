import * as fs from "fs";
import * as path from "path";

const WIKIMEDIA_USER_AGENT = "IQArenaBot/2.0 (https://kenatst.github.io/rival-mind/; contact@kenatst.com)";

export interface DiverseQuery {
  domain: string;
  category: string;
  sparql: string;
  predicateName: string;
  propertyId: string;
  difficulty: "easy" | "medium" | "hard";
  promptTemplateFr: (subject: string) => string;
}

export const BALANCED_DIVERSE_QUERIES: DiverseQuery[] = [
  // 1. Cinéma & Audiovisuel
  { domain: "cinema", category: "Cinéma", propertyId: "P57", predicateName: "DIRECTED_BY", difficulty: "easy", sparql: "SELECT ?item ?val WHERE { ?item wdt:P31 wd:Q11424 ; wdt:P57 ?val . } LIMIT 2000", promptTemplateFr: (s) => `Qui a réalisé le film ${s} ?` },
  { domain: "cinema", category: "Cinéma", propertyId: "P86", predicateName: "MUSIC_BY", difficulty: "medium", sparql: "SELECT ?item ?val WHERE { ?item wdt:P31 wd:Q11424 ; wdt:P86 ?val . } LIMIT 2000", promptTemplateFr: (s) => `Qui a composé la musique du film ${s} ?` },
  { domain: "cinema", category: "Cinéma", propertyId: "P161", predicateName: "CAST_MEMBER", difficulty: "easy", sparql: "SELECT ?item ?val WHERE { ?item wdt:P31 wd:Q11424 ; wdt:P161 ?val . } LIMIT 2000", promptTemplateFr: (s) => `Quel acteur ou actrice joue dans ${s} ?` },
  { domain: "cinema", category: "Cinéma", propertyId: "P166", predicateName: "AWARD_RECEIVED", difficulty: "hard", sparql: "SELECT ?item ?val WHERE { ?item wdt:P31 wd:Q11424 ; wdt:P166 ?val . } LIMIT 2000", promptTemplateFr: (s) => `Quelle récompense le film ${s} a-t-il remportée ?` },
  { domain: "cinema", category: "Cinéma", propertyId: "P495", predicateName: "ORIGIN_COUNTRY", difficulty: "easy", sparql: "SELECT ?item ?val WHERE { ?item wdt:P31 wd:Q11424 ; wdt:P495 ?val . } LIMIT 2000", promptTemplateFr: (s) => `De quel pays est originaire le film ${s} ?` },

  // 2. Musique
  { domain: "music", category: "Musique", propertyId: "P175", predicateName: "PERFORMER", difficulty: "easy", sparql: "SELECT ?item ?val WHERE { ?item wdt:P31 wd:Q482994 ; wdt:P175 ?val . } LIMIT 2000", promptTemplateFr: (s) => `Quel artiste a sorti l'album ${s} ?` },
  { domain: "music", category: "Musique", propertyId: "P136", predicateName: "GENRE", difficulty: "easy", sparql: "SELECT ?item ?val WHERE { ?item wdt:P31 wd:Q482994 ; wdt:P136 ?val . } LIMIT 2000", promptTemplateFr: (s) => `Quel est le genre musical de l'album ${s} ?` },
  { domain: "music", category: "Musique", propertyId: "P740", predicateName: "FORMATION_PLACE", difficulty: "medium", sparql: "SELECT ?item ?val WHERE { ?item wdt:P31 wd:Q215380 ; wdt:P740 ?val . } LIMIT 2000", promptTemplateFr: (s) => `Dans quelle ville le groupe ${s} a-t-il été formé ?` },
  { domain: "music", category: "Musique", propertyId: "P1303", predicateName: "INSTRUMENT", difficulty: "easy", sparql: "SELECT ?item ?val WHERE { ?item wdt:P106 wd:Q177220 ; wdt:P1303 ?val . } LIMIT 2000", promptTemplateFr: (s) => `De quel instrument joue le musicien ${s} ?` },

  // 3. Histoire & Souverains
  { domain: "history", category: "Histoire", propertyId: "P53", predicateName: "DYNASTY", difficulty: "medium", sparql: "SELECT ?item ?val WHERE { ?item wdt:P106 wd:Q116 ; wdt:P53 ?val . } LIMIT 2000", promptTemplateFr: (s) => `À quelle dynastie appartenait le souverain ${s} ?` },
  { domain: "history", category: "Histoire", propertyId: "P276", predicateName: "BATTLE_LOCATION", difficulty: "medium", sparql: "SELECT ?item ?val WHERE { ?item wdt:P31 wd:Q178561 ; wdt:P276 ?val . } LIMIT 2000", promptTemplateFr: (s) => `Où s'est déroulée la bataille historique de ${s} ?` },
  { domain: "history", category: "Histoire", propertyId: "P61", predicateName: "INVENTOR", difficulty: "easy", sparql: "SELECT ?item ?val WHERE { ?item wdt:P31 wd:Q11019 ; wdt:P61 ?val . } LIMIT 2000", promptTemplateFr: (s) => `Qui est l'inventeur de ${s} ?` },

  // 4. Géographie
  { domain: "geography", category: "Géographie", propertyId: "P36", predicateName: "CAPITAL_OF", difficulty: "easy", sparql: "SELECT ?item ?val WHERE { ?item wdt:P31 wd:Q6256 ; wdt:P36 ?val . } LIMIT 1000", promptTemplateFr: (s) => `Quelle est la capitale officielle de ${s} ?` },
  { domain: "geography", category: "Géographie", propertyId: "P30", predicateName: "CONTINENT", difficulty: "easy", sparql: "SELECT ?item ?val WHERE { ?item wdt:P31 wd:Q6256 ; wdt:P30 ?val . } LIMIT 1000", promptTemplateFr: (s) => `Sur quel continent se situe ${s} ?` },
  { domain: "geography", category: "Géographie", propertyId: "P37", predicateName: "OFFICIAL_LANGUAGE", difficulty: "easy", sparql: "SELECT ?item ?val WHERE { ?item wdt:P31 wd:Q6256 ; wdt:P37 ?val . } LIMIT 1500", promptTemplateFr: (s) => `Quelle est la langue officielle de ${s} ?` },
  { domain: "geography", category: "Géographie", propertyId: "P4552", predicateName: "MOUNTAIN_RANGE", difficulty: "medium", sparql: "SELECT ?item ?val WHERE { ?item wdt:P31 wd:Q8502 ; wdt:P4552 ?val . } LIMIT 2000", promptTemplateFr: (s) => `À quel massif montagneux appartient le pic ${s} ?` },

  // 5. Littérature & Philosophie
  { domain: "literature", category: "Littérature", propertyId: "P50", predicateName: "AUTHOR", difficulty: "easy", sparql: "SELECT ?item ?val WHERE { ?item wdt:P31 wd:Q571 ; wdt:P50 ?val . } LIMIT 2500", promptTemplateFr: (s) => `Qui a écrit le livre ${s} ?` },
  { domain: "literature", category: "Littérature", propertyId: "P135", predicateName: "LITERARY_MOVEMENT", difficulty: "medium", sparql: "SELECT ?item ?val WHERE { ?item wdt:P106 wd:Q36180 ; wdt:P135 ?val . } LIMIT 2000", promptTemplateFr: (s) => `À quel courant littéraire appartient ${s} ?` },
  { domain: "literature", category: "Littérature", propertyId: "P166", predicateName: "AWARD_RECEIVED", difficulty: "hard", sparql: "SELECT ?item ?val WHERE { ?item wdt:P106 wd:Q36180 ; wdt:P166 ?val . } LIMIT 2000", promptTemplateFr: (s) => `Quel prix littéraire a été décerné à ${s} ?` },

  // 6. Sciences, Espace & Nature
  { domain: "science", category: "Sciences", propertyId: "P166", predicateName: "AWARD_RECEIVED", difficulty: "hard", sparql: "SELECT ?item ?val WHERE { ?item wdt:P106 wd:Q169470 ; wdt:P166 ?val . } LIMIT 1500", promptTemplateFr: (s) => `Quelle distinction majeure a reçue le scientifique ${s} ?` },
  { domain: "science", category: "Sciences", propertyId: "P397", predicateName: "PARENT_PLANET", difficulty: "easy", sparql: "SELECT ?item ?val WHERE { ?item wdt:P31 wd:Q2537 ; wdt:P397 ?val . } LIMIT 500", promptTemplateFr: (s) => `Autour de quelle planète gravite le satellite ${s} ?` },
  { domain: "nature", category: "Nature", propertyId: "P171", predicateName: "PARENT_TAXON", difficulty: "medium", sparql: "SELECT ?item ?val WHERE { ?item wdt:P31 wd:Q16521 ; wdt:P171 ?val . } LIMIT 2500", promptTemplateFr: (s) => `À quelle famille ou ordre biologique appartient le taxon ${s} ?` },

  // 7. Art & Peinture
  { domain: "art", category: "Art", propertyId: "P170", predicateName: "CREATOR", difficulty: "easy", sparql: "SELECT ?item ?val WHERE { ?item wdt:P31 wd:Q3305213 ; wdt:P170 ?val . } LIMIT 2500", promptTemplateFr: (s) => `Qui a peint le chef-d'œuvre ${s} ?` },
  { domain: "art", category: "Art", propertyId: "P276", predicateName: "LOCATION", difficulty: "medium", sparql: "SELECT ?item ?val WHERE { ?item wdt:P31 wd:Q3305213 ; wdt:P276 ?val . } LIMIT 2000", promptTemplateFr: (s) => `Dans quel musée ou lieu est conservé ${s} ?` },
  { domain: "art", category: "Art", propertyId: "P135", predicateName: "ART_MOVEMENT", difficulty: "medium", sparql: "SELECT ?item ?val WHERE { ?item wdt:P106 wd:Q1028181 ; wdt:P135 ?val . } LIMIT 2000", promptTemplateFr: (s) => `À quel mouvement artistique appartient le peintre ${s} ?` },

  // 8. Jeux Vidéo & Technologie
  { domain: "gaming", category: "Jeux Vidéo", propertyId: "P178", predicateName: "DEVELOPER", difficulty: "easy", sparql: "SELECT ?item ?val WHERE { ?item wdt:P31 wd:Q7889 ; wdt:P178 ?val . } LIMIT 2500", promptTemplateFr: (s) => `Quel studio a développé le jeu ${s} ?` },
  { domain: "gaming", category: "Jeux Vidéo", propertyId: "P123", predicateName: "PUBLISHER", difficulty: "medium", sparql: "SELECT ?item ?val WHERE { ?item wdt:P31 wd:Q7889 ; wdt:P123 ?val . } LIMIT 2000", promptTemplateFr: (s) => `Quel éditeur a publié le jeu vidéo ${s} ?` },
  { domain: "technology", category: "Technologie", propertyId: "P178", predicateName: "CREATOR", difficulty: "easy", sparql: "SELECT ?item ?val WHERE { ?item wdt:P31 wd:Q9143 ; wdt:P178 ?val . } LIMIT 1000", promptTemplateFr: (s) => `Qui est le concepteur du langage informatique ${s} ?` },

  // 9. Sports
  { domain: "sports", category: "Sport", propertyId: "P641", predicateName: "SPORT_DISCIPLINE", difficulty: "easy", sparql: "SELECT ?item ?val WHERE { ?item wdt:P106 wd:Q937857 ; wdt:P641 ?val . } LIMIT 2500", promptTemplateFr: (s) => `Dans quelle discipline sportive s'illustre l'athlète ${s} ?` },
  { domain: "sports", category: "Sport", propertyId: "P115", predicateName: "HOME_STADIUM", difficulty: "medium", sparql: "SELECT ?item ?val WHERE { ?item wdt:P31 wd:Q476028 ; wdt:P115 ?val . } LIMIT 2000", promptTemplateFr: (s) => `Quel est le stade officiel du club ${s} ?` },

  // 10. Gastronomie
  { domain: "gastronomy", category: "Gastronomie", propertyId: "P495", predicateName: "ORIGIN_COUNTRY", difficulty: "easy", sparql: "SELECT ?item ?val WHERE { ?item wdt:P31 wd:Q2095 ; wdt:P495 ?val . } LIMIT 2000", promptTemplateFr: (s) => `De quel pays est originaire la spécialité culinaire ${s} ?` },
];

export async function runBalancedHarvest(): Promise<void> {
  const outputDir = path.resolve("data", "raw");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const rawOutPath = path.join(outputDir, "GENUINE_OPEN_DATA_TRIPLES.ndjson");
  const writeStream = fs.createWriteStream(rawOutPath, { flags: "a" });

  console.log("================================================================");
  console.log("⚖️ IQ ARENA — BALANCED DIVERSE HARVEST ENGINE (12 DOMAINS)");
  console.log(`⚖️ Tasks configured: ${BALANCED_DIVERSE_QUERIES.length} balanced queries`);
  console.log("================================================================\n");

  let totalHarvested = 0;
  const startTime = Date.now();

  for (const q of BALANCED_DIVERSE_QUERIES) {
    const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(q.sparql)}&format=json`;

    try {
      const res = await fetch(url, { headers: { "User-Agent": WIKIMEDIA_USER_AGENT } });
      if (!res.ok) continue;

      const data = await res.json();
      const bindings = data?.results?.bindings || [];
      if (bindings.length === 0) continue;

      // Collect QIDs to resolve
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
          statement_id: `wdt:${itemQid}:${q.propertyId}:${encodeURIComponent(objLabel)}`,
          subject_id: itemQid,
          subject_label: subLabel,
          predicate_id: q.propertyId,
          predicate_label: q.predicateName,
          object_value: objLabel,
          domain: q.domain,
          category: q.category,
          difficulty: q.difficulty,
          license: "CC0",
          confidence: 0.99,
          prompt_fr: q.promptTemplateFr(subLabel),
          explanation_fr: `Proposition vérifiée par Wikidata (Réponse: ${objLabel}).`,
        };

        writeStream.write(JSON.stringify(triple) + "\n");
        taskCount++;
        totalHarvested++;
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`  ✓ Harvested ${taskCount.toLocaleString()} triples for [${q.category} / ${q.predicateName}] (Total: ${totalHarvested.toLocaleString()} [${elapsed}s])`);
    } catch (err: any) {
      console.warn(`  ⚠️ Error on [${q.category} / ${q.predicateName}]:`, err.message);
    }
  }

  writeStream.end();
  console.log(`\n🎉 BALANCED HARVEST COMPLETE: ${totalHarvested.toLocaleString()} genuine propositions added.`);
}

async function main() {
  await runBalancedHarvest();
}

if (import.meta.main) {
  main().catch(console.error);
}
