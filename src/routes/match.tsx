import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { AnswerCard, ScoreCounter, Timer, type AnswerState } from "@/components/kit/game";
import { Avatar } from "@/components/kit/badges";
import { fmt, playCue } from "@/lib/game";
import { setLastMatch } from "@/lib/session";
import { profileRepo, rankedRepo, RankedMatchSnapshotDTO, SanitizedRoundDTO } from "@/repositories";
import { cn } from "@/lib/utils";

export interface MatchSearch {
  matchId?: string | undefined;
}

export const Route = createFileRoute("/match")({
  validateSearch: (search: Record<string, unknown>): MatchSearch => {
    return {
      matchId: search["matchId"] ? String(search["matchId"]) : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Ranked Match — IQ ARENA" },
      { name: "description", content: "Live ranked match: same questions, same clock, ELO on the line." },
    ],
  }),
  component: RankedMatch,
});

type DuelStage = "answering" | "locked" | "revealed";

function RankedMatch() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const matchId = search.matchId || "match-demo-live";

  const [profile, setProfile] = React.useState<any>(null);
  const [snapshot, setSnapshot] = React.useState<RankedMatchSnapshotDTO | null>(null);
  const [picked, setPicked] = React.useState<string | null>(null);
  const [revealedCorrectId, setRevealedCorrectId] = React.useState<string | null>(null);
  const [stage, setStage] = React.useState<DuelStage>("answering");
  const [timeLeft, setTimeLeft] = React.useState(10);
  const [banner, setBanner] = React.useState<"won" | "lost" | null>(null);

  React.useEffect(() => {
    let isCancelled = false;
    let unsubscribe: (() => void) | undefined;

    async function init() {
      const p = await profileRepo.getProfile();
      if (isCancelled) return;
      setProfile(p);

      try {
        const snap = await rankedRepo.getMatchSnapshot(matchId, p.id);
        if (isCancelled) return;
        setSnapshot(snap);

        if (snap.round) {
          setTimeLeft(snap.round.secondsRemaining || 10);
          if (snap.round.selfAnswer) {
            setPicked(snap.round.selfAnswer.selectedOptionId);
            setStage(snap.round.status === "revealed" ? "revealed" : "locked");
          }
          if (snap.round.reveal) {
            setRevealedCorrectId(snap.round.reveal.correctOptionId);
          }
        }

        unsubscribe = rankedRepo.subscribeMatch(matchId, p.id, (updatedSnap) => {
          setSnapshot(updatedSnap);

          if (updatedSnap.state === "completed" && updatedSnap.completedResult) {
            const isUserA = updatedSnap.playerA.id === p.id;
            setLastMatch({
              playerScore: isUserA ? updatedSnap.playerA.score : updatedSnap.playerB.score,
              opponentScore: isUserA ? updatedSnap.playerB.score : updatedSnap.playerA.score,
              won: updatedSnap.completedResult.winnerId === p.id,
              isDraw: updatedSnap.completedResult.isDraw,
              eloDelta: isUserA ? updatedSnap.completedResult.playerADelta : updatedSnap.completedResult.playerBDelta,
              newElo: isUserA ? updatedSnap.completedResult.playerARatingAfter : updatedSnap.completedResult.playerBRatingAfter,
              oldElo: isUserA ? updatedSnap.completedResult.playerARatingBefore : updatedSnap.completedResult.playerBRatingBefore,
              score: {
                you: isUserA ? updatedSnap.playerA.score : updatedSnap.playerB.score,
                them: isUserA ? updatedSnap.playerB.score : updatedSnap.playerA.score,
              },
              opponent: isUserA ? updatedSnap.playerB : updatedSnap.playerA,
            });

            navigate({ to: "/match-result" });
            return;
          }

          if (updatedSnap.round) {
            if (updatedSnap.round.reveal) {
              setRevealedCorrectId(updatedSnap.round.reveal.correctOptionId);
              setStage("revealed");
            } else if (updatedSnap.round.status === "active") {
              setPicked(null);
              setRevealedCorrectId(null);
              setStage("answering");
              setTimeLeft(updatedSnap.round.secondsRemaining || 10);
              setBanner(null);
            }
          }
        });
      } catch (err) {
        console.error("Match snapshot load failed:", err);
      }
    }

    init();

    return () => {
      isCancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, [matchId, navigate]);

  React.useEffect(() => {
    if (stage !== "answering" || !snapshot?.round?.expiresAt) return;

    const tick = () => {
      const expiresAtMs = new Date(snapshot.round!.expiresAt).getTime();
      const remaining = Math.max(0, Math.ceil((expiresAtMs - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        handleSelectAnswer("timeout");
      }
    };

    tick();
    const timer = setInterval(tick, 250);

    return () => clearInterval(timer);
  }, [stage, snapshot?.round?.expiresAt]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (stage !== "answering" || !snapshot?.round) return;
      const key = e.key.toUpperCase();
      let selectedIdx = -1;
      if (key === "1" || key === "A") selectedIdx = 0;
      else if (key === "2" || key === "B") selectedIdx = 1;
      else if (key === "3" || key === "C") selectedIdx = 2;
      else if (key === "4" || key === "D") selectedIdx = 3;

      if (selectedIdx >= 0 && selectedIdx < snapshot.round.options.length) {
        handleSelectAnswer(snapshot.round.options[selectedIdx]!.id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [stage, snapshot]);

  const handleSelectAnswer = async (answerId: string) => {
    if (stage !== "answering" || !snapshot?.round || !profile) return;
    const chosen = answerId || "timeout";
    setPicked(chosen);
    setStage("locked");
    playCue("select");

    const clientTelemetryMs = (10 - timeLeft) * 1000;
    try {
      const res = await rankedRepo.submitRoundAnswer(
        matchId,
        snapshot.currentRound,
        profile.id,
        chosen,
        clientTelemetryMs,
      );

      if (res.bothAnswered && res.snapshot?.round?.reveal) {
        setRevealedCorrectId(res.snapshot.round.reveal.correctOptionId);
        setStage("revealed");
        const wasCorrect = res.snapshot.round.reveal.correctOptionId === chosen;
        playCue(wasCorrect ? "answer-correct" : "answer-wrong");
      }
    } catch (e) {
      console.error("Answer submission failed:", e);
    }
  };

  if (!snapshot || !profile || !snapshot.round) {
    return (
      <div className="stage min-h-screen grid place-items-center bg-background text-foreground">
        <div className="text-center space-y-2">
          <div className="animate-spin text-primary text-2xl">⏳</div>
          <div className="font-bold">Syncing Server Match...</div>
        </div>
      </div>
    );
  }

  const isYouA = snapshot.playerA.id === profile.id;
  const you = isYouA ? snapshot.playerA : snapshot.playerB;
  const opp = isYouA ? snapshot.playerB : snapshot.playerA;

  const currentQ = snapshot.round;
  const isOpponentLocked = snapshot.round.opponentLocked;

  return (
    <div className="stage min-h-screen bg-background px-4 py-6 select-none flex flex-col justify-between max-w-xl mx-auto">
      <div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar initials={you.initials} color={you.avatarColor} size={44} ring />
            <div className="min-w-0">
              <div className="font-bold text-sm truncate">{you.username}</div>
              <div className="text-xs text-muted-foreground font-mono">{fmt(you.rating)} ELO</div>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono">
            <ScoreCounter value={you.score} size="md" />
            <span className="text-muted-foreground text-xl font-black">—</span>
            <ScoreCounter value={opp.score} size="md" />
          </div>

          <div className="flex items-center justify-end gap-2.5 min-w-0">
            <div className="min-w-0 text-right">
              <div className="font-bold text-sm truncate">{opp.username}</div>
              <div className="text-xs text-muted-foreground font-mono">{fmt(opp.rating)} ELO</div>
            </div>
            <Avatar initials={opp.initials} color={opp.avatarColor} size={44} ring />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="label-xs text-muted-foreground font-bold">
            Round {snapshot.currentRound} of {snapshot.totalRounds}
          </div>
          <div className="flex items-center gap-3">
            {isOpponentLocked && (
              <span className="label-xs rounded bg-accent/20 text-accent border border-accent/40 px-2 py-0.5 animate-pulse font-black">
                ⚡ Opponent Locked In
              </span>
            )}
            <Timer seconds={timeLeft} total={10} urgent={timeLeft <= 3} />
          </div>
        </div>
      </div>

      <div className="my-auto space-y-5">
        <div className="rounded-3xl border-2 border-primary/30 bg-surface p-6 text-center space-y-2 shadow-[var(--shadow-lift)]">
          <div className="label-xs text-primary font-black uppercase tracking-wider">
            {currentQ.category} · {currentQ.difficulty}
          </div>
          <h2 className="display text-2xl sm:text-3xl font-black leading-snug">
            {currentQ.prompt}
          </h2>
        </div>

        <div className="grid gap-2.5">
          {currentQ.options.map((opt, idx) => {
            const isPicked = picked === opt.id;
            let answerState: AnswerState = "idle";

            if (stage === "revealed") {
              if (opt.id === revealedCorrectId) {
                answerState = "correct";
              } else if (isPicked) {
                answerState = "wrong";
              }
            } else if (isPicked) {
              answerState = "selected";
            }

            return (
              <AnswerCard
                key={opt.id}
                index={idx}
                answer={{ id: opt.id, label: opt.label }}
                state={answerState}
                disabled={stage !== "answering"}
                onSelect={() => handleSelectAnswer(opt.id)}
              />
            );
          })}
        </div>

        {stage === "locked" && (
          <div className="rounded-2xl border border-primary/40 bg-primary/10 p-3 text-center text-xs font-bold text-primary animate-pulse">
            ✓ Answer Locked In · Waiting for simultaneous reveal...
          </div>
        )}
      </div>

      <div className="text-center text-xs text-muted-foreground pt-4">
        Ranked Classic · Server Authoritative Sync
      </div>
    </div>
  );
}
