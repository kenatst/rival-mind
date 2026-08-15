/**
 * Standard Elo Rating Calculator with K-Factor = 24.
 * Server-authoritative calculation based purely on match outcomes relative to opponent strength.
 */

export interface EloOutcomeResult {
  playerARatingBefore: number;
  playerBRatingBefore: number;
  playerARatingAfter: number;
  playerBRatingAfter: number;
  playerADelta: number;
  playerBDelta: number;
  expectedA: number;
  expectedB: number;
}

export const ELO_K_FACTOR = 24;

export function calculateEloOutcome(
  ratingA: number,
  ratingB: number,
  scoreA: number,
  scoreB: number,
  kFactor: number = ELO_K_FACTOR,
): EloOutcomeResult {
  // Expected scores: E = 1 / (1 + 10^((R_opponent - R_player) / 400))
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const expectedB = 1 / (1 + Math.pow(10, (ratingA - ratingB) / 400));

  // Actual match scores (S)
  let actualA = 0.5;
  let actualB = 0.5;

  if (scoreA > scoreB) {
    actualA = 1.0;
    actualB = 0.0;
  } else if (scoreA < scoreB) {
    actualA = 0.0;
    actualB = 1.0;
  }

  // Delta: Round(K * (S - E))
  const deltaA = Math.round(kFactor * (actualA - expectedA));
  const deltaB = Math.round(kFactor * (actualB - expectedB));

  const newRatingA = Math.max(100, ratingA + deltaA);
  const newRatingB = Math.max(100, ratingB + deltaB);

  return {
    playerARatingBefore: ratingA,
    playerBRatingBefore: ratingB,
    playerARatingAfter: newRatingA,
    playerBRatingAfter: newRatingB,
    playerADelta: deltaA,
    playerBDelta: deltaB,
    expectedA,
    expectedB,
  };
}
