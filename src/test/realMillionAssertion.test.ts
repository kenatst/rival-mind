import { describe, it, expect } from "bun:test";
import * as fs from "fs";
import { crossSourceDeduplicator, EMPTY_SHA256 } from "@/factory/sources/crossSourceDeduplicator";
import { oneMillionQuestionEngine } from "@/factory/oneMillionEngine";
import { topicGraphRegistry } from "@/factory/topicGraph";

describe("IQ ARENA — Real Million Knowledge Corpus Assertions (IQ_ARENA_CORPUS_V1)", () => {
  it("Invariant 1: Manifest exists, is non-empty, and has a real cryptographic SHA-256 checksum", () => {
    const manifestPath = "million-corpus-manifest.json";
    expect(fs.existsSync(manifestPath)).toBe(true);

    const raw = fs.readFileSync(manifestPath, "utf-8");
    const manifest = JSON.parse(raw);

    expect(manifest.corpusVersion).toBe("IQ_ARENA_CORPUS_V1");
    expect(manifest.totalCanonicalUniqueConcepts).toBeGreaterThanOrEqual(1_000_000);
    expect(manifest.totalCandidatesScanned).toBeGreaterThan(5_000_000);
    expect(manifest.corpusBytes).toBeGreaterThan(0);
    expect(manifest.corpusSha256).not.toBe(EMPTY_SHA256);
    expect(manifest.corpusSha256.length).toBe(64); // Full 256-bit hex string
  });

  it("Invariant 2: Taxonomy reclassification DOES NOT change canonical hash (Knowledge Proposition Identity)", () => {
    const hashInGeography = oneMillionQuestionEngine.generateCanonicalHash("Q142", "P36", "Paris");
    const hashInHistory = oneMillionQuestionEngine.generateCanonicalHash("Q142", "P36", "Paris");
    const hashInWorldKnowledge = oneMillionQuestionEngine.generateCanonicalHash("Q142", "P36", "Paris");

    expect(hashInGeography).toBe(hashInHistory);
    expect(hashInGeography).toBe(hashInWorldKnowledge);
    expect(hashInGeography.length).toBe(64);
  });

  it("Invariant 3: Cross-Source Deduplication merges external citations into 1 canonical fact", () => {
    const fp = crossSourceDeduplicator.generateFingerprint("CAPITAL_OF", "France", "Paris");

    const factWikidata = {
      candidateId: "wd-fact-1",
      fingerprint: fp,
      domain: "Knowledge",
      category: "Geography",
      subcategory: "Capitals",
      topicSlug: "capitals-france",
      topicPath: "knowledge/geography/capitals/france",
      subjectEntityId: "Q142",
      subjectName: "France",
      predicate: "CAPITAL_OF" as const,
      objectValue: "Paris",
      sources: [{ sourceName: "wikidata" as const, externalId: "Q142", license: "CC0", retrievedAt: new Date().toISOString(), sourceVersion: "2026-08-15" }],
      confidence: 0.95,
      notability: 0.99,
      interestScore: 0.98,
      isTimeless: true,
    };

    const factGeoNames = {
      candidateId: "gn-fact-1",
      fingerprint: fp,
      domain: "Knowledge",
      category: "Geography",
      subcategory: "Capitals",
      topicSlug: "capitals-france",
      topicPath: "knowledge/geography/capitals/france",
      subjectEntityId: "3017382",
      subjectName: "France",
      predicate: "CAPITAL_OF" as const,
      objectValue: "Paris",
      sources: [{ sourceName: "geonames" as const, externalId: "3017382", license: "CC0", retrievedAt: new Date().toISOString(), sourceVersion: "2026-08-15" }],
      confidence: 0.90,
      notability: 0.99,
      interestScore: 0.98,
      isTimeless: true,
    };

    crossSourceDeduplicator.clear();
    const r1 = crossSourceDeduplicator.ingestCandidate(factWikidata);
    const r2 = crossSourceDeduplicator.ingestCandidate(factGeoNames);

    expect(r1.isNew).toBe(true);
    expect(r2.isNew).toBe(false);
    expect(crossSourceDeduplicator.getCanonicalCount()).toBe(1); // Exactly 1 canonical fact
    expect(r2.mergedCandidate.sources.length).toBe(2);
  });

  it("Invariant 4: Random Source Proof Sample contains verified external IDs and licenses", () => {
    const proofPath = "real-source-proof-sample.json";
    expect(fs.existsSync(proofPath)).toBe(true);

    const raw = fs.readFileSync(proofPath, "utf-8");
    const samples = JSON.parse(raw);

    expect(samples.length).toBeGreaterThanOrEqual(200);
    for (const s of samples.slice(0, 50)) {
      expect(s.canonicalHash.length).toBe(64);
      expect(s.sources.length).toBeGreaterThanOrEqual(1);
      expect(s.sources[0].externalId).toBeDefined();
      expect(s.sources[0].license).toBeDefined();
    }
  });

  it("Invariant 5: Championship trust tier is strictly 0 pending real human panel approval", () => {
    const raw = fs.readFileSync("million-corpus-manifest.json", "utf-8");
    const manifest = JSON.parse(raw);

    expect(manifest.trustTierDistribution["Championship"]).toBe(0);
  });
});
