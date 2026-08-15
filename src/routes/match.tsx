import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { AnswerCard, ScoreCounter, Timer, type AnswerState } from "@/components/kit/game";
import { Avatar } from "@/components/kit/badges";
import { playCue, useCountdown } from "@/lib/game";
import { setLastMatch } from "@/lib/session";
import { gameService } from "@/lib/gameService";
import { authoritativeGameEngine, ServerQuestionInstance } from "@/engine/gameEngine";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/match")({
  head: () => ({
    meta: [
      { title: "Ranked Match — IQ ARENA" },
      { name: "description", content: "Live ranked match: same questions, same clock, ELO on the line." },
      { property: "og:title", content: "Ranked Match — IQ ARENA" },
      { property: "og:description", content: "Head-to-head knowledge duel in progress." },
    ],
  }),
  component: RankedMatch,
});

type DuelStage = "answering" | "locked" | "revealed";

function RankedMatch() {
  const navigate = useNavigate();
  const [profile] = React.useState(() => gameService.getUserProfile());

  // Initialize authoritative ranked match on server (returns Round 1 question ONLY)
  const [serverMatch] = React.useState(() =>
    authoritativeGameEngine.startRankedMatch(profile.id),
  );

  const [round, setRound] = React.useState(0);
  const [currentQuestion, setCurrentQuestion] = React.useState<ServerQuestionInstance>(
    serverMatch.initialRoundQuestion,
  );
  const [picked, setPicked] = React.useState<string | null>(null);
  const [revealedCorrectId, setRevealedCorrectId] = React.useState<string | null>(null);
  const [scores, setScores] = React.useState({ you: 0, them: 0 });
  const [stage, setStage] = React.useState<DuelStage>("answering");
  const [opponentLocked, setOpponentLocked] = React.useState(false);
  const [banner, setBanner] = React.useState<"won" | "lost" | null>(null);

  const totalRounds = serverMatch.totalRounds;
  const isAnswering = stage === "answering";

  const { left, urgent, reset } = useCountdown(currentQuestion.seconds, isAnswering, () => {
    if (stage === "answering") {
      handleSelectAnswer("timeout");
    }
  });

  // Keyboard controls (1-4 or A-D)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (stage !== "answering") return;
      const key = e.key.toUpperCase();
      let selectedIdx = -1;
      if (key === "1" || key === "A") selectedIdx = 0;
      else if (key === "2" || key === "B") selectedIdx = 1;
      else if (key === "3" || key === "C") selectedIdx = 2;
      else if (key === "4" || key === "D") selectedIdx = 3;

      if (selectedIdx >= 0 && selectedIdx < currentQuestion.answers.length) {
        handleSelectAnswer(currentQuestion.answers[selectedIdx]!.id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [stage, currentQuestion]);

  // Opponent simulated behavior
  React.useEffect(() => {
    const oppDelay = 2000 + (round % 3) * 700;
    const t = setTimeout(() => {
      setOpponentLocked(true);
    }, oppDelay);
    return () => clearTimeout(t);
  }, [round]);

  const handleSelectAnswer = (answerId: string) => {
    if (stage !== "answering") return;
    const chosen = answerId || "timeout";
    setPicked(chosen);
    setStage("locked");
    playCue("select");

    // Suspense Beat: 600ms pause before simultaneous reveal
    setTimeout(() => {
      // Authoritative round submission (server evaluates correctness, scores, timing)
      const clientTelemetryMs = (10 - left) * 1000;
      const roundResult = authoritativeGameEngine.submitRankedRound(
        serverMatch.matchId,
        round + 1,
        profile.id,
        chosen,
        clientTelemetryMs,
      );

      setRevealedCorrectId(roundResult.correctOptionId || null);
      setStage("revealed");
      playCue(roundResult.wasCorrect ? "answer-correct" : "answer-wrong");

      const newScores = {
        you: roundResult.playerAScore,
        them: roundResult.playerBScore,
      };
      setScores(newScores);

      if (roundResult.wasCorrect && scores.them === roundResult.playerBScore) {
        setBanner("won");
      } else if (!roundResult.wasCorrect && scores.them < roundResult.playerBScore) {
        setBanner("lost");
      }

      // Next round transition
      setTimeout(() => {
        if (roundResult.isLastRound) {
          // Authoritatively complete match on server (Caller ID only, no client score injection!)
          authoritativeGameEngine.completeRankedMatch(
            serverMatch.matchId,
            profile.id,
          );

          setLastMatch({
            playerScore: newScores.you,
            opponentScore: newScores.them,
          });

          navigate({ to: "/match-result" });
          return;
        }

        const nextRoundNumber = round + 2;
        // Server fetches strictly the next round question
        const nextQ = authoritativeGameEngine.getRankedRoundQuestion(
          serverMatch.matchId,
          nextRoundNumber,
          profile.id,
        );

        setCurrentQuestion(nextQ);
        setRound((r) => r + 1);
        setPicked(null);
        setRevealedCorrectId(null);
        setStage("answering");
        setOpponentLocked(false);
        setBanner(null);
        reset();
      }, 1800);
    }, 600);
  };

  function stateFor(id: string): AnswerState {
    if (stage === "answering") return "idle";
    if (stage === "locked") {
      return id === picked ? "selected" : "idle";
    }
    // stage === 'revealed'
    if (id === revealedCorrectId) return "correct";
    if (id === picked) return "wrong";
    return "dimmed";
  }

  return (
    <div className="stage flex min-h-screen flex-col bg-background select-none">
      {/* Top HUD */}
      <header className="border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto grid w-full max-w-3xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar initials={profile.initials} color={profile.avatarColor} size={36} />
            <div className="min-w-0">
              <div className="display truncate text-sm font-bold">{profile.username}</div>
              <ScoreCounter value={scores.you} size="md" className="text-2xl text-primary font-black" />
            </div>
          </div>
          <div className="label-xs text-center text-muted-foreground font-mono font-bold">
            Round {round + 1}/{totalRounds}
          </div>
          <div className="flex min-w-0 flex-row-reverse items-center gap-2 text-right">
            <Avatar initials={serverMatch.playerB.initials} color={serverMatch.playerB.avatarColor} size={36} />
            <div className="min-w-0">
              <div className="display truncate text-sm font-bold">{serverMatch.playerB.username}</div>
              <ScoreCounter value={scores.them} size="md" className="text-2xl text-accent font-black" />
            </div>
          </div>
        </div>
      </header>

      {/* Center Question Arena */}
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-8 sm:px-6 justify-between">
        <div className="flex flex-col items-center gap-4 py-4 text-center sm:py-6">
          <span className="label-xs rounded-full border border-border bg-surface px-3.5 py-1 text-primary font-black">
            {currentQuestion.category}
          </span>
          <Timer seconds={left} total={currentQuestion.seconds} urgent={urgent && isAnswering} />
          <h1 className="display max-w-2xl text-balance text-2xl sm:text-4xl text-foreground font-black">
            {currentQuestion.prompt}
          </h1>

          {/* Staged Tension Indicator */}
          <div className="flex items-center gap-2 min-h-[28px]">
            {stage === "locked" && (
              <span className="label-xs rounded-full bg-gold/20 text-gold border border-gold/40 px-3.5 py-1 animate-pulse font-bold">
                ⚡ Answer Locked · Revealing…
              </span>
            )}
            {stage === "answering" && (
              <span
                className={cn(
                  "label-xs rounded-full px-3 py-1 font-mono font-bold transition-colors",
                  opponentLocked ? "bg-accent/15 text-accent border border-accent/30" : "bg-surface text-muted-foreground border border-border",
                )}
              >
                {opponentLocked ? "Opponent locked in!" : "Opponent thinking…"}
              </span>
            )}
          </div>
        </div>

        {/* 4 Answers Grid */}
        <div className="grid gap-3 sm:grid-cols-2 pt-2">
          {currentQuestion.answers.map((a, i) => (
            <AnswerCard
              key={a.id}
              answer={a}
              index={i}
              state={stateFor(a.id)}
              disabled={stage !== "answering"}
              onSelect={() => handleSelectAnswer(a.id)}
            />
          ))}
        </div>
      </div>

      {/* Round Won / Lost Slam Banner */}
      {banner && (
        <div
          className={cn(
            "pointer-events-none fixed inset-x-0 top-1/3 z-50 text-center drop-shadow-2xl",
            banner === "won" ? "text-primary" : "text-danger",
          )}
        >
          <div className="display animate-slam text-6xl sm:text-8xl font-black">
            {banner === "won" ? "ROUND WON" : "ROUND LOST"}
          </div>
        </div>
      )}
    </div>
  );
}
