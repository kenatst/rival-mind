import { getSupabaseClient } from "@/lib/supabase";

async function main() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase client not configured");
  }

  console.log("================================================================");
  console.log("🏛️ AUTHORITATIVE REMOTE SQL AUDIT — 1,000,000 CORPUS");
  console.log("🏛️ Target Project:  kvfxguzshicmhbvlzobg");
  console.log("🏛️ Target Hostname: db.kvfxguzshicmhbvlzobg.supabase.co");
  console.log("================================================================\n");

  const { count: totalFacts } = await supabase.from("canonical_facts").select("*", { count: "exact", head: true });
  const { count: totalSources } = await supabase.from("canonical_fact_sources").select("*", { count: "exact", head: true });
  const { count: totalTopics } = await supabase.from("knowledge_topics").select("*", { count: "exact", head: true });
  const { count: totalQTopics } = await supabase.from("question_topics").select("*", { count: "exact", head: true });
  const { count: totalSurfaces } = await supabase.from("localized_question_surfaces").select("*", { count: "exact", head: true });
  const { count: totalConcepts } = await supabase.from("question_concepts").select("*", { count: "exact", head: true });

  // Sample check for source-less facts
  const { data: sampleFacts } = await supabase.from("canonical_facts").select("id").limit(100);
  let sourcelessInSample = 0;
  let topiclessInSample = 0;

  if (sampleFacts) {
    for (const f of sampleFacts) {
      const { count: srcCount } = await supabase.from("canonical_fact_sources").select("*", { count: "exact", head: true }).eq("canonical_fact_id", f.id);
      if (!srcCount || srcCount === 0) sourcelessInSample++;

      const { count: topCount } = await supabase.from("question_topics").select("*", { count: "exact", head: true }).eq("canonical_fact_id", f.id);
      if (!topCount || topCount === 0) topiclessInSample++;
    }
  }

  console.log("📊 CONFIRMED AUTHORITATIVE REMOTE SQL ROW COUNTS:");
  console.log(`• canonical_facts:              ${totalFacts?.toLocaleString()}`);
  console.log(`• canonical_fact_sources:        ${totalSources?.toLocaleString()}`);
  console.log(`• knowledge_topics:              ${totalTopics?.toLocaleString()}`);
  console.log(`• question_topics:               ${totalQTopics?.toLocaleString()}`);
  console.log(`• localized_question_surfaces:   ${totalSurfaces?.toLocaleString()}`);
  console.log(`• question_concepts:             ${totalConcepts?.toLocaleString()}`);
  console.log("────────────────────────────────────────────────────────────────");
  console.log(`• Source-less facts (in audit sample): ${sourcelessInSample} / 100`);
  console.log(`• Topic-less facts (in audit sample):  ${topiclessInSample} / 100`);
  console.log("================================================================\n");
}

main().catch(console.error);
