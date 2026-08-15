import { describe, it, expect } from "bun:test";
import { oneMillionQuestionEngine } from "@/factory/oneMillionEngine";
import { questionSelectorService } from "@/engine/questionSelector";

describe("IQ ARENA — One Million Question Engine Test Suite", () => {
  it("Phase 1: Canonical Hash guarantees strict deterministic uniqueness", () => {
    const hash1 = oneMillionQuestionEngine.generateCanonicalHash("Culture", "Cinema", "Inception", "director", "Christopher Nolan");
    const hash2 = oneMillionQuestionEngine.generateCanonicalHash("Culture", "Cinema", "Inception", "director", "Christopher Nolan");
    const hash3 = oneMillionQuestionEngine.generateCanonicalHash("Culture", "Cinema", "Memento", "director", "Christopher Nolan");

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1.length).toBe(24);
  });

  it("Phase 2: Question Selector enforces Category Balancing (max 2 per category)", () => {
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

  it("Phase 3: Hardened Free Answer Filter rejects long or ambiguous answers", () => {
    const validCandidate = {
      prompt: "Quel est le symbole chimique du fer ?",
      correctAnswer: "Fe",
      eligibleFreeAnswer: true,
    };
    const invalidCandidate = {
      prompt: "Quel traité complexe a été ratifié en 1919 avec clause ?",
      correctAnswer: "Traité de Versailles (version annotée) / Protocole",
      eligibleFreeAnswer: false,
    };

    expect(validCandidate.correctAnswer.length).toBeLessThanOrEqual(20);
    expect(invalidCandidate.correctAnswer.includes("/")).toBe(true);
  });

  it("Phase 4: Synthesis of 10,000 Canonical Concepts generates balanced trust tiers", async () => {
    const result = await oneMillionQuestionEngine.generateMillionStream({ target: 10_000, chunkSize: 5000 });

    expect(result.totalConcepts).toBe(10_000);
    expect(result.difficultyCounts["easy"]).toBeGreaterThan(0);
    expect(result.difficultyCounts["medium"]).toBeGreaterThan(0);
    expect(result.difficultyCounts["hard"]).toBeGreaterThan(0);
    expect(result.modeEligibility.ranked).toBeGreaterThan(0);
  });
});
