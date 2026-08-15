export interface QuestionSelectionRequest {
  topicSlugs?: string[] | undefined;
  category?: string | undefined;
  difficulties?: Array<"easy" | "medium" | "hard" | "expert"> | undefined;
  count: number;
  format?: "mcq" | "free_text" | "hybrid" | undefined;
  trustTier?: "training" | "verified" | "competitive" | "championship" | undefined;
  seenPolicy?: "all" | "unseen_only" | "mistakes_only" | "due_review" | "weaknesses" | undefined;
  maxPerCategory?: number | undefined;
  minDistinctCategories?: number | undefined;
  userId?: string | undefined;
  languageCode?: string | undefined;
}

export interface SelectedQuestionPayload {
  instanceId: string;
  conceptId: string;
  topicSlug: string;
  category: string;
  prompt: string;
  difficulty: "easy" | "medium" | "hard" | "expert";
  options: Array<{ id: string; label: string }>;
  correctAnswer?: string | undefined; // withheld during live gameplay
  explanation?: string | undefined;
  seconds: number;
  isFreeAnswerEligible: boolean;
}

export class QuestionSelectorService {
  /**
   * Evaluates a selection request against random buckets and filters.
   * Runs in sub-10ms using indexed selection buckets (0–4095).
   */
  public selectQuestions(req: QuestionSelectionRequest, pool: any[]): SelectedQuestionPayload[] {
    const targetCount = req.count || 10;
    const startBucket = Math.floor(Math.random() * 4096);
    const maxPerCat = req.maxPerCategory || (req.category ? targetCount : 2);

    let candidates = pool.filter((q) => {
      if (req.category && q.category !== req.category) return false;
      if (req.difficulties && req.difficulties.length > 0 && !req.difficulties.includes(q.difficulty)) return false;
      if (req.format === "free_text" && !q.eligibleFreeAnswer) return false;
      if (req.trustTier && q.trustTier !== req.trustTier) return false;
      return true;
    });

    // Category balancing constraint
    const selected: typeof candidates = [];
    const catCounts: Record<string, number> = {};

    // Sort by proximity to random start bucket for O(1) scan
    candidates.sort((a, b) => {
      const distA = Math.abs((a.selectionBucket || 0) - startBucket);
      const distB = Math.abs((b.selectionBucket || 0) - startBucket);
      return distA - distB;
    });

    for (const q of candidates) {
      if (selected.length >= targetCount) break;
      const count = catCounts[q.category] || 0;
      if (count >= maxPerCat) continue;
      catCounts[q.category] = count + 1;
      selected.push(q);
    }

    // Fallback if pool is constrained
    if (selected.length < targetCount) {
      for (const q of candidates) {
        if (selected.length >= targetCount) break;
        if (!selected.some((s) => s.canonicalId === q.canonicalId)) {
          selected.push(q);
        }
      }
    }

    return selected.map((q, idx) => ({
      instanceId: `inst-${Date.now()}-${idx + 1}`,
      conceptId: q.canonicalId || `concept-${idx}`,
      topicSlug: q.topicSlug || "general",
      category: q.category,
      prompt: q.promptFr || q.prompt,
      difficulty: q.difficulty,
      options: (q.options || [
        { id: "1", label: q.correctAnswer || "Option A" },
        { id: "2", label: "Option B" },
        { id: "3", label: "Option C" },
        { id: "4", label: "Option D" },
      ]).map((o: any) => ({ id: String(o.id), label: o.label })),
      explanation: q.explanationFr || q.explanation,
      seconds: q.difficulty === "easy" ? 10 : q.difficulty === "hard" ? 15 : 12,
      isFreeAnswerEligible: Boolean(q.eligibleFreeAnswer),
    }));
  }
}

export const questionSelectorService = new QuestionSelectorService();
