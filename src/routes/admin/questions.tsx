import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { Page } from "@/components/AppShell";
import { Button, Panel, Modal, Tabs } from "@/components/kit/primitives";
import { adminService, AdminQuestionView } from "@/services/adminService";
import { authService } from "@/services/authService";
import { Shield, Search, Filter, AlertTriangle, CheckCircle, Edit3, Trash2, RotateCcw, Plus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/questions")({
  head: () => ({
    meta: [
      { title: "Admin Question Center — IQ ARENA" },
      { name: "description", content: "Knowledge moderation and question variant management." },
    ],
  }),
  component: AdminQuestionsScreen,
});

function AdminQuestionsScreen() {
  const navigate = useNavigate();
  const [questions, setQuestions] = React.useState<AdminQuestionView[]>([]);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [selectedQuestion, setSelectedQuestion] = React.useState<AdminQuestionView | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState<boolean>(false);
  const [editPrompt, setEditPrompt] = React.useState("");
  const [editExplanation, setEditExplanation] = React.useState("");
  const [editDifficulty, setEditDifficulty] = React.useState<"easy" | "medium" | "hard" | "expert">("medium");
  const auth = authService.getAuthState();

  const loadQuestions = React.useCallback(async () => {
    const list = await adminService.getQuestions(statusFilter, searchQuery);
    setQuestions(list);
  }, [statusFilter, searchQuery]);

  React.useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const handleQuarantine = async (q: AdminQuestionView) => {
    await adminService.quarantineQuestion(q.id, "Flagged via Admin Center");
    loadQuestions();
    if (selectedQuestion?.id === q.id) {
      setSelectedQuestion({ ...q, status: "quarantined" });
    }
  };

  const handleRestore = async (q: AdminQuestionView) => {
    await adminService.restoreQuestion(q.id);
    loadQuestions();
    if (selectedQuestion?.id === q.id) {
      setSelectedQuestion({ ...q, status: "verified" });
    }
  };

  const handleOpenEdit = (q: AdminQuestionView) => {
    setSelectedQuestion(q);
    setEditPrompt(q.prompt);
    setEditExplanation(q.explanation);
    setEditDifficulty(q.difficulty);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuestion) return;

    await adminService.updateQuestion(selectedQuestion.id, {
      prompt: editPrompt,
      explanation: editExplanation,
      difficulty: editDifficulty,
    });

    setIsEditModalOpen(false);
    loadQuestions();
  };

  if (!auth.isAdmin) {
    return (
      <Page title="Admin Question Center" subtitle="Restricted operational portal.">
        <Panel className="text-center p-8 space-y-4 border-danger/40">
          <Shield size={40} className="mx-auto text-danger" />
          <h2 className="display text-2xl text-danger font-bold">Access Restricted</h2>
          <p className="text-sm text-muted-foreground">
            You must have the 'admin' or 'moderator' role to access the IQ ARENA Knowledge Center.
          </p>
          <Button variant="surface" onClick={() => navigate({ to: "/home" })}>
            Return to Lobby
          </Button>
        </Panel>
      </Page>
    );
  }

  return (
    <Page
      title="Admin Question Center"
      subtitle="Knowledge Registry, variant moderation, and anti-cheat telemetry."
      wide
      action={
        <span className="label-xs rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-primary font-bold">
          🛡️ Admin Authorized
        </span>
      }
    >
      {/* Top Filter Bar */}
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] items-center mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search questions by prompt or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface pl-9 pr-3 py-2 text-sm text-foreground outline-none focus:border-primary placeholder:text-muted-foreground/50"
          />
        </div>

        <Tabs
          value={statusFilter}
          onChange={setStatusFilter}
          tabs={[
            { id: "all", label: "All" },
            { id: "verified", label: "Verified" },
            { id: "quarantined", label: "⚠️ Quarantined" },
          ]}
        />
      </div>

      {/* Main Grid: Question List & Detail Inspector */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* Question List */}
        <div className="space-y-3">
          {questions.length === 0 ? (
            <Panel className="p-8 text-center text-muted-foreground text-sm">
              No questions found matching criteria.
            </Panel>
          ) : (
            questions.map((q) => (
              <Panel
                key={q.id}
                className={cn(
                  "p-4 cursor-pointer transition-all border",
                  selectedQuestion?.id === q.id ? "border-primary bg-surface-2" : "border-border hover:border-border-strong",
                  q.status === "quarantined" && "border-danger/40 bg-danger/5",
                )}
                onClick={() => setSelectedQuestion(q)}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="label-xs text-primary font-bold">{q.category}</span>
                  <div className="flex items-center gap-2">
                    <span className="label-xs text-muted-foreground font-mono">{q.difficulty}</span>
                    {q.status === "quarantined" ? (
                      <span className="label-xs rounded bg-danger/20 text-danger border border-danger/40 px-1.5 py-0.5 font-bold">
                        Quarantined
                      </span>
                    ) : (
                      <span className="label-xs rounded bg-success/20 text-success border border-success/40 px-1.5 py-0.5 font-bold">
                        Verified
                      </span>
                    )}
                  </div>
                </div>

                <p className="font-bold text-sm text-foreground line-clamp-2">{q.prompt}</p>

                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground font-mono border-t border-border pt-2">
                  <span>Served: {q.timesServed}</span>
                  <span>Accuracy: {q.accuracy}%</span>
                  {q.reportCount > 0 && (
                    <span className="text-danger font-bold">⚠️ {q.reportCount} Reports</span>
                  )}
                </div>
              </Panel>
            ))
          )}
        </div>

        {/* Detailed Inspector Panel */}
        {selectedQuestion ? (
          <Panel className="h-fit sticky top-20 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="label-xs text-muted-foreground font-mono">ID: {selectedQuestion.id} (v{selectedQuestion.version})</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleOpenEdit(selectedQuestion)}>
                  <Edit3 size={14} /> Edit
                </Button>
                {selectedQuestion.status === "quarantined" ? (
                  <Button size="sm" variant="primary" onClick={() => handleRestore(selectedQuestion)}>
                    <RotateCcw size={14} /> Restore
                  </Button>
                ) : (
                  <Button size="sm" variant="live" onClick={() => handleQuarantine(selectedQuestion)}>
                    <AlertTriangle size={14} /> Quarantine
                  </Button>
                )}
              </div>
            </div>

            <div>
              <div className="label-xs text-muted-foreground mb-1">Prompt</div>
              <h3 className="display text-lg font-black">{selectedQuestion.prompt}</h3>
            </div>

            <div>
              <div className="label-xs text-muted-foreground mb-2">Options & Ground Truth</div>
              <div className="space-y-1.5">
                {selectedQuestion.answers.map((a) => (
                  <div
                    key={a.id}
                    className={cn(
                      "flex items-center justify-between rounded-xl px-3 py-2 text-xs border",
                      a.isCorrect
                        ? "border-success bg-success/15 font-bold text-success"
                        : "border-border bg-surface text-muted-foreground",
                    )}
                  >
                    <span>{a.label}</span>
                    {a.isCorrect && <span>✓ Correct Answer</span>}
                  </div>
                ))}
              </div>
            </div>

            {selectedQuestion.explanation && (
              <div>
                <div className="label-xs text-muted-foreground mb-1">Fact Explanation</div>
                <p className="text-xs text-muted-foreground leading-relaxed bg-surface-2 p-3 rounded-xl">
                  {selectedQuestion.explanation}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-border">
              <div>
                <span className="text-muted-foreground">Source:</span> {selectedQuestion.source}
              </div>
              <div>
                <span className="text-muted-foreground">Difficulty:</span> {selectedQuestion.difficulty}
              </div>
            </div>
          </Panel>
        ) : (
          <Panel className="h-48 grid place-items-center text-muted-foreground text-sm">
            Select a question from the list to inspect.
          </Panel>
        )}
      </div>

      {/* Edit Question Modal */}
      <Modal open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Question Variant">
        <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
          <div>
            <label className="label-xs mb-1 block text-muted-foreground">Prompt</label>
            <textarea
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-foreground outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="label-xs mb-1 block text-muted-foreground">Explanation</label>
            <textarea
              value={editExplanation}
              onChange={(e) => setEditExplanation(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-foreground outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="label-xs mb-1 block text-muted-foreground">Difficulty</label>
            <select
              value={editDifficulty}
              onChange={(e) => setEditDifficulty(e.target.value as any)}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-foreground"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="expert">Expert</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="surface" size="sm" type="button" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Changes (v2)
            </Button>
          </div>
        </form>
      </Modal>
    </Page>
  );
}
