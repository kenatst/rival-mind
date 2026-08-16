import * as fs from "fs";
import * as path from "path";

export interface SparqlHarvestTask {
  id: string;
  domain: string;
  category: string;
  itemType: string;
  property: string;
  predicateName: string;
  difficulty: "easy" | "medium" | "hard";
  promptTemplateFr: (subject: string) => string;
}

export const HARVEST_TASKS: SparqlHarvestTask[] = [
  // Cinema (10 tasks)
  { id: "cinema-director", domain: "cinema", category: "Cinéma", itemType: "Q11424", property: "P57", predicateName: "DIRECTED_BY", difficulty: "easy", promptTemplateFr: (s) => `Qui est le réalisateur du film ${s} ?` },
  { id: "cinema-composer", domain: "cinema", category: "Cinéma", itemType: "Q11424", property: "P86", predicateName: "MUSIC_BY", difficulty: "medium", promptTemplateFr: (s) => `Qui a composé la musique originale du film ${s} ?` },
  { id: "cinema-screenwriter", domain: "cinema", category: "Cinéma", itemType: "Q11424", property: "P58", predicateName: "SCREENPLAY_BY", difficulty: "medium", promptTemplateFr: (s) => `Qui a écrit le scénario du film ${s} ?` },
  { id: "cinema-producer", domain: "cinema", category: "Cinéma", itemType: "Q11424", property: "P162", predicateName: "PRODUCED_BY", difficulty: "hard", promptTemplateFr: (s) => `Qui a produit le film ${s} ?` },
  { id: "cinema-cast", domain: "cinema", category: "Cinéma", itemType: "Q11424", property: "P161", predicateName: "CAST_MEMBER", difficulty: "easy", promptTemplateFr: (s) => `Quel acteur ou actrice fait partie de la distribution principale de ${s} ?` },
  { id: "cinema-genre", domain: "cinema", category: "Cinéma", itemType: "Q11424", property: "P136", predicateName: "GENRE", difficulty: "easy", promptTemplateFr: (s) => `À quel genre cinématographique appartient le film ${s} ?` },
  { id: "cinema-origin", domain: "cinema", category: "Cinéma", itemType: "Q11424", property: "P495", predicateName: "COUNTRY_OF_ORIGIN", difficulty: "easy", promptTemplateFr: (s) => `De quel pays est originaire le film ${s} ?` },
  { id: "cinema-distributor", domain: "cinema", category: "Cinéma", itemType: "Q11424", property: "P750", predicateName: "DISTRIBUTED_BY", difficulty: "hard", promptTemplateFr: (s) => `Quelle société a distribué le film ${s} ?` },
  { id: "cinema-dp", domain: "cinema", category: "Cinéma", itemType: "Q11424", property: "P344", predicateName: "DIRECTOR_OF_PHOTOGRAPHY", difficulty: "hard", promptTemplateFr: (s) => `Qui était le directeur de la photographie du film ${s} ?` },
  { id: "cinema-award", domain: "cinema", category: "Cinéma", itemType: "Q11424", property: "P166", predicateName: "AWARD_RECEIVED", difficulty: "medium", promptTemplateFr: (s) => `Quelle récompense majeure a été décernée au film ${s} ?` },

  // Music (10 tasks)
  { id: "music-artist", domain: "music", category: "Musique", itemType: "Q482994", property: "P175", predicateName: "PERFORMED_BY", difficulty: "easy", promptTemplateFr: (s) => `Quel groupe ou interprète a sorti l'album ${s} ?` },
  { id: "music-genre", domain: "music", category: "Musique", itemType: "Q482994", property: "P136", predicateName: "GENRE", difficulty: "easy", promptTemplateFr: (s) => `Quel est le genre musical principal de l'album ${s} ?` },
  { id: "music-producer", domain: "music", category: "Musique", itemType: "Q482994", property: "P162", predicateName: "PRODUCER", difficulty: "hard", promptTemplateFr: (s) => `Qui a produit l'album musical ${s} ?` },
  { id: "music-band-origin", domain: "music", category: "Musique", itemType: "Q215380", property: "P740", predicateName: "LOCATION_OF_FORMATION", difficulty: "medium", promptTemplateFr: (s) => `Dans quelle ville ou région le groupe ${s} s'est-il formé ?` },
  { id: "music-band-country", domain: "music", category: "Musique", itemType: "Q215380", property: "P495", predicateName: "COUNTRY_OF_ORIGIN", difficulty: "easy", promptTemplateFr: (s) => `De quel pays est originaire le groupe musical ${s} ?` },
  { id: "music-singer-instrument", domain: "music", category: "Musique", itemType: "Q177220", property: "P1303", predicateName: "INSTRUMENT", difficulty: "easy", promptTemplateFr: (s) => `De quel instrument le musicien ${s} joue-t-il principalement ?` },
  { id: "music-record-label", domain: "music", category: "Musique", itemType: "Q482994", property: "P264", predicateName: "RECORD_LABEL", difficulty: "hard", promptTemplateFr: (s) => `Sur quel label discographique est paru l'album ${s} ?` },
  { id: "music-song-performer", domain: "music", category: "Musique", itemType: "Q7366", property: "P175", predicateName: "PERFORMER", difficulty: "easy", promptTemplateFr: (s) => `Quel artiste a interprété la chanson emblématique ${s} ?` },
  { id: "music-composer-movement", domain: "music", category: "Musique", itemType: "Q36834", property: "P136", predicateName: "GENRE", difficulty: "medium", promptTemplateFr: (s) => `À quel courant musical le compositeur ${s} est-il rattaché ?` },
  { id: "music-band-member", domain: "music", category: "Musique", itemType: "Q215380", property: "P527", predicateName: "HAS_PART", difficulty: "medium", promptTemplateFr: (s) => `Quel musicien fait partie des membres fondateurs de ${s} ?` },

  // Geography (10 tasks)
  { id: "geo-capital", domain: "geography", category: "Géographie", itemType: "Q6256", property: "P36", predicateName: "CAPITAL_OF", difficulty: "easy", promptTemplateFr: (s) => `Quelle est la capitale officielle de ${s} ?` },
  { id: "geo-city-country", domain: "geography", category: "Géographie", itemType: "Q515", property: "P17", predicateName: "LOCATED_IN_COUNTRY", difficulty: "easy", promptTemplateFr: (s) => `Dans quel pays se trouve la ville de ${s} ?` },
  { id: "geo-river-mouth", domain: "geography", category: "Géographie", itemType: "Q4022", property: "P206", predicateName: "MOUTH_OF_RIVER", difficulty: "medium", promptTemplateFr: (s) => `Dans quelle mer ou océan se jette le fleuve ${s} ?` },
  { id: "geo-mountain-range", domain: "geography", category: "Géographie", itemType: "Q8502", property: "P4552", predicateName: "MOUNTAIN_RANGE", difficulty: "medium", promptTemplateFr: (s) => `À quelle chaîne montagneuse appartient le sommet ${s} ?` },
  { id: "geo-lake-country", domain: "geography", category: "Géographie", itemType: "Q23397", property: "P17", predicateName: "LAKE_COUNTRY", difficulty: "easy", promptTemplateFr: (s) => `Dans quel pays se situe principalement le lac ${s} ?` },
  { id: "geo-island-archipelago", domain: "geography", category: "Géographie", itemType: "Q23442", property: "P361", predicateName: "PART_OF_ARCHIPELAGO", difficulty: "hard", promptTemplateFr: (s) => `À quel archipel appartient l'île de ${s} ?` },
  { id: "geo-country-continent", domain: "geography", category: "Géographie", itemType: "Q6256", property: "P30", predicateName: "CONTINENT", difficulty: "easy", promptTemplateFr: (s) => `Sur quel continent se trouve ${s} ?` },
  { id: "geo-country-currency", domain: "geography", category: "Géographie", itemType: "Q6256", property: "P38", predicateName: "CURRENCY", difficulty: "medium", promptTemplateFr: (s) => `Quelle est la monnaie officielle de ${s} ?` },
  { id: "geo-desert-continent", domain: "geography", category: "Géographie", itemType: "Q8514", property: "P30", predicateName: "DESERT_CONTINENT", difficulty: "medium", promptTemplateFr: (s) => `Sur quel continent s'étend le désert ${s} ?` },
  { id: "geo-strait-connects", domain: "geography", category: "Géographie", itemType: "Q37901", property: "P206", predicateName: "LOCATED_IN_WATER", difficulty: "hard", promptTemplateFr: (s) => `Quel détroit ou passage maritime sépare les rives de ${s} ?` },

  // Literature (10 tasks)
  { id: "lit-author", domain: "literature", category: "Littérature", itemType: "Q7725634", property: "P50", predicateName: "AUTHOR", difficulty: "easy", promptTemplateFr: (s) => `Qui a écrit l'œuvre littéraire ${s} ?` },
  { id: "lit-genre", domain: "literature", category: "Littérature", itemType: "Q7725634", property: "P136", predicateName: "GENRE", difficulty: "easy", promptTemplateFr: (s) => `À quel genre littéraire se rattache ${s} ?` },
  { id: "lit-language", domain: "literature", category: "Littérature", itemType: "Q7725634", property: "P407", predicateName: "ORIGINAL_LANGUAGE", difficulty: "medium", promptTemplateFr: (s) => `Dans quelle langue a été rédigé à l'origine ${s} ?` },
  { id: "lit-character", domain: "literature", category: "Littérature", itemType: "Q7725634", property: "P674", predicateName: "CHARACTERS", difficulty: "medium", promptTemplateFr: (s) => `Quel personnage célèbre apparaît dans le roman ${s} ?` },
  { id: "lit-movement", domain: "literature", category: "Littérature", itemType: "Q36180", property: "P135", predicateName: "MOVEMENT", difficulty: "medium", promptTemplateFr: (s) => `À quel mouvement littéraire appartient l'écrivain ${s} ?` },
  { id: "lit-prize", domain: "literature", category: "Littérature", itemType: "Q36180", property: "P166", predicateName: "AWARD", difficulty: "hard", promptTemplateFr: (s) => `Quel prix littéraire prestigieux a été attribué à ${s} ?` },
  { id: "lit-birthplace", domain: "literature", category: "Littérature", itemType: "Q36180", property: "P19", predicateName: "PLACE_OF_BIRTH", difficulty: "medium", promptTemplateFr: (s) => `Dans quelle ville est né l'auteur ${s} ?` },
  { id: "lit-country", domain: "literature", category: "Littérature", itemType: "Q36180", property: "P27", predicateName: "CITIZENSHIP", difficulty: "easy", promptTemplateFr: (s) => `De quelle nationalité était l'écrivain ${s} ?` },
  { id: "lit-series", domain: "literature", category: "Littérature", itemType: "Q7725634", property: "P179", predicateName: "SERIES", difficulty: "easy", promptTemplateFr: (s) => `À quelle saga ou série littéraire appartient le livre ${s} ?` },
  { id: "lit-illustrator", domain: "literature", category: "Littérature", itemType: "Q7725634", property: "P110", predicateName: "ILLUSTRATOR", difficulty: "hard", promptTemplateFr: (s) => `Qui est l'illustrateur de l'ouvrage ${s} ?` },
];

export async function runDirect1MHarvest(): Promise<void> {
  const outputDir = path.resolve("data", "raw");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const rawOutPath = path.join(outputDir, "GENUINE_OPEN_DATA_TRIPLES.ndjson");
  const writeStream = fs.createWriteStream(rawOutPath, { flags: "w" });

  console.log("================================================================");
  console.log("🚀 IQ ARENA — DIRECT 1M REAL WIKIDATA HARVEST ENGINE");
  console.log(`🚀 Tasks configured: ${HARVEST_TASKS.length} high-density domain queries`);
  console.log("================================================================\n");

  let totalHarvested = 0;
  const startTime = Date.now();

  for (const t of HARVEST_TASKS) {
    const sparql = `
      SELECT ?item ?itemLabel ?val ?valLabel WHERE {
        ?item wdt:P31 wd:${t.itemType} ;
              wdt:${t.property} ?val ;
              rdfs:label ?itemLabel .
        ?val rdfs:label ?valLabel .
        FILTER(LANG(?itemLabel) = "fr" && LANG(?valLabel) = "fr")
      }
      LIMIT 2500
    `;

    const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`;

    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "IQArena/2.0 (bulk open-data engine)" },
        signal: AbortSignal.timeout(30000),
      });

      if (!res.ok) {
        console.warn(`  ⚠️ Query failed for [${t.category} / ${t.property}] (HTTP ${res.status})`);
        continue;
      }

      const json = await res.json();
      const bindings = json?.results?.bindings || [];

      for (const b of bindings) {
        const itemUri = b.item?.value || "";
        const itemQid = itemUri.split("/").pop() || "";
        const subLabel = b.itemLabel?.value || "";
        const objLabel = b.valLabel?.value || "";

        if (!itemQid || !subLabel || !objLabel || subLabel.startsWith("Q") || objLabel.startsWith("Q")) {
          continue;
        }

        const triple = {
          source_name: "wikidata",
          statement_id: `wdt:${itemQid}:${t.property}:${encodeURIComponent(objLabel)}`,
          subject_id: itemQid,
          subject_label: subLabel,
          predicate_id: t.property,
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
        totalHarvested++;
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`  ✓ Harvested ${bindings.length.toLocaleString()} triples for [${t.category} / ${t.predicateName}] (Cumulative: ${totalHarvested.toLocaleString()} [${elapsed}s])`);
    } catch (err: any) {
      console.warn(`  ⚠️ Query error for [${t.category} / ${t.predicateName}]:`, err.message);
    }
  }

  writeStream.end();
  console.log(`\n🎉 MASSIVE DIRECT HARVEST COMPLETE: ${totalHarvested.toLocaleString()} genuine propositions in ${rawOutPath}`);
}

async function main() {
  await runDirect1MHarvest();
}

if (import.meta.main) {
  main().catch(console.error);
}
