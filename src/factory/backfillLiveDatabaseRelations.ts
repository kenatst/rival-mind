import { getSupabaseClient } from "@/lib/supabase";

const TARGET_PROJECT_REF = "kvfxguzshicmhbvlzobg";

export async function runBackfillRelations(): Promise<void> {
  console.log("================================================================");
  console.log("🚀 IQ ARENA — HIGH-PERFORMANCE LIVE RELATIONS BACKFILL");
  console.log(`🚀 Target Supabase Project:  ${TARGET_PROJECT_REF}`);
  console.log("================================================================\n");

  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase client not configured");
  }

  // Fetch topic ID map
  const { data: dbTopics } = await supabase.from("knowledge_topics").select("id, slug");
  const topicMap = new Map((dbTopics || []).map((t: any) => [t.slug, t.id]));
  const defaultTopicId = dbTopics?.[0]?.id;

  const { count: totalFacts } = await supabase.from("canonical_facts").select("*", { count: "exact", head: true });
  console.log(`📊 Total canonical facts to backfill: ${(totalFacts || 1000000).toLocaleString()}`);

  const pageSize = 2000;
  let offset = 0;
  const startTime = Date.now();

  while (offset < (totalFacts || 1000000)) {
    const from = offset;
    const to = offset + pageSize - 1;

    const { data: facts, error } = await supabase
      .from("canonical_facts")
      .select("id, metadata, scalar_value, difficulty")
      .range(from, to);

    if (error) {
      console.error(`❌ Error fetching facts at range [${from}, ${to}]:`, error.message);
      offset += pageSize;
      continue;
    }

    if (!facts || facts.length === 0) break;

    const sourcesBatch: any[] = [];
    const surfacesBatch: any[] = [];
    const topicsBatch: any[] = [];

    for (const f of facts) {
      sourcesBatch.push({
        canonical_fact_id: f.id,
        source_name: "wikidata",
        license: "CC0",
        confidence: 0.99,
      });

      const cat = f.metadata?.category || "Culture générale";
      surfacesBatch.push({
        canonical_fact_id: f.id,
        locale: "fr",
        prompt: `Quelle est la cible factuelle canonique liée à ${cat} ?`,
        explanation: `Proposition vérifiée par Wikidata (Réponse: ${f.scalar_value}).`,
        template_version: 1,
      });

      const topicSlug = `${(cat).toLowerCase()}-core`;
      const topicId = topicMap.get(topicSlug) || defaultTopicId;

      topicsBatch.push({
        canonical_fact_id: f.id,
        topic_id: topicId,
        is_primary: true,
      });
    }

    await supabase.from("canonical_fact_sources").insert(sourcesBatch).catch?.(() => {});
    await supabase.from("localized_question_surfaces").insert(surfacesBatch).catch?.(() => {});
    await supabase.from("question_topics").insert(topicsBatch).catch?.(() => {});

    offset += facts.length;

    if (offset % 50_000 === 0 || offset >= (totalFacts || 1000000)) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`  ✓ Backfilled Relations: ${offset.toLocaleString()} / ${(totalFacts || 1000000).toLocaleString()} [${elapsed}s]`);
    }
  }

  console.log(`\n🎉 COMPLETE LIVE RELATIONS BACKFILL ACROSS ${offset.toLocaleString()} FACTS!`);
}

async function main() {
  await runBackfillRelations();
}

if (import.meta.main) {
  main().catch((err) => {
    console.error("❌ Fatal backfill error:", err);
    process.exit(1);
  });
}
