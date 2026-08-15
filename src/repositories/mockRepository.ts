import { PlayerProfile } from "@/lib/types";
import {
  IProfileRepository,
  IMatchmakingRepository,
  IRankedRepository,
  ISocialRepository,
  IRecordsRepository,
  IMatchReviewRepository,
  RankedMatchSnapshotDTO,
  SanitizedRoundDTO,
  QueueStatusDTO,
  MatchAnswerResultDTO,
  MatchReviewDTO,
} from "./types";
import { DEV_PERSONAS } from "./supabaseRepository";
import { SEED_QUESTIONS } from "@/engine/seedData";
import { calculateEloOutcome } from "@/engine/ratingCalculator";
import { socialEngine, PlayerRivalry } from "@/engine/socialEngine";
import { recordsEngine, PlayerModeRecordsSummary, PlayerSkillDimensions } from "@/engine/recordsEngine";
import { generateMatchReviewDTO } from "@/engine/matchReviewEngine";

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
  public reviews: Map<string, MatchReviewDTO> = new Map();
  public syncChannel?: BroadcastChannel | undefined;

  constructor() {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        this.syncChannel = new BroadcastChannel("iq_arena_multiplayer_sync");
        this.syncChannel.onmessage = (event) => {
          this.handleSyncMessage(event.data);
        };
      } catch {}
    }
  }

  private handleSyncMessage(data: any) {
    if (!data || !data.type) return;

    if (data.type === "QUEUE_JOINED") {
      this.waitingQueue.set(data.queueId, {
        queueId: data.queueId,
        userId: data.userId,
        rating: data.rating,
        joinedAt: data.joinedAt,
      });
    } else if (data.type === "MATCH_CREATED" && data.matchId && data.match) {
      const restoredMatch = this.deserializeMatch(data.match);
      this.matches.set(data.matchId, restoredMatch);

      // Check if this window was waiting in queue
      for (const [qId, entry] of this.waitingQueue.entries()) {
        if (entry.onMatched) {
          entry.onMatched(data.matchId);
        }
      }
      this.waitingQueue.clear();
    } else if (data.type === "ANSWER_LOCKED" && data.matchId) {
      const match = this.matches.get(data.matchId);
      if (match) {
        const round = match.rounds[data.roundNumber - 1];
        if (round) {
          round.answers.set(data.userId, {
            selectedOptionId: data.selectedOptionId,
            serverResponseMs: data.serverResponseMs,
            wasCorrect: data.wasCorrect,
            lockedAt: data.lockedAt,
          });

          if (round.answers.size >= 2) {
            this.processRoundReveal(match, round);
          } else {
            this.notifyMatchListeners(match);
          }
        }
      }
    }
  }

  public broadcast(msg: any) {
    if (this.syncChannel) {
      try {
        this.syncChannel.postMessage(msg);
      } catch {}
    }
  }

  public serializeMatch(match: MockInternalMatch): any {
    return {
      matchId: match.matchId,
      state: match.state,
      currentRound: match.currentRound,
      totalRounds: match.totalRounds,
      startsAt: match.startsAt,
      playerA: match.playerA,
      playerB: match.playerB,
      playerAScore: match.playerAScore,
      playerBScore: match.playerBScore,
      rounds: match.rounds.map((r) => ({
        ...r,
        answers: Array.from(r.answers.entries()),
      })),
      playerARatingBefore: match.playerARatingBefore,
      playerARatingAfter: match.playerARatingAfter,
      playerADelta: match.playerADelta,
      playerBRatingBefore: match.playerBRatingBefore,
      playerBRatingAfter: match.playerBRatingAfter,
      playerBDelta: match.playerBDelta,
    };
  }

  public deserializeMatch(data: any): MockInternalMatch {
    return {
      ...data,
      rounds: data.rounds.map((r: any) => ({
        ...r,
        answers: new Map(r.answers || []),
      })),
      listeners: new Set(),
    };
  }

  public notifyMatchListeners(match: MockInternalMatch) {
    for (const listener of match.listeners) {
      const snap = new MockRankedRepository().buildSnapshotDTO(match, this.activePersona.id);
      listener(snap);
    }
  }

  public processRoundReveal(match: MockInternalMatch, round: MockInternalRound) {
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

    this.notifyMatchListeners(match);

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
      }

      this.notifyMatchListeners(match);
    }, 2500);
  }
}

const store = MockStateStore.instance;

function getOpponentForPersona(persona: PlayerProfile): PlayerProfile {
  if (persona.username === "LUCAS92") return DEV_PERSONAS["KENAEL"]!;
  if (persona.username === "KENAEL") return DEV_PERSONAS["LUCAS92"]!;
  if (persona.username === "THOMAS") return DEV_PERSONAS["EMMA"]!;
  return DEV_PERSONAS["THOMAS"]!;
}

export class MockProfileRepository implements IProfileRepository {
  public async getProfile(userId?: string): Promise<PlayerProfile> {
    if (userId && DEV_PERSONAS[userId.replace("u-", "").toUpperCase()]) {
      return { ...DEV_PERSONAS[userId.replace("u-", "").toUpperCase()]! };
    }
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
      const matchId = `match-sync-${now.toString(36)}`;
      const joiningPersona =
        Object.values(DEV_PERSONAS).find((p) => p.id === userId) || store.activePersona;
      const waitingPersona =
        Object.values(DEV_PERSONAS).find((p) => p.id === opponentEntry?.userId) ||
        getOpponentForPersona(joiningPersona);

      const match = this.createMockMatch(matchId, waitingPersona, joiningPersona);
      store.matches.set(matchId, match);

      if (opponentEntry.onMatched) {
        opponentEntry.onMatched(matchId);
      }

      // Broadcast to other tabs/browsers
      store.broadcast({
        type: "MATCH_CREATED",
        matchId,
        match: store.serializeMatch(match),
      });

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

    store.broadcast({
      type: "QUEUE_JOINED",
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

    // Extended timeout to allow manual 2-browser testing comfortably (30s)
    const timeout = setTimeout(() => {
      if (store.waitingQueue.has(queueId)) {
        store.waitingQueue.delete(queueId);
        const matchId = `match-auto-${Date.now().toString(36)}`;
        const opponent = getOpponentForPersona(store.activePersona);
        const match = this.createMockMatch(matchId, store.activePersona, opponent);
        store.matches.set(matchId, match);
        onMatchFound(matchId);
      }
    }, 30000);

    return () => clearTimeout(timeout);
  }

  public createMockMatch(matchId: string, playerA: PlayerProfile, playerB: PlayerProfile): MockInternalMatch {
    const now = Date.now();
    const startsAt = now + 4000; // Synchronized start in future
    const rounds: MockInternalRound[] = SEED_QUESTIONS.slice(0, 8).map((q, idx) => {
      const servedAt = startsAt;
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
      startsAt,
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
      const opp = getOpponentForPersona(store.activePersona);
      const newMatch = mm.createMockMatch(matchId, store.activePersona, opp);
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

    // Broadcast answer to sync across browser tabs
    store.broadcast({
      type: "ANSWER_LOCKED",
      matchId,
      roundNumber,
      userId,
      selectedOptionId,
      serverResponseMs,
      wasCorrect,
      lockedAt: now,
    });

    const oppId = userId === match.playerA.id ? match.playerB.id : match.playerA.id;

    if (round.answers.size >= 2) {
      store.processRoundReveal(match, round);
    } else {
      store.notifyMatchListeners(match);
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

  public async requestRematch(
    matchId: string,
    userId: string,
  ): Promise<{ success: boolean; newMatchId?: string | undefined }> {
    const match = store.matches.get(matchId);
    if (!match) return { success: false };

    match.rematchRequestedBy = userId;
    const newMatchId = `match-rematch-${Date.now().toString(36)}`;
    const mm = new MockMatchmakingRepository();
    const newMatch = mm.createMockMatch(newMatchId, match.playerA, match.playerB);
    store.matches.set(newMatchId, newMatch);
    match.rematchMatchId = newMatchId;

    store.notifyMatchListeners(match);
    return { success: true, newMatchId };
  }

  public subscribeMatch(
    matchId: string,
    _userId: string,
    onUpdate: (snapshot: RankedMatchSnapshotDTO) => void,
  ): () => void {
    const match = store.matches.get(matchId);
    if (!match) return () => {};

    match.listeners.add(onUpdate);
    return () => match.listeners.delete(onUpdate);
  }

  public buildSnapshotDTO(match: MockInternalMatch, userId: string): RankedMatchSnapshotDTO {
    const roundIdx = match.currentRound - 1;
    const round = match.rounds[roundIdx];

    let sanitizedRound: SanitizedRoundDTO | undefined;
    if (round) {
      const ownAns = round.answers.get(userId);
      const oppId = userId === match.playerA.id ? match.playerB.id : match.playerA.id;
      const oppAns = round.answers.get(oppId);

      const now = Date.now();
      const secondsRemaining = Math.max(0, Math.ceil((round.expiresAt - now) / 1000));
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

export class MockMatchReviewRepository implements IMatchReviewRepository {
  public async getMatchReview(matchId: string, playerId: string): Promise<MatchReviewDTO> {
    const key = `${matchId}-${playerId}`;
    const cached = store.reviews.get(key);
    if (cached) return cached;

    const rankedRepo = new MockRankedRepository();
    const snap = await rankedRepo.getMatchSnapshot(matchId, playerId);
    const review = generateMatchReviewDTO(snap, playerId);
    store.reviews.set(key, review);
    return review;
  }
}
