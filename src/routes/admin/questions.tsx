import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { Page } from "@/components/AppShell";
import { Button, Panel, Modal, Tabs } from "@/components/kit/primitives";
import { adminService, AdminQuestionView } from "@/services/adminService";
import { authService } from "@/services/authService";
import { freeAnswerEngine, FreeAnswerDispute } from "@/engine/freeAnswerEngine";
import {
  Shield,
  Search,
  AlertTriangle,
  CheckCircle,
  Edit3,
  RotateCcw,
  Sparkles,
  Database,
  Cpu,
  Layers,
  Award,
  ExternalLink,
  Keyboard,
  Check,
  X,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/questions")({
  head: () => ({
    meta: [
      { title: "Admin Question Center — IQ ARENA" },
      { name: "description", content: "Knowledge moderation, free answer alias adjudication, and question variant management." },
    ],
  }),
  component: AdminQuestionsScreen,
});

function AdminQuestionsScreen() {
  const navigate = useNavigate();
  const [questions, setQuestions] = React.useState<AdminQuestionView[]>([]);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [selectedQuestion, setSelectedQuestion] = React.useState<AdminQuestionView | null>(null);
  const [selectedIndex, setSelectedIndex] = React.useState<number>(0);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState<boolean>(false);
  const [editPrompt, setEditPrompt] = React.useState("");
  const [editExplanation, setEditExplanation] = React.useState("");
  const [editDifficulty, setEditDifficulty] = React.useState<"easy" | "medium" | "hard" | "expert">("medium");

  const [disputes, setDisputes] = React.useState<FreeAnswerDispute[]>(() => freeAnswerEngine.getDisputes());
  const auth = authService.getAuthState();

  const loadQuestions = React.useCallback(async () => {
    const list = await adminService.getQuestions(statusFilter, searchQuery);
    let filtered = categoryFilter === "all" ? list : list.filter((q) => q.category === categoryFilter);

    if (statusFilter === "free_answer") {
      filtered = filtered.filter((q) => q.answers.some((a) => a.isCorrect && a.label.length < 25));
    } else if (statusFilter === "blitz") {
      filtered = filtered.filter((q) => q.prompt.length < 60);
    }

    setQuestions(filtered);
    if (filtered.length > 0 && !selectedQuestion) {
      setSelectedQuestion(filtered[0] || null);
      setSelectedIndex(0);
    }
  }, [statusFilter, categoryFilter, searchQuery]);

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

  const handleApproveDispute = (disputeId: string) => {
    freeAnswerEngine.approveDispute(disputeId);
    setDisputes([...freeAnswerEngine.getDisputes()]);
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

  const categories = [
    "all",
    "Geography",
    "History",
    "Science",
    "Nature",
    "Literature",
    "Art",
    "Cinema",
    "Music",
    "Technology",
    "Food & Culture",
  ];

  return (
    <Page
      title="Admin Question Center"
      subtitle="Knowledge Registry · Free Answer Alias Adjudication · Mode Eligibility Filters"
      wide
      action={
        <div className="flex items-center gap-2">
          <span className="label-xs rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-primary font-bold flex items-center gap-1.5">
            <Cpu size={14} /> Factory Live
          </span>
          <span className="label-xs rounded-full border border-success/40 bg-success/10 px-3 py-1.5 text-success font-bold flex items-center gap-1.5">
            🛡️ Admin Authorized
          </span>
        </div>
      }
    >
      {/* Factory Dashboard Metrics Banner */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Panel className="p-4 border-primary/30 bg-primary/5">
          <div className="flex items-center justify-between">
            <span className="label-xs text-primary font-bold">Facts Ingested</span>
            <Database size={16} className="text-primary" />
          </div>
          <div className="mt-2 text-2xl font-black text-foreground">1,171</div>
          <div className="text-xs text-muted-foreground mt-0.5">Wikidata Whitelist Provenance</div>
        </Panel>

        <Panel className="p-4 border-success/30 bg-success/5">
          <div className="flex items-center justify-between">
            <span className="label-xs text-success font-bold">Auto-Verified Live</span>
            <CheckCircle size={16} className="text-success" />
          </div>
          <div className="mt-2 text-2xl font-black text-success">1,160</div>
          <div className="text-xs text-muted-foreground mt-0.5">99.1% Pipeline Pass Rate</div>
        </Panel>

        <Panel className="p-4 border-warning/30 bg-warning/5">
          <div className="flex items-center justify-between">
            <span className="label-xs text-warning font-bold">Free Answer Eligible</span>
            <Keyboard size={16} className="text-warning" />
          </div>
          <div className="mt-2 text-2xl font-black text-warning">890</div>
          <div className="text-xs text-muted-foreground mt-0.5">Canonical Aliases Mapped</div>
        </Panel>

        <Panel className="p-4 border-border bg-surface-2">
          <div className="flex items-center justify-between">
            <span className="label-xs text-muted-foreground font-bold">Disputed Aliases</span>
            <HelpCircle size={16} className="text-muted-foreground" />
          </div>
          <div className="mt-2 text-2xl font-black text-foreground">{disputes.length}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Community Suggestions</div>
        </Panel>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] items-center mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search questions by prompt, fact or entity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface pl-9 pr-3 py-2 text-sm text-foreground outline-none focus:border-primary placeholder:text-muted-foreground/50"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground outline-none focus:border-primary font-bold"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === "all" ? "All Categories" : c}
            </option>
          ))}
        </select>

        <Tabs
          value={statusFilter}
          onChange={setStatusFilter}
          tabs={[
            { id: "all", label: "All Questions" },
            { id: "free_answer", label: "⌨️ Free Answer (890)" },
            { id: "blitz", label: "⚡ Blitz Eligible" },
            { id: "quarantined", label: "⚠️ Quarantined" },
          ]}
        />
      </div>

      {/* Disputed Aliases Review Bar (If any exist) */}
      {disputes.length > 0 && (
        <Panel className="p-4 mb-6 border-warning/40 bg-warning/5 space-y-3">
          <div className="label-xs text-warning font-black flex items-center justify-between">
            <span>⚠️ Community Free Answer Disputes Pending Adjudication</span>
            <span className="text-xs font-mono">{disputes.filter((d) => d.status === "pending").length} Pending</span>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {disputes.map((d) => (
              <div key={d.id} className="p-3 bg-surface rounded-xl border border-border text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">Disputed Input: "{d.rawInput}"</span>
                  {d.status === "approved" ? (
                    <span className="text-success font-bold">✓ Approved</span>
                  ) : (
                    <Button size="sm" variant="primary" onClick={() => handleApproveDispute(d.id)}>
                      Approve Alias
                    </Button>
                  )}
                </div>
                <div className="text-muted-foreground font-mono">
                  Canonical: <strong className="text-foreground">{d.canonicalAnswer}</strong>
                </div>
                {d.reason && <div className="text-muted-foreground italic">"{d.reason}"</div>}
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Main Grid: Question List & Detail Inspector */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* Question List */}
        <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
          {questions.length === 0 ? (
            <Panel className="p-8 text-center text-muted-foreground text-sm">
              No questions found matching criteria.
            </Panel>
          ) : (
            questions.map((q, idx) => (
              <Panel
                key={q.id}
                className={cn(
                  "p-4 cursor-pointer transition-all border",
                  selectedQuestion?.id === q.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border hover:border-border-strong",
                  q.status === "quarantined" && "border-danger/40 bg-danger/5",
                )}
                onClick={() => {
                  setSelectedQuestion(q);
                  setSelectedIndex(idx);
                }}
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
                        ✓ Verified Live
                      </span>
                    )}
                  </div>
                </div>

                <p className="font-bold text-sm text-foreground line-clamp-2">{q.prompt}</p>

                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground font-mono border-t border-border pt-2">
                  <span className="truncate max-w-[200px]">{q.source}</span>
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
          <Panel className="h-fit sticky top-20 p-5 space-y-4 border-primary/30">
            <div className="flex items-center justify-between">
              <span className="label-xs text-muted-foreground font-mono truncate max-w-[180px]">
                ID: {selectedQuestion.id}
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleOpenEdit(selectedQuestion)}>
                  <Edit3 size={14} /> Edit (E)
                </Button>
                {selectedQuestion.status === "quarantined" ? (
                  <Button size="sm" variant="primary" onClick={() => handleRestore(selectedQuestion)}>
                    <RotateCcw size={14} /> Restore (A)
                  </Button>
                ) : (
                  <Button size="sm" variant="live" onClick={() => handleQuarantine(selectedQuestion)}>
                    <AlertTriangle size={14} /> Quarantine (Q)
                  </Button>
                )}
              </div>
            </div>

            <div>
              <div className="label-xs text-muted-foreground mb-1">Generated Question Prompt</div>
              <h3 className="display text-lg font-black text-foreground">{selectedQuestion.prompt}</h3>
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

            {/* Fact Lineage & Provenance Metadata */}
            <div className="p-3 bg-surface-2 rounded-xl space-y-2 border border-border text-xs">
              <div className="font-bold text-foreground flex items-center justify-between">
                <span>Provenance & Mode Eligibility</span>
                <span className="text-success font-mono font-black">Score: 0.98 / 1.00</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-muted-foreground font-mono">
                <div>Source: <span className="text-foreground">{selectedQuestion.source}</span></div>
                <div>Difficulty: <span className="text-foreground">{selectedQuestion.difficulty}</span></div>
                <div>Language: <span className="text-foreground">fr (French)</span></div>
                <div>Mode Pools: <span className="text-primary font-bold">MCQ, Free Answer, Blitz</span></div>
              </div>
            </div>
          </Panel>
        ) : (
          <Panel className="h-48 grid place-items-center text-muted-foreground text-sm">
            Select a question from the list to inspect.
          </Panel>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <Modal title="Edit Question Variant" isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label className="label-xs text-muted-foreground">Prompt</label>
              <textarea
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-xl border border-border bg-surface p-3 text-sm text-foreground outline-none focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="label-xs text-muted-foreground">Fact Explanation</label>
              <textarea
                value={editExplanation}
                onChange={(e) => setEditExplanation(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-xl border border-border bg-surface p-3 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="label-xs text-muted-foreground">Difficulty</label>
              <select
                value={editDifficulty}
                onChange={(e) => setEditDifficulty(e.target.value as any)}
                className="mt-1 w-full rounded-xl border border-border bg-surface p-2 text-sm text-foreground outline-none focus:border-primary"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="expert">Expert</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="surface" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </Page>
  );
}
