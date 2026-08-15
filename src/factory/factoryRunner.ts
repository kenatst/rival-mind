import { IngestedFact, GeneratedVariant, ValidatedQuestionVariant, FactoryRunReport } from "./types";
import { wikidataIngestionEngine } from "./wikidataIngestion";
import { factEligibilityEngine } from "./eligibilityEngine";
import { FACTORY_TEMPLATES } from "./templates";
import { distractorEngine } from "./distractorEngine";
import { questionValidationPipeline } from "./validationPipeline";
import { authoritativeGameEngine } from "@/engine/gameEngine";
import { SeedQuestion } from "@/engine/seedData";
import * as fs from "fs";
import * as path from "path";

export interface FactoryRunnerOptions {
  target?: number | undefined;
  dryRun?: boolean | undefined;
  auditSamplePath?: string | undefined;
  reportPath?: string | undefined;
}

export class QuestionFactoryRunner {
  private generatedHistory: ValidatedQuestionVariant[] = [];
  private jobIndex: Map<string, ValidatedQuestionVariant[]> = new Map();

  /**
   * Runs the complete end-to-end industrial Question Factory pipeline.
   */
  public runPipeline(options: FactoryRunnerOptions = {}): {
    report: FactoryRunReport;
    verifiedQuestions: ValidatedQuestionVariant[];
    auditSample: ValidatedQuestionVariant[];
  } {
    const target = options.target || 1000;
    const isDryRun = Boolean(options.dryRun);
    const jobId = "factory-job-" + Math.random().toString(36).substring(2, 10);

    questionValidationPipeline.resetRegistry();

    // 1. Ingest structured Wikidata facts
    const ingestion = wikidataIngestionEngine.runIngestion({ limit: target * 2 });
    const allFacts = ingestion.facts;

    // 2. Filter eligible facts
    const { eligible, rejected: rejectedFacts } = factEligibilityEngine.filterEligible(allFacts);

    // 3. Generate candidate variants using deterministic templates & distractor engine
    const candidates: GeneratedVariant[] = [];
    let candidateIndex = 1;

    for (const fact of eligible) {
      // Find matching templates for fact predicate
      const matchingTemplates = FACTORY_TEMPLATES.filter((t) => t.predicate === fact.predicate);
      for (const template of matchingTemplates) {
        if (candidates.length >= target * 1.5) break;

        const prompt = template.templatePrompt
          .replace("{subject}", fact.subject)
          .replace("{object}", fact.objectValue);

        const explanation = template.templateExplanation
          .replace("{subject}", fact.subject)
          .replace("{object}", fact.objectValue);

        const distractors = distractorEngine.generateDistractors(fact, allFacts, template.difficultyEstimate);

        // Build 4 shuffled options
        const rawOptions = [
          { id: "a", label: fact.objectValue, isCorrect: true },
          { id: "b", label: distractors[0] || "Option B", isCorrect: false },
          { id: "c", label: distractors[1] || "Option C", isCorrect: false },
          { id: "d", label: distractors[2] || "Option D", isCorrect: false },
        ].sort(() => 0.5 - Math.random());

        // Standardize IDs to 1, 2, 3, 4
        const standardizedOptions = rawOptions.map((o, idx) => ({
          id: String(idx + 1),
          label: o.label,
          isCorrect: o.isCorrect,
        }));

        const candidate: GeneratedVariant = {
          candidateId: `cand-${jobId}-${candidateIndex++}`,
          factId: fact.factId,
          conceptId: `concept-${fact.predicate}-${fact.subject.toLowerCase().replace(/[^\w]/g, "")}`,
          templateId: template.templateId,
          languageCode: "fr",
          prompt,
          explanation,
          category: template.category,
          subcategory: template.subcategory || fact.subcategory,
          difficultyEstimate: template.difficultyEstimate,
          correctAnswer: fact.objectValue,
          distractors,
          options: standardizedOptions,
          generationJobId: jobId,
        };

        candidates.push(candidate);
      }
    }

    // 4. Run through 5-stage validation pipeline
    const validatedVariants: ValidatedQuestionVariant[] = [];
    const verifiedQuestions: ValidatedQuestionVariant[] = [];
    let exactDuplicates = 0;
    let validationRejects = 0;
    let manualReviewRequired = 0;
    let competitiveCandidates = 0;
    const categoryBreakdown: Record<string, number> = {};
    const difficultyBreakdown: Record<string, number> = {};
    const rejectionReasons: Record<string, number> = {};

    for (const cand of candidates) {
      const validated = questionValidationPipeline.validateQuestion(cand);
      validatedVariants.push(validated);

      if (validated.validation.status === "rejected") {
        validationRejects++;
        for (const w of validated.validation.warnings) {
          rejectionReasons[w] = (rejectionReasons[w] || 0) + 1;
        }
        if (validated.validation.warnings.some((w) => w.includes("duplicate"))) {
          exactDuplicates++;
        }
      } else if (validated.validation.status === "needs_review") {
        manualReviewRequired++;
      } else {
        // Auto-Verified
        verifiedQuestions.push(validated);
        if (validated.pools.includes("competitive")) {
          competitiveCandidates++;
        }

        categoryBreakdown[validated.category] = (categoryBreakdown[validated.category] || 0) + 1;
        difficultyBreakdown[validated.difficultyEstimate] = (difficultyBreakdown[validated.difficultyEstimate] || 0) + 1;
      }
    }

    // 5. If not dry run, publish verified questions into authoritative game engine pool
    if (!isDryRun) {
      const seedFormat: SeedQuestion[] = verifiedQuestions.map((v) => ({
        id: v.candidateId,
        category: v.category,
        subcategory: v.subcategory,
        prompt: v.prompt,
        difficulty: v.difficultyEstimate,
        seconds: 10,
        explanation: v.explanation,
        source: `Wikidata (${v.factId}) · IQ Factory v1`,
        answers: v.options,
      }));

      authoritativeGameEngine.registerFactoryQuestions(seedFormat);
      this.jobIndex.set(jobId, verifiedQuestions);
      this.generatedHistory.push(...verifiedQuestions);
    }

    // 6. Generate 100-Question Random Audit Sample
    const shuffledVerified = [...verifiedQuestions].sort(() => 0.5 - Math.random());
    const auditSample = shuffledVerified.slice(0, 100);

    // 7. Assemble Run Report
    const report: FactoryRunReport = {
      timestamp: new Date().toISOString(),
      target,
      factsIngested: allFacts.length,
      eligibleFacts: eligible.length,
      candidatesGenerated: candidates.length,
      exactDuplicates,
      validationRejects,
      manualReviewRequired,
      autoVerified: verifiedQuestions.length,
      competitiveCandidates,
      categoryBreakdown,
      difficultyBreakdown,
      rejectionReasons,
    };

    // Export audit sample to file if requested or in workspace
    try {
      const exportPath = options.auditSamplePath || path.resolve(process.cwd(), "factory-audit-sample.json");
      fs.writeFileSync(
        exportPath,
        JSON.stringify(
          auditSample.map((q) => ({
            id: q.candidateId,
            category: q.category,
            prompt: q.prompt,
            options: q.options.map((o) => o.label),
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            difficulty: q.difficultyEstimate,
            qualityScore: q.qualityScore,
            pools: q.pools,
            provenance: { factId: q.factId, templateId: q.templateId },
          })),
          null,
          2,
        ),
      );
    } catch (e) {
      console.warn("Could not write audit sample file:", e);
    }

    return {
      report,
      verifiedQuestions,
      auditSample,
    };
  }

  /**
   * Rollback / Quarantine an entire batch by jobId.
   */
  public rollbackJob(jobId: string): { rolledBack: number } {
    const variants = this.jobIndex.get(jobId) || [];
    for (const v of variants) {
      authoritativeGameEngine.quarantineQuestion(v.candidateId, "admin-system", `Rollback batch ${jobId}`);
    }
    return { rolledBack: variants.length };
  }

  public getGeneratedHistory(): ValidatedQuestionVariant[] {
    return this.generatedHistory;
  }
}

export const questionFactoryRunner = new QuestionFactoryRunner();
