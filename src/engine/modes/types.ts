export type ModeFamily = "compete" | "quick" | "train" | "social";

export type AnswerInputType = "mcq" | "free_text" | "hybrid";

export type EliminationRule = "none" | "one_strike" | "bottom_percentile" | "bracket";

export type ScoringRuleType =
  | "elo_k24"
  | "speed_streak_points"
  | "lightning_volume"
  | "streak_length"
  | "perfection_time"
  | "ladder_stages"
  | "double_or_nothing"
  | "daily_gem"
  | "tower_floors"
  | "standard";

export type DifficultyRuleType =
  | "balanced"
  | "escalating"
  | "player_adaptive"
  | "hard"
  | "expert"
  | "random_bounded";

export interface GameModeDefinition {
  id: string;
  slug: string;
  family: ModeFamily;
  displayName: string;
  shortTagline: string;
  description: string;
  ranked: boolean;
  questionCount: number | null; // null for infinite or time-based
  timePerQuestionMs: number | null; // e.g. 5000 for Blitz
  totalTimeMs: number | null; // e.g. 60000 for Lightning
  estimatedDuration: string; // e.g. "~20s", "~60s", "~2 min"
  answerInputType: AnswerInputType;
  eliminationRule: EliminationRule;
  scoringRule: ScoringRuleType;
  difficultyRule: DifficultyRuleType;
  categoryRule: string; // "all", "single", "custom", "weakness"
  allowsRetry: boolean;
  officialLeaderboard: boolean;
  ratingPool: "classic" | "blitz" | "free_answer" | null;
  shareable: boolean;
  active: boolean;
  featureFlag: string;
  badgeLabel?: string | undefined;
  iconName: string;
  accentColor: string;
  metadata?: Record<string, any> | undefined;
}
