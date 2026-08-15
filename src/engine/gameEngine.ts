import { SEED_QUESTIONS, SeedQuestion } from "./seedData";
import { calculateEloOutcome } from "./ratingCalculator";
import { calibrationEngine } from "./calibrationEngine";
import type { MatchMode, PlayerProfile, Question } from "@/lib/types";
import { currentUser as defaultUser, rivalOpponent } from "@/data/mock";

export interface ServerQuestionInstance {
  instanceId: string;
  questionId: string;
  version: number;
  position: number;
  prompt: string;
  category: string;
  difficulty: string;
  seconds: number;
  servedAt: number; // Server timestamp in ms
  answers: { id: string; label: string }[]; // SANITIZED: No isCorrect or ground truth
}

export interface ServerGameSession {
  sessionId: string;
  userId: string | null;
  mode: MatchMode;
  categorySlug?: string | undefined;
  language: string;
  totalScore: number;
  questions: ServerQuestionInstance[];
  startedAt: string;
  completedAt?: string | undefined;
  status: "active" | "completed";
}

export interface RankedRoundInternal {
  roundNumber: number;
  fullQuestion: SeedQuestion;
  questionInstance: ServerQuestionInstance;
  playerAOptionId?: string | undefined;
  playerBOptionId?: string | undefined;
  playerACorrect?: boolean | undefined;
  playerBCorrect?: boolean | undefined;
  playerATimeMs?: number | undefined;
  playerBTimeMs?: number | undefined;
  answeredAt?: number | undefined;
}

export interface ServerRankedMatch {
  matchId: string;
  playerA: PlayerProfile;
  playerB: PlayerProfile;
  rounds: RankedRoundInternal[];
  status: "in_progress" | "completed";
  winnerId?: string | undefined;
  playerAScore: number;
  playerBScore: number;
  playerARatingBefore: number;
  playerBRatingBefore: number;
  playerARatingAfter?: number | undefined;
  playerBRatingAfter?: number | undefined;
  playerADelta?: number | undefined;
  playerBDelta?: number | undefined;
  completedAt?: string | undefined;
}

export interface QuestionReportRecord {
  reportId: string;
  questionVariantId: string;
  userId?: string | undefined;
  reason: string;
  details?: string | undefined;
  status: "pending" | "resolved" | "dismissed";
  createdAt: string;
}

/**
 * Server-Authoritative Game Engine.
 * Enforces "The client displays. The server decides."
 * Protects competitive integrity, secrecy of future questions, authoritative timing, and Elo calculations.
 */
class AuthoritativeGameEngine {
  private questions: SeedQuestion[] = [...SEED_QUESTIONS];
  private activeSessions: Map<string, ServerGameSession> = new Map();
  private answeredInstances: Map<string, { selectedOptionId: string; wasCorrect: boolean; serverResponseTimeMs: number; clientTelemetryMs?: number | undefined }> = new Map();
  private rankedMatches: Map<string, ServerRankedMatch> = new Map();
  private dailyOfficialResults: Map<string, { userId: string; score: number; completedAt: string }> = new Map();
  private reports: QuestionReportRecord[] = [];
  private playerProfiles: Map<string, PlayerProfile> = new Map();
  private quarantinedQuestionIds: Set<string> = new Set();

  constructor() {
    // Initialize default player profiles
    this.playerProfiles.set(defaultUser.id, { ...defaultUser });
    this.playerProfiles.set(rivalOpponent.id, { ...rivalOpponent });
  }

  // --- 1. Session Creation (Sanitized Question Delivery) ---
  public startSession(userId: string | null, mode: MatchMode = "training", categorySlug?: string, language: string = "fr"): ServerGameSession {
    const sessionId = "sess-" + Math.random().toString(36).substring(2, 10);
    const limit = mode === "daily" ? 12 : 10;

    let pool = this.questions.filter((q) => !this.quarantinedQuestionIds.has(q.id));
    if (categorySlug) {
      const match = pool.filter((q) => q.category.toLowerCase() === categorySlug.toLowerCase());
      if (match.length > 0) pool = match;
    }

    const shuffled = [...pool].sort(() => 0.5 - Math.random()).slice(0, limit);
    const nowMs = Date.now();

    // Create sanitized instances with authoritative servedAt timestamp
    const instances: ServerQuestionInstance[] = shuffled.map((q, idx) => ({
      instanceId: `inst-${sessionId}-${idx + 1}`,
      questionId: q.id,
      version: 1,
      position: idx + 1,
      prompt: q.prompt,
      category: q.category,
      difficulty: q.difficulty,
      seconds: q.seconds,
      servedAt: nowMs,
      answers: q.answers.map((a) => ({ id: a.id, label: a.label })), // Stripped isCorrect
    }));

    const session: ServerGameSession = {
      sessionId,
      userId,
      mode,
      categorySlug,
      language,
      totalScore: 0,
      questions: instances,
      startedAt: new Date().toISOString(),
      status: "active",
    };

    this.activeSessions.set(sessionId, session);
    return session;
  }

  // --- 2. Answer Submission (Authoritative Server Validation & Timing) ---
  public submitAnswer(
    sessionId: string,
    instanceId: string,
    selectedOptionId: string,
    clientTelemetryMs?: number,
  ) {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error("Game session not found");

    if (this.answeredInstances.has(instanceId)) {
      throw new Error("Duplicate submission: Question already answered");
    }

    const instance = session.questions.find((q) => q.instanceId === instanceId);
    if (!instance) throw new Error("Question instance not found in session");

    const fullQuestion = this.questions.find((q) => q.id === instance.questionId);
    if (!fullQuestion) throw new Error("Original question definition not found");

    // Authoritative timing: compute server response time
    const nowMs = Date.now();
    const serverResponseTimeMs = Math.max(50, nowMs - instance.servedAt);

    const correctOption = fullQuestion.answers.find((a) => a.isCorrect);
    const wasCorrect = selectedOptionId === correctOption?.id;
    const scoreAwarded = wasCorrect ? 1 : 0;

    // Speed bonus XP derived strictly from server timing
    const xpAwarded = wasCorrect
      ? 80 + Math.max(0, Math.round((10000 - serverResponseTimeMs) / 1000)) * 8
      : 15;

    this.answeredInstances.set(instanceId, {
      selectedOptionId,
      wasCorrect,
      serverResponseTimeMs,
      clientTelemetryMs,
    });

    session.totalScore += scoreAwarded;

    // Update user profile if authenticated
    if (session.userId) {
      const p = this.playerProfiles.get(session.userId);
      if (p) {
        p.xp += xpAwarded;
        p.level = Math.floor(p.xp / 700) + 1;
      }
    }

    return {
      instanceId,
      wasCorrect,
      correctOptionId: correctOption?.id,
      explanation: fullQuestion.explanation,
      scoreAwarded,
      xpAwarded,
      serverResponseTimeMs,
      totalSessionScore: session.totalScore,
    };
  }

  // --- 3. Ranked Matchmaking (Round-by-Round Delivery & Server Scoring) ---

  /**
   * Starts a ranked match. Returns match metadata ONLY.
   * Future round questions are withheld on the server until requested sequentially.
   */
  public startRankedMatch(userId: string = defaultUser.id): {
    matchId: string;
    playerA: PlayerProfile;
    playerB: PlayerProfile;
    totalRounds: number;
    initialRoundQuestion: ServerQuestionInstance;
  } {
    const matchId = "match-" + Math.random().toString(36).substring(2, 10);
    const playerA = this.playerProfiles.get(userId) || { ...defaultUser, id: userId };
    const playerB = { ...rivalOpponent };

    const pool = this.questions.filter((q) => !this.quarantinedQuestionIds.has(q.id));
    const shuffled = [...pool].sort(() => 0.5 - Math.random()).slice(0, 8);
    const nowMs = Date.now();

    const rounds: RankedRoundInternal[] = shuffled.map((q, idx) => ({
      roundNumber: idx + 1,
      fullQuestion: q,
      questionInstance: {
        instanceId: `inst-${matchId}-${idx + 1}`,
        questionId: q.id,
        version: 1,
        position: idx + 1,
        prompt: q.prompt,
        category: q.category,
        difficulty: q.difficulty,
        seconds: q.seconds,
        servedAt: idx === 0 ? nowMs : 0, // only set for first round initially
        answers: q.answers.map((a) => ({ id: a.id, label: a.label })), // sanitized
      },
    }));

    const match: ServerRankedMatch = {
      matchId,
      playerA,
      playerB,
      rounds,
      status: "in_progress",
      playerAScore: 0,
      playerBScore: 0,
      playerARatingBefore: playerA.elo,
      playerBRatingBefore: playerB.elo,
    };

    this.rankedMatches.set(matchId, match);

    return {
      matchId,
      playerA,
      playerB,
      totalRounds: rounds.length,
      initialRoundQuestion: rounds[0]!.questionInstance,
    };
  }

  /**
   * Retrieves the question for a specific round.
   * Sets the authoritative servedAt timestamp for that round.
   */
  public getRankedRoundQuestion(matchId: string, roundNumber: number, callerUserId: string = defaultUser.id): ServerQuestionInstance {
    const match = this.rankedMatches.get(matchId);
    if (!match) throw new Error("Ranked match not found");

    if (callerUserId !== match.playerA.id && callerUserId !== match.playerB.id) {
      throw new Error("Unauthorized: Caller is not a participant in this match");
    }

    if (match.status !== "in_progress") {
      throw new Error("Match is no longer in progress");
    }

    const roundIndex = roundNumber - 1;
    if (roundIndex < 0 || roundIndex >= match.rounds.length) {
      throw new Error(`Invalid round number: ${roundNumber}`);
    }

    // Ensure previous round was answered before requesting next
    if (roundIndex > 0) {
      const prevRound = match.rounds[roundIndex - 1]!;
      if (prevRound.playerACorrect === undefined) {
        throw new Error(`Cannot skip ahead to round ${roundNumber} before completing round ${roundNumber - 1}`);
      }
    }

    const round = match.rounds[roundIndex]!;
    round.questionInstance.servedAt = Date.now();

    return round.questionInstance;
  }

  /**
   * Submits player answer for a specific ranked round.
   * Authoritatively evaluates correctness, records scores, and simulates fair opponent response.
   */
  public submitRankedRound(
    matchId: string,
    roundNumber: number,
    callerUserId: string = defaultUser.id,
    selectedOptionId: string,
    clientTelemetryMs?: number,
  ) {
    const match = this.rankedMatches.get(matchId);
    if (!match) throw new Error("Ranked match not found");

    if (callerUserId !== match.playerA.id && callerUserId !== match.playerB.id) {
      throw new Error("Unauthorized: Caller is not a participant in this match");
    }

    if (match.status !== "in_progress") {
      throw new Error("Match is no longer in progress");
    }

    const roundIndex = roundNumber - 1;
    const round = match.rounds[roundIndex];
    if (!round) throw new Error(`Round ${roundNumber} not found in match`);

    if (round.playerACorrect !== undefined) {
      throw new Error(`Round ${roundNumber} has already been answered`);
    }

    const nowMs = Date.now();
    const serverTimeMs = Math.max(50, nowMs - (round.questionInstance.servedAt || nowMs - 2000));

    const correctOption = round.fullQuestion.answers.find((a) => a.isCorrect);
    const youCorrect = selectedOptionId === correctOption?.id;

    // Simulate opponent (~66% baseline accuracy, independent of user input)
    const theyCorrect = (roundNumber + 1) % 3 !== 0;

    round.playerAOptionId = selectedOptionId;
    round.playerACorrect = youCorrect;
    round.playerATimeMs = serverTimeMs;
    round.playerBCorrect = theyCorrect;
    round.answeredAt = nowMs;

    if (youCorrect) match.playerAScore += 1;
    if (theyCorrect) match.playerBScore += 1;

    const isLastRound = roundNumber === match.rounds.length;

    return {
      matchId,
      roundNumber,
      wasCorrect: youCorrect,
      correctOptionId: correctOption?.id,
      explanation: round.fullQuestion.explanation,
      playerAScore: match.playerAScore,
      playerBScore: match.playerBScore,
      serverResponseTimeMs: serverTimeMs,
      telemetryMs: clientTelemetryMs,
      isLastRound,
    };
  }

  /**
   * Authoritatively completes a ranked match.
   * SECURITY: Does NOT accept client-provided scores! Derives outcome from server-recorded rounds.
   */
  public completeRankedMatch(matchId: string, callerUserId: string = defaultUser.id) {
    const match = this.rankedMatches.get(matchId);
    if (!match) throw new Error("Ranked match not found");

    // Caller must be a participant
    if (callerUserId !== match.playerA.id && callerUserId !== match.playerB.id) {
      throw new Error("Unauthorized: Caller is not a participant in this match");
    }

    // IDEMPOTENCY: If already completed, return existing outcome without applying double rating deltas
    if (match.status === "completed") {
      return {
        matchId,
        status: "completed",
        winnerId: match.winnerId,
        playerAScore: match.playerAScore,
        playerBScore: match.playerBScore,
        playerARatingAfter: match.playerARatingAfter,
        playerBRatingAfter: match.playerBRatingAfter,
        playerADelta: match.playerADelta,
        playerBDelta: match.playerBDelta,
        updatedProfile: match.playerA,
        isIdempotentReplay: true,
      };
    }

    // Verify all rounds have been completed
    const uncompletedRound = match.rounds.find((r) => r.playerACorrect === undefined);
    if (uncompletedRound) {
      throw new Error(`Cannot complete match: Round ${uncompletedRound.roundNumber} is still pending.`);
    }

    // Derive authoritative scores strictly from server round evaluations
    const serverPlayerAScore = match.rounds.filter((r) => r.playerACorrect === true).length;
    const serverPlayerBScore = match.rounds.filter((r) => r.playerBCorrect === true).length;

    const outcome = calculateEloOutcome(
      match.playerARatingBefore,
      match.playerBRatingBefore,
      serverPlayerAScore,
      serverPlayerBScore,
    );

    match.playerARatingAfter = outcome.playerARatingAfter;
    match.playerBRatingAfter = outcome.playerBRatingAfter;
    match.playerADelta = outcome.playerADelta;
    match.playerBDelta = outcome.playerBDelta;

    // Apply rating updates atomically
    match.playerA.elo = outcome.playerARatingAfter;
    match.playerA.peakElo = Math.max(match.playerA.peakElo, outcome.playerARatingAfter);
    match.playerA.battles += 1;

    if (serverPlayerAScore > serverPlayerBScore) {
      match.playerA.wins += 1;
      match.playerA.streak += 1;
      match.winnerId = match.playerA.id;
    } else if (serverPlayerAScore < serverPlayerBScore) {
      match.playerA.streak = 0;
      match.winnerId = match.playerB.id;
    } else {
      match.winnerId = undefined; // Draw
    }

    match.playerA.accuracy = Math.round((match.playerA.wins / Math.max(1, match.playerA.battles)) * 100);

    match.playerAScore = serverPlayerAScore;
    match.playerBScore = serverPlayerBScore;
    match.status = "completed";
    match.completedAt = new Date().toISOString();

    return {
      matchId,
      status: "completed",
      winnerId: match.winnerId,
      playerAScore: serverPlayerAScore,
      playerBScore: serverPlayerBScore,
      playerARatingAfter: outcome.playerARatingAfter,
      playerBRatingAfter: outcome.playerBRatingAfter,
      playerADelta: outcome.playerADelta,
      playerBDelta: outcome.playerBDelta,
      outcome,
      updatedProfile: match.playerA,
      isIdempotentReplay: false,
    };
  }

  // --- 4. Guest Calibration & Claim System ---
  public completeGuestQuizAndGetCalibrationToken(guestSessionId: string): { token: string; provisionalRating: number } {
    const session = this.activeSessions.get(guestSessionId);
    const score = session ? session.totalScore : 7;
    return calibrationEngine.createCalibration(guestSessionId, score, 10);
  }

  public registerUserWithCalibrationClaim(
    userId: string,
    username: string,
    calibrationToken?: string,
  ): PlayerProfile {
    let startingRating = 1200;

    if (calibrationToken) {
      const claim = calibrationEngine.claimCalibration(calibrationToken);
      if (claim.valid) {
        startingRating = claim.provisionalRating;
      }
    }

    const newProfile: PlayerProfile = {
      ...defaultUser,
      id: userId,
      username: username.toUpperCase(),
      elo: startingRating,
      peakElo: startingRating,
      battles: 0,
      wins: 0,
      streak: 0,
      worldRank: 1,
      countryRank: 1,
    };

    this.playerProfiles.set(userId, newProfile);
    return newProfile;
  }

  // --- 5. Daily Challenge Submission (One Official Result Constraint) ---
  public submitDailyChallenge(challengeDate: string, userId: string, score: number) {
    const key = `${challengeDate}-${userId}`;
    if (this.dailyOfficialResults.has(key)) {
      return {
        status: "already_submitted",
        message: "You have already completed your official Daily 12 attempt for today.",
        isPractice: true,
      };
    }

    this.dailyOfficialResults.set(key, {
      userId,
      score,
      completedAt: new Date().toISOString(),
    });

    const p = this.playerProfiles.get(userId);
    if (p) {
      p.streak += 1;
      p.xp += score * 60;
    }

    const percentile = Math.max(0.5, Number((100 - (score / 12) * 95).toFixed(1)));
    const countryRank = Math.max(1, 12000 - score * 900);

    return {
      status: "recorded",
      score,
      percentile,
      countryRank,
      isPractice: false,
    };
  }

  // --- 6. Question Reporting ---
  public reportQuestion(questionVariantId: string, userId: string = defaultUser.id, reason: string, details?: string) {
    const report: QuestionReportRecord = {
      reportId: "rep-" + Math.random().toString(36).substring(2, 10),
      questionVariantId,
      userId,
      reason,
      details,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    this.reports.push(report);
    return report;
  }

  public getReports(): QuestionReportRecord[] {
    return this.reports;
  }

  // --- 7. Admin Quarantine & Question Center ---
  public getQuestionsForAdmin(statusFilter?: string, search?: string): SeedQuestion[] {
    return this.questions.filter((q) => {
      const isQuarantined = this.quarantinedQuestionIds.has(q.id);
      if (statusFilter === "quarantined" && !isQuarantined) return false;
      if (statusFilter === "verified" && isQuarantined) return false;
      if (search && search.trim().length > 0) {
        const s = search.toLowerCase().trim();
        const matchesPrompt = q.prompt.toLowerCase().includes(s);
        const matchesCategory = q.category.toLowerCase().includes(s);
        const matchesSubcategory = q.subcategory ? q.subcategory.toLowerCase().includes(s) : false;
        const matchesExplanation = q.explanation ? q.explanation.toLowerCase().includes(s) : false;
        const matchesAnswer = q.answers.some((a) => a.label.toLowerCase().includes(s));
        if (!matchesPrompt && !matchesCategory && !matchesSubcategory && !matchesExplanation && !matchesAnswer) {
          return false;
        }
      }
      return true;
    });
  }

  public quarantineQuestion(questionId: string, adminId: string, reason: string) {
    this.quarantinedQuestionIds.add(questionId);
    return { status: "quarantined", questionId, adminId, reason };
  }

  public restoreQuestion(questionId: string) {
    this.quarantinedQuestionIds.delete(questionId);
    return { status: "restored", questionId };
  }

  public updateQuestion(questionId: string, updates: Partial<SeedQuestion>) {
    const index = this.questions.findIndex((q) => q.id === questionId);
    if (index === -1) throw new Error("Question not found");
    this.questions[index] = { ...this.questions[index]!, ...updates };
    return this.questions[index];
  }

  // --- 8. Question Bank Extension for Factory ---
  public registerFactoryQuestions(newQuestions: SeedQuestion[]) {
    for (const q of newQuestions) {
      const existingIdx = this.questions.findIndex((existing) => existing.id === q.id);
      if (existingIdx >= 0) {
        this.questions[existingIdx] = q;
      } else {
        this.questions.push(q);
      }
    }
  }

  public getQuestionCount(): number {
    return this.questions.length;
  }

  // --- 9. Profile Get/Update ---
  public getProfile(userId: string = defaultUser.id): PlayerProfile {
    return this.playerProfiles.get(userId) || { ...defaultUser };
  }

  public updateProfile(userId: string, updates: Partial<PlayerProfile>): PlayerProfile {
    const p = this.playerProfiles.get(userId) || { ...defaultUser };
    const merged = { ...p, ...updates };
    this.playerProfiles.set(userId, merged);
    return merged;
  }
}

export const authoritativeGameEngine = new AuthoritativeGameEngine();
