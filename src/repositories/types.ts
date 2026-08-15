import { PlayerProfile, DivisionTier } from "@/lib/types";
import { ModeRunResult } from "@/engine/modeEngine";
import { PlayerModeRecordsSummary, PlayerSkillDimensions } from "@/engine/recordsEngine";
import { PlayerRivalry } from "@/engine/socialEngine";

export type BackendMode = "mock" | "supabase";

export interface ServerQuestionOption {
  id: string;
  label: string;
}

export interface SanitizedRoundDTO {
  roundId: string;
  roundNumber: number;
  totalRounds: number;
  questionId: string;
  category: string;
  difficulty: string;
  prompt: string;
  options: ServerQuestionOption[];
  secondsRemaining: number;
  servedAt: string;
  expiresAt: string;
  status: "active" | "locked" | "revealed" | "completed";
  selfAnswer?: {
    selectedOptionId: string;
    lockedAt: string;
  } | undefined;
  opponentLocked: boolean;
  // Included ONLY after round is revealed
  reveal?: {
    correctOptionId: string;
    explanation?: string | undefined;
    playerAAnswer?: { selectedOptionId: string; wasCorrect: boolean; responseTimeMs: number } | undefined;
    playerBAnswer?: { selectedOptionId: string; wasCorrect: boolean; responseTimeMs: number } | undefined;
    roundWinnerId?: string | undefined;
    scoreA: number;
    scoreB: number;
  } | undefined;
}

export interface RankedMatchSnapshotDTO {
  matchId: string;
  state: "matched" | "countdown" | "round_active" | "round_locked" | "round_reveal" | "between_rounds" | "completed" | "cancelled" | "abandoned";
  currentRound: number;
  totalRounds: number;
  startsAt: string;
  playerA: {
    id: string;
    username: string;
    country: { code: string; name: string; flag: string };
    avatarColor: string;
    initials: string;
    rating: number;
    score: number;
  };
  playerB: {
    id: string;
    username: string;
    country: { code: string; name: string; flag: string };
    avatarColor: string;
    initials: string;
    rating: number;
    score: number;
  };
  round?: SanitizedRoundDTO | undefined;
  completedResult?: {
    winnerId?: string | undefined;
    isDraw: boolean;
    playerAScore: number;
    playerBScore: number;
    playerARatingBefore: number;
    playerARatingAfter: number;
    playerADelta: number;
    playerBRatingBefore: number;
    playerBRatingAfter: number;
    playerBDelta: number;
    worldRankAfter?: number | undefined;
  } | undefined;
  rematchRequestedBy?: string | undefined;
  rematchMatchId?: string | undefined;
}

export interface QueueStatusDTO {
  queueId: string;
  status: "waiting" | "matched" | "cancelled" | "expired";
  matchId?: string | undefined;
  joinedAt: string;
}

export interface MatchAnswerResultDTO {
  roundId: string;
  roundNumber: number;
  locked: boolean;
  bothAnswered: boolean;
  roundStatus: "locked" | "revealed" | "completed";
  snapshot?: RankedMatchSnapshotDTO | undefined;
}

export interface IProfileRepository {
  getProfile(userId: string): Promise<PlayerProfile>;
  updateProfile(userId: string, updates: Partial<PlayerProfile>): Promise<PlayerProfile>;
  switchPersona?(personaName: "KENAEL" | "LUCAS92" | "THOMAS" | "EMMA"): Promise<PlayerProfile>;
}

export interface IMatchmakingRepository {
  joinQueue(userId: string, mode: string, rating: number, clientSessionId?: string): Promise<QueueStatusDTO>;
  cancelQueue(queueId: string, userId: string): Promise<boolean>;
  getQueueStatus(queueId: string, userId: string): Promise<QueueStatusDTO>;
  subscribeQueue(queueId: string, onMatchFound: (matchId: string) => void): () => void;
}

export interface IRankedRepository {
  getMatchSnapshot(matchId: string, userId: string): Promise<RankedMatchSnapshotDTO>;
  submitRoundAnswer(matchId: string, roundNumber: number, userId: string, selectedOptionId: string, clientTelemetryMs?: number): Promise<MatchAnswerResultDTO>;
  requestRematch(matchId: string, userId: string): Promise<{ success: boolean; newMatchId?: string | undefined }>;
  subscribeMatch(matchId: string, userId: string, onUpdate: (snapshot: RankedMatchSnapshotDTO) => void): () => void;
}

export interface ISocialRepository {
  getRivalries(userId: string): Promise<PlayerRivalry[]>;
  recordRivalryMatch(opponentUsername: string, userWon: boolean): Promise<void>;
}

export interface IRecordsRepository {
  getPlayerModeRecords(userId: string): Promise<PlayerModeRecordsSummary>;
  getPlayerSkillDimensions(userId: string): Promise<PlayerSkillDimensions>;
  saveModeRecord(userId: string, modeSlug: string, value: number): Promise<boolean>;
}
