import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { AnswerCard, ScoreCounter, Timer, type AnswerState } from "@/components/kit/game";
import { Avatar } from "@/components/kit/badges";
import { currentUser, questions, rivalOpponent } from "@/data/mock";
import { playCue, useCountdown } from "@/lib/game";
import { setLastMatch } from "@/lib/session";
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

type OpponentState = "thinking" | "answered";

function RankedMatch() {
  const navigate = useNavigate();
  const [round, setRound] = React.useState(0);
  const [picked, setPicked] = React.useState<string | null>(null);
  const [scores, setScores] = React.useState({ you: 0, them: 0 });
  const [opponent, setOpponent] = React.useState<OpponentState>("thinking");
  const [banner, setBanner] = React.useState<"won" | "lost" | null>(null);

  const question = ROUNDS[round]!;
  const answered = picked !== null;
  const { left, urgent, reset } = useCountdown(question.seconds, !answered, () => {
    if (!answered) resolve("");
  });

  React.useEffect(() => {
    const delay = 2500 + (round % 3) * 900;
    const t = setTimeout(() => setOpponent("answered"), delay);
    return () => clearTimeout(t);
  }, [round]);

  function resolve(answerId: string) {
    const youCorrect = answerId === question.correctAnswerId;
    const theyCorrect = round % 3 !== 1;
    setPicked(answerId || "timeout");
    setOpponent("answered");
    playCue(youCorrect ? "answer-correct" : "answer-wrong");
    setScores((s) => ({
      you: s.you + (youCorrect ? 1 : 0),
      them: s.them + (theyCorrect ? 1 : 0),
    }));
    setBanner(youCorrect && !theyCorrect ? "won" : !youCorrect && theyCorrect ? "lost" : null);

    setTimeout(() => {
      if (round === ROUNDS.length - 1) {
        setLastMatch({
          playerScore: scores.you + (youCorrect ? 1 : 0),
          opponentScore: scores.them + (theyCorrect ? 1 : 0),
        });
        navigate({ to: "/match-result" });
        return;
      }
      setRound((r) => r + 1);
      setPicked(null);
      setOpponent("thinking");
      setBanner(null);
      reset();
    }, 1800);
  }

  function stateFor(id: string): AnswerState {
    if (!answered) return "idle";
    if (id === question.correctAnswerId) return "correct";
    if (id === picked) return "wrong";
    return "dimmed";
  }

  return (
    <div className="stage flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto grid w-full max-w-3xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar initials={currentUser.initials} color={currentUser.avatarColor} size={36} />
            <div className="min-w-0">
              <div className="display truncate text-sm">{currentUser.username}</div>
              <ScoreCounter value={scores.you} size="md" className="text-2xl" />
            </div>
          </div>
          <div className="label-xs text-center text-muted-foreground">
            Round {round + 1}/{ROUNDS.length}
          </div>
          <div className="flex min-w-0 flex-row-reverse items-center gap-2 text-right">
            <Avatar initials={rivalOpponent.initials} color={rivalOpponent.avatarColor} size={36} />
            <div className="min-w-0">
              <div className="display truncate text-sm">{rivalOpponent.username}</div>
              <ScoreCounter value={scores.them} size="md" className="text-2xl" />
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-8 sm:px-6">
        <div className="flex flex-col items-center gap-4 py-5 text-center sm:py-8">
          <span className="label-xs rounded-full border border-border bg-surface px-3 py-1 text-primary">
            {question.category}
          </span>
          <Timer seconds={left} total={question.seconds} urgent={urgent && !answered} />
          <h1 className="display max-w-2xl text-balance text-2xl sm:text-4xl">{question.prompt}</h1>
          <span
            className={cn(
              "label-xs rounded-full px-3 py-1",
              opponent === "thinking"
                ? "bg-surface text-muted-foreground"
                : "bg-accent/15 text-accent",
            )}
          >
            {opponent === "thinking" ? "Opponent thinking…" : "Opponent answered"}
          </span>
        </div>

        <div className="mt-auto grid gap-3 sm:grid-cols-2">
          {question.answers.map((a, i) => (
            <AnswerCard
              key={a.id}
              answer={a}
              index={i}
              state={stateFor(a.id)}
              disabled={answered}
              onSelect={() => resolve(a.id)}
            />
          ))}
        </div>
      </div>

      {banner && (
        <div
          className={cn(
            "pointer-events-none fixed inset-x-0 top-1/3 z-50 text-center",
            banner === "won" ? "text-primary" : "text-danger",
          )}
        >
          <div className="display animate-slam text-6xl sm:text-8xl">
            {banner === "won" ? "Round won" : "Round lost"}
          </div>
        </div>
      )}
    </div>
  );
}
