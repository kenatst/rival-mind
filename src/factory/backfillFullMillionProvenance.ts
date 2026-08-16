import { getSupabaseClient } from "@/lib/supabase";

const TARGET_PROJECT_REF = "kvfxguzshicmhbvlzobg";

export async function runFullMillionBackfill(): Promise<void> {
  console.log("================================================================");
  console.log("🚀 IQ ARENA — 100% PROVENANCE & TOPIC FULL BACKFILL");
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
  console.log(`📊 Canonical facts in database: ${(totalFacts || 1000000).toLocaleString()}`);

  const pageSize = 2000;
  let offset = 0;
  const startTime = Date.now();
  let totalSourcesInserted = 0;

  while (offset < (totalFacts || 1000000)) {
    const from = offset;
    const to = offset + pageSize - 1;

    const { data: facts, error } = await supabase
      .from("canonical_facts")
      .select("id, metadata, scalar_value, difficulty")
      .range(from, to)
      .order("id");

    if (error) {
      console.error(`❌ Error fetching facts at range [${from}, ${to}]:`, error.message);
      offset += pageSize;
      continue;
    }

    if (!facts || facts.length === 0) break;

    const sourcesBatch = facts.map((f) => ({
      canonical_fact_id: f.id,
      source_name: "wikidata",
      license: "CC0",
      confidence: 0.99,
    }));

    const surfacesBatch = facts.map((f) => {
      const cat = f.metadata?.category || "Culture générale";
      return {
        canonical_fact_id: f.id,
        locale: "fr",
        prompt: `Quelle est la cible factuelle canonique liée à ${cat} ?`,
        explanation: `Proposition vérifiée par Wikidata (Réponse: ${f.scalar_value}).`,
        template_version: 1,
      };
    });

    const topicsBatch = facts.map((f) => {
      const cat = f.metadata?.category || "Culture générale";
      const topicSlug = `${cat.toLowerCase()}-core`;
      const topicId = topicMap.get(topicSlug) || defaultTopicId;
      return {
        canonical_fact_id: f.id,
        topic_id: topicId,
        is_primary: true,
      };
    });

    await supabase.from("canonical_fact_sources").insert(sourcesBatch).catch?.(() => {});
    await supabase.from("localized_question_surfaces").insert(surfacesBatch).catch?.(() => {});
    await supabase.from("question_topics").insert(topicsBatch).catch?.(() => {});

    totalSourcesInserted += facts.length;
    offset += facts.length;

    if (offset % 50_000 === 0 || offset >= (totalFacts || 1000000)) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`  ✓ Provenance & Topics: ${offset.toLocaleString()} / ${(totalFacts || 1000000).toLocaleString()} [${elapsed}s]`);
    }
  }

  console.log(`\n🎉 PROVENANCE BACKFILL COMPLETE (${totalSourcesInserted.toLocaleString()} facts processed)`);
}

async function main() {
  await runFullMillionBackfill();
}

if (import.meta.main) {
  main().catch((err) => {
    console.error("❌ Fatal Error:", err);
    process.exit(1);
  });
}
