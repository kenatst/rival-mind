import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { modeEngine, ModeSessionState, ModeRunResult } from "@/engine/modeEngine";
import { getModeBySlug } from "@/engine/modes/registry";
import { GameModeDefinition } from "@/engine/modes/types";
import { ResultScreenFramework } from "@/components/kit/ResultScreenFramework";
import { Button, Panel, ProgressBar, Modal } from "@/components/kit/primitives";
import { AnswerCard, ScoreCounter, Timer } from "@/components/kit/game";
import { playCue } from "@/lib/game";
import {
  Flame,
  Zap,
  TrendingUp,
  Target,
  Sparkles,
  Building2,
  HelpCircle,
  Coins,
  Send,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function UnifiedModeRunner({
  modeSlug,
  category,
  onExit = "/play",
}: {
  modeSlug: string;
  category?: string | undefined;
  onExit?: string | undefined;
}) {
  const navigate = useNavigate();
  const modeDef = getModeBySlug(modeSlug);

  const [session, setSession] = React.useState<ModeSessionState | null>(null);
  const [currentQuestion, setCurrentQuestion] = React.useState<any | null>(null);
  const [typedInput, setTypedInput] = React.useState("");
  const [pickedOptionId, setPickedOptionId] = React.useState<string | null>(null);
  const [isAnswered, setIsAnswered] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{
    isCorrect: boolean;
    points: number;
    explanation?: string | undefined;
    correctAnswer: string;
    feedbackMessage?: string | undefined;
  } | null>(null);

  const [finalResult, setFinalResult] = React.useState<ModeRunResult | null>(null);
  const [timeLeft, setTimeLeft] = React.useState<number>(10);
  const [masterTimeLeftMs, setMasterTimeLeftMs] = React.useState<number>(60000);
  const [isBankModalOpen, setIsBankModalOpen] = React.useState(false);

  const inputRef = React.useRef<HTMLInputElement>(null);

  // Initialize Session
  const initSession = React.useCallback(() => {
    try {
      const { session: newSession, firstQuestion } = modeEngine.startSession(
        "u-kenael",
        modeSlug,
        category,
      );
      setSession(newSession);
      setCurrentQuestion(firstQuestion);
      setFinalResult(null);
      setTypedInput("");
      setPickedOptionId(null);
      setIsAnswered(false);
      setFeedback(null);
      setTimeLeft(firstQuestion.seconds || 10);
      setMasterTimeLeftMs(60000);
    } catch (e) {
      console.error("Failed to start mode session:", e);
      navigate({ to: onExit });
    }
  }, [modeSlug, category, navigate, onExit]);

  React.useEffect(() => {
    initSession();
  }, [initSession]);

  // Master Timer for 60s Lightning Mode
  React.useEffect(() => {
    if (!session || modeSlug !== "lightning" || finalResult) return;

    const interval = setInterval(() => {
      if (!session.deadlineAt) return;
      const rem = Math.max(0, session.deadlineAt - Date.now());
      setMasterTimeLeftMs(rem);

      if (rem <= 0) {
        clearInterval(interval);
        handleFinishSession();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [session, modeSlug, finalResult]);

  // Per-Question Countdown Timer (e.g. 5s Blitz, 10s Classic)
  React.useEffect(() => {
    if (!currentQuestion || isAnswered || modeSlug === "lightning" || finalResult) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentQuestion, isAnswered, modeSlug, finalResult]);

  // Auto-focus input for Free Answer Mode
  React.useEffect(() => {
    if (modeDef?.answerInputType === "free_text" && !isAnswered && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentQuestion, isAnswered, modeDef]);

  const handleTimeExpired = () => {
    if (isAnswered) return;
    handleSubmitAnswer("timeout");
  };

  const handleFinishSession = () => {
    if (!session) return;
    const res = modeEngine.finishSession(session.sessionId);
    setFinalResult(res);
  };

  const handleSubmitAnswer = (answerValue: string) => {
    if (!session || isAnswered) return;
    setIsAnswered(true);

    const val = answerValue || typedInput;
    if (modeDef?.answerInputType === "mcq") {
      setPickedOptionId(val);
    }

    playCue("select");

    const evaluation = modeEngine.submitAnswer(session.sessionId, val);

    setFeedback({
      isCorrect: evaluation.isCorrect,
      points: evaluation.pointsAwarded,
      explanation: evaluation.explanation,
      correctAnswer: evaluation.correctAnswer,
      feedbackMessage: evaluation.freeAnswerResult?.feedbackMessage,
    });

    if (evaluation.isCorrect) {
      playCue("correct");
    } else {
      playCue("wrong");
    }

    // Fast chaining delay: 400ms for Lightning/Blitz, 900ms for Standard
    const delay = modeSlug === "lightning" || modeSlug === "blitz" ? 450 : 850;

    setTimeout(() => {
      if (evaluation.completed || evaluation.eliminated) {
        handleFinishSession();
      } else {
        setCurrentQuestion(evaluation.nextQuestion);
        setSession({ ...session });
        setTypedInput("");
        setPickedOptionId(null);
        setIsAnswered(false);
        setFeedback(null);
        setTimeLeft(evaluation.nextQuestion?.seconds || 10);
      }
    }, delay);
  };

  // Keyboard shortcut support (1-4, A-D for MCQ, Enter for Free Text)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnswered || finalResult) return;

      if (modeDef?.answerInputType === "free_text") {
        if (e.key === "Enter" && typedInput.trim().length > 0) {
          handleSubmitAnswer(typedInput);
        }
        return;
      }

      const key = e.key.toUpperCase();
      let selectedIdx = -1;
      if (key === "1" || key === "A") selectedIdx = 0;
      else if (key === "2" || key === "B") selectedIdx = 1;
      else if (key === "3" || key === "C") selectedIdx = 2;
      else if (key === "4" || key === "D") selectedIdx = 3;

      if (
        selectedIdx >= 0 &&
        currentQuestion?.answers &&
        selectedIdx < currentQuestion.answers.length
      ) {
        handleSubmitAnswer(currentQuestion.answers[selectedIdx]!.id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAnswered, finalResult, currentQuestion, typedInput, modeDef]);

  if (!modeDef) return null;

  if (finalResult) {
    return (
      <ResultScreenFramework
        result={finalResult}
        onReplay={initSession}
        exitTo={onExit}
      />
    );
  }

  if (!session || !currentQuestion) {
    return (
      <div className="stage min-h-screen grid place-items-center bg-background p-4">
        <Panel className="p-6 text-center space-y-2">
          <div className="animate-spin text-primary mx-auto">⏳</div>
          <div className="font-bold">Initializing {modeDef.displayName}...</div>
        </Panel>
      </div>
    );
  }

  const isLightning = modeSlug === "lightning";
  const isBlitz = modeSlug === "blitz";
  const isStreak = modeSlug === "streak";
  const isLadder = modeSlug === "ladder";
  const isTower = modeSlug === "category-tower";
  const isDailyGem = modeSlug === "daily-gem";

  return (
    <div className="stage min-h-screen bg-background px-4 py-6 select-none flex flex-col justify-between max-w-xl mx-auto">
      {/* Top Header / HUD */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="label-xs rounded-full border border-primary/40 bg-primary/10 px-3 py-1 font-bold text-primary">
              {modeDef.displayName}
            </span>
            {isTower && (
              <span className="label-xs text-gold font-bold flex items-center gap-1">
                <Building2 size={13} /> {session.towerCategory} Floor {session.towerFloor || 1}
              </span>
            )}
            {isLadder && (
              <span className="label-xs text-accent font-bold flex items-center gap-1">
                <TrendingUp size={13} /> Stage {session.ladderStage || 1}/10
              </span>
            )}
          </div>

          <button
            onClick={() => navigate({ to: onExit })}
            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Dynamic Mode HUDs */}
        {isLightning ? (
          /* 60s Lightning Master Timer Display */
          <div className="stage p-4 rounded-2xl border border-primary/40 bg-primary/5 flex items-center justify-between mb-4 shadow-[var(--shadow-glow)]">
            <div>
              <div className="label-xs text-primary font-black">Lightning Countdown</div>
              <div className="numeric text-4xl sm:text-5xl font-black text-foreground">
                {(masterTimeLeftMs / 1000).toFixed(1)}s
              </div>
            </div>
            <div className="text-right">
              <div className="label-xs text-muted-foreground font-black">Score</div>
              <div className="numeric text-4xl sm:text-5xl font-black text-gold">
                {session.score}
              </div>
            </div>
          </div>
        ) : (
          /* Standard Round Progress & Score Bar */
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span className="text-muted-foreground">
              Question {session.currentIndex + 1} {currentQuestion.total ? `of ${currentQuestion.total}` : ""}
            </span>
            <div className="flex items-center gap-3">
              {session.currentStreak > 1 && (
                <span className="text-gold font-black flex items-center gap-1 animate-pulse">
                  <Flame size={14} className="fill-gold" /> {session.currentStreak}x
                </span>
              )}
              <span className="numeric text-sm font-black text-primary">
                Score: {session.score}
              </span>
            </div>
          </div>
        )}

        {/* Rapid 5s Blitz Timer Bar */}
        {!isLightning && (
          <div className="mb-4">
            <ProgressBar
              value={((currentQuestion.seconds - timeLeft) / currentQuestion.seconds) * 100}
              color={timeLeft <= 2 ? "oklch(0.66 0.26 5)" : "var(--primary)"}
              striped={timeLeft <= 2}
            />
          </div>
        )}
      </div>

      {/* Main Question Card Area */}
      <div className="my-auto space-y-5">
        <Panel className="p-6 text-center space-y-3 border-primary/30 shadow-[var(--shadow-lift)]">
          <div className="label-xs text-primary font-black uppercase tracking-wider">
            {currentQuestion.category} · {currentQuestion.difficulty}
          </div>
          <h2 className="display text-2xl sm:text-3xl font-black text-foreground leading-snug">
            {currentQuestion.prompt}
          </h2>
        </Panel>

        {/* MCQ Answers or Free Answer Input Area */}
        {modeDef.answerInputType === "free_text" ? (
          /* Free Answer Typing Interface */
          <div className="space-y-3">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={typedInput}
                onChange={(e) => setTypedInput(e.target.value)}
                disabled={isAnswered}
                placeholder="Type your answer here..."
                className="w-full rounded-2xl border-2 border-primary/50 bg-surface px-4 py-3.5 text-lg font-bold text-foreground outline-none focus:border-primary placeholder:text-muted-foreground/40 shadow-inner"
              />
              <button
                type="button"
                onClick={() => handleSubmitAnswer(typedInput)}
                disabled={isAnswered || typedInput.trim().length === 0}
                className="absolute right-2.5 top-2.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-black text-primary-foreground transition-transform active:scale-95 disabled:opacity-40"
              >
                <Send size={14} /> Submit (↵)
              </button>
            </div>

            <div className="text-center text-xs text-muted-foreground">
              ⚡ Small typos & transliterations automatically accepted.
            </div>
          </div>
        ) : (
          /* 4-Choice Multiple Choice Grid */
          <div className="grid gap-2.5">
            {currentQuestion.answers.map((a: any, idx: number) => {
              const isSelected = pickedOptionId === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => handleSubmitAnswer(a.id)}
                  disabled={isAnswered}
                  className={cn(
                    "flex items-center justify-between rounded-2xl border-2 p-4 text-left font-bold text-sm sm:text-base transition-all active:scale-[0.99]",
                    isSelected
                      ? "border-primary bg-primary/20 text-primary shadow-[var(--shadow-glow)]"
                      : "border-border bg-surface text-foreground hover:border-primary/50 hover:bg-surface-2",
                    isAnswered && !isSelected && "opacity-40",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-surface-2 text-xs font-black text-muted-foreground">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{a.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Immediate Short Feedback Flash */}
        {feedback && (
          <div
            className={cn(
              "rounded-xl p-3 text-center text-xs font-bold animate-rise",
              feedback.isCorrect
                ? "bg-success/20 text-success border border-success/40"
                : "bg-danger/20 text-danger border border-danger/40",
            )}
          >
            {feedback.feedbackMessage ||
              (feedback.isCorrect
                ? `✓ Correct! +${feedback.points} pts`
                : `✗ Missed! Expected: ${feedback.correctAnswer}`)}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="text-center text-xs text-muted-foreground pt-4">
        {modeDef.shortTagline} · Official Server Authority
      </div>
    </div>
  );
}
