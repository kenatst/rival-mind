import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

export interface GenuineFact {
  canonical_hash: string;
  canonical_predicate: string;
  subject_qid: string;
  predicate_pid: string;
  object_value: string;
  domain: string;
  category: string;
  topic_slug: string;
  difficulty: "easy" | "medium" | "hard";
  trust_tier: "verified" | "competitive";
  source_statement_id: string;
  license: string;
  confidence: number;
  prompt_fr: string;
  explanation_fr: string;
}

export class GenuineMillionBuilder {
  private outputDir = path.resolve("data", "curated");
  private rawDir = path.resolve("data", "raw");

  constructor() {
    if (!fs.existsSync(this.outputDir)) fs.mkdirSync(this.outputDir, { recursive: true });
    if (!fs.existsSync(this.rawDir)) fs.mkdirSync(this.rawDir, { recursive: true });
  }

  public generateGenuineHash(source: string, qid: string, pid: string, val: string): string {
    return crypto
      .createHash("sha256")
      .update(`source:${source}|subject:${qid}|predicate:${pid}|object:${val.trim().toLowerCase()}`)
      .digest("hex");
  }
}
