export type DivisionTier =
  | "Rookie"
  | "Bronze"
  | "Silver"
  | "Gold"
  | "Platinum"
  | "Diamond"
  | "Master"
  | "Grandmaster"
  | "Legend";

export interface Division {
  tier: DivisionTier;
  /** Roman sub-division, e.g. "III". Master+ have none. */
  sub?: "I" | "II" | "III";
  minElo: number;
  maxElo: number;
  /** CSS color token expression used by badges. */
  color: string;
}

export interface Country {
  code: string;
  name: string;
  flag: string;
}

export interface User {
  id: string;
  username: string;
  country: Country;
  avatarColor: string;
  initials: string;
}

export interface PlayerProfile extends User {
  elo: number;
  xp: number;
  level: number;
  streak: number;
  worldRank: number;
  countryRank: number;
  accuracy: number;
  battles: number;
  wins: number;
  strongCategories: CategoryScore[];
  weakCategories: CategoryScore[];
  achievements: Achievement[];
  online?: boolean;
}

export interface CategoryScore {
  category: string;
  score: number;
}

export interface Achievement {
  id: string;
  label: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

export interface Answer {
  id: string;
  label: string;
}

export interface Question {
  id: string;
  category: string;
  prompt: string;
  answers: Answer[];
  correctAnswerId: string;
  seconds: number;
  /** % of players who got this right — used for post-answer feedback. */
  globalSuccessRate: number;
}

export type MatchMode = "infinite" | "ranked" | "daily12" | "battle" | "category";

export interface Match {
  id: string;
  mode: MatchMode;
  player: PlayerProfile;
  opponent: PlayerProfile;
  questions: Question[];
  eloOnWin: number;
  eloOnLoss: number;
}

export interface MatchResult {
  matchId: string;
  outcome: "victory" | "defeat" | "draw";
  playerScore: number;
  opponentScore: number;
  eloBefore: number;
  eloAfter: number;
  worldRankBefore: number;
  worldRankAfter: number;
  xpGained: number;
}

export interface LeaderboardEntry {
  rank: number;
  player: User;
  elo: number;
  isYou?: boolean;
  trend?: number;
}

export interface CountryRanking {
  rank: number;
  country: Country;
  power: number;
  totalPoints: number;
  todayPoints: number;
  players: number;
}

export interface LeagueMember {
  rank: number;
  player: User;
  points: number;
  weeklyRank: number;
  battlesWon: number;
  accuracy: number;
  elo: number;
  isYou?: boolean;
}

export interface League {
  id: string;
  name: string;
  season: number;
  memberCount: number;
  inviteCode: string;
  members: LeagueMember[];
}

export interface DailyChallenge {
  date: string;
  totalQuestions: number;
  completed: boolean;
  score: number;
  percentile: number;
  countryRank: number;
  friends: { player: User; score: number }[];
  hoursRemaining: number;
}

export type NotificationKind = "rival" | "rematch" | "country" | "streak" | "league" | "event";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  time: string;
  unread: boolean;
}

export interface LiveEvent {
  id: string;
  title: string;
  startsAt: string;
  homeCountry: Country;
  challenger: string;
  registered: number;
}
