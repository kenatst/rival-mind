import { describe, it, expect } from "bun:test";
import { divisionForElo, fmt } from "@/lib/game";
import { calculateEloOutcome } from "@/engine/ratingCalculator";
import { authoritativeGameEngine } from "@/engine/gameEngine";

describe("IQ ARENA - Division & Rating Hierarchy", () => {
  it("computes exact divisions with subdivisions", () => {
    expect(divisionForElo(720).tier).toBe("Rookie");
    expect(divisionForElo(910).label).toBe("Bronze II");
    expect(divisionForElo(1120).label).toBe("Silver II");
    expect(divisionForElo(1310).label).toBe("Gold II");
    expect(divisionForElo(1510).label).toBe("Platinum II");
    expect(divisionForElo(1657).label).toBe("Diamond III");
    expect(divisionForElo(1795).label).toBe("Diamond I");
    expect(divisionForElo(1795).isPromotionZone).toBe(true);
    expect(divisionForElo(1910).label).toBe("Master II");
    expect(divisionForElo(2110).label).toBe("Grandmaster II");
    expect(divisionForElo(2250).label).toBe("Legend");
  });
});

describe("IQ ARENA - Server-Authoritative Elo (K=24)", () => {
  it("calculates expected Elo shifts on win against higher rated opponent", () => {
    const outcome = calculateEloOutcome(1657, 1691, 7, 5, 24);
    expect(outcome.playerADelta).toBeGreaterThan(12);
    expect(outcome.playerARatingAfter).toBe(1657 + outcome.playerADelta);
    expect(outcome.playerBDelta).toBeLessThan(0);
  });

  it("calculates balanced expected Elo on equal ratings", () => {
    const outcome = calculateEloOutcome(1600, 1600, 8, 4, 24);
    expect(outcome.playerADelta).toBe(12);
    expect(outcome.playerBDelta).toBe(-12);
  });
});

describe("IQ ARENA - Authoritative Question Delivery & Anti-Cheat", () => {
  it("delivers questions WITHOUT leaking correct answers", () => {
    const session = authoritativeGameEngine.startSession("test-user-1", "training", "history");
    expect(session.questions.length).toBeGreaterThan(0);

    const firstQ = session.questions[0]!;
    expect(firstQ.answers.length).toBe(4);
    // CRITICAL: Ensure answers do not contain isCorrect property!
    firstQ.answers.forEach((ans) => {
      expect((ans as any).isCorrect).toBeUndefined();
    });
  });

  it("authoritatively validates answers and prevents duplicate submissions", () => {
    const session = authoritativeGameEngine.startSession("test-user-2", "training");
    const firstQ = session.questions[0]!;
    const chosenOption = firstQ.answers[0]!.id;

    const result = authoritativeGameEngine.submitAnswer(
      session.sessionId,
      firstQ.instanceId,
      chosenOption,
      2500,
    );

    expect(typeof result.wasCorrect).toBe("boolean");
    expect(typeof result.correctOptionId).toBe("string");
    expect(result.xpAwarded).toBeGreaterThan(0);

    // Duplicate submission must throw an error
    expect(() => {
      authoritativeGameEngine.submitAnswer(
        session.sessionId,
        firstQ.instanceId,
        chosenOption,
        2500,
      );
    }).toThrow("Duplicate submission");
  });
});

describe("IQ ARENA - Daily Challenge & Moderation", () => {
  it("enforces single official attempt on Daily challenge", () => {
    const challengeDate = "2026-08-15";
    const userId = "test-daily-user-99";

    const attempt1 = authoritativeGameEngine.submitDailyChallenge(challengeDate, userId, 11);
    expect(attempt1.status).toBe("recorded");
    expect(attempt1.isPractice).toBe(false);

    const attempt2 = authoritativeGameEngine.submitDailyChallenge(challengeDate, userId, 12);
    expect(attempt2.status).toBe("already_submitted");
    expect(attempt2.isPractice).toBe(true);
  });

  it("handles question reporting and admin quarantine", () => {
    const report = authoritativeGameEngine.reportQuestion(
      "geo-001",
      "user-1",
      "ambiguous",
      "Please verify unit conversion",
    );
    expect(report.status).toBe("pending");

    authoritativeGameEngine.quarantineQuestion("geo-001", "admin-1", "Under review");
    const questions = authoritativeGameEngine.getQuestionsForAdmin("verified");
    expect(questions.some((q) => q.id === "geo-001")).toBe(false);
  });
});
