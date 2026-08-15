import * as React from "react";
import { X, Flame, Swords, ArrowRight, Flag } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { AnswerCard, ScoreCounter, Timer, type AnswerState } from "@/components/kit/game";
import { ProgressBar, Button, Modal } from "@/components/kit/primitives";
import { Avatar } from "@/components/kit/badges";
import { playCue, useCountdown } from "@/lib/game";
import type { Question, MatchMode } from "@/lib/types";
import { gameService } from "@/lib/gameService";
import { authoritativeGameEngine } from "@/engine/gameEngine";
import { ReportQuestionModal } from "@/components/ReportQuestionModal";
import { friends, rivalOpponent } from "@/data/mock";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

export interface QuizFeedback {
  correct: boolean;
  xp: number;
  streak: number;
  fasterThan: number;
  correctOptionId?: string | undefined;
  explanation?: string | undefined;
}

export function QuizEngine({
  questions: _initialQuestions,
  mode = "guest",
  categoryName,
  opponentName,
  onFinish,
  exitTo = "/play",
}: {
  questions?: Question[] | undefined;
  mode?: MatchMode | undefined;
  categoryName?: string | undefined;
  opponentName?: string | undefined;
  onFinish?: ((score: number) => void) | undefined;
  exitTo?: string | undefined;
}) {
  const navigate = useNavigate();
  const [profile] = React.useState(() => gameService.getUserProfile());

  // Initialize server-authoritative session (SANITISED: No isCorrect!)
  const [serverSession] = React.useState(() =>
    authoritativeGameEngine.startSession(profile.id, mode, categoryName),
  );

  const [index, setIndex] = React.useState(0);
  const [picked, setPicked] = React.useState<string | null>(null);
  const [revealedCorrectId, setRevealedCorrectId] = React.useState<string | null>(null);
  const [score, setScore] = React.useState(0);
  const [opponentScore, setOpponentScore] = React.useState(0);
  const [streak, setStreak] = React.useState(profile.streak);
  const [feedback, setFeedback] = React.useState<QuizFeedback | null>(null);
  const [isBattleResultOpen, setIsBattleResultOpen] = React.useState(false);
  const [isReportOpen, setIsReportOpen] = React.useState(false);

  const sessionQuestions = serverSession.questions;
  const currentQuestionIndex = index % sessionQuestions.length;
  const question = sessionQuestions[currentQuestionIndex]!;
  const answered = picked !== null;

  const opponent = React.useMemo(() => {
    if (mode !== "battle") return null;
    if (opponentName) {
      const match = friends.find(
        (f) => f.username.toLowerCase() === opponentName.toLowerCase(),
      );
      if (match) return match;
    }
    return rivalOpponent;
  }, [mode, opponentName]);

  const { left, urgent, reset } = useCountdown(question.seconds, !answered, () => {
    if (!answered) resolve("");
  });

  // Keyboard accessibility
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (answered) {
        if (e.key === "Enter" || e.key === " ") {
          next();
        }
        return;
      }

      const key = e.key.toUpperCase();
      let selectedIdx = -1;
      if (key === "1" || key === "A") selectedIdx = 0;
      else if (key === "2" || key === "B") selectedIdx = 1;
      else if (key === "3" || key === "C") selectedIdx = 2;
      else if (key === "4" || key === "D") selectedIdx = 3;

      if (selectedIdx >= 0 && selectedIdx < question.answers.length) {
        resolve(question.answers[selectedIdx]!.id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [answered, question, index]);

  function resolve(answerId: string) {
    const chosen = answerId || "timeout";
    setPicked(chosen);

    // Server-Authoritative Answer Validation
    const validation = authoritativeGameEngine.submitAnswer(
      serverSession.sessionId,
      question.instanceId,
      chosen,
      (10 - left) * 1000,
    );

    setRevealedCorrectId(validation.correctOptionId || null);
    playCue(validation.wasCorrect ? "answer-correct" : "answer-wrong");

    if (validation.wasCorrect) {
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
    }

    if (mode === "battle") {
      const oppCorrect = (index + 2) % 3 !== 0;
      if (oppCorrect) {
        setOpponentScore((s) => s + 1);
      }
    }

    setFeedback({
      correct: validation.wasCorrect,
      xp: validation.xpAwarded,
      streak: validation.wasCorrect ? streak + 1 : 0,
      fasterThan: validation.wasCorrect ? Math.min(98, 40 + left * 6) : 0,
      correctOptionId: validation.correctOptionId,
      explanation: validation.explanation,
    });
  }

  function next() {
    const isLastQuestion = index === sessionQuestions.length - 1;

    if (mode === "training") {
      setIndex((i) => i + 1);
      setPicked(null);
      setRevealedCorrectId(null);
      setFeedback(null);
      reset();
      return;
    }

    if (isLastQuestion) {
      if (mode === "battle") {
        setIsBattleResultOpen(true);
        if (score >= opponentScore) {
          playCue("victory");
          try {
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 },
              colors: ["#76FF03", "#FFD600", "#00E5FF"],
            });
          } catch {}
        } else {
          playCue("defeat");
        }
        return;
      }

      onFinish?.(score + (feedback?.correct ? 1 : 0));
      return;
    }

    setIndex((i) => i + 1);
    setPicked(null);
    setRevealedCorrectId(null);
    setFeedback(null);
    reset();
  }

  function stateFor(answerId: string): AnswerState {
    if (!answered) return "idle";
    if (answerId === revealedCorrectId) return "correct";
    if (answerId === picked) return "wrong";
    return "dimmed";
  }

  return (
    <div className="stage flex min-h-screen flex-col bg-background select-none">
      {/* Top HUD */}
      <header className="mx-auto flex w-full max-w-3xl items-center gap-4 px-4 py-4 sm:px-6">
        <Link
          to={exitTo as "/"}
          className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
          aria-label="Exit mode"
        >
          <X size={22} strokeWidth={2.5} />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="label-xs flex justify-between text-muted-foreground font-bold">
            <span className="truncate">
              {mode === "training" && "⚡ Infinite Practice (Server-Authoritative)"}
              {mode === "category" && `🏛 ${categoryName ? categoryName.toUpperCase() : "CATEGORY"} RUN`}
              {mode === "battle" && `⚔️ DUEL VS ${opponent?.username.toUpperCase()}`}
              {mode === "daily" && "🎯 DAILY 12 CHALLENGE"}
              {mode === "guest" && `Question ${index + 1} / ${sessionQuestions.length}`}
              {mode !== "guest" && mode !== "training" && ` (${index + 1} / ${sessionQuestions.length})`}
            </span>
            <span className="text-gold flex items-center gap-1 font-mono">
              <Flame size={13} className="fill-gold" /> {streak}
            </span>
          </div>

          <ProgressBar
            className="mt-2"
            value={
              mode === "training"
                ? Math.min(1, (index + 1) / 50)
                : (index + (answered ? 1 : 0)) / sessionQuestions.length
            }
            height={6}
          />
        </div>

        {mode === "battle" && opponent ? (
          <div className="flex items-center gap-2 font-mono">
            <span className="numeric text-2xl text-primary font-black">{score}</span>
            <span className="text-xs text-muted-foreground">-</span>
            <span className="numeric text-2xl text-accent font-black">{opponentScore}</span>
          </div>
        ) : (
          <ScoreCounter value={score} size="md" className="text-primary font-black" />
        )}
      </header>

      {/* Battle Faceoff Sub-bar if in battle mode */}
      {mode === "battle" && opponent && (
        <div className="border-y border-border bg-surface/60 py-2 px-4">
          <div className="mx-auto flex max-w-3xl items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar initials={profile.initials} color={profile.avatarColor} size={28} />
              <span className="display text-xs font-bold">{profile.username}</span>
            </div>
            <div className="label-xs text-muted-foreground font-mono">
              Rivalry Record: 7 - 6
            </div>
            <div className="flex items-center gap-2">
              <span className="display text-xs font-bold text-accent">{opponent.username}</span>
              <Avatar initials={opponent.initials} color={opponent.avatarColor} size={28} />
            </div>
          </div>
        </div>
      )}

      {/* Question Arena */}
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-8 sm:px-6 justify-between">
        <div className="flex flex-col items-center gap-4 py-4 text-center sm:py-8">
          <span className="label-xs rounded-full border border-border bg-surface px-3.5 py-1 text-primary font-black">
            {question.category}
          </span>
          <Timer seconds={left} total={question.seconds} urgent={urgent && !answered} />
          <h1 className="display max-w-2xl text-balance text-2xl sm:text-4xl text-foreground font-black">
            {question.prompt}
          </h1>
        </div>

        {/* 4 Answers Grid */}
        <div className="grid gap-3 sm:grid-cols-2 pt-4">
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

      {/* Feedback Bar */}
      {feedback && (
        <FeedbackBar
          feedback={feedback}
          onNext={next}
          onReport={() => setIsReportOpen(true)}
          last={index === sessionQuestions.length - 1 && mode !== "training"}
        />
      )}

      {/* Report Question Modal */}
      <ReportQuestionModal
        open={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        questionId={question.questionId}
        questionPrompt={question.prompt}
      />

      {/* Battle Complete Modal */}
      {mode === "battle" && opponent && (
        <Modal
          open={isBattleResultOpen}
          onClose={() => navigate({ to: "/battles" })}
          title="Battle Result"
        >
          <div className="space-y-4 text-center">
            <div
              className={cn(
                "display text-5xl sm:text-6xl font-black",
                score >= opponentScore ? "text-primary" : "text-danger",
              )}
            >
              {score >= opponentScore ? "VICTORY" : "DEFEAT"}
            </div>

            <div className="rounded-2xl border border-border bg-surface-2 p-4 grid grid-cols-3 items-center">
              <div>
                <div className="display text-sm">{profile.username}</div>
                <div className="numeric text-4xl text-primary font-black">{score}</div>
              </div>
              <span className="display text-muted-foreground text-lg">VS</span>
              <div>
                <div className="display text-sm">{opponent.username}</div>
                <div className="numeric text-4xl text-accent font-black">{opponentScore}</div>
              </div>
            </div>

            <div className="space-y-2">
              <Button full variant="primary" onClick={() => navigate({ to: "/battles" })}>
                Back to Battles
              </Button>
              <Button
                full
                variant="surface"
                onClick={() => {
                  setIsBattleResultOpen(false);
                  setIndex(0);
                  setScore(0);
                  setOpponentScore(0);
                  setPicked(null);
                  setRevealedCorrectId(null);
                  setFeedback(null);
                  reset();
                }}
              >
                Rematch Duel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function FeedbackBar({
  feedback,
  onNext,
  onReport,
  last,
}: {
  feedback: QuizFeedback;
  onNext: () => void;
  onReport: () => void;
  last: boolean;
}) {
  return (
    <div
      className={cn(
        "animate-rise sticky bottom-0 border-t backdrop-blur z-20",
        feedback.correct
          ? "border-success/40 bg-success/15"
          : "border-danger/40 bg-danger/15",
      )}
    >
      <div className="mx-auto grid w-full max-w-3xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-4 sm:px-6">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "display text-2xl sm:text-3xl font-black",
                feedback.correct ? "text-success" : "text-danger",
              )}
            >
              {feedback.correct ? "CORRECT" : "WRONG"}
            </div>
            <button
              onClick={onReport}
              className="text-xs text-muted-foreground hover:text-danger transition-colors flex items-center gap-1 p-1 rounded-md hover:bg-surface"
              title="Report question issue"
            >
              <Flag size={13} />
            </button>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="numeric text-base text-foreground font-black">+{feedback.xp} XP</span>
            {feedback.correct && <span className="text-gold font-bold">🔥 x{feedback.streak}</span>}
            {feedback.correct && <span>Faster than {feedback.fasterThan}% of players</span>}
          </div>
          {feedback.explanation && (
            <p className="text-xs text-muted-foreground/90 mt-1 line-clamp-1">
              💡 {feedback.explanation}
            </p>
          )}
        </div>
        <button
          onClick={onNext}
          className="display h-12 rounded-xl bg-primary px-6 text-sm text-primary-foreground shadow-[0_4px_0_0_color-mix(in_oklab,var(--primary)_55%,black)] active:translate-y-[2px] font-black flex items-center gap-1.5"
        >
          {last ? "See Result" : "Next"} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
