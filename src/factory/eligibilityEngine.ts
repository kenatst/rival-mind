import { IngestedFact, FactEligibility } from "./types";

export class FactEligibilityEngine {
  /**
   * Evaluates a fact across dimensions to compute a deterministic eligibility score (0.00 - 1.00).
   */
  public evaluateFact(fact: IngestedFact): FactEligibility {
    const reasons: string[] = [];
    let score = 1.0;

    // 1. Check for unreadable/code-like identifiers (e.g. Q12345 or P678)
    if (/^Q\d+$/i.test(fact.subject) || /^Q\d+$/i.test(fact.objectValue)) {
      score -= 0.8;
      reasons.push("Entity contains unresolved Wikidata identifier instead of human label.");
    }

    // 2. Check for missing/blank values
    if (!fact.subject.trim() || !fact.objectValue.trim()) {
      score = 0.0;
      reasons.push("Fact missing subject or object string value.");
      return { factId: fact.factId, eligible: false, score: 0.0, reasons };
    }

    // 3. Check for time-sensitive volatility
    if (!fact.timeless) {
      score -= 0.35;
      reasons.push("Fact is flagged as time-sensitive (requires ongoing verification).");
    }

    // 4. Check confidence score from source
    if (fact.confidence < 0.90) {
      score -= (1.0 - fact.confidence) * 0.5;
      reasons.push(`Low source confidence: ${fact.confidence}`);
    }

    // 5. Check length and formatting sanity
    if (fact.subject.length > 120 || fact.objectValue.length > 80) {
      score -= 0.2;
      reasons.push("Subject or object exceeds standard display bounds.");
    }

    // Normalized score boundary
    const finalScore = Math.max(0.0, Math.min(1.0, Number(score.toFixed(2))));
    const isEligible = finalScore >= 0.80;

    return {
      factId: fact.factId,
      eligible: isEligible,
      score: finalScore,
      reasons: reasons.length > 0 ? reasons : ["Fact meets all high-confidence eligibility criteria."],
    };
  }

  public filterEligible(facts: IngestedFact[]): { eligible: IngestedFact[]; rejected: { fact: IngestedFact; evaluation: FactEligibility }[] } {
    const eligible: IngestedFact[] = [];
    const rejected: { fact: IngestedFact; evaluation: FactEligibility }[] = [];

    for (const f of facts) {
      const evaluation = this.evaluateFact(f);
      if (evaluation.eligible) {
        eligible.push(f);
      } else {
        rejected.push({ fact: f, evaluation });
      }
    }

    return { eligible, rejected };
  }
}

export const factEligibilityEngine = new FactEligibilityEngine();
