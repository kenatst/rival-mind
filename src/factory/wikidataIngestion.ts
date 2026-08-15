import { IngestedFact } from "./types";
import { RAW_WIKIDATA_FACTS } from "./wikidataCorpus";

export interface IngestionOptions {
  limit?: number | undefined;
  source?: string | undefined;
  dryRun?: boolean | undefined;
}

export interface IngestionResult {
  jobId: string;
  source: string;
  recordsExamined: number;
  recordsInserted: number;
  recordsSkipped: number;
  recordsFailed: number;
  facts: IngestedFact[];
  warnings: string[];
}

export class WikidataIngestionEngine {
  private ingestedFacts: Map<string, IngestedFact> = new Map();

  constructor() {
    // Initialize with corpus
    this.seedCorpus();
  }

  private seedCorpus() {
    for (const fact of RAW_WIKIDATA_FACTS) {
      this.ingestedFacts.set(fact.factId, fact);
    }
  }

  /**
   * Runs an idempotent ingestion job with limit and dry-run options.
   */
  public runIngestion(options: IngestionOptions = {}): IngestionResult {
    const limit = options.limit || 2000;
    const isDryRun = Boolean(options.dryRun);
    const jobId = "ingest-job-" + Math.random().toString(36).substring(2, 10);

    const examined = RAW_WIKIDATA_FACTS.slice(0, limit);
    const resultFacts: IngestedFact[] = [];
    const warnings: string[] = [];
    let inserted = 0;
    let skipped = 0;

    for (const f of examined) {
      // Validate fact integrity
      if (!f.subject || !f.predicate || !f.objectValue) {
        skipped++;
        warnings.push(`Skipped malformed fact: ID ${f.factId}`);
        continue;
      }

      if (!isDryRun) {
        this.ingestedFacts.set(f.factId, f);
      }

      resultFacts.push(f);
      inserted++;
    }

    return {
      jobId,
      source: "wikidata-curated-whitelist",
      recordsExamined: examined.length,
      recordsInserted: inserted,
      recordsSkipped: skipped,
      recordsFailed: 0,
      facts: resultFacts,
      warnings,
    };
  }

  public getAllFacts(): IngestedFact[] {
    return Array.from(this.ingestedFacts.values());
  }

  public getFactById(factId: string): IngestedFact | undefined {
    return this.ingestedFacts.get(factId);
  }
}

export const wikidataIngestionEngine = new WikidataIngestionEngine();
