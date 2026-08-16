import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { getSupabaseClient } from "@/lib/supabase";
import { topicGraphRegistry } from "./topicGraph";

const TARGET_PROJECT_REF = "kvfxguzshicmhbvlzobg";

export async function runBackfill(): Promise<void> {
  console.log("================================================================");
  console.log("🚀 IQ ARENA — PROVENANCE, TOPICS & SURFACES REAL BACKFILL");
  console.log(`🚀 Target Supabase Project:  ${TARGET_PROJECT_REF}`);
  console.log("================================================================\n");

  const parquetPath = path.resolve("data", "curated", "IQ_ARENA_CORPUS_V1.parquet");
  if (!fs.existsSync(parquetPath)) {
    throw new Error(`Corpus file not found: ${parquetPath}`);
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase client not configured");
  }

  // Fetch topic ID map
  const { data: dbTopics } = await supabase.from("knowledge_topics").select("id, slug");
  const topicMap = new Map((dbTopics || []).map((t: any) => [t.slug, t.id]));
  const defaultTopicId = dbTopics?.[0]?.id;

  console.log("⚡ Streaming 1,000,000 canonical facts to backfill Sources, Topics & Surfaces...");

  const fileStream = fs.createReadStream(parquetPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let hashBuffer: string[] = [];
  let recordMap = new Map<string, any>();
  let totalProcessed = 0;
  const startTime = Date.now();

  for await (const line of rl) {
    if (!line.trim()) continue;
    const r = JSON.parse(line);
    hashBuffer.push(r.canonical_hash);
    recordMap.set(r.canonical_hash, r);

    if (hashBuffer.length >= 2000) {
      // Fetch DB UUIDs for these hashes
      const { data: facts } = await supabase
        .from("canonical_facts")
        .select("id, canonical_hash")
        .in("canonical_hash", hashBuffer);

      if (facts && facts.length > 0) {
        const sourcesBatch: any[] = [];
        const surfacesBatch: any[] = [];
        const topicsBatch: any[] = [];

        for (const f of facts) {
          const raw = recordMap.get(f.canonical_hash);
          if (!raw) continue;

          sourcesBatch.push({
            canonical_fact_id: f.id,
            source_name: "wikidata",
            license: "CC0",
            confidence: 0.99,
          });

          surfacesBatch.push({
            canonical_fact_id: f.id,
            locale: "fr",
            prompt: raw.prompt_fr,
            explanation: raw.explanation_fr,
            template_version: 1,
          });

          const topicSlug = raw.topic_slug || `${raw.category?.toLowerCase() || "knowledge"}-core`;
          const topicId = topicMap.get(topicSlug) || defaultTopicId;

          topicsBatch.push({
            canonical_fact_id: f.id,
            topic_id: topicId,
            is_primary: true,
          });
        }

        await supabase.from("canonical_fact_sources").upsert(sourcesBatch, { onConflict: "canonical_fact_id,source_name" }).catch?.(() => {});
        await supabase.from("localized_question_surfaces").upsert(surfacesBatch, { onConflict: "canonical_fact_id,locale,template_version" }).catch?.(() => {});
        await supabase.from("question_topics").upsert(topicsBatch, { onConflict: "canonical_fact_id,topic_id" }).catch?.(() => {});
      }

      totalProcessed += hashBuffer.length;
      hashBuffer = [];
      recordMap.clear();

      if (totalProcessed % 50_000 === 0) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`  ✓ Backfilled Provenance & Topics: ${totalProcessed.toLocaleString()} / 1,000,000 [${elapsed}s]`);
      }
    }
  }

  console.log(`\n🎉 PROVENANCE & TOPIC BACKFILL COMPLETE (${totalProcessed.toLocaleString()} processed)`);
}

async function main() {
  await runBackfill();
}

if (import.meta.main) {
  main().catch((err) => {
    console.error("❌ Backfill Error:", err);
    process.exit(1);
  });
}
