import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

export interface GenuineSourceProposition {
  source_name: "wikidata" | "musicbrainz" | "openalex";
  statement_id: string;
  subject_id: string;
  subject_label: string;
  predicate_id: string;
  predicate_label: string;
  object_value: string;
  domain: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  license: "CC0" | "CC-BY" | "Open Database License";
  confidence: number;
}

export class BulkOpenDataHarvester {
  private outputDir = path.resolve("data", "raw");
  private rawCorpusPath = path.resolve("data", "raw", "GENUINE_OPEN_DATA_TRIPLES.ndjson");

  constructor() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Generates a streaming batch of SPARQL queries to fetch real Wikidata triples
   */
  public async fetchWikidataBatch(property: string, itemType: string, domain: string, category: string, limit = 5000): Promise<GenuineSourceProposition[]> {
    const sparql = `
      SELECT ?item ?itemLabel ?val ?valLabel WHERE {
        ?item wdt:P31/wdt:P279* wd:${itemType} ;
              wdt:${property} ?val .
        SERVICE wikibase:label { bd:serviceParam wikibase:language "fr,en". }
      }
      LIMIT ${limit}
    `;

    try {
      const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`;
      const res = await fetch(url, {
        headers: { "User-Agent": "IQArenaBot/2.0 (open-data knowledge engine)" },
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) return [];
      const json = await res.json();
      const bindings = json?.results?.bindings || [];

      return bindings
        .filter((b: any) => b.item?.value && b.valLabel?.value && b.itemLabel?.value)
        .map((b: any) => {
          const qid = b.item.value.split("/").pop() || "Q0";
          const subLabel = b.itemLabel.value;
          const objVal = b.valLabel.value;
          return {
            source_name: "wikidata" as const,
            statement_id: `wdt:${qid}:${property}:${objVal}`,
            subject_id: qid,
            subject_label: subLabel,
            predicate_id: property,
            predicate_label: property,
            object_value: objVal,
            domain,
            category,
            difficulty: "medium" as const,
            license: "CC0" as const,
            confidence: 0.99,
          };
        });
    } catch {
      return [];
    }
  }
}
