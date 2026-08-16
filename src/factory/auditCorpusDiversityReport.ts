import * as fs from "fs";
import * as path from "path";
import { getSupabaseClient } from "@/lib/supabase";

export async function runDiversityReport(): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase client not configured");

  console.log("================================================================");
  console.log("📊 IQ ARENA — AUTHORITATIVE REAL SOURCED CORPUS AUDIT");
  console.log("================================================================\n");

  const rawPath = path.resolve("data", "raw", "GENUINE_OPEN_DATA_TRIPLES.ndjson");
  const rawTriples: any[] = [];
  if (fs.existsSync(rawPath)) {
    const lines = fs.readFileSync(rawPath, "utf-8").split("\n").filter((l) => l.trim().length > 0);
    for (const l of lines) {
      try {
        rawTriples.push(JSON.parse(l));
      } catch {}
    }
  }

  // Count unique propositions
  const uniquePropositions = new Set<string>();
  const predicateCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();

  for (const t of rawTriples) {
    const key = `${t.subject_id}:${t.predicate_id}:${t.object_value}`.toLowerCase();
    uniquePropositions.add(key);

    const pred = t.predicate_label || t.predicate_id || "UNKNOWN";
    predicateCounts.set(pred, (predicateCounts.get(pred) || 0) + 1);

    const cat = t.category || "General";
    categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
  }

  const { count: totalDbFacts } = await supabase.from("canonical_facts").select("*", { count: "exact", head: true });
  const { count: totalDbSources } = await supabase.from("canonical_fact_sources").select("*", { count: "exact", head: true });

  const sortedPredicates = Array.from(predicateCounts.entries()).sort((a, b) => b[1] - a[1]);
  const sortedCategories = Array.from(categoryCounts.entries()).sort((a, b) => b[1] - a[1]);

  console.log(`REAL UNIQUE SOURCED FACTS:      ${uniquePropositions.size.toLocaleString()} / 1,000,000`);
  console.log(`DATABASE PROVENANCE ROWS:       ${(totalDbSources || 0).toLocaleString()}`);
  console.log(`SOURCE-LESS TECHNICAL ROWS:     ${Math.max(0, (totalDbFacts || 0) - (totalDbSources || 0)).toLocaleString()}`);
  console.log(`QUALIFIED RESERVE HARVESTED:    ${rawTriples.length.toLocaleString()}\n`);

  console.log("TOP PREDICATES (DIVERSITY AUDIT):");
  for (const [pred, cnt] of sortedPredicates.slice(0, 10)) {
    const pct = ((cnt / (rawTriples.length || 1)) * 100).toFixed(1);
    console.log(`  • ${pred.padEnd(25)} ${cnt.toLocaleString().padStart(8)} (${pct}%)`);
  }

  console.log("\nTOP CATEGORIES:");
  for (const [cat, cnt] of sortedCategories.slice(0, 10)) {
    const pct = ((cnt / (rawTriples.length || 1)) * 100).toFixed(1);
    console.log(`  • ${cat.padEnd(25)} ${cnt.toLocaleString().padStart(8)} (${pct}%)`);
  }

  console.log("────────────────────────────────────────────────────────────────\n");
}

async function main() {
  await runDiversityReport();
}

if (import.meta.main) {
  main().catch(console.error);
}
