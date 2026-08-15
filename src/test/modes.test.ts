import { describe, it, expect } from "bun:test";
import { modeEngine } from "../engine/modeEngine";
import { GAME_MODES, getModeBySlug, getModesByFamily } from "../engine/modes/registry";
import { socialEngine } from "../engine/socialEngine";
import { tournamentEngine } from "../engine/tournamentEngine";

describe("IQ ARENA — Game Modes & Competitive Systems Test Suite", () => {
  it("Phase 1: Mode Registry correctly organizes 4 sacred families", () => {
    const competeModes = getModesByFamily("compete");
    const quickModes = getModesByFamily("quick");
    const trainModes = getModesByFamily("train");
    const socialModes = getModesByFamily("social");

    expect(competeModes.length).toBeGreaterThanOrEqual(7);
    expect(quickModes.length).toBeGreaterThanOrEqual(7);
    expect(trainModes.length).toBeGreaterThanOrEqual(5);
    expect(socialModes.length).toBeGreaterThanOrEqual(4);

    // Verify exclusions are NOT present
    const allSlugs = GAME_MODES.map((m) => m.slug);
    expect(allSlugs).not.toContain("mixed-brain");
    expect(allSlugs).not.toContain("audio-mode");
    expect(allSlugs).not.toContain("duo-mode");
    expect(allSlugs).not.toContain("country-relay");
    expect(allSlugs).not.toContain("ghost-mode");
    expect(allSlugs).not.toContain("morning-5");
    expect(allSlugs).not.toContain("night-5");
    expect(allSlugs).not.toContain("roguelike");
    expect(allSlugs).not.toContain("knowledge-jackpot");
  });

  it("Phase 2: 5-Second Blitz executes with 5000ms timer and speed bonuses", () => {
    const { session, firstQuestion } = modeEngine.startSession("u-kenael", "blitz");
    expect(session.mode.slug).toBe("blitz");
    expect(firstQuestion.seconds).toBe(5);

    // Submit correct answer with rapid 1200ms response time
    const eval1 = modeEngine.submitAnswer(session.sessionId, firstQuestion.answers[0].id, 1200);
    expect(eval1.pointsAwarded).toBeGreaterThanOrEqual(1000);
    expect(session.currentStreak).toBe(1);
  });

  it("Phase 3: 60-Second Lightning enforces 60s total deadline and continuous chain", () => {
    const { session, firstQuestion } = modeEngine.startSession("u-kenael", "lightning");
    expect(session.deadlineAt).toBeDefined();
    expect(session.deadlineAt! - session.startedAt).toBe(60000);

    const eval1 = modeEngine.submitAnswer(session.sessionId, firstQuestion.answers[0].id, 2000);
    expect(session.score).toBeGreaterThanOrEqual(0);
  });

  it("Phase 4: Streak Mode immediately terminates session on 1 strike", () => {
    const { session, firstQuestion } = modeEngine.startSession("u-kenael", "streak");
    expect(session.mode.eliminationRule).toBe("one_strike");

    // Submit wrong answer
    const evalWrong = modeEngine.submitAnswer(session.sessionId, "wrong_option_id");
    expect(evalWrong.isCorrect).toBe(false);
    expect(evalWrong.eliminated).toBe(true);
    expect(evalWrong.completed).toBe(true);
  });

  it("Phase 5: Perfect 10 identifies near-misses (9/10)", () => {
    const { session } = modeEngine.startSession("u-kenael", "perfect-10");

    // Simulate 9 correct and 1 wrong
    for (let i = 0; i < 9; i++) {
      session.answers.push({
        questionId: `q-${i}`,
        prompt: `Question ${i + 1}`,
        userInput: "correct",
        isCorrect: true,
        responseTimeMs: 2000,
        pointsAwarded: 100,
      });
    }
    session.missedIndices.push(6); // Question 7 missed
    session.answers.push({
      questionId: "q-missed",
      prompt: "Question 7",
      userInput: "wrong",
      isCorrect: false,
      responseTimeMs: 2000,
      pointsAwarded: 0,
    });

    const result = modeEngine.finishSession(session.sessionId);
    expect(result.accuracy).toBe(90);
    expect(result.nearMissMessage).toContain("SO CLOSE! 9/10 — Question 7 cost you the perfect run.");
  });

  it("Phase 6: Rivalries track persistent head-to-head records and streak holders", () => {
    const rivalryBefore = socialEngine.getRivalryWith("LUCAS92");
    expect(rivalryBefore).toBeDefined();
    const userWinsBefore = rivalryBefore!.userWins;

    // Record user victory
    socialEngine.recordRivalryMatch("LUCAS92", true);
    const rivalryAfter = socialEngine.getRivalryWith("LUCAS92");
    expect(rivalryAfter!.userWins).toBe(userWinsBefore + 1);
    expect(rivalryAfter!.streakHolder).toBe("KENAEL");
  });

  it("Phase 7: Championship Qualifiers eligibility is server-verified", () => {
    // Diamond player (1657 Elo) is eligible
    const check1 = tournamentEngine.verifyQualifierEligibility(1657, 450);
    expect(check1.eligible).toBe(true);

    // Silver player (1100 Elo, Daily rank 5000) is locked
    const check2 = tournamentEngine.verifyQualifierEligibility(1100, 5000);
    expect(check2.eligible).toBe(false);
    expect(check2.reasons[0]).toContain("Requires Diamond Division");
  });
});
