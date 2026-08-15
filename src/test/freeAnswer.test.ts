import { describe, it, expect } from "bun:test";
import { freeAnswerEngine } from "../engine/freeAnswerEngine";

describe("IQ ARENA — Free Answer Deterministic Evaluation Engine", () => {
  it("Phase 1: Normalization correctly strips articles, diacritics, and punctuation", () => {
    expect(freeAnswerEngine.normalize("  La France  ")).toBe("france");
    expect(freeAnswerEngine.normalize("L'Océan Pacifique")).toBe("ocean pacifique");
    expect(freeAnswerEngine.normalize("Le traité de Versailles")).toBe("traite de versailles");
    expect(freeAnswerEngine.normalize("États-Unis d'Amérique")).toBe("etats unis d'amerique");
    expect(freeAnswerEngine.normalize("  « Léonard de Vinci »  ")).toBe("leonard de vinci");
  });

  it("Phase 2: Exact and Normalized answers are accepted as CORRECT", () => {
    const res1 = freeAnswerEngine.evaluateAnswer("Paris", "Paris");
    expect(res1.isCorrect).toBe(true);
    expect(res1.state).toBe("CORRECT");
    expect(res1.matchMethod).toBe("normalized");

    const res2 = freeAnswerEngine.evaluateAnswer("tokyo", "Tokyo");
    expect(res2.isCorrect).toBe(true);
    expect(res2.state).toBe("CORRECT");

    const res3 = freeAnswerEngine.evaluateAnswer("l'or", "Or");
    expect(res3.isCorrect).toBe(true);
    expect(res3.state).toBe("CORRECT");
  });

  it("Phase 3: Bounded Typo Tolerance accepts small typos on medium and long words", () => {
    // 1-typo on medium word: "Pacifque" -> "Océan Pacifique"
    const res1 = freeAnswerEngine.evaluateAnswer("Pacifque", "Océan Pacifique");
    expect(res1.isCorrect).toBe(true);
    expect(res1.state).toBe("TYPO_ACCEPTED");

    // 1-typo on "Canada" -> "Canade"
    const res2 = freeAnswerEngine.evaluateAnswer("Canade", "Canada");
    expect(res2.isCorrect).toBe(true);
    expect(res2.state).toBe("TYPO_ACCEPTED");

    // 2-typos on long word: "Dostoyevski" -> "Fiodor Dostoïevski"
    const res3 = freeAnswerEngine.evaluateAnswer("Dostoievski", "Fiodor Dostoïevski");
    expect(res3.isCorrect).toBe(true);
  });

  it("Phase 4: Strict short-word protection prevents false positives", () => {
    // Short word (<= 4 chars) "Paris" must NOT match "Pares" or "Partis"
    const res1 = freeAnswerEngine.evaluateAnswer("Pares", "Paris");
    expect(res1.isCorrect).toBe(false);
    expect(res1.state).toBe("INCORRECT");

    const res2 = freeAnswerEngine.evaluateAnswer("Rome", "Oslo");
    expect(res2.isCorrect).toBe(false);
  });

  it("Phase 5: Canonical aliases, abbreviations, and transliterations are accepted as ALIAS_ACCEPTED", () => {
    // USA -> États-Unis
    const res1 = freeAnswerEngine.evaluateAnswer("USA", "États-Unis");
    expect(res1.isCorrect).toBe(true);
    expect(res1.state).toBe("ALIAS_ACCEPTED");

    // UK -> Royaume-Uni
    const res2 = freeAnswerEngine.evaluateAnswer("UK", "Royaume-Uni");
    expect(res2.isCorrect).toBe(true);
    expect(res2.state).toBe("ALIAS_ACCEPTED");

    // Tchaikovsky (English transliteration) -> Piotr Ilitch Tchaïkovski
    const res3 = freeAnswerEngine.evaluateAnswer("Tchaikovsky", "Piotr Ilitch Tchaïkovski");
    expect(res3.isCorrect).toBe(true);
    expect(res3.state).toBe("ALIAS_ACCEPTED");

    // Leonardo Da Vinci -> Léonard de Vinci
    const res4 = freeAnswerEngine.evaluateAnswer("Da Vinci", "Léonard de Vinci");
    expect(res4.isCorrect).toBe(true);
    expect(res4.state).toBe("ALIAS_ACCEPTED");
  });

  it("Phase 6: Dispute Submission and Admin Approval adds new aliases dynamically", () => {
    const dispute = freeAnswerEngine.submitDispute("q-101", "La Ville Éternelle", "Rome", "Historical nickname");
    expect(dispute.status).toBe("pending");

    // Before approval, it's rejected
    const beforeRes = freeAnswerEngine.evaluateAnswer("La Ville Éternelle", "Rome");
    expect(beforeRes.isCorrect).toBe(false);

    // Admin approves dispute
    const approval = freeAnswerEngine.approveDispute(dispute.id);
    expect(approval.success).toBe(true);
    expect(approval.dispute.status).toBe("approved");

    // Now it matches!
    const afterRes = freeAnswerEngine.evaluateAnswer("La Ville Éternelle", "Rome");
    expect(afterRes.isCorrect).toBe(true);
  });
});
