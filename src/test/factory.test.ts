import { describe, it, expect } from "bun:test";
import { wikidataIngestionEngine } from "@/factory/wikidataIngestion";
import { factEligibilityEngine } from "@/factory/eligibilityEngine";
import { FACTORY_TEMPLATES } from "@/factory/templates";
import { distractorEngine } from "@/factory/distractorEngine";
import { questionValidationPipeline } from "@/factory/validationPipeline";
import { questionFactoryRunner } from "@/factory/factoryRunner";
import { GeneratedVariant } from "@/factory/types";

describe("IQ ARENA - Question Factory V1 Test Suite (Goal B)", () => {
  it("Phase 1 - Ingestion: loads high-confidence Wikidata facts with provenance", () => {
    const res = wikidataIngestionEngine.runIngestion({ limit: 100 });
    expect(res.recordsExamined).toBe(100);
    expect(res.recordsInserted).toBe(100);
    expect(res.facts.length).toBe(100);

    const firstFact = res.facts[0]!;
    expect(firstFact.factId).toBeDefined();
    expect(firstFact.externalEntityId).toMatch(/^Q\d+/);
    expect(firstFact.sourceReference).toContain("wikidata.org");
    expect(firstFact.confidence).toBe(1.0);
  });

  it("Phase 2 - Eligibility: approves notable factual triples and rejects invalid ones", () => {
    const validFact = {
      factId: "f-test-1",
      sourceName: "Wikidata",
      externalEntityId: "Q142",
      externalPropertyId: "P36",
      sourceReference: "https://www.wikidata.org/wiki/Q142",
      subject: "la France",
      predicate: "capital",
      objectValue: "Paris",
      entityType: "Country",
      category: "Geography",
      confidence: 1.0,
      timeless: true,
      ingestedAt: "2026-08-15T00:00:00Z",
    };

    const evalValid = factEligibilityEngine.evaluateFact(validFact);
    expect(evalValid.eligible).toBe(true);
    expect(evalValid.score).toBeGreaterThanOrEqual(0.85);

    // Unresolved Q-identifier in subject
    const unreadableFact = {
      ...validFact,
      subject: "Q142",
    };
    const evalUnreadable = factEligibilityEngine.evaluateFact(unreadableFact);
    expect(evalUnreadable.eligible).toBe(false);
    expect(evalUnreadable.reasons.some((r) => r.includes("identifier"))).toBe(true);
  });

  it("Phase 3 - Templates: deterministic French template interpolation", () => {
    const template = FACTORY_TEMPLATES.find((t) => t.templateId === "geo-capital-direct")!;
    expect(template).toBeDefined();

    const prompt = template.templatePrompt
      .replace("{subject}", "l'Italie")
      .replace("{object}", "Rome");
    expect(prompt).toBe("Quelle est la capitale de l'Italie ?");

    const explanation = template.templateExplanation
      .replace("{subject}", "l'Italie")
      .replace("{object}", "Rome");
    expect(explanation).toBe("Rome est la capitale officielle de l'Italie.");
  });

  it("Phase 4 - Distractor Engine: generates 3 unique, semantically compatible distractors", () => {
    const allFacts = wikidataIngestionEngine.getAllFacts();
    const fact = allFacts.find((f) => f.predicate === "capital")!;

    const distractors = distractorEngine.generateDistractors(fact, allFacts, "medium");
    expect(distractors.length).toBe(3);

    // None can be the correct answer
    const lowerCorrect = fact.objectValue.trim().toLowerCase();
    for (const d of distractors) {
      expect(d.trim().toLowerCase()).not.toBe(lowerCorrect);
    }

    // All 3 distractors must be distinct
    const uniqueDistractors = new Set(distractors.map((d) => d.toLowerCase()));
    expect(uniqueDistractors.size).toBe(3);
  });

  it("Phase 5 - Validation Pipeline: scores composite quality and assigns pools", () => {
    const testCandidate: GeneratedVariant = {
      candidateId: "cand-test-1",
      factId: "f-test-1",
      conceptId: "concept-test-1",
      templateId: "geo-capital-direct",
      languageCode: "fr",
      prompt: "Quelle est la capitale du Portugal ?",
      explanation: "Lisbonne est la capitale officielle du Portugal.",
      category: "Geography",
      difficultyEstimate: "easy",
      correctAnswer: "Lisbonne",
      distractors: ["Madrid", "Porto", "Séville"],
      options: [
        { id: "1", label: "Lisbonne", isCorrect: true },
        { id: "2", label: "Madrid", isCorrect: false },
        { id: "3", label: "Porto", isCorrect: false },
        { id: "4", label: "Séville", isCorrect: false },
      ],
    };

    const validated = questionValidationPipeline.validateQuestion(testCandidate);
    expect(validated.validation.status).toBe("passed");
    expect(validated.qualityScore).toBeGreaterThanOrEqual(0.95);
    expect(validated.pools).toContain("verified");
    expect(validated.pools).toContain("competitive");
  });

  it("Phase 6 - End-to-End Factory: generates 1,000+ verified French questions with audit export", () => {
    const run = questionFactoryRunner.runPipeline({ target: 1000, dryRun: false });

    expect(run.report.factsIngested).toBeGreaterThanOrEqual(1000);
    expect(run.report.autoVerified).toBeGreaterThanOrEqual(1000);
    expect(run.verifiedQuestions.length).toBeGreaterThanOrEqual(1000);
    expect(run.auditSample.length).toBe(100);

    // Verify balanced category representation
    expect(run.report.categoryBreakdown["Geography"]).toBeGreaterThan(100);
    expect(run.report.categoryBreakdown["Science"]).toBeGreaterThan(100);
    expect(run.report.categoryBreakdown["Art"]).toBeGreaterThan(20);
    expect(run.report.categoryBreakdown["Literature"]).toBeGreaterThan(20);

    // Verify difficulty breakdown
    expect(run.report.difficultyBreakdown["easy"]).toBeGreaterThan(100);
    expect(run.report.difficultyBreakdown["medium"]).toBeGreaterThan(100);
  });
});
