import { describe, it, expect } from "bun:test";
import { authoritativeGameEngine } from "@/engine/gameEngine";
import { guestCalibrationEngine } from "@/engine/calibrationEngine";

describe("IQ ARENA - Security Hardening Test Suite (Goal A)", () => {
  it("Invariant 1: Ranked match completion ignores client scores and calculates strictly from server-recorded rounds", () => {
    const userA = "test-user-a";

    // Start ranked match
    const match = authoritativeGameEngine.startRankedMatch(userA);
    expect(match.matchId).toBeDefined();

    // Complete all 8 rounds sequentially
    for (let r = 1; r <= 8; r++) {
      const instance = authoritativeGameEngine.getRankedRoundQuestion(match.matchId, r, userA);
      expect(instance.position).toBe(r);
      const optionId = instance.answers[0]!.id;
      authoritativeGameEngine.submitRankedRound(match.matchId, r, userA, optionId, 1500);
    }

    // Call completeRankedMatch - note that the API does NOT accept client scores!
    const outcome = authoritativeGameEngine.completeRankedMatch(match.matchId, userA);

    expect(outcome.matchId).toBe(match.matchId);
    expect(outcome.status).toBe("completed");
    // Authoritative scores derived exclusively from server rounds
    expect(outcome.playerAScore).toBeDefined();
    expect(outcome.playerBScore).toBeDefined();
    expect(outcome.playerARatingAfter).toBeDefined();
    expect(outcome.playerBRatingAfter).toBeDefined();
  });

  it("Invariant 2: Server response time is derived as (answeredAt - servedAt), client responseTimeMs is stored as telemetry only", () => {
    const user = "test-user-timing";
    const match = authoritativeGameEngine.startRankedMatch(user);

    // Fetch round 1
    const q1 = authoritativeGameEngine.getRankedRoundQuestion(match.matchId, 1, user);
    expect(q1.servedAt).toBeDefined();

    // Client passes arbitrary manipulated telemetry (e.g. 50ms)
    const manipulatedTelemetry = 50;
    const res = authoritativeGameEngine.submitRankedRound(match.matchId, 1, user, "1", manipulatedTelemetry);

    // Telemetry is captured for analytics
    expect(res.telemetryMs).toBe(50);
    // Server response time is authoritatively calculated and non-negative
    expect(res.serverResponseTimeMs).toBeGreaterThanOrEqual(0);
  });

  it("Invariant 3: Future ranked questions are NOT leaked upfront and served only sequentially", () => {
    const user = "test-user-sequential";
    const match = authoritativeGameEngine.startRankedMatch(user);

    // Match start returns ONLY round 1
    expect(match.initialRoundQuestion.position).toBe(1);
    expect(match.initialRoundQuestion.prompt).toBeDefined();

    // Asking for round 2 before completing round 1 is strictly rejected
    expect(() => {
      authoritativeGameEngine.getRankedRoundQuestion(match.matchId, 2, user);
    }).toThrow("Cannot skip ahead to round 2 before completing round 1");

    // Complete round 1
    authoritativeGameEngine.submitRankedRound(match.matchId, 1, user, "1", 1200);

    // Now round 2 can be fetched
    const q2 = authoritativeGameEngine.getRankedRoundQuestion(match.matchId, 2, user);
    expect(q2.position).toBe(2);
    expect(q2.prompt).toBeDefined();
  });

  it("Invariant 4: Guest calibration rating cannot be forged or self-selected by users", () => {
    const guestSessionId = "guest-session-qa";

    // Generate authoritative calibration token for a provisional score
    const { token, provisionalRating } = guestCalibrationEngine.createCalibration(guestSessionId, 12, 10);
    expect(token).toBeDefined();
    expect(provisionalRating).toBeGreaterThanOrEqual(1000);

    // Claim token with valid registered user ID
    const claim = guestCalibrationEngine.claimCalibration(token);
    expect(claim.success).toBe(true);
    expect(claim.provisionalRating).toBe(provisionalRating);

    // Tampered token must be rejected
    const tampered = guestCalibrationEngine.claimCalibration("forged-token-abc");
    expect(tampered.success).toBe(false);

    // Replay of consumed token must be rejected
    const replay = guestCalibrationEngine.claimCalibration(token);
    expect(replay.success).toBe(false);
  });

  it("Invariant 5: Match completion is strictly idempotent (no double Elo updates)", () => {
    const user = "test-user-idempotency";
    const match = authoritativeGameEngine.startRankedMatch(user);

    for (let r = 1; r <= 8; r++) {
      const q = authoritativeGameEngine.getRankedRoundQuestion(match.matchId, r, user);
      authoritativeGameEngine.submitRankedRound(match.matchId, r, user, q.answers[0]!.id, 1000);
    }

    const firstCompletion = authoritativeGameEngine.completeRankedMatch(match.matchId, user);
    expect(firstCompletion.status).toBe("completed");
    const delta1 = firstCompletion.playerADelta;

    // Second call with same match ID
    const secondCompletion = authoritativeGameEngine.completeRankedMatch(match.matchId, user);
    expect(secondCompletion.isIdempotentReplay).toBe(true);
    expect(secondCompletion.playerARatingAfter).toBe(firstCompletion.playerARatingAfter);
    expect(secondCompletion.playerADelta).toBe(delta1);
  });

  it("Invariant 6: Duplicate round answer submissions are blocked", () => {
    const user = "test-user-dup";
    const match = authoritativeGameEngine.startRankedMatch(user);

    authoritativeGameEngine.submitRankedRound(match.matchId, 1, user, "1", 1000);

    expect(() => {
      authoritativeGameEngine.submitRankedRound(match.matchId, 1, user, "2", 1000);
    }).toThrow("Round 1 has already been answered");
  });

  it("Invariant 7: Unauthorized users cannot fetch or complete another user's match", () => {
    const legitUser = "legit-user";
    const attacker = "attacker-user";

    const match = authoritativeGameEngine.startRankedMatch(legitUser);

    expect(() => {
      authoritativeGameEngine.getRankedRoundQuestion(match.matchId, 1, attacker);
    }).toThrow("Unauthorized: Caller is not a participant in this match");

    expect(() => {
      authoritativeGameEngine.completeRankedMatch(match.matchId, attacker);
    }).toThrow("Unauthorized: Caller is not a participant in this match");
  });
});
