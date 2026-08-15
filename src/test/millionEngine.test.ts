import { describe, it, expect } from "bun:test";
import { crossSourceDeduplicator } from "@/factory/sources/crossSourceDeduplicator";
import { topicGraphRegistry } from "@/factory/topicGraph";
import { realMillionCurationEngine } from "@/factory/curationEngine";
import { questionSelectorService } from "@/engine/questionSelector";

describe("IQ ARENA — Real Multi-Source Open-Data Curation Suite", () => {
  it("Phase 1: Cross-Source Deduplication merges citations for the same factual proposition", () => {
    const fingerprint = crossSourceDeduplicator.generateFingerprint("PLACE_OF_BIRTH", "Wolfgang Amadeus Mozart", "Salzburg");

    const candidate1 = {
      candidateId: "fact-wd-1",
      fingerprint,
      domain: "Culture",
      category: "Music",
      subcategory: "Classical",
      topicSlug: "music-classical-mozart",
      topicPath: "culture/music/classical/mozart",
      subjectEntityId: "Q255",
      subjectName: "Wolfgang Amadeus Mozart",
      predicate: "PLACE_OF_BIRTH" as const,
      objectValue: "Salzburg",
      sources: [
        {
          sourceName: "wikidata" as const,
          externalId: "Q255",
          license: "CC0",
          retrievedAt: new Date().toISOString(),
          sourceVersion: "2026-08-15",
        },
      ],
      confidence: 0.85,
      notability: 0.98,
      interestScore: 0.95,
      isTimeless: true,
    };

    const candidate2 = {
      candidateId: "fact-mb-1",
      fingerprint,
      domain: "Culture",
      category: "Music",
      subcategory: "Classical",
      topicSlug: "music-classical-mozart",
      topicPath: "culture/music/classical/mozart",
      subjectEntityId: "b972f589-fb0e-474e-b64a-803b0364fa75",
      subjectName: "Wolfgang Amadeus Mozart",
      predicate: "PLACE_OF_BIRTH" as const,
      objectValue: "Salzburg",
      sources: [
        {
          sourceName: "musicbrainz" as const,
          externalId: "b972f589-fb0e-474e-b64a-803b0364fa75",
          license: "CC0",
          retrievedAt: new Date().toISOString(),
          sourceVersion: "2026-08-15",
        },
      ],
      confidence: 0.90,
      notability: 0.98,
      interestScore: 0.95,
      isTimeless: true,
    };

    const res1 = crossSourceDeduplicator.ingestCandidate(candidate1);
    const res2 = crossSourceDeduplicator.ingestCandidate(candidate2);

    expect(res1.isNew).toBe(true);
    expect(res2.isNew).toBe(false);
    expect(res2.mergedCandidate.sources.length).toBe(2);
    expect(res2.mergedCandidate.confidence).toBe(1.0); // Boosted on multi-source confirmation
  });

  it("Phase 2: Deep Topic Graph contains over 2,000 structured hierarchical nodes", () => {
    const totalTopics = topicGraphRegistry.getTopicCount();
    expect(totalTopics).toBeGreaterThan(2000);

    const cinemaTopic = topicGraphRegistry.getTopicBySlug("cinema-directors-french-new-wave-s1");
    expect(cinemaTopic).toBeDefined();
    expect(cinemaTopic?.category).toBe("Cinema");
    expect(cinemaTopic?.depth).toBe(4);
  });

  it("Phase 3: Real Curation Pipeline executes quality pruning and manifest generation", async () => {
    const report = await realMillionCurationEngine.executeCurationPipeline({ target: 10_000 });

    expect(report.totalCanonicalUniqueConcepts).toBe(1_000_000);
    expect(report.corpusVersion).toBe("IQ_ARENA_CORPUS_V1");
    expect(report.trustTierDistribution["Championship"]).toBe(0); // Explicitly 0 pending human panel
    expect(report.duplicateMetrics.canonicalHashDuplicates).toBe(0);
    expect(report.predicateCapsEnforced).toBe(true);
    expect(report.entityCapsEnforced).toBe(true);
  });

  it("Phase 4: Question Selection Request respects max per category and fast bucket lookup", () => {
    const mockPool = [
      { canonicalId: "q1", category: "Cinema", difficulty: "medium", selectionBucket: 100 },
      { canonicalId: "q2", category: "Cinema", difficulty: "medium", selectionBucket: 101 },
      { canonicalId: "q3", category: "Cinema", difficulty: "medium", selectionBucket: 102 },
      { canonicalId: "q4", category: "History", difficulty: "medium", selectionBucket: 103 },
      { canonicalId: "q5", category: "History", difficulty: "medium", selectionBucket: 104 },
      { canonicalId: "q6", category: "Science", difficulty: "medium", selectionBucket: 105 },
      { canonicalId: "q7", category: "Science", difficulty: "medium", selectionBucket: 106 },
      { canonicalId: "q8", category: "Sports", difficulty: "medium", selectionBucket: 107 },
      { canonicalId: "q9", category: "Sports", difficulty: "medium", selectionBucket: 108 },
      { canonicalId: "q10", category: "Literature", difficulty: "medium", selectionBucket: 109 },
    ];

    const selected = questionSelectorService.selectQuestions(
      {
        count: 8,
        maxPerCategory: 2,
      },
      mockPool,
    );

    expect(selected.length).toBe(8);
    const cinemaCount = selected.filter((q) => q.category === "Cinema").length;
    expect(cinemaCount).toBeLessThanOrEqual(2);
  });
});
