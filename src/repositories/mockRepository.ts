import { PlayerProfile } from "@/lib/types";
import {
  IProfileRepository,
  IMatchmakingRepository,
  IRankedRepository,
  ISocialRepository,
  IRecordsRepository,
  RankedMatchSnapshotDTO,
  SanitizedRoundDTO,
  QueueStatusDTO,
  MatchAnswerResultDTO,
} from "./types";
import { DEV_PERSONAS } from "./supabaseRepository";
import { SEED_QUESTIONS } from "@/engine/seedData";
import { calculateEloOutcome } from "@/engine/ratingCalculator";
import { socialEngine, PlayerRivalry } from "@/engine/socialEngine";
import { recordsEngine, PlayerModeRecordsSummary, PlayerSkillDimensions } from "@/engine/recordsEngine";

interface MockInternalRound {
  roundNumber: number;
  questionId: string;
  category: string;
  difficulty: string;
  prompt: string;
  options: { id: string; label: string }[];
  correctOptionId: string;
  explanation: string;
  servedAt: number;
  expiresAt: number;
  status: "pending" | "active" | "locked" | "revealed" | "completed";
  revealedAt?: number | undefined;
  answers: Map<string, { selectedOptionId: string; serverResponseMs: number; wasCorrect: boolean; lockedAt: number }>;
}

interface MockInternalMatch {
  matchId: string;
  state: "matched" | "countdown" | "round_active" | "round_locked" | "round_reveal" | "between_rounds" | "completed";
  currentRound: number;
  totalRounds: number;
  startsAt: number;
  playerA: PlayerProfile;
  playerB: PlayerProfile;
  playerAScore: number;
  playerBScore: number;
  rounds: MockInternalRound[];
  winnerId?: string | undefined;
  isDraw?: boolean | undefined;
  playerARatingBefore: number;
  playerARatingAfter: number;
  playerADelta: number;
  playerBRatingBefore: number;
  playerBRatingAfter: number;
  playerBDelta: number;
  rematchRequestedBy?: string | undefined;
  rematchMatchId?: string | undefined;
  listeners: Set<(snapshot: RankedMatchSnapshotDTO) => void>;
}

class MockStateStore {
  public static instance = new MockStateStore();
  public activePersona: PlayerProfile = { ...DEV_PERSONAS["KENAEL"]! };
  public waitingQueue: Map<string, { queueId: string; userId: string; rating: number; joinedAt: number; onMatched?: (matchId: string) => void }> = new Map();
  public matches: Map<string, MockInternalMatch> = new Map();
}

const store = MockStateStore.instance;

export class MockProfileRepository implements IProfileRepository {
  public async getProfile(_userId: string): Promise<PlayerProfile> {
    return { ...store.activePersona };
  }

  public async updateProfile(_userId: string, updates: Partial<PlayerProfile>): Promise<PlayerProfile> {
    store.activePersona = { ...store.activePersona, ...updates };
    return { ...store.activePersona };
  }

  public async switchPersona(personaName: "KENAEL" | "LUCAS92" | "THOMAS" | "EMMA"): Promise<PlayerProfile> {
    const p = DEV_PERSONAS[personaName] || DEV_PERSONAS["KENAEL"]!;
    store.activePersona = { ...p };
    return { ...store.activePersona };
  }
}

export class MockMatchmakingRepository implements IMatchmakingRepository {
  public async joinQueue(
    userId: string,
    _mode: string = "ranked_classic",
    rating: number = 1657,
  ): Promise<QueueStatusDTO> {
    const queueId = `mock-q-${userId}`;
    const now = Date.now();

    let opponentEntry: { queueId: string; userId: string; rating: number; onMatched?: (matchId: string) => void } | undefined;

    for (const [qId, entry] of store.waitingQueue.entries()) {
      if (entry.userId !== userId) {
        opponentEntry = entry;
        store.waitingQueue.delete(qId);
        break;
      }
    }

    if (opponentEntry) {
      const matchId = `match-${now.toString(36)}`;
      const match = this.createMockMatch(matchId, store.activePersona, DEV_PERSONAS["LUCAS92"]!);
      store.matches.set(matchId, match);

      if (opponentEntry.onMatched) {
        opponentEntry.onMatched(matchId);
      }

      return {
        queueId,
        status: "matched",
        matchId,
        joinedAt: new Date(now).toISOString(),
      };
    }

    store.waitingQueue.set(queueId, {
      queueId,
      userId,
      rating,
      joinedAt: now,
    });

    return {
      queueId,
      status: "waiting",
      joinedAt: new Date(now).toISOString(),
    };
  }

  public async cancelQueue(queueId: string, _userId: string): Promise<boolean> {
    store.waitingQueue.delete(queueId);
    return true;
  }

  public async getQueueStatus(queueId: string, _userId: string): Promise<QueueStatusDTO> {
    const entry = store.waitingQueue.get(queueId);
    return {
      queueId,
      status: entry ? "waiting" : "matched",
      joinedAt: entry ? new Date(entry.joinedAt).toISOString() : new Date().toISOString(),
    };
  }

  public subscribeQueue(queueId: string, onMatchFound: (matchId: string) => void): () => void {
    const entry = store.waitingQueue.get(queueId);
    if (entry) {
      entry.onMatched = onMatchFound;
    }

    const timeout = setTimeout(() => {
      if (store.waitingQueue.has(queueId)) {
        store.waitingQueue.delete(queueId);
        const matchId = `match-auto-${Date.now().toString(36)}`;
        const match = this.createMockMatch(matchId, store.activePersona, DEV_PERSONAS["LUCAS92"]!);
        store.matches.set(matchId, match);
        onMatchFound(matchId);
      }
    }, 2200);

    return () => clearTimeout(timeout);
  }

  private createMockMatch(matchId: string, playerA: PlayerProfile, playerB: PlayerProfile): MockInternalMatch {
    const now = Date.now();
    const shuffled = [...SEED_QUESTIONS].sort(() => 0.5 - Math.random()).slice(0, 8);

    const rounds: MockInternalRound[] = shuffled.map((q, idx) => {
      const servedAt = now + (idx === 0 ? 3000 : 999999);
      return {
        roundNumber: idx + 1,
        questionId: q.id,
        category: q.category,
        difficulty: q.difficulty,
        prompt: q.prompt,
        options: q.answers.map((a) => ({ id: a.id, label: a.label })),
        correctOptionId: q.answers.find((a) => a.isCorrect)?.id || "a",
        explanation: q.explanation,
        servedAt,
        expiresAt: servedAt + 10000,
        status: idx === 0 ? "active" : "pending",
        answers: new Map(),
      };
    });

    return {
      matchId,
      state: "countdown",
      currentRound: 1,
      totalRounds: 8,
      startsAt: now + 3000,
      playerA: { ...playerA },
      playerB: { ...playerB },
      playerAScore: 0,
      playerBScore: 0,
      rounds,
      playerARatingBefore: playerA.elo,
      playerARatingAfter: playerA.elo,
      playerADelta: 0,
      playerBRatingBefore: playerB.elo,
      playerBRatingAfter: playerB.elo,
      playerBDelta: 0,
      listeners: new Set(),
    };
  }
}

export class MockRankedRepository implements IRankedRepository {
  public async getMatchSnapshot(matchId: string, userId: string): Promise<RankedMatchSnapshotDTO> {
    let match = store.matches.get(matchId);
    if (!match) {
      const mm = new MockMatchmakingRepository();
      const newMatch = (mm as any).createMockMatch(matchId, store.activePersona, DEV_PERSONAS["LUCAS92"]!);
      store.matches.set(matchId, newMatch);
      match = newMatch;
    }

    return this.buildSnapshotDTO(match!, userId);
  }

  public async submitRoundAnswer(
    matchId: string,
    roundNumber: number,
    userId: string,
    selectedOptionId: string,
    clientTelemetryMs?: number,
  ): Promise<MatchAnswerResultDTO> {
    let match = store.matches.get(matchId);
    if (!match) {
      await this.getMatchSnapshot(matchId, userId);
      match = store.matches.get(matchId);
    }
    if (!match) throw new Error("Match not found");

    const round = match.rounds[roundNumber - 1];
    if (!round) throw new Error(`Round ${roundNumber} not found`);

    const now = Date.now();
    const serverResponseMs = clientTelemetryMs || Math.min(10000, Math.max(800, now - round.servedAt));
    const wasCorrect = round.correctOptionId === selectedOptionId;

    round.answers.set(userId, {
      selectedOptionId,
      serverResponseMs,
      wasCorrect,
      lockedAt: now,
    });

    if (!round.answers.has(match.playerB.id) && userId === match.playerA.id) {
      setTimeout(() => {
        const oppCorrect = Math.random() > 0.3;
        const oppOption = oppCorrect
          ? round.correctOptionId
          : round.options.find((o) => o.id !== round.correctOptionId)?.id || "b";

        round.answers.set(match.playerB.id, {
          selectedOptionId: oppOption,
          serverResponseMs: 2400,
          wasCorrect: oppCorrect,
          lockedAt: Date.now(),
        });

        this.processRoundReveal(match, round);
      }, 950);
    } else if (round.answers.size >= 2) {
      this.processRoundReveal(match, round);
    }

    const snapshot = this.buildSnapshotDTO(match, userId);
    return {
      roundId: `r-${round.roundNumber}`,
      roundNumber,
      locked: true,
      bothAnswered: round.answers.size >= 2,
      roundStatus: round.status === "revealed" ? "revealed" : "locked",
      snapshot,
    };
  }

  private processRoundReveal(match: MockInternalMatch, round: MockInternalRound) {
    round.status = "revealed";
    round.revealedAt = Date.now();
    match.state = "round_reveal";

    const ansA = round.answers.get(match.playerA.id);
    const ansB = round.answers.get(match.playerB.id);

    if (ansA?.wasCorrect && !ansB?.wasCorrect) {
      match.playerAScore += 1;
    } else if (!ansA?.wasCorrect && ansB?.wasCorrect) {
      match.playerBScore += 1;
    } else if (ansA?.wasCorrect && ansB?.wasCorrect) {
      if (ansA.serverResponseMs < ansB.serverResponseMs) match.playerAScore += 1;
      else if (ansB.serverResponseMs < ansA.serverResponseMs) match.playerBScore += 1;
    }

    this.notifyListeners(match);

    setTimeout(() => {
      if (round.roundNumber < match.totalRounds) {
        match.currentRound += 1;
        const nextRound = match.rounds[match.currentRound - 1]!;
        nextRound.status = "active";
        nextRound.servedAt = Date.now();
        nextRound.expiresAt = nextRound.servedAt + 10000;
        match.state = "round_active";
      } else {
        match.state = "completed";
        const winner =
          match.playerAScore > match.playerBScore
            ? match.playerA.id
            : match.playerBScore > match.playerAScore
            ? match.playerB.id
            : undefined;

        const eloCalc = calculateEloOutcome(
          match.playerARatingBefore,
          match.playerBRatingBefore,
          match.playerAScore,
          match.playerBScore,
          24,
        );

        match.winnerId = winner;
        match.isDraw = !winner;
        match.playerARatingAfter = eloCalc.playerARatingAfter;
        match.playerADelta = eloCalc.playerADelta;
        match.playerBRatingAfter = eloCalc.playerBRatingAfter;
        match.playerBDelta = eloCalc.playerBDelta;

        store.activePersona.elo = eloCalc.playerARatingAfter;
        store.activePersona.peakElo = Math.max(store.activePersona.peakElo, eloCalc.playerARatingAfter);
        store.activePersona.battles += 1;
        if (winner === store.activePersona.id) store.activePersona.wins += 1;
      }

      this.notifyListeners(match);
    }, 2400);
  }

  public async requestRematch(
    matchId: string,
    userId: string,
  ): Promise<{ success: boolean; newMatchId?: string | undefined }> {
    const match = store.matches.get(matchId);
    if (!match) return { success: false };

    match.rematchRequestedBy = userId;
    const newMatchId = `match-rematch-${Date.now().toString(36)}`;
    const mm = new MockMatchmakingRepository();
    const newMatch = (mm as any).createMockMatch(newMatchId, match.playerA, match.playerB);
    store.matches.set(newMatchId, newMatch);
    match.rematchMatchId = newMatchId;

    this.notifyListeners(match);
    return { success: true, newMatchId };
  }

  public subscribeMatch(
    matchId: string,
    userId: string,
    onUpdate: (snapshot: RankedMatchSnapshotDTO) => void,
  ): () => void {
    const match = store.matches.get(matchId);
    if (!match) return () => {};

    match.listeners.add(onUpdate);
    return () => match.listeners.delete(onUpdate);
  }

  private notifyListeners(match: MockInternalMatch) {
    for (const listener of match.listeners) {
      listener(this.buildSnapshotDTO(match, store.activePersona.id));
    }
  }

  private buildSnapshotDTO(match: MockInternalMatch, userId: string): RankedMatchSnapshotDTO {
    const roundIdx = match.currentRound - 1;
    const round = match.rounds[roundIdx];

    let sanitizedRound: SanitizedRoundDTO | undefined;
    if (round) {
      const ownAns = round.answers.get(userId);
      const oppId = userId === match.playerA.id ? match.playerB.id : match.playerA.id;
      const oppAns = round.answers.get(oppId);

      const now = Date.now();
      const secondsRemaining = Math.max(0, Math.round((round.expiresAt - now) / 1000));
      const isRevealed = round.status === "revealed" || match.state === "completed";

      sanitizedRound = {
        roundId: `r-${round.roundNumber}`,
        roundNumber: round.roundNumber,
        totalRounds: match.totalRounds,
        questionId: round.questionId,
        category: round.category,
        difficulty: round.difficulty,
        prompt: round.prompt,
        options: round.options,
        secondsRemaining,
        servedAt: new Date(round.servedAt).toISOString(),
        expiresAt: new Date(round.expiresAt).toISOString(),
        status: round.status === "pending" ? "active" : (round.status as any),
        selfAnswer: ownAns
          ? { selectedOptionId: ownAns.selectedOptionId, lockedAt: new Date(ownAns.lockedAt).toISOString() }
          : undefined,
        opponentLocked: !!oppAns,
        reveal: isRevealed
          ? {
              correctOptionId: round.correctOptionId,
              explanation: round.explanation,
              playerAAnswer: round.answers.get(match.playerA.id)
                ? {
                    selectedOptionId: round.answers.get(match.playerA.id)!.selectedOptionId,
                    wasCorrect: round.answers.get(match.playerA.id)!.wasCorrect,
                    responseTimeMs: round.answers.get(match.playerA.id)!.serverResponseMs,
                  }
                : undefined,
              playerBAnswer: round.answers.get(match.playerB.id)
                ? {
                    selectedOptionId: round.answers.get(match.playerB.id)!.selectedOptionId,
                    wasCorrect: round.answers.get(match.playerB.id)!.wasCorrect,
                    responseTimeMs: round.answers.get(match.playerB.id)!.serverResponseMs,
                  }
                : undefined,
              roundWinnerId: match.playerAScore > match.playerBScore ? match.playerA.id : undefined,
              scoreA: match.playerAScore,
              scoreB: match.playerBScore,
            }
          : undefined,
      };
    }

    return {
      matchId: match.matchId,
      state: match.state,
      currentRound: match.currentRound,
      totalRounds: match.totalRounds,
      startsAt: new Date(match.startsAt).toISOString(),
      playerA: {
        id: match.playerA.id,
        username: match.playerA.username,
        country: match.playerA.country,
        avatarColor: match.playerA.avatarColor,
        initials: match.playerA.initials,
        rating: match.playerARatingBefore,
        score: match.playerAScore,
      },
      playerB: {
        id: match.playerB.id,
        username: match.playerB.username,
        country: match.playerB.country,
        avatarColor: match.playerB.avatarColor,
        initials: match.playerB.initials,
        rating: match.playerBRatingBefore,
        score: match.playerBScore,
      },
      round: sanitizedRound,
      completedResult:
        match.state === "completed"
          ? {
              winnerId: match.winnerId,
              isDraw: !!match.isDraw,
              playerAScore: match.playerAScore,
              playerBScore: match.playerBScore,
              playerARatingBefore: match.playerARatingBefore,
              playerARatingAfter: match.playerARatingAfter,
              playerADelta: match.playerADelta,
              playerBRatingBefore: match.playerBRatingBefore,
              playerBRatingAfter: match.playerBRatingAfter,
              playerBDelta: match.playerBDelta,
              worldRankAfter: 18429,
            }
          : undefined,
      rematchRequestedBy: match.rematchRequestedBy,
      rematchMatchId: match.rematchMatchId,
    };
  }
}

export class MockSocialRepository implements ISocialRepository {
  public async getRivalries(_userId: string): Promise<PlayerRivalry[]> {
    return socialEngine.getRivalries();
  }

  public async recordRivalryMatch(opponentUsername: string, userWon: boolean): Promise<void> {
    socialEngine.recordRivalryMatch(opponentUsername, userWon);
  }
}

export class MockRecordsRepository implements IRecordsRepository {
  public async getPlayerModeRecords(userId: string): Promise<PlayerModeRecordsSummary> {
    return recordsEngine.getPlayerModeRecords(userId);
  }

  public async getPlayerSkillDimensions(userId: string): Promise<PlayerSkillDimensions> {
    return recordsEngine.getPlayerSkillDimensions(userId);
  }

  public async saveModeRecord(userId: string, modeSlug: string, value: number): Promise<boolean> {
    return true;
  }
}
