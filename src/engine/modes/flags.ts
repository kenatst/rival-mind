/**
 * Centralized Game Mode Feature Flags.
 * Controls mode availability and progressive enablement.
 */
export const MODE_FEATURE_FLAGS: Record<string, boolean> = {
  // COMPETE FAMILY
  mode_ranked_classic: true,
  mode_ranked_blitz: true,
  mode_free_answer_ranked: true,
  mode_weekend_cup: true,
  mode_qualifiers: true,
  mode_king_of_hill: true,
  mode_sudden_death: true,
  mode_world_quiz: true,

  // QUICK FAMILY
  mode_blitz_5s: true,
  mode_lightning_60: true,
  mode_perfect_10: true,
  mode_streak: true,
  mode_double_or_nothing: true,
  mode_ladder: true,
  mode_daily_gem: true,
  mode_mystery: true,

  // TRAIN FAMILY
  mode_infinite_training: true,
  mode_adaptive_training: true,
  mode_category_runs: true,
  mode_category_tower: true,
  mode_weakness_run: true,

  // SOCIAL FAMILY
  mode_friend_battle: true,
  mode_rivalries: true,
  mode_private_leagues: true,
  mode_country_wars: true,

  // Separate Rating Pools (Feature Flagged — Unified by default)
  separate_rating_pools: false,
};

export function isModeEnabled(flagKey: string): boolean {
  if (flagKey in MODE_FEATURE_FLAGS) {
    return !!MODE_FEATURE_FLAGS[flagKey];
  }
  return true;
}
