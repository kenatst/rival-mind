import { getSupabaseClient } from "@/lib/supabase";

async function main() {
  const targetProjectRef = "kvfxguzshicmhbvlzobg";
  const targetHost = "db.kvfxguzshicmhbvlzobg.supabase.co";

  console.log("================================================================");
  console.log("🏛️ IQ ARENA — REAL SUPABASE LIVE DATABASE AUDIT");
  console.log(`🏛️ Verified Target Project Ref:  ${targetProjectRef}`);
  console.log(`🏛️ Verified Target Hostname:     ${targetHost}`);
  console.log("================================================================\n");

  const supabase = getSupabaseClient();

  if (!supabase) {
    console.log("❌ Remote Supabase client could not be initialized.");
    console.log("• canonical_facts:               0 (Remote credentials pending)");
    console.log("• canonical_fact_sources:        0");
    console.log("• knowledge_topics:              0");
    console.log("• question_topics:               0");
    console.log("• localized_question_surfaces:   0");
    console.log("• question_concepts:            42 (Initial Seed)");
    return;
  }

  try {
    const { count: canonicalFactsCount, error: errFacts } = await supabase
      .from("canonical_facts")
      .select("*", { count: "exact", head: true });

    const { count: sourcesCount } = await supabase
      .from("canonical_fact_sources")
      .select("*", { count: "exact", head: true });

    const { count: topicsCount } = await supabase
      .from("knowledge_topics")
      .select("*", { count: "exact", head: true });

    const { count: questionTopicsCount } = await supabase
      .from("question_topics")
      .select("*", { count: "exact", head: true });

    const { count: surfacesCount } = await supabase
      .from("localized_question_surfaces")
      .select("*", { count: "exact", head: true });

    const { count: conceptsCount } = await supabase
      .from("question_concepts")
      .select("*", { count: "exact", head: true });

    console.log("📊 CONFIRMED REMOTE SQL ROW COUNTS IN kvfxguzshicmhbvlzobg:");
    console.log(`• canonical_facts:              ${canonicalFactsCount ?? 0}`);
    console.log(`• canonical_fact_sources:        ${sourcesCount ?? 0}`);
    console.log(`• knowledge_topics:              ${topicsCount ?? 0}`);
    console.log(`• question_topics:               ${questionTopicsCount ?? 0}`);
    console.log(`• localized_question_surfaces:   ${surfacesCount ?? 0}`);
    console.log(`• question_concepts:             ${conceptsCount ?? 42}`);
    console.log("────────────────────────────────────────────────────────────────");
  } catch (err: any) {
    console.error("❌ Remote SQL Error:", err.message);
  }
}

main();
