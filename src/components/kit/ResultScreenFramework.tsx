import * as React from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button, Panel, Modal } from "@/components/kit/primitives";
import { ModeRunResult } from "@/engine/modeEngine";
import { freeAnswerEngine } from "@/engine/freeAnswerEngine";
import { playCue } from "@/lib/game";
import {
  Trophy,
  Flame,
  RotateCcw,
  Share2,
  Check,
  Copy,
  ArrowRight,
  AlertCircle,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

export function ResultScreenFramework({
  result,
  onReplay,
  exitTo = "/play",
}: {
  result: ModeRunResult;
  onReplay: () => void;
  exitTo?: string | undefined;
}) {
  const navigate = useNavigate();
  const [copied, setCopied] = React.useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = React.useState(false);
  const [selectedDisputeQuestion, setSelectedDisputeQuestion] = React.useState<{
    prompt: string;
    correctAnswer: string;
    userAnswer: string;
  } | null>(null);
  const [disputeReason, setDisputeReason] = React.useState("");
  const [disputeSubmitted, setDisputeSubmitted] = React.useState(false);

  React.useEffect(() => {
    if (result.isPersonalBest || result.accuracy === 100) {
      playCue("victory");
      try {
        confetti({
          particleCount: 85,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#76FF03", "#FFD600", "#00E5FF"],
        });
      } catch {}
    }
  }, [result]);

  const handleCopyShare = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenDispute = (q: { prompt: string; correctAnswer: string; userAnswer: string }) => {
    setSelectedDisputeQuestion(q);
    setDisputeReason("");
    setDisputeSubmitted(false);
    setIsDisputeModalOpen(true);
  };

  const handleSubmitDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDisputeQuestion) return;

    freeAnswerEngine.submitDispute(
      "q-disp",
      selectedDisputeQuestion.userAnswer,
      selectedDisputeQuestion.correctAnswer,
      disputeReason,
    );

    setDisputeSubmitted(true);
    setTimeout(() => {
      setIsDisputeModalOpen(false);
    }, 1500);
  };

  return (
    <div className="stage min-h-screen bg-background px-4 py-8 select-none">
      <div className="mx-auto w-full max-w-lg space-y-4">
        {/* Headline Banner */}
        <div className="text-center space-y-2">
          <span className="label-xs rounded-full border border-primary/40 bg-primary/10 px-3 py-1 font-bold text-primary">
            {result.displayName}
          </span>
          <h1
            className={cn(
              "display text-5xl sm:text-6xl font-black drop-shadow-2xl animate-slam",
              result.isPersonalBest ? "text-gold" : "text-foreground",
            )}
          >
            {result.isPersonalBest
              ? "NEW RECORD!"
              : result.accuracy === 100
              ? "PERFECT RUN!"
              : "RUN COMPLETED"}
          </h1>
        </div>

        {/* Near-Miss Motivational Callout */}
        {result.nearMissMessage && (
          <Panel className="p-4 border-warning/40 bg-warning/10 text-center space-y-1 animate-rise">
            <div className="label-xs text-warning font-black flex items-center justify-center gap-1.5">
              <Sparkles size={14} /> Near-Miss Motivational Alert
            </div>
            <p className="text-sm font-bold text-foreground">{result.nearMissMessage}</p>
          </Panel>
        )}

        {/* Core Stats Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Panel className="text-center p-4">
            <div className="label-xs text-muted-foreground font-bold">Score</div>
            <div className="numeric text-4xl font-black text-primary mt-1">{result.score}</div>
          </Panel>

          <Panel className="text-center p-4">
            <div className="label-xs text-muted-foreground font-bold">Accuracy</div>
            <div className="numeric text-4xl font-black text-foreground mt-1">{result.accuracy}%</div>
          </Panel>

          <Panel className="text-center p-4 col-span-2 sm:col-span-1">
            <div className="label-xs text-muted-foreground font-bold">Best Streak</div>
            <div className="numeric text-4xl font-black text-gold mt-1 flex items-center justify-center gap-1">
              <Flame size={24} className="fill-gold" /> {result.bestStreak}
            </div>
          </Panel>
        </div>

        {/* Action CTAs: 1-Tap Replay + Share Card */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button
            size="xl"
            variant="primary"
            onClick={onReplay}
            className="w-full font-black text-lg shadow-[0_5px_0_0_color-mix(in_oklab,var(--primary)_55%,black)]"
          >
            <RotateCcw size={20} /> Play Again
          </Button>

          <Button
            size="xl"
            variant="surface"
            onClick={() => setIsShareModalOpen(true)}
            className="w-full font-bold"
          >
            <Share2 size={18} /> Share Card
          </Button>
        </div>

        <Button
          variant="outline"
          size="md"
          full
          onClick={() => navigate({ to: exitTo })}
          className="text-muted-foreground"
        >
          Return to Play Hub
        </Button>

        {/* Review Questions Breakdown */}
        {result.reviewQuestions.length > 0 && (
          <div className="pt-4 space-y-3">
            <div className="label-xs text-muted-foreground font-bold flex items-center justify-between">
              <span>Question Review ({result.reviewQuestions.length})</span>
              <span className="text-xs font-mono">
                {result.reviewQuestions.filter((q) => q.isCorrect).length} Correct ·{" "}
                {result.reviewQuestions.filter((q) => !q.isCorrect).length} Missed
              </span>
            </div>

            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {result.reviewQuestions.map((q, idx) => (
                <Panel
                  key={idx}
                  className={cn(
                    "p-3 text-xs border space-y-1.5",
                    q.isCorrect
                      ? "border-success/30 bg-success/5"
                      : "border-danger/30 bg-danger/5",
                  )}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-foreground">
                      #{idx + 1}. {q.prompt}
                    </span>
                    <span className={q.isCorrect ? "text-success" : "text-danger"}>
                      {q.isCorrect ? "✓ Correct" : "✗ Missed"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-muted-foreground font-mono pt-1">
                    <div>
                      Your answer:{" "}
                      <span className={cn(q.isCorrect ? "text-success" : "text-danger font-bold")}>
                        {q.userAnswer || "(none)"}
                      </span>
                    </div>
                    <div>
                      Correct: <span className="text-foreground font-bold">{q.correctAnswer}</span>
                    </div>
                  </div>

                  {q.explanation && (
                    <p className="text-xs text-muted-foreground bg-surface-2 p-2 rounded-lg leading-relaxed mt-1">
                      {q.explanation}
                    </p>
                  )}

                  {!q.isCorrect && result.modeSlug.includes("free-answer") && (
                    <div className="pt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleOpenDispute(q)}
                        className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                      >
                        <HelpCircle size={12} /> My answer should have been accepted
                      </button>
                    </div>
                  )}
                </Panel>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Share Card Modal */}
      {isShareModalOpen && (
        <Modal
          title="Share Your Score"
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
        >
          <div className="space-y-4">
            <Panel className="p-4 bg-surface-2 border-primary/40 font-mono text-sm leading-relaxed text-foreground whitespace-pre-line">
              {result.shareCardText}
            </Panel>

            <Button
              size="lg"
              full
              variant="primary"
              onClick={handleCopyShare}
              className="font-bold"
            >
              {copied ? (
                <>
                  <Check size={18} /> Copied to Clipboard!
                </>
              ) : (
                <>
                  <Copy size={18} /> Copy Shareable Text
                </>
              )}
            </Button>
          </div>
        </Modal>
      )}

      {/* Free Answer Dispute Modal */}
      {isDisputeModalOpen && selectedDisputeQuestion && (
        <Modal
          title="Dispute Free Answer"
          isOpen={isDisputeModalOpen}
          onClose={() => setIsDisputeModalOpen(false)}
        >
          {disputeSubmitted ? (
            <div className="p-6 text-center space-y-2 text-success">
              <Check size={36} className="mx-auto" />
              <div className="font-bold text-lg">Dispute Submitted!</div>
              <p className="text-xs text-muted-foreground">
                Our knowledge moderators will review your suggested alias.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitDispute} className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Did our engine reject a valid spelling, synonym, or transliteration? Submit it to expand the accepted aliases dictionary.
              </p>

              <div className="p-3 bg-surface-2 rounded-xl text-xs space-y-1 font-mono">
                <div>Question: <span className="text-foreground">{selectedDisputeQuestion.prompt}</span></div>
                <div>Your answer: <span className="text-danger font-bold">{selectedDisputeQuestion.userAnswer}</span></div>
                <div>Expected: <span className="text-success font-bold">{selectedDisputeQuestion.correctAnswer}</span></div>
              </div>

              <div>
                <label className="label-xs text-muted-foreground">Reason / Context (Optional)</label>
                <textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="e.g. This is a common French translation / historical alternate spelling."
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-border bg-surface p-3 text-xs text-foreground outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="surface" onClick={() => setIsDisputeModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Submit for Review
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}
