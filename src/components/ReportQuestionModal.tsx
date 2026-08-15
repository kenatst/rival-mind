import * as React from "react";
import { Modal, Button } from "@/components/kit/primitives";
import { authoritativeGameEngine } from "@/engine/gameEngine";
import { AlertCircle, Check, Flag } from "lucide-react";

export function ReportQuestionModal({
  open,
  onClose,
  questionId,
  questionPrompt,
}: {
  open: boolean;
  onClose: () => void;
  questionId: string;
  questionPrompt: string;
}) {
  const [reason, setReason] = React.useState<string>("wrong_answer");
  const [details, setDetails] = React.useState<string>("");
  const [submitted, setSubmitted] = React.useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    authoritativeGameEngine.reportQuestion(questionId, undefined, reason, details);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setDetails("");
      onClose();
    }, 1600);
  };

  return (
    <Modal open={open} onClose={onClose} title="Report Question">
      {submitted ? (
        <div className="py-6 text-center space-y-3">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-success/20 text-success">
            <Check size={24} />
          </div>
          <div className="display text-lg font-bold text-success">Report Received</div>
          <p className="text-xs text-muted-foreground">
            Thank you for helping keep IQ ARENA accurate. Our knowledge moderation team will review this variant.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="rounded-xl border border-border bg-surface-2 p-3">
            <div className="label-xs text-muted-foreground font-mono mb-1">Question</div>
            <p className="font-bold text-foreground line-clamp-2">{questionPrompt}</p>
          </div>

          <div>
            <label className="label-xs mb-1.5 block text-muted-foreground">Reason for Report</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-foreground font-bold outline-none focus:border-primary"
            >
              <option value="wrong_answer">Wrong / Incorrect Answer</option>
              <option value="ambiguous">Ambiguous / Multiple Plausible Answers</option>
              <option value="outdated">Outdated Information</option>
              <option value="typo">Typo / Spelling Error</option>
              <option value="bad_translation">Bad Translation</option>
              <option value="other">Other Issue</option>
            </select>
          </div>

          <div>
            <label className="label-xs mb-1.5 block text-muted-foreground">Additional Details (Optional)</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide context or source references if possible..."
              rows={3}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-foreground outline-none focus:border-primary placeholder:text-muted-foreground/50 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="surface" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="live" size="sm" type="submit">
              <Flag size={14} /> Submit Report
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
