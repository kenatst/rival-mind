import { GameModeDefinition } from "./modes/types";
import { getModeBySlug } from "./modes/registry";
import { freeAnswerEngine, FreeAnswerEvaluationResult } from "./freeAnswerEngine";
import { SEED_QUESTIONS, SeedQuestion } from "./seedData";
import { calculateEloOutcome } from "./ratingCalculator";

export interface ModeSessionState {
  sessionId: string;
  modeSlug: string;
  mode: GameModeDefinition;
  userId: string;
  startedAt: number; // ms timestamp
  deadlineAt?: number | undefined; // ms timestamp for Lightning (startedAt + 60000)
  currentIndex: number;
  totalQuestions: number;
  score: number;
  bankedScore?: number | undefined; // for Double or Nothing
  currentStreak: number;
  bestStreak: number;
  missedIndices: number[];
  completed: boolean;
  eliminated: boolean;
  ladderStage?: number | undefined;
  towerCategory?: string | undefined;
  towerFloor?: number | undefined;
  answers: {
    questionId: string;
    prompt: string;
    userInput: string;
    isCorrect: boolean;
    responseTimeMs: number;
    pointsAwarded: number;
    explanation?: string | undefined;
  }[];
}

export interface ModeRunResult {
  sessionId: string;
  modeSlug: string;
  displayName: string;
  userId: string;
  score: number;
  totalAttempted: number;
  accuracy: number;
  currentStreak: number;
  bestStreak: number;
  isPersonalBest: boolean;
  previousPersonalBest?: number | undefined;
  nearMissMessage?: string | undefined;
  xpGained: number;
  eloDelta?: number | undefined;
  rankBefore?: number | undefined;
  rankAfter?: number | undefined;
  shareCardText: string;
  completedAt: string;
  reviewQuestions: {
    prompt: string;
    correctAnswer: string;
    userAnswer: string;
    isCorrect: boolean;
    explanation?: string | undefined;
  }[];
}

class ModeEngine {
  private activeSessions: Map<string, ModeSessionState> = new Map();
  private personalBests: Map<string, number> = new Map(); // `${userId}_${modeSlug}` -> record
  private towerProgress: Map<string, number> = new Map(); // `${userId}_${category}` -> highest floor

  constructor() {
    // Default mock PBs for user
    this.personalBests.set("u-kenael_lightning", 24);
    this.personalBests.set("u-kenael_blitz", 18);
    this.personalBests.set("u-kenael_streak", 22);
    this.personalBests.set("u-kenael_ladder", 7);
    this.personalBests.set("u-kenael_perfect-10", 9);
    this.personalBests.set("u-kenael_daily-gem", 14); // streak days
  }

  /**
   * Starts a new server-authoritative game session for any supported mode.
   */
  public startSession(
    userId: string,
    modeSlug: string,
    customCategory?: string,
  ): { session: ModeSessionState; firstQuestion: any } {
    const mode = getModeBySlug(modeSlug);
    if (!mode) throw new Error(`Unknown game mode: ${modeSlug}`);

    const sessionId = `mode-sess-${Math.random().toString(36).substring(2, 10)}`;
    const now = Date.now();
    const deadlineAt = mode.totalTimeMs ? now + mode.totalTimeMs : undefined;
    const totalQuestions = mode.questionCount || (modeSlug === "lightning" ? 30 : 15);

    const session: ModeSessionState = {
      sessionId,
      modeSlug,
      mode,
      userId,
      startedAt: now,
      deadlineAt,
      currentIndex: 0,
      totalQuestions,
      score: 0,
      bankedScore: modeSlug === "double-or-nothing" ? 100 : undefined,
      currentStreak: 0,
      bestStreak: 0,
      missedIndices: [],
      completed: false,
      eliminated: false,
      ladderStage: modeSlug === "ladder" ? 1 : undefined,
      towerCategory: customCategory || (modeSlug === "category-tower" ? "History" : undefined),
      towerFloor: modeSlug === "category-tower" ? this.getTowerFloor(userId, customCategory || "History") : undefined,
      answers: [],
    };

    this.activeSessions.set(sessionId, session);

    const firstQ = this.getSanitizedQuestionForSession(session, 0);
    return { session, firstQuestion: firstQ };
  }

  /**
   * Authoritatively evaluates an answer in a mode session.
   */
  public submitAnswer(
    sessionId: string,
    userInput: string,
    telemetryResponseTimeMs?: number,
  ): {
    session: ModeSessionState;
    isCorrect: boolean;
    pointsAwarded: number;
    explanation?: string | undefined;
    correctAnswer: string;
    nextQuestion?: any | undefined;
    completed: boolean;
    eliminated: boolean;
    freeAnswerResult?: FreeAnswerEvaluationResult | undefined;
  } {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error("Active session not found");
    if (session.completed || session.eliminated) {
      throw new Error("Session has already concluded");
    }

    const now = Date.now();

    // Enforce 60-second Lightning deadline strictly
    if (session.deadlineAt && now > session.deadlineAt + 1000) {
      session.completed = true;
      return {
        session,
        isCorrect: false,
        pointsAwarded: 0,
        correctAnswer: "",
        completed: true,
        eliminated: false,
      };
    }

    const fullQuestion = this.getRawQuestionForSession(session, session.currentIndex);
    let isCorrect = false;
    let freeAnswerResult: FreeAnswerEvaluationResult | undefined;
    let correctAnswer = "";

    if (session.mode.answerInputType === "free_text") {
      correctAnswer = fullQuestion.answers.find((a) => a.isCorrect)?.label || fullQuestion.prompt;
      freeAnswerResult = freeAnswerEngine.evaluateAnswer(
        userInput,
        correctAnswer,
        [],
        fullQuestion.explanation,
      );
      isCorrect = freeAnswerResult.isCorrect;
    } else {
      const selectedOption = fullQuestion.answers.find((a) => a.id === userInput);
      isCorrect = selectedOption ? selectedOption.isCorrect : false;
      correctAnswer = fullQuestion.answers.find((a) => a.isCorrect)?.label || "";
    }

    // Scoring calculation per mode rules
    let pointsAwarded = 0;
    const responseTime = telemetryResponseTimeMs || 2500;

    if (isCorrect) {
      session.currentStreak += 1;
      session.bestStreak = Math.max(session.bestStreak, session.currentStreak);

      if (session.mode.scoringRule === "speed_streak_points") {
        // 5s Blitz: base + speed bonus + streak multiplier
        const speedBonus = Math.max(0, 5000 - responseTime) * 0.2;
        pointsAwarded = Math.round(1000 + speedBonus + session.currentStreak * 100);
      } else if (session.mode.scoringRule === "lightning_volume") {
        pointsAwarded = 1;
      } else if (session.mode.scoringRule === "ladder_stages") {
        pointsAwarded = 100 * (session.ladderStage || 1);
        if (session.ladderStage && session.ladderStage < 10) {
          session.ladderStage += 1;
        }
      } else if (session.mode.scoringRule === "double_or_nothing") {
        pointsAwarded = session.score > 0 ? session.score * 2 : 200;
      } else {
        pointsAwarded = 100;
      }

      session.score += pointsAwarded;
    } else {
      session.missedIndices.push(session.currentIndex);
      session.currentStreak = 0;

      // Check one-strike elimination (Streak, Sudden Death, Ladder)
      if (session.mode.eliminationRule === "one_strike") {
        session.eliminated = true;
        session.completed = true;
      }
    }

    session.answers.push({
      questionId: fullQuestion.id,
      prompt: fullQuestion.prompt,
      userInput,
      isCorrect,
      responseTimeMs: responseTime,
      pointsAwarded,
      explanation: fullQuestion.explanation,
    });

    session.currentIndex += 1;

    // Check completion conditions
    if (!session.eliminated) {
      if (session.mode.questionCount && session.currentIndex >= session.mode.questionCount) {
        session.completed = true;
      }
    }

    const nextQuestion = session.completed
      ? null
      : this.getSanitizedQuestionForSession(session, session.currentIndex);

    return {
      session,
      isCorrect,
      pointsAwarded,
      explanation: fullQuestion.explanation,
      correctAnswer,
      nextQuestion,
      completed: session.completed,
      eliminated: session.eliminated,
      freeAnswerResult,
    };
  }

  /**
   * Finalizes a session and constructs rich result analytics, PB updates, near-miss note, and share card.
   */
  public finishSession(sessionId: string): ModeRunResult {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error("Session not found");

    session.completed = true;
    const mode = session.mode;
    const totalAttempted = session.answers.length;
    const correctCount = session.answers.filter((a) => a.isCorrect).length;
    const accuracy = totalAttempted > 0 ? Math.round((correctCount / totalAttempted) * 100) : 0;

    // Personal Best check
    const pbKey = `${session.userId}_${session.modeSlug}`;
    const prevPB = this.personalBests.get(pbKey) || 0;
    let isPersonalBest = false;
    let comparisonValue = session.score;

    if (mode.slug === "lightning") comparisonValue = correctCount;
    else if (mode.slug === "streak") comparisonValue = session.bestStreak;
    else if (mode.slug === "ladder") comparisonValue = session.ladderStage || 1;
    else if (mode.slug === "perfect-10") comparisonValue = correctCount;

    if (comparisonValue > prevPB) {
      isPersonalBest = true;
      this.personalBests.set(pbKey, comparisonValue);
    }

    // Near-Miss UX Generation
    let nearMissMessage: string | undefined;
    if (mode.slug === "perfect-10") {
      if (correctCount === 9) {
        const missedIndex = session.missedIndices[0] !== undefined ? session.missedIndices[0] + 1 : 7;
        nearMissMessage = `SO CLOSE! 9/10 — Question ${missedIndex} cost you the perfect run.`;
      }
    } else if (mode.slug === "streak") {
      if (session.bestStreak === prevPB - 1 || session.bestStreak === prevPB) {
        nearMissMessage = `RECORD TIED! You were 1 question away from beating your best of ${prevPB}!`;
      }
    } else if (mode.slug === "lightning") {
      if (correctCount === prevPB - 1) {
        nearMissMessage = `JUST 1 POINT AWAY from your all-time record (${prevPB})!`;
      }
    }

    // Category Tower floor progression
    if (mode.slug === "category-tower" && accuracy >= 80 && session.towerCategory) {
      const currentFloor = this.getTowerFloor(session.userId, session.towerCategory);
      this.towerProgress.set(`${session.userId}_${session.towerCategory}`, currentFloor + 1);
    }

    // Share Card generation
    let shareCardText = "";
    if (mode.slug === "blitz") {
      shareCardText = `⚡ IQ ARENA BLITZ: ${correctCount}/${totalAttempted} (${session.score} pts) 🔥 Play: https://iqarena.gg/play/blitz`;
    } else if (mode.slug === "lightning") {
      shareCardText = `⚡ IQ ARENA LIGHTNING: ${correctCount} correct in 60s! (Personal Best: ${Math.max(correctCount, prevPB)}) 🔥 Can you beat me? https://iqarena.gg/play/lightning`;
    } else if (mode.slug === "streak") {
      shareCardText = `🔥 IQ ARENA STREAK: ${session.bestStreak} questions in a row without a mistake! https://iqarena.gg/play/streak`;
    } else if (mode.slug === "perfect-10") {
      shareCardText = `🎯 IQ ARENA PERFECT 10: ${correctCount}/10! https://iqarena.gg/play/perfect-10`;
    } else if (mode.slug === "daily-gem") {
      shareCardText = `💎 IQ ARENA DAILY GEM: ${correctCount === 1 ? "✅ CORRECT" : "❌ MISSED"} — Only 14.8% knew it today! https://iqarena.gg/daily-gem`;
    } else if (mode.slug === "ladder") {
      shareCardText = `🪜 IQ ARENA LADDER: Reached Level ${session.ladderStage || 1}/10! (Top 4.8% Worldwide) https://iqarena.gg/play/ladder`;
    } else {
      shareCardText = `🧠 IQ ARENA ${mode.displayName}: Score ${session.score} pts! https://iqarena.gg/play`;
    }

    const reviewQuestions = session.answers.map((a) => {
      const q = SEED_QUESTIONS.find((sq) => sq.id === a.questionId);
      return {
        prompt: a.prompt,
        correctAnswer: q ? q.answers.find((ans) => ans.isCorrect)?.label || "" : "",
        userAnswer: a.userInput,
        isCorrect: a.isCorrect,
        explanation: a.explanation,
      };
    });

    const xpGained = Math.round(correctCount * 35 + (isPersonalBest ? 150 : 0));

    return {
      sessionId,
      modeSlug: mode.slug,
      displayName: mode.displayName,
      userId: session.userId,
      score: session.score,
      totalAttempted,
      accuracy,
      currentStreak: session.currentStreak,
      bestStreak: session.bestStreak,
      isPersonalBest,
      previousPersonalBest: prevPB,
      nearMissMessage,
      xpGained,
      shareCardText,
      completedAt: new Date().toISOString(),
      reviewQuestions,
    };
  }

  // --- Helpers ---
  private getRawQuestionForSession(session: ModeSessionState, index: number): SeedQuestion {
    let pool = [...SEED_QUESTIONS];

    // Filter by category if category mode or tower
    if (session.towerCategory) {
      const filtered = pool.filter((q) => q.category.toLowerCase() === session.towerCategory!.toLowerCase());
      if (filtered.length > 0) pool = filtered;
    } else if (session.mode.categoryRule === "weakness") {
      // Weakness: Music, Cinema, Literature, Art
      const weaknessPool = pool.filter((q) => ["Music", "Cinema", "Literature", "Art"].includes(q.category));
      if (weaknessPool.length > 0) pool = weaknessPool;
    }

    // Difficulty curve selection
    if (session.mode.difficultyRule === "escalating" || session.mode.slug === "ladder") {
      const stage = session.ladderStage || Math.min(4, Math.floor(index / 3) + 1);
      if (stage === 1) pool = pool.filter((q) => q.difficulty === "easy");
      else if (stage === 2) pool = pool.filter((q) => q.difficulty === "medium");
      else if (stage >= 3) pool = pool.filter((q) => q.difficulty === "hard");
      if (pool.length === 0) pool = SEED_QUESTIONS;
    }

    const safeIndex = index % pool.length;
    return pool[safeIndex] || pool[0]!;
  }

  private getSanitizedQuestionForSession(session: ModeSessionState, index: number) {
    const raw = this.getRawQuestionForSession(session, index);
    return {
      id: raw.id,
      index: index + 1,
      total: session.mode.questionCount,
      prompt: raw.prompt,
      category: raw.category,
      difficulty: raw.difficulty,
      seconds: session.mode.timePerQuestionMs ? Math.round(session.mode.timePerQuestionMs / 1000) : 10,
      inputType: session.mode.answerInputType,
      answers: raw.answers.map((a) => ({ id: a.id, label: a.label })), // Stripped isCorrect
    };
  }

  public getPersonalBest(userId: string, modeSlug: string): number {
    return this.personalBests.get(`${userId}_${modeSlug}`) || 0;
  }

  public getTowerFloor(userId: string, category: string): number {
    return this.towerProgress.get(`${userId}_${category}`) || 1;
  }
}

export const modeEngine = new ModeEngine();
