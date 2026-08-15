import { describe, it, expect } from "bun:test";
import {
  classifyMatchRound,
  calculateMatchPerformanceRating,
  getEstimatedTelemetryForQuestion,
  generateMatchReviewDTO,
} from "@/engine/matchReviewEngine";
import { getRatingBucketForElo } from "@/engine/matchReviewConfig";
import { MockRankedRepository } from "@/repositories/mockRepository";
import { DEV_PERSONAS } from "@/repositories/supabaseRepository";

describe("IQ ARENA — Match Review & Telemetry Test Suite", () => {
  it("Phase 1: Rating bucket mapping correctly matches competitive divisions", () => {
    expect(getRatingBucketForElo(750)).toBe("<1000");
    expect(getRatingBucketForElo(1050)).toBe("1000–1199");
    expect(getRatingBucketForElo(1288)).toBe("1200–1399");
    expect(getRatingBucketForElo(1520)).toBe("1400–1599");
    expect(getRatingBucketForElo(1657)).toBe("1600–1799");
    expect(getRatingBucketForElo(1850)).toBe("1800–1999");
    expect(getRatingBucketForElo(2050)).toBe("2000–2199");
    expect(getRatingBucketForElo(2300)).toBe("2200+");
  });

  it("Phase 2: Correct answer with lightning speed is classified as INSTANT", () => {
    const res = classifyMatchRound({
      wasCorrect: true,
      responseMs: 950,
      difficulty: "medium",
      telemetry: {
        expectedProbability: 0.65,
        peerMedianMs: 3200,
        sampleSize: 150,
        peerAccuracy: 0.65,
      },
    });

    expect(res.classification).toBe("INSTANT");
    expect(res.performanceDelta).toBeGreaterThan(0);
    expect(res.analysisText).toContain("foudroyante");
  });

  it("Phase 3: Correct answer on low expected-success question is classified as ELITE", () => {
    const res = classifyMatchRound({
      wasCorrect: true,
      responseMs: 2800,
      difficulty: "hard",
      telemetry: {
        expectedProbability: 0.28,
        peerMedianMs: 3800,
        sampleSize: 200,
        peerAccuracy: 0.28,
      },
    });

    expect(res.classification).toBe("ELITE");
    expect(res.performanceDelta).toBeGreaterThanOrEqual(70);
    expect(res.analysisText).toContain("de votre niveau");
  });

  it("Phase 4: Correct answer with sluggish response time is classified as HESITATION", () => {
    const res = classifyMatchRound({
      wasCorrect: true,
      responseMs: 6500,
      difficulty: "medium",
      telemetry: {
        expectedProbability: 0.70,
        peerMedianMs: 3000,
        sampleSize: 100,
        peerAccuracy: 0.70,
      },
    });

    expect(res.classification).toBe("HESITATION");
    expect(res.analysisText).toContain("temps de réflexion");
  });

  it("Phase 5: Wrong answer on an easy question is classified as BLUNDER", () => {
    const res = classifyMatchRound({
      wasCorrect: false,
      responseMs: 2500,
      difficulty: "easy",
      telemetry: {
        expectedProbability: 0.88,
        peerMedianMs: 2200,
        sampleSize: 300,
        peerAccuracy: 0.88,
      },
    });

    expect(res.classification).toBe("BLUNDER");
    expect(res.performanceDelta).toBeLessThan(-50);
    expect(res.analysisText).toContain("Occasion manquée");
  });

  it("Phase 6: Wrong answer on contested question is classified as MISS", () => {
    const res = classifyMatchRound({
      wasCorrect: false,
      responseMs: 3100,
      difficulty: "medium",
      telemetry: {
        expectedProbability: 0.52,
        peerMedianMs: 3400,
        sampleSize: 120,
        peerAccuracy: 0.52,
      },
    });

    expect(res.classification).toBe("MISS");
    expect(res.performanceDelta).toBeLessThan(0);
    expect(res.analysisText).toContain("Question disputée");
  });

  it("Phase 7: Performance Rating applies shrinkage factor and clamps correctly", () => {
    const arenaRating = 1657;
    const strongDeltas = [+75, +55, +40, +40, +75, +40, -35, +55]; // Excellent performance

    const res = calculateMatchPerformanceRating(arenaRating, strongDeltas, 88);
    expect(res.performanceRating).toBeGreaterThan(arenaRating);
    expect(res.performanceRating).toBeLessThanOrEqual(arenaRating + 450);
    expect(res.performanceDelta).toBe(res.performanceRating - arenaRating);
  });

  it("Phase 8: Two participants in the same match receive their OWN tailored Match Reviews", async () => {
    const ranked = new MockRankedRepository();
    const matchId = `match-review-test-${Date.now()}`;
    const snap = await ranked.getMatchSnapshot(matchId, "u-kenael");

    const reviewA = generateMatchReviewDTO(snap, "u-kenael");
    const reviewB = generateMatchReviewDTO(snap, "u-lucas92");

    expect(reviewA.playerId).toBe("u-kenael");
    expect(reviewB.playerId).toBe("u-lucas92");
    expect(reviewA.playerUsername).toBe("KENAEL");
    expect(reviewB.playerUsername).toBe("LUCAS92");
    expect(reviewA.rounds.length).toBe(8);
    expect(reviewB.rounds.length).toBe(8);
  });
});
