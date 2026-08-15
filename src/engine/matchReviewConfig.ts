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

  // Instant Speed Thresholds
  instant: {
    medianSpeedMultiplier: 0.45,
    absoluteMaxMs: 1400,
    minResponseMs: 300, // Physical floor
  },

  // Elite Difficulty Thresholds
  elite: {
    maxExpectedProbability: 0.35,
    hardTierExpectedProbability: 0.45,
    expertTierExpectedProbability: 0.55,
  },

  // Hesitation Thresholds
  hesitation: {
    medianSpeedMultiplier: 1.70,
    minAbsoluteMs: 5000,
  },

  // Blunder (Unforced Error) Thresholds
  blunder: {
    minExpectedProbability: 0.75,
  },

  // Performance Rating Model Configuration
  performance: {
    shrinkageFactor: 0.65, // Shrinks noisy 8-round sample toward Arena Rating
    maxDeltaClamp: 450,    // Clamps max match divergence to ±450 ELO
    baseQuestionValue: 50,  // Base performance weight per round
    speedBonusMax: 15,     // Speed percentile contribution
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
