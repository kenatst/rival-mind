import { SEED_QUESTIONS, SeedQuestion } from "./seedData";
import { calculateEloOutcome } from "./ratingCalculator";
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
  answers: { id: string; label: string }[]; // SANITIZED: No isCorrect!
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

export interface ServerRankedMatch {
  matchId: string;
  playerA: PlayerProfile;
  playerB: PlayerProfile;
  rounds: {
    roundNumber: number;
    question: ServerQuestionInstance;
    playerAOptionId?: string | undefined;
    playerBOptionId?: string | undefined;
    playerACorrect?: boolean | undefined;
    playerBCorrect?: boolean | undefined;
  }[];
  status: "in_progress" | "completed";
  winnerId?: string | undefined;
  playerAScore: number;
  playerBScore: number;
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
 * In-memory authoritative backend store that enforces anti-cheat and sanitization.
 */
class AuthoritativeGameEngine {
  private questions: SeedQuestion[] = [...SEED_QUESTIONS];
  private activeSessions: Map<string, ServerGameSession> = new Map();
  private answeredInstances: Map<string, { selectedOptionId: string; wasCorrect: boolean; responseTimeMs: number }> = new Map();
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

    // Filter available non-quarantined questions
    let pool = this.questions.filter((q) => !this.quarantinedQuestionIds.has(q.id));
    if (categorySlug) {
      const match = pool.filter((q) => q.category.toLowerCase() === categorySlug.toLowerCase());
      if (match.length > 0) pool = match;
    }

    // Shuffle
    const shuffled = [...pool].sort(() => 0.5 - Math.random()).slice(0, limit);

    // Create sanitized instances
    const instances: ServerQuestionInstance[] = shuffled.map((q, idx) => ({
      instanceId: `inst-${sessionId}-${idx + 1}`,
      questionId: q.id,
      version: 1,
      position: idx + 1,
      prompt: q.prompt,
      category: q.category,
      difficulty: q.difficulty,
      seconds: q.seconds,
      answers: q.answers.map((a) => ({ id: a.id, label: a.label })), // Stripped isCorrect!
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

  // --- 2. Answer Submission (Authoritative Server Validation) ---
  public submitAnswer(sessionId: string, instanceId: string, selectedOptionId: string, responseTimeMs: number = 2000) {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error("Game session not found");

    if (this.answeredInstances.has(instanceId)) {
      throw new Error("Duplicate submission: Question already answered");
    }

    const instance = session.questions.find((q) => q.instanceId === instanceId);
    if (!instance) throw new Error("Question instance not found in session");

    const fullQuestion = this.questions.find((q) => q.id === instance.questionId);
    if (!fullQuestion) throw new Error("Original question definition not found");

    const correctOption = fullQuestion.answers.find((a) => a.isCorrect);
    const wasCorrect = selectedOptionId === correctOption?.id;
    const scoreAwarded = wasCorrect ? 1 : 0;
    const xpAwarded = wasCorrect ? 80 + Math.max(0, Math.round((10000 - responseTimeMs) / 1000)) * 8 : 15;

    this.answeredInstances.set(instanceId, {
      selectedOptionId,
      wasCorrect,
      responseTimeMs,
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
      totalSessionScore: session.totalScore,
    };
  }

  // --- 3. Ranked Matchmaking & Bot Duel Staging ---
  public startRankedMatch(userId: string = defaultUser.id): ServerRankedMatch {
    const matchId = "match-" + Math.random().toString(36).substring(2, 10);
    const playerA = this.playerProfiles.get(userId) || { ...defaultUser };
    const playerB = { ...rivalOpponent };

    const pool = this.questions.filter((q) => !this.quarantinedQuestionIds.has(q.id));
    const shuffled = [...pool].sort(() => 0.5 - Math.random()).slice(0, 8);

    const rounds = shuffled.map((q, idx) => ({
      roundNumber: idx + 1,
      question: {
        instanceId: `inst-${matchId}-${idx + 1}`,
        questionId: q.id,
        version: 1,
        position: idx + 1,
        prompt: q.prompt,
        category: q.category,
        difficulty: q.difficulty,
        seconds: q.seconds,
        answers: q.answers.map((a) => ({ id: a.id, label: a.label })),
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
    };

    this.rankedMatches.set(matchId, match);
    return match;
  }

  public completeRankedMatch(matchId: string, playerAScore: number, playerBScore: number) {
    const match = this.rankedMatches.get(matchId);
    if (!match) throw new Error("Ranked match not found");

    if (match.status === "completed") {
      throw new Error("Match already completed");
    }

    const outcome = calculateEloOutcome(
      match.playerA.elo,
      match.playerB.elo,
      playerAScore,
      playerBScore,
    );

    // Apply rating changes
    match.playerA.elo = outcome.playerARatingAfter;
    match.playerA.peakElo = Math.max(match.playerA.peakElo, outcome.playerARatingAfter);
    match.playerA.battles += 1;
    if (playerAScore > playerBScore) {
      match.playerA.wins += 1;
      match.playerA.streak += 1;
      match.winnerId = match.playerA.id;
    } else {
      match.playerA.streak = 0;
      match.winnerId = match.playerB.id;
    }
    match.playerA.worldRank = Math.max(1, Math.round(28000 - match.playerA.elo * 5.8));
    match.playerA.countryRank = Math.max(1, Math.round(1100 - match.playerA.elo * 0.23));
    match.playerA.accuracy = Math.round((match.playerA.wins / match.playerA.battles) * 100);

    match.playerAScore = playerAScore;
    match.playerBScore = playerBScore;
    match.status = "completed";

    return {
      matchId,
      winnerId: match.winnerId,
      playerAScore,
      playerBScore,
      outcome,
      updatedProfile: match.playerA,
    };
  }

  // --- 4. Daily Challenge Submission (One Official Result Constraint) ---
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

  // --- 5. Question Reporting ---
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

  // --- 6. Admin Quarantine & Question Center ---
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

  // --- 7. Profile Get/Update ---
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
