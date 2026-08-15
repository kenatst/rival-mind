import * as React from "react";
import { X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { AnswerCard, ScoreCounter, Timer, type AnswerState } from "@/components/kit/game";
import { ProgressBar } from "@/components/kit/primitives";
import { playCue, useCountdown } from "@/lib/game";
import type { Question } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface QuizFeedback {
  correct: boolean;
  xp: number;
  streak: number;
  fasterThan: number;
}

export function QuizEngine({
  questions,
  onFinish,
  header,
  exitTo = "/",
}: {
  questions: Question[];
  onFinish: (score: number) => void;
  header?: React.ReactNode;
  exitTo?: string;
}) {
  const [index, setIndex] = React.useState(0);
  const [picked, setPicked] = React.useState<string | null>(null);
  const [score, setScore] = React.useState(0);
  const [streak, setStreak] = React.useState(6);
  const [feedback, setFeedback] = React.useState<QuizFeedback | null>(null);

  const question = questions[index]!;
  const answered = picked !== null;

  const { left, urgent, reset } = useCountdown(question.seconds, !answered, () => {
    if (!answered) resolve("");
  });

  React.useEffect(() => {
    if (urgent && !answered) playCue("countdown");
  }, [urgent, answered]);

  function resolve(answerId: string) {
    const correct = answerId === question.correctAnswerId;
    setPicked(answerId || "timeout");
    playCue(correct ? "answer-correct" : "answer-wrong");
    if (correct) setScore((s) => s + 1);
    setStreak((s) => (correct ? s + 1 : 0));
    setFeedback({
      correct,
      xp: correct ? 80 + left * 8 : 12,
      streak: correct ? streak + 1 : 0,
      fasterThan: correct ? Math.min(98, 40 + left * 6) : 0,
    });
  }

  function next() {
    const last = index === questions.length - 1;
    if (last) {
      onFinish(score);
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
    setFeedback(null);
    reset();
  }

  function stateFor(answerId: string): AnswerState {
    if (!answered) return "idle";
    if (answerId === question.correctAnswerId) return "correct";
    if (answerId === picked) return "wrong";
    return "dimmed";
  }

  return (
    <div className="stage flex min-h-screen flex-col bg-background">
      <header className="mx-auto flex w-full max-w-3xl items-center gap-4 px-4 py-4 sm:px-6">
        <Link
          to={exitTo as "/"}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
          aria-label="Leave quiz"
        >
          <X size={20} strokeWidth={2.5} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="label-xs flex justify-between text-muted-foreground">
            <span>
              Question {index + 1} / {questions.length}
            </span>
            <span className="text-primary">🔥 {streak}</span>
          </div>
          <ProgressBar className="mt-2" value={(index + (answered ? 1 : 0)) / questions.length} height={6} />
        </div>
        <ScoreCounter value={score} size="md" />
      </header>

      {header}

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-8 sm:px-6">
        <div className="flex flex-col items-center gap-4 py-4 text-center sm:py-8">
          <span className="label-xs rounded-full border border-border bg-surface px-3 py-1 text-primary">
            {question.category}
          </span>
          <Timer seconds={left} total={question.seconds} urgent={urgent && !answered} />
          <h1 className="display max-w-2xl text-balance text-2xl sm:text-4xl">{question.prompt}</h1>
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

      {feedback && (
        <FeedbackBar feedback={feedback} onNext={next} last={index === questions.length - 1} />
      )}
    </div>
  );
}

function FeedbackBar({
  feedback,
  onNext,
  last,
}: {
  feedback: QuizFeedback;
  onNext: () => void;
  last: boolean;
}) {
  return (
    <div
      className={cn(
        "animate-rise sticky bottom-0 border-t backdrop-blur",
        feedback.correct
          ? "border-success/40 bg-success/10"
          : "border-danger/40 bg-danger/10",
      )}
    >
      <div className="mx-auto grid w-full max-w-3xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-4 sm:px-6">
        <div className="min-w-0">
          <div
            className={cn(
              "display text-2xl sm:text-3xl",
              feedback.correct ? "text-success" : "text-danger",
            )}
          >
            {feedback.correct ? "Correct" : "Wrong"}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="numeric text-base text-foreground">+{feedback.xp} XP</span>
            {feedback.correct && <span>🔥 x{feedback.streak}</span>}
            {feedback.correct && <span>Faster than {feedback.fasterThan}% of players</span>}
          </div>
        </div>
        <button
          onClick={onNext}
          className="display h-12 rounded-xl bg-primary px-6 text-sm text-primary-foreground shadow-[0_4px_0_0_color-mix(in_oklab,var(--primary)_55%,black)] active:translate-y-[2px]"
        >
          {last ? "See result" : "Next"}
        </button>
      </div>
    </div>
  );
}
