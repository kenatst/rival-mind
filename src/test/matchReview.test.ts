import { describe, it, expect } from "bun:test";
import {
  classifyMatchRound,
  calculateMatchPerformanceRating,
  getEstimatedTelemetryForQuestion,
  generateMatchReviewDTO,
  deriveMatchVerdict,
  identifyMomentOfTheMatch,
} from "@/engine/matchReviewEngine";
import { getRatingBucketForElo, MATCH_REVIEW_CONFIG } from "@/engine/matchReviewConfig";
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
        source: "rating_bucket",
      },
    });

    expect(res.classification).toBe("INSTANT");
    expect(res.performanceDelta).toBeGreaterThan(0);
    expect(res.analysisText).toContain("nettement plus rapide");
  });

  it("Phase 3: Correct answer on low expected-success question is classified as ELITE (precedence over INSTANT)", () => {
    const res = classifyMatchRound({
      wasCorrect: true,
      responseMs: 850, // fast, but difficult question!
      difficulty: "hard",
      telemetry: {
        expectedProbability: 0.22,
        peerMedianMs: 3800,
        sampleSize: 200,
        peerAccuracy: 0.22,
        source: "rating_bucket",
      },
    });

    expect(res.classification).toBe("ELITE");
    expect(res.performanceDelta).toBeGreaterThanOrEqual(65);
    expect(res.analysisText).toContain("joueurs proches de votre rating");
  });

  it("Phase 4: Correct answer with sluggish response time (>= 5000ms and >= 1.7x median) is classified as HESITATION", () => {
    const res = classifyMatchRound({
      wasCorrect: true,
      responseMs: 6500,
      difficulty: "medium",
      telemetry: {
        expectedProbability: 0.70,
        peerMedianMs: 3000,
        sampleSize: 100,
        peerAccuracy: 0.70,
        source: "rating_bucket",
      },
    });

    expect(res.classification).toBe("HESITATION");
    expect(res.analysisText).toContain("temps de réflexion");
  });

  it("Phase 5: Wrong answer on an easy question (>= 0.80 expected) is classified as BLUNDER", () => {
    const res = classifyMatchRound({
      wasCorrect: false,
      responseMs: 2500,
      difficulty: "easy",
      telemetry: {
        expectedProbability: 0.88,
        peerMedianMs: 2200,
        sampleSize: 300,
        peerAccuracy: 0.88,
        source: "rating_bucket",
      },
    });

    expect(res.classification).toBe("BLUNDER");
    expect(res.performanceDelta).toBeLessThan(-50);
    expect(res.analysisText).toContain("joueurs proches de votre rating");
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
        source: "rating_bucket",
      },
    });

    expect(res.classification).toBe("MISS");
    expect(res.performanceDelta).toBeLessThan(0);
    expect(res.analysisText).toContain("Question disputée");
  });

  it("Phase 7: Fallback Chain adapts copy strictly without faking population stats on heuristic", () => {
    const heuristicTel = getEstimatedTelemetryForQuestion("Science", "expert", 1650);
    expect(heuristicTel.source).toBe("heuristic");

    const res = classifyMatchRound({
      wasCorrect: true,
      responseMs: 2500,
      difficulty: "expert",
      telemetry: heuristicTel,
    });

    expect(res.classification).toBe("ELITE");
    expect(res.analysisText).not.toContain("% des joueurs");
    expect(res.analysisText).toContain("Difficile");
  });

  it("Phase 8: Mathematical Invariant — Correctness strictly dominates speed (8/8 slow > 4/8 instant)", () => {
    const arenaRating = 1657;

    const slowPerfectDeltas = [+40, +40, +40, +40, +40, +40, +40, +40]; // 8/8 slow
    const fastMediocreDeltas = [+55, +55, +55, +55, -70, -70, -70, -70]; // 4/8 instant

    const slowPerfectPerf = calculateMatchPerformanceRating(arenaRating, slowPerfectDeltas, 100, 4800);
    const fastMediocrePerf = calculateMatchPerformanceRating(arenaRating, fastMediocreDeltas, 50, 950);

    expect(slowPerfectPerf.performanceRating).toBeGreaterThan(fastMediocrePerf.performanceRating);
    expect(slowPerfectPerf.performanceRating).toBeGreaterThan(arenaRating);
  });

  it("Phase 9: Mathematical Invariant — Easy mistakes hurt more than hard mistakes", () => {
    const easyMiss = classifyMatchRound({
      wasCorrect: false,
      responseMs: 2500,
      difficulty: "easy",
      telemetry: {
        expectedProbability: 0.85,
        peerMedianMs: 2200,
        sampleSize: 100,
        peerAccuracy: 0.85,
        source: "rating_bucket",
      },
    });

    const hardMiss = classifyMatchRound({
      wasCorrect: false,
      responseMs: 2500,
      difficulty: "hard",
      telemetry: {
        expectedProbability: 0.35,
        peerMedianMs: 4000,
        sampleSize: 100,
        peerAccuracy: 0.35,
        source: "rating_bucket",
      },
    });

    expect(easyMiss.performanceDelta).toBeLessThan(hardMiss.performanceDelta);
    expect(easyMiss.classification).toBe("BLUNDER");
    expect(hardMiss.classification).toBe("MISS");
  });

  it("Phase 10: Mathematical Invariant — Clamping bounds performance within ±450 ELO", () => {
    const arenaRating = 1657;
    const extremeDeltas = [+75, +75, +75, +75, +75, +75, +75, +75]; // maximum possible delta
    const res = calculateMatchPerformanceRating(arenaRating, extremeDeltas, 100, 800);

    expect(res.performanceRating).toBeLessThanOrEqual(arenaRating + 450);
  });

  it("Phase 11: Two participants in the same match receive their OWN tailored Match Reviews", async () => {
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

  it("Phase 12: Canonical Golden Fixture — KENAEL 1657 vs LUCAS92 1691", async () => {
    const ranked = new MockRankedRepository();
    const snap = await ranked.getMatchSnapshot("match-golden-fixture", "u-kenael");
    const review = generateMatchReviewDTO(snap, "u-kenael");

    expect(review.matchId).toBe("match-golden-fixture");
    expect(review.arenaRatingBefore).toBe(1657);
    expect(review.analysisVersion).toBe(1);
    expect(review.matchVerdict).toBeDefined();
    expect(typeof review.matchVerdict).toBe("string");
    expect(review.rounds.length).toBe(8);
  });

  it("Phase 13: Mathematical Invariant — 7 correct strictly dominates 6 correct under normal equal difficulty", () => {
    const arenaRating = 1650;
    const correctDelta = +60; // Standard medium correct answer
    const missDelta = -65;    // Standard medium miss

    const sevenCorrectDeltas = [correctDelta, correctDelta, correctDelta, correctDelta, correctDelta, correctDelta, correctDelta, missDelta];
    const sixCorrectDeltas = [correctDelta, correctDelta, correctDelta, correctDelta, correctDelta, correctDelta, missDelta, missDelta];

    const perf7 = calculateMatchPerformanceRating(arenaRating, sevenCorrectDeltas);
    const perf6 = calculateMatchPerformanceRating(arenaRating, sixCorrectDeltas);

    expect(perf7.performanceRating).toBeGreaterThan(perf6.performanceRating);
    expect(perf7.performanceDelta - perf6.performanceDelta).toBeGreaterThanOrEqual(50);
  });
});
