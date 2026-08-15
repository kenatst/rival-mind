import { questionFactoryRunner } from "./factoryRunner";
import { wikidataIngestionEngine } from "./wikidataIngestion";

const args = process.argv.slice(2);
const command = args[0] || "run";

function parseFlag(flag: string, defaultValue?: string): string | undefined {
  const match = args.find((a) => a.startsWith(`--${flag}=`));
  if (match) return match.split("=")[1];
  if (args.includes(`--${flag}`)) return "true";
  return defaultValue;
}

async function main() {
  const isDryRun = parseFlag("dry-run") === "true";
  const limit = Number(parseFlag("limit", "1000"));
  const target = Number(parseFlag("target", "1000"));

  console.log(`🏭 ========================================================`);
  console.log(`🏭 IQ ARENA — Industrial Question Factory v1.0`);
  console.log(`🏭 Mode: ${isDryRun ? "🧪 DRY RUN (No state committed)" : "🚀 LIVE EXECUTION"}`);
  console.log(`🏭 Target Limit: ${target || limit}`);
  console.log(`🏭 ========================================================\n`);

  if (command === "ingest") {
    console.log("📥 Running Wikidata Fact Ingestion...");
    const res = wikidataIngestionEngine.runIngestion({ limit, dryRun: isDryRun });
    console.log(`✓ Records Examined: ${res.recordsExamined}`);
    console.log(`✓ Facts Ingested:   ${res.recordsInserted}`);
    console.log(`✓ Facts Skipped:    ${res.recordsSkipped}`);
    console.log(`✅ Ingestion Job ${res.jobId} completed.`);
    return;
  }

  // Default: run complete pipeline
  console.log("⚡ Executing End-to-End Factory Pipeline...");
  const result = questionFactoryRunner.runPipeline({
    target,
    dryRun: isDryRun,
  });

  const { report, verifiedQuestions, auditSample } = result;

  console.log("\n📊 FACTORY PIPELINE RUN REPORT:");
  console.log("────────────────────────────────────────────────────────");
  console.log(`• Facts Ingested:        ${report.factsIngested}`);
  console.log(`• Eligible Facts:        ${report.eligibleFacts}`);
  console.log(`• Candidate Questions:   ${report.candidatesGenerated}`);
  console.log(`• Validation Rejects:    ${report.validationRejects}`);
  console.log(`• Manual Review Needed:  ${report.manualReviewRequired}`);
  console.log(`• Auto-Verified Live:    ${report.autoVerified}`);
  console.log(`• Competitive Candidates:${report.competitiveCandidates}`);
  console.log("────────────────────────────────────────────────────────");

  console.log("\n📚 Category Breakdown:");
  for (const [cat, count] of Object.entries(report.categoryBreakdown)) {
    console.log(`  - ${cat.padEnd(20)}: ${count}`);
  }

  console.log("\n🎯 Difficulty Breakdown:");
  for (const [diff, count] of Object.entries(report.difficultyBreakdown)) {
    console.log(`  - ${diff.padEnd(20)}: ${count}`);
  }

  if (Object.keys(report.rejectionReasons).length > 0) {
    console.log("\n⚠️ Top Rejection Warnings:");
    for (const [reason, count] of Object.entries(report.rejectionReasons).slice(0, 5)) {
      console.log(`  - [${count}] ${reason}`);
    }
  }

  console.log(`\n📁 Audit Sample Exported: factory-audit-sample.json (${auditSample.length} questions)`);
  console.log("✅ Question Factory execution finished successfully.");
}

main().catch((err) => {
  console.error("❌ Fatal Factory Error:", err);
  process.exit(1);
});
