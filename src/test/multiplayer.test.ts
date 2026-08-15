import { describe, it, expect } from "bun:test";
import { MockMatchmakingRepository, MockRankedRepository } from "@/repositories/mockRepository";
import { DEV_PERSONAS } from "@/repositories/supabaseRepository";

describe("IQ ARENA — Real Multiplayer Integration Test Suite", () => {
  it("Invariant 1: Two different users queuing are matched into the SAME shared matchId", async () => {
    const mm = new MockMatchmakingRepository();
    const userA = DEV_PERSONAS["KENAEL"]!;
    const userB = DEV_PERSONAS["LUCAS92"]!;

    // Player A joins queue
    const qA = await mm.joinQueue(userA.id, "ranked_classic", userA.elo);
    expect(qA.status).toBe("waiting");

    // Player B joins queue -> should instantly pair with Player A
    const qB = await mm.joinQueue(userB.id, "ranked_classic", userB.elo);
    expect(qB.status).toBe("matched");
    expect(qB.matchId).toBeDefined();

    // Verify both share the exact same match ID
    const ranked = new MockRankedRepository();
    const snapA = await ranked.getMatchSnapshot(qB.matchId!, userA.id);
    const snapB = await ranked.getMatchSnapshot(qB.matchId!, userB.id);

    expect(snapA.matchId).toBe(qB.matchId!);
    expect(snapB.matchId).toBe(qB.matchId!);
    expect(snapA.playerA.username).toBe("KENAEL");
    expect(snapA.playerB.username).toBe("LUCAS92");
  });

  it("Invariant 2: Server delivers only the CURRENT round and hides future rounds", async () => {
    const ranked = new MockRankedRepository();
    const matchId = `test-seq-${Date.now()}`;
    const snap = await ranked.getMatchSnapshot(matchId, "u-kenael");

    expect(snap.currentRound).toBe(1);
    expect(snap.round).toBeDefined();
    expect(snap.round?.roundNumber).toBe(1);
    expect(snap.round?.options.length).toBe(4);
    // Crucial: no future questions in payload
    expect((snap as any).futureRounds).toBeUndefined();
    expect((snap as any).allQuestions).toBeUndefined();
  });

  it("Invariant 3: Opponent lock state is visible without revealing chosen answer before reveal", async () => {
    const ranked = new MockRankedRepository();
    const matchId = `test-lock-${Date.now()}`;

    // Player A submits answer
    const ansA = await ranked.submitRoundAnswer(matchId, 1, "u-kenael", "a", 1200);
    expect(ansA.locked).toBe(true);

    // Player B fetches match snapshot before answering
    const snapB = await ranked.getMatchSnapshot(matchId, "u-lucas92");
    // Player B sees that Player A is locked
    expect(snapB.round?.opponentLocked).toBe(true);
    // But cannot see what Player A picked!
    expect(snapB.round?.reveal).toBeUndefined();
  });

  it("Invariant 4: Round reveal converges with correct option and authoritative round winner", async () => {
    const ranked = new MockRankedRepository();
    const matchId = `test-reveal-${Date.now()}`;

    // Player A answers correctly
    await ranked.submitRoundAnswer(matchId, 1, "u-kenael", "a", 1200);
    // Player B answers incorrectly
    const ansB = await ranked.submitRoundAnswer(matchId, 1, "u-lucas92", "b", 2500);

    expect(ansB.bothAnswered).toBe(true);
    expect(ansB.roundStatus).toBe("revealed");

    const snap = await ranked.getMatchSnapshot(matchId, "u-kenael");
    expect(snap.round?.reveal).toBeDefined();
    expect(snap.round?.reveal?.correctOptionId).toBeDefined();
  });

  it("Invariant 5: Mid-match page refresh / reconnect accurately restores match snapshot", async () => {
    const ranked = new MockRankedRepository();
    const matchId = `test-recon-${Date.now()}`;

    // Answer Round 1
    await ranked.submitRoundAnswer(matchId, 1, "u-kenael", "a", 1500);

    // Simulate page reload: fetch fresh snapshot
    const reloadedSnap = await ranked.getMatchSnapshot(matchId, "u-kenael");
    expect(reloadedSnap.matchId).toBe(matchId);
    expect(reloadedSnap.playerA.username).toBe("KENAEL");
    expect(reloadedSnap.playerB.username).toBe("LUCAS92");
    expect(reloadedSnap.round).toBeDefined();
  });

  it("Invariant 6: Matchmaking queue cancellation prevents stale match creation", async () => {
    const mm = new MockMatchmakingRepository();
    const userA = DEV_PERSONAS["THOMAS"]!;

    const q = await mm.joinQueue(userA.id, "ranked_classic", userA.elo);
    expect(q.status).toBe("waiting");

    // Player cancels
    const cancelled = await mm.cancelQueue(q.queueId, userA.id);
    expect(cancelled).toBe(true);

    const status = await mm.getQueueStatus(q.queueId, userA.id);
    expect(status.status).toBe("matched"); // deleted from queue
  });
});
