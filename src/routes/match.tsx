import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { AnswerCard, ScoreCounter, Timer, type AnswerState } from "@/components/kit/game";
import { Avatar } from "@/components/kit/badges";
import { questions, rivalOpponent } from "@/data/mock";
import { playCue, useCountdown } from "@/lib/game";
import { setLastMatch } from "@/lib/session";
import { gameService } from "@/lib/gameService";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/match")({
  head: () => ({
    meta: [
      { title: "Ranked match — QuizArena" },
      { name: "description", content: "Live ranked match: same questions, same clock, ELO on the line." },
      { property: "og:title", content: "Ranked match — QuizArena" },
      { property: "og:description", content: "Head-to-head knowledge duel in progress." },
    ],
  }),
  component: RankedMatch,
});

const ROUNDS = questions.slice(0, 8);

type DuelStage = "answering" | "locked" | "revealed";

function RankedMatch() {
  const navigate = useNavigate();
  const [profile] = React.useState(() => gameService.getUserProfile());
  const [round, setRound] = React.useState(0);
  const [picked, setPicked] = React.useState<string | null>(null);
  const [scores, setScores] = React.useState({ you: 0, them: 0 });
  const [stage, setStage] = React.useState<DuelStage>("answering");
  const [opponentLocked, setOpponentLocked] = React.useState(false);
  const [banner, setBanner] = React.useState<"won" | "lost" | null>(null);

  const question = ROUNDS[round]!;
  const isAnswering = stage === "answering";

  const { left, urgent, reset } = useCountdown(question.seconds, isAnswering, () => {
    if (stage === "answering") {
      handleSelectAnswer("timeout");
    }
  });

  // Opponent lock simulation
  React.useEffect(() => {
    const oppDelay = 2200 + (round % 3) * 800;
    const t = setTimeout(() => {
      setOpponentLocked(true);
    }, oppDelay);
    return () => clearTimeout(t);
  }, [round]);

  const handleSelectAnswer = (answerId: string) => {
    if (stage !== "answering") return;
    setPicked(answerId);
    setStage("locked");
    playCue("select");

    // Suspense Beat: Wait 1.4s before simultaneous reveal
    setTimeout(() => {
      const youCorrect = answerId === question.correctAnswerId;
      const theyCorrect = (round + 1) % 3 !== 0; // opponent gets ~66% right

      setStage("revealed");
      playCue(youCorrect ? "answer-correct" : "answer-wrong");

      const newScores = {
        you: scores.you + (youCorrect ? 1 : 0),
        them: scores.them + (theyCorrect ? 1 : 0),
      };
      setScores(newScores);

      if (youCorrect && !theyCorrect) {
        setBanner("won");
      } else if (!youCorrect && theyCorrect) {
        setBanner("lost");
      }

      // Next round transition
      setTimeout(() => {
        if (round === ROUNDS.length - 1) {
          setLastMatch({
            playerScore: newScores.you,
            opponentScore: newScores.them,
          });
          navigate({ to: "/match-result" });
          return;
        }
        setRound((r) => r + 1);
        setPicked(null);
        setStage("answering");
        setOpponentLocked(false);
        setBanner(null);
        reset();
      }, 1900);
    }, 1400);
  };

  function stateFor(id: string): AnswerState {
    if (stage === "answering") return "idle";
    if (stage === "locked") {
      return id === picked ? "selected" : "idle";
    }
    // stage === 'revealed'
    if (id === question.correctAnswerId) return "correct";
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
            Round {round + 1}/{ROUNDS.length}
          </div>
          <div className="flex min-w-0 flex-row-reverse items-center gap-2 text-right">
            <Avatar initials={rivalOpponent.initials} color={rivalOpponent.avatarColor} size={36} />
            <div className="min-w-0">
              <div className="display truncate text-sm font-bold">{rivalOpponent.username}</div>
              <ScoreCounter value={scores.them} size="md" className="text-2xl text-accent font-black" />
            </div>
          </div>
        </div>
      </header>

      {/* Center Question Arena */}
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-8 sm:px-6 justify-between">
        <div className="flex flex-col items-center gap-4 py-5 text-center sm:py-8">
          <span className="label-xs rounded-full border border-border bg-surface px-3.5 py-1 text-primary font-black">
            {question.category}
          </span>
          <Timer seconds={left} total={question.seconds} urgent={urgent && isAnswering} />
          <h1 className="display max-w-2xl text-balance text-2xl sm:text-4xl text-foreground font-black">
            {question.prompt}
          </h1>

          {/* Staged Tension Indicator */}
          <div className="flex items-center gap-2">
            {stage === "locked" && (
              <span className="label-xs rounded-full bg-gold/20 text-gold border border-gold/40 px-3 py-1 animate-pulse">
                ⚡ Answer Locked · Revealing in a moment…
              </span>
            )}
            {stage === "answering" && (
              <span
                className={cn(
                  "label-xs rounded-full px-3 py-1 font-mono transition-colors",
                  opponentLocked ? "bg-accent/15 text-accent border border-accent/30" : "bg-surface text-muted-foreground border border-border",
                )}
              >
                {opponentLocked ? "Opponent locked in!" : "Opponent thinking…"}
              </span>
            )}
          </div>
        </div>

        {/* 4 Answers Grid */}
        <div className="grid gap-3 sm:grid-cols-2 pt-4">
          {question.answers.map((a, i) => (
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
