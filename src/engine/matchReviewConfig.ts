/**
 * IQ ARENA — Centralized Match Review & Classification Configuration
 * Strict, deterministic, measurable rules without LLM latency or non-reproducible variance.
 */

export const MATCH_REVIEW_ANALYSIS_VERSION = 1;

export interface RatingBucketDef {
  label: string;
  minElo: number;
  maxElo: number;
}

export const RATING_BUCKETS: readonly RatingBucketDef[] = [
  { label: "<1000", minElo: 0, maxElo: 999 },
  { label: "1000–1199", minElo: 1000, maxElo: 1199 },
  { label: "1200–1399", minElo: 1200, maxElo: 1399 },
  { label: "1400–1599", minElo: 1400, maxElo: 1599 },
  { label: "1600–1799", minElo: 1600, maxElo: 1799 },
  { label: "1800–1999", minElo: 1800, maxElo: 1999 },
  { label: "2000–2199", minElo: 2000, maxElo: 2199 },
  { label: "2200+", minElo: 2200, maxElo: 4000 },
] as const;

export const MATCH_REVIEW_CONFIG = {
  // Telemetry sample confidence thresholds
  sampleSize: {
    bucketMinSample: 50,
    globalMinSample: 100,
  },

  // Instant Speed Thresholds (Part 14)
  instant: {
    medianSpeedMultiplier: 0.45,
    absoluteMaxMs: 1400,
    minResponseMs: 300, // Physical human floor
    topSpeedPercentile: 90,
  },

  // Elite Difficulty Thresholds (Part 13)
  elite: {
    maxExpectedProbability: 0.30,
    maxExpectedWithConfidence: 0.35,
    hardTierExpectedProbability: 0.40,
    expertTierExpectedProbability: 0.50,
  },

  // Hesitation Thresholds (Part 15)
  hesitation: {
    medianSpeedMultiplier: 1.70,
    minAbsoluteMs: 5000,
  },

  // Blunder (Unforced Error) Thresholds (Part 12)
  blunder: {
    minExpectedProbability: 0.80,
    minSampleSizeForBlunder: 50,
  },

  // Performance Rating Model Configuration (Part 8 & 9)
  performance: {
    shrinkageFactor: 0.65, // Shrinks noisy 8-round sample toward baseline Arena Rating
    maxDeltaClamp: 450,    // Clamps max match divergence to ±450 ELO
    baseWeight: 40,
  },
} as const;

export function getRatingBucketForElo(elo: number): string {
  for (const b of RATING_BUCKETS) {
    if (elo >= b.minElo && elo <= b.maxElo) {
      return b.label;
    }
  }
  return "1600–1799";
}
