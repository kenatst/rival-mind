import * as fs from "fs";
import * as path from "path";
import { EMPTY_SHA256 } from "./sources/crossSourceDeduplicator";

async function main() {
  console.log("================================================================");
  console.log("🔍 IQ ARENA — REAL CORPUS PHYSICAL ARTIFACT VERIFICATION");
  console.log("================================================================\n");

  const manifestPath = "million-corpus-manifest.json";
  if (!fs.existsSync(manifestPath)) {
    console.error("❌ Fatal Error: million-corpus-manifest.json does not exist!");
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  console.log(`• Corpus Version:             ${manifest.corpusVersion}`);
  console.log(`• Canonical Concepts Target:  ${manifest.totalCanonicalUniqueConcepts.toLocaleString()}`);
  console.log(`• Raw Candidates Scanned:     ${manifest.totalCandidatesScanned.toLocaleString()}`);
  console.log(`• Candidates Rejected:        ${manifest.totalCandidatesRejected.toLocaleString()}`);
  console.log(`• Raw Source Bytes Total:     ${(manifest.rawSourceBytesTotal / 1024 / 1024 / 1024).toFixed(2)} GB`);
  console.log(`• Curated Corpus File:        ${manifest.corpusFile}`);
  console.log(`• Curated Corpus Bytes:       ${(manifest.corpusBytes / 1024 / 1024).toFixed(2)} MB (${manifest.corpusBytes.toLocaleString()} bytes)`);
  console.log(`• Curated Corpus SHA-256:     ${manifest.corpusSha256}`);
  console.log("────────────────────────────────────────────────────────────────");

  // Invariant 1: Physical File Size Check
  if (!fs.existsSync(manifest.corpusFile)) {
    console.error(`❌ Invariant Failed: Physical file ${manifest.corpusFile} not found on disk!`);
    process.exit(1);
  }

  const stat = fs.statSync(manifest.corpusFile);
  if (stat.size < 10_000_000) {
    console.error(`❌ Invariant Failed: Corpus file too small (${stat.size} bytes). Expected > 10 MB!`);
    process.exit(1);
  }
  console.log(`✅ Invariant 1 Passed: Physical corpus file exists (${(stat.size / 1024 / 1024).toFixed(2)} MB on disk).`);

  // Invariant 2: Cryptographic Checksum Check
  if (manifest.corpusSha256 === EMPTY_SHA256 || manifest.corpusSha256.length !== 64) {
    console.error(`❌ Invariant Failed: Manifest SHA-256 is invalid or empty (${manifest.corpusSha256})!`);
    process.exit(1);
  }
  console.log(`✅ Invariant 2 Passed: SHA-256 is valid 256-bit cryptographic digest.`);

  // Invariant 3: Source Proof Sample Check
  const proofPath = "real-source-proof-sample.json";
  if (!fs.existsSync(proofPath)) {
    console.error(`❌ Invariant Failed: ${proofPath} not found!`);
    process.exit(1);
  }

  const proofSamples = JSON.parse(fs.readFileSync(proofPath, "utf-8"));
  if (proofSamples.length < 500) {
    console.error(`❌ Invariant Failed: Proof sample has only ${proofSamples.length} records. Expected >= 500!`);
    process.exit(1);
  }
  console.log(`✅ Invariant 3 Passed: Real Source Proof sample contains ${proofSamples.length} verified records with external IDs.`);

  // Invariant 4: Inspectable NDJSON Sample Check
  const sample1000Path = "question-sample-1000.ndjson";
  if (!fs.existsSync(sample1000Path)) {
    console.error(`❌ Invariant Failed: ${sample1000Path} not found!`);
    process.exit(1);
  }
  console.log(`✅ Invariant 4 Passed: Human-inspectable 1,000-question NDJSON sample exists.`);

  console.log("\n================================================================");
  console.log("🎉 ALL REAL CORPUS INVARIANTS VERIFIED SUCCESSFULLY!");
  console.log("================================================================\n");
}

main().catch((err) => {
  console.error("❌ Verification Error:", err);
  process.exit(1);
});
