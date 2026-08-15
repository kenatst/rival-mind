import {
  GeneratedVariant,
  ValidatedQuestionVariant,
  ValidationScoreBreakdown,
  ValidationStatus,
  QuestionPool,
} from "./types";

export class QuestionValidationPipeline {
  private existingPromptSignatures: Set<string> = new Set();
  private existingConceptVariants: Map<string, number> = new Map();

  /**
   * Clears internal deduplication caches.
   */
  public resetRegistry() {
    this.existingPromptSignatures.clear();
    this.existingConceptVariants.clear();
  }

  /**
   * Validates a candidate question variant across all 5 verification dimensions.
   */
  public validateQuestion(variant: GeneratedVariant): ValidatedQuestionVariant {
    const warnings: string[] = [];
    let factualScore = 1.0;
    let ambiguityScore = 1.0;
    let distractorScore = 1.0;
    let languageScore = 1.0;
    let duplicateScore = 1.0;

    // 1. Schema Validation
    if (!variant.prompt || variant.prompt.length < 8) {
      factualScore -= 0.8;
      warnings.push("Prompt is excessively short or missing.");
    }

    if (!variant.explanation || variant.explanation.length < 10) {
      languageScore -= 0.3;
      warnings.push("Explanation is missing or too brief.");
    }

    if (variant.options.length !== 4) {
      factualScore = 0.0;
      warnings.push(`Expected exactly 4 options, found ${variant.options.length}.`);
    }

    const correctOptions = variant.options.filter((o) => o.isCorrect);
    if (correctOptions.length !== 1) {
      factualScore = 0.0;
      warnings.push(`Expected exactly 1 correct option, found ${correctOptions.length}.`);
    }

    // Check option uniqueness (case-insensitive)
    const optionLabels = variant.options.map((o) => o.label.trim().toLowerCase());
    const uniqueOptions = new Set(optionLabels);
    if (uniqueOptions.size !== variant.options.length) {
      distractorScore = 0.0;
      warnings.push("Duplicate option labels detected.");
    }

    // 2. Factual Alignment
    const correctLabel = correctOptions[0]?.label.trim().toLowerCase() || "";
    if (correctLabel !== variant.correctAnswer.trim().toLowerCase()) {
      factualScore -= 0.6;
      warnings.push("Correct option does not match canonical fact object value.");
    }

    // 3. Ambiguity & Anti-Pattern Check
    const lowerPrompt = variant.prompt.toLowerCase();
    if (
      lowerPrompt.includes("toutes les réponses") ||
      lowerPrompt.includes("aucune de ces réponses") ||
      lowerPrompt.includes("lequel n'est pas") ||
      lowerPrompt.includes("laquelle n'est pas")
    ) {
      ambiguityScore -= 0.4;
      warnings.push("Contains negative framing or exam anti-pattern ('toutes les réponses', 'aucun').");
    }

    // 4. Distractor Length & Balance Check
    const lengths = variant.options.map((o) => o.label.length);
    const minLen = Math.min(...lengths);
    const maxLen = Math.max(...lengths);
    if (maxLen > minLen * 3.5 && minLen > 0) {
      distractorScore -= 0.15;
      warnings.push("High disparity in option lengths (potential visual answer clue).");
    }

    // 5. Deduplication Check (Exact & Lineage)
    const normalizedSignature = variant.prompt
      .toLowerCase()
      .replace(/[^\w\s]/gi, "")
      .replace(/\s+/g, " ")
      .trim();

    if (this.existingPromptSignatures.has(normalizedSignature)) {
      duplicateScore = 0.0;
      warnings.push("Exact duplicate prompt signature already published in registry.");
    } else {
      this.existingPromptSignatures.add(normalizedSignature);
    }

    // Track concept variant density
    const count = this.existingConceptVariants.get(variant.conceptId) || 0;
    if (count >= 3) {
      duplicateScore -= 0.2;
      warnings.push(`High concept variant count (${count} variants already generated for this fact).`);
    }
    this.existingConceptVariants.set(variant.conceptId, count + 1);

    // 6. Composite Score Calculation
    const compositeScore = Math.max(
      0.0,
      Math.min(
        1.0,
        Number(
          (
            factualScore * 0.35 +
            ambiguityScore * 0.25 +
            distractorScore * 0.20 +
            languageScore * 0.10 +
            duplicateScore * 0.10
          ).toFixed(2),
        ),
      ),
    );

    // 7. Threshold & Pool Classification
    let status: ValidationStatus = "passed";
    let reviewStatus: "approved" | "pending" | "quarantined" = "approved";
    const suggestedPools: QuestionPool[] = ["training"];

    if (compositeScore < 0.80 || factualScore < 0.5 || distractorScore < 0.5) {
      status = "rejected";
      reviewStatus = "quarantined";
    } else if (compositeScore < 0.92 || warnings.length > 1) {
      status = "needs_review";
      reviewStatus = "pending";
      suggestedPools.push("verified");
    } else if (compositeScore < 0.97) {
      status = "passed";
      reviewStatus = "approved";
      suggestedPools.push("verified");
    } else {
      status = "passed";
      reviewStatus = "approved";
      suggestedPools.push("verified", "competitive");
    }

    const breakdown: ValidationScoreBreakdown = {
      status,
      compositeScore,
      factualScore,
      ambiguityScore,
      distractorScore,
      languageScore,
      duplicateScore,
      warnings,
      suggestedPools,
    };

    return {
      ...variant,
      validation: breakdown,
      qualityScore: compositeScore,
      reviewStatus,
      pools: suggestedPools,
      validatedAt: new Date().toISOString(),
    };
  }
}

export const questionValidationPipeline = new QuestionValidationPipeline();
