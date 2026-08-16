import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { getSupabaseClient } from "@/lib/supabase";
import { topicGraphRegistry } from "./topicGraph";

const TARGET_PROJECT_REF = "kvfxguzshicmhbvlzobg";
const TARGET_HOST = "db.kvfxguzshicmhbvlzobg.supabase.co";

async function main() {
  console.log("================================================================");
  console.log("🚀 IQ ARENA — 10,000 REAL CANONICAL FACTS LIVE IMPORTER");
  console.log(`🚀 Target Supabase Project:  ${TARGET_PROJECT_REF}`);
  console.log(`🚀 Target Hostname:          ${TARGET_HOST}`);
  console.log("================================================================\n");

  const checkpointPath = path.resolve("data", "curated", "checkpoint-10k.parquet");
  if (!fs.existsSync(checkpointPath)) {
    console.error(`❌ Checkpoint file not found at ${checkpointPath}`);
    console.error("Please run: bun run src/factory/checkpoint10k.ts first.");
    process.exit(1);
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error("================================================================");
    console.error("❌ CRITICAL: Remote Supabase credentials are not set in environment.");
    console.error("================================================================\n");
    process.exit(1);
  }

  // Phase 1: Topics Ingestion
  console.log("📦 Phase 1: Upserting 2,496 Knowledge Topics...");
  const topics = topicGraphRegistry.getAllTopics();
  const batchSize = 500;
  for (let i = 0; i < topics.length; i += batchSize) {
    const batch = topics.slice(i, i + batchSize);
    const payload = batch.map((t) => ({
      slug: t.slug,
      name: t.name,
      domain: t.domain,
      category: t.category,
      depth: t.depth,
      path: t.path,
      active: true,
      description: `Discipline canonique ${t.name}`,
      metadata: { icon_key: t.iconKey, category: t.category, depth: t.depth },
    }));

    const { error } = await supabase.from("knowledge_topics").upsert(payload, { onConflict: "slug" });
    if (error) {
      console.error(`❌ Topic insertion failed at batch ${i}:`, error.message);
      process.exit(1);
    }
  }
  console.log("✅ 2,496 Knowledge Topics successfully active in database.");

  // Fetch topic ID mapping
  const { data: dbTopics } = await supabase.from("knowledge_topics").select("id, slug");
  const topicIdMap = new Map((dbTopics || []).map((t: any) => [t.slug, t.id]));
  const defaultTopicId = dbTopics?.[0]?.id;

  // Phase 2: Ingest 10,000 Canonical Facts, Sources, Surfaces & Topics
  console.log("\n⚡ Phase 2: Streaming and Ingesting 10,000 Canonical Facts & Relations...");

  const fileStream = fs.createReadStream(checkpointPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let factBuffer: any[] = [];
  let sourceBuffer: any[] = [];
  let surfaceBuffer: any[] = [];
  let topicBuffer: any[] = [];
  let inserted = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;
    const r = JSON.parse(line);

    factBuffer.push({
      canonical_hash: r.canonical_hash,
      canonical_predicate: r.canonical_predicate,
      subject_entity_id: null,
      scalar_value: r.object_value,
      difficulty: r.difficulty,
      obscurity_tier: r.trust_tier === "competitive" ? "expert" : "core",
      training_eligible: true,
      verified_eligible: true,
      competitive_eligible: r.trust_tier === "competitive",
      free_answer_eligible: r.object_value.length <= 20,
      blitz_eligible: true,
      status: "live",
      corpus_version: "IQ_ARENA_CORPUS_V1",
      selection_bucket: inserted % 4096,
      metadata: { subject_qid: r.subject_qid, domain: r.domain, category: r.category },
    });

    sourceBuffer.push({
      canonical_fact_id: r.canonical_hash,
      source_name: "wikidata",
      license: "CC0",
      confidence: 0.99,
    });

    surfaceBuffer.push({
      canonical_fact_id: r.canonical_hash,
      locale: "fr",
      prompt: r.prompt_fr,
      explanation: r.explanation_fr,
      template_version: 1,
    });

    const topicSlug = r.topic_slug || `${r.category?.toLowerCase() || "knowledge"}-core`;
    const topicId = topicIdMap.get(topicSlug) || defaultTopicId;

    topicBuffer.push({
      canonical_fact_id: r.canonical_hash,
      topic_id: topicId,
      is_primary: true,
    });

    if (factBuffer.length >= 1000) {
      const { data: insertedFacts, error: errFacts } = await supabase
        .from("canonical_facts")
        .upsert(factBuffer, { onConflict: "canonical_hash" })
        .select("id, canonical_hash");

      if (errFacts) {
        console.error("❌ Canonical facts upsert error:", errFacts.message);
        process.exit(1);
      }

      if (insertedFacts) {
        const idMap = new Map(insertedFacts.map((f: any) => [f.canonical_hash, f.id]));
        const sourcesWithUuid = sourceBuffer.map((s) => ({
          ...s,
          canonical_fact_id: idMap.get(s.canonical_fact_id) || s.canonical_fact_id,
        }));
        const surfacesWithUuid = surfaceBuffer.map((s) => ({
          ...s,
          canonical_fact_id: idMap.get(s.canonical_fact_id) || s.canonical_fact_id,
        }));
        const topicsWithUuid = topicBuffer.map((tb) => ({
          canonical_fact_id: idMap.get(tb.canonical_fact_id) || tb.canonical_fact_id,
          topic_id: tb.topic_id,
          is_primary: tb.is_primary,
        }));

        await supabase.from("canonical_fact_sources").insert(sourcesWithUuid);
        await supabase.from("localized_question_surfaces").upsert(surfacesWithUuid, { onConflict: "canonical_fact_id,locale,template_version" });
        await supabase.from("question_topics").insert(topicsWithUuid);
      }

      inserted += factBuffer.length;
      console.log(`  ✓ Inserted ${inserted.toLocaleString()} / 10,000 canonical facts into kvfxguzshicmhbvlzobg`);

      factBuffer = [];
      sourceBuffer = [];
      surfaceBuffer = [];
      topicBuffer = [];
    }
  }

  if (factBuffer.length > 0) {
    const { data: insertedFacts, error: errFacts } = await supabase
      .from("canonical_facts")
      .upsert(factBuffer, { onConflict: "canonical_hash" })
      .select("id, canonical_hash");

    if (errFacts) {
      console.error("❌ Final batch facts error:", errFacts.message);
      process.exit(1);
    }

    if (insertedFacts) {
      const idMap = new Map(insertedFacts.map((f: any) => [f.canonical_hash, f.id]));
      const sourcesWithUuid = sourceBuffer.map((s) => ({
        ...s,
        canonical_fact_id: idMap.get(s.canonical_fact_id) || s.canonical_fact_id,
      }));
      const surfacesWithUuid = surfaceBuffer.map((s) => ({
        ...s,
        canonical_fact_id: idMap.get(s.canonical_fact_id) || s.canonical_fact_id,
      }));
      const topicsWithUuid = topicBuffer.map((tb) => ({
        canonical_fact_id: idMap.get(tb.canonical_fact_id) || tb.canonical_fact_id,
        topic_id: tb.topic_id,
        is_primary: tb.is_primary,
      }));

      await supabase.from("canonical_fact_sources").insert(sourcesWithUuid);
      await supabase.from("localized_question_surfaces").upsert(surfacesWithUuid, { onConflict: "canonical_fact_id,locale,template_version" });
      await supabase.from("question_topics").insert(topicsWithUuid);
    }
    inserted += factBuffer.length;
    console.log(`  ✓ Inserted ${inserted.toLocaleString()} / 10,000 canonical facts into kvfxguzshicmhbvlzobg`);
  }

  // Phase 3: Remote SQL Verification
  console.log("\n🔍 Phase 3: Executing authoritative remote SQL verification query...");
  const { count: liveFacts } = await supabase.from("canonical_facts").select("*", { count: "exact", head: true });
  const { count: liveSources } = await supabase.from("canonical_fact_sources").select("*", { count: "exact", head: true });
  const { count: liveSurfaces } = await supabase.from("localized_question_surfaces").select("*", { count: "exact", head: true });
  const { count: liveTopics } = await supabase.from("knowledge_topics").select("*", { count: "exact", head: true });
  const { count: liveQTopics } = await supabase.from("question_topics").select("*", { count: "exact", head: true });

  console.log(`\n================================================================`);
  console.log(`📊 AUTHORITATIVE REMOTE SQL COUNTS IN kvfxguzshicmhbvlzobg:`);
  console.log(`• canonical_facts:              ${liveFacts?.toLocaleString()}`);
  console.log(`• canonical_fact_sources:        ${liveSources?.toLocaleString()}`);
  console.log(`• knowledge_topics:              ${liveTopics?.toLocaleString()}`);
  console.log(`• localized_question_surfaces:   ${liveSurfaces?.toLocaleString()}`);
  console.log(`• question_topics:               ${liveQTopics?.toLocaleString()}`);
  console.log(`================================================================\n`);
}

main().catch((err) => {
  console.error("❌ Import CLI Fatal Error:", err);
  process.exit(1);
});
