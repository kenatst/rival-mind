export type QuestionPool = "training" | "verified" | "competitive" | "championship";

export type DifficultyTier = "easy" | "medium" | "hard" | "expert";

export type ValidationStatus = "passed" | "needs_review" | "rejected";

export type ReviewStatus = "draft" | "pending" | "approved" | "quarantined" | "deprecated";

export interface IngestedFact {
  factId: string;
  sourceName: string;
  externalEntityId: string;
  externalPropertyId: string;
  sourceReference: string;
  subject: string;
  predicate: string;
  objectValue: string;
  entityType: string;
  category: string;
  subcategory?: string | undefined;
  numericValue?: number | undefined;
  dateValue?: string | undefined;
  unit?: string | undefined;
  confidence: number;
  timeless: boolean;
  ingestedAt: string;
}

export interface FactEligibility {
  factId: string;
  eligible: boolean;
  score: number; // 0.00 - 1.00
  reasons: string[];
}

export interface QuestionTemplate {
  templateId: string;
  predicate: string;
  direction: "subject_to_object" | "object_to_subject";
  languageCode: "fr";
  templatePrompt: string; // e.g. "Quelle est la capitale de {subject} ?"
  templateExplanation: string; // e.g. "{object} est la capitale officielle de {subject}."
  category: string;
  subcategory?: string | undefined;
  difficultyEstimate: DifficultyTier;
}

export interface GeneratedVariant {
  candidateId: string;
  factId: string;
  conceptId: string;
  templateId: string;
  languageCode: "fr";
  prompt: string;
  explanation: string;
  category: string;
  subcategory?: string | undefined;
  difficultyEstimate: DifficultyTier;
  correctAnswer: string;
  distractors: string[];
  options: { id: string; label: string; isCorrect: boolean }[];
  generationJobId?: string | undefined;
}

export interface ValidationScoreBreakdown {
  status: ValidationStatus;
  compositeScore: number; // 0.00 - 1.00
  factualScore: number;
  ambiguityScore: number;
  distractorScore: number;
  languageScore: number;
  duplicateScore: number;
  warnings: string[];
  suggestedPools: QuestionPool[];
}

export interface ValidatedQuestionVariant extends GeneratedVariant {
  validation: ValidationScoreBreakdown;
  qualityScore: number;
  reviewStatus: ReviewStatus;
  pools: QuestionPool[];
  validatedAt: string;
}

export interface FactoryJobRecord {
  jobId: string;
  jobType: "ingestion" | "generation" | "validation" | "publishing" | "pipeline";
  status: "queued" | "running" | "completed" | "partial" | "failed" | "cancelled";
  cursor: number;
  recordsSeen: number;
  recordsInserted: number;
  recordsSkipped: number;
  recordsFailed: number;
  startedAt: string;
  completedAt?: string | undefined;
  errorSummary?: string | undefined;
  metadata?: Record<string, any> | undefined;
}

export interface FactoryRunReport {
  timestamp: string;
  target: number;
  factsIngested: number;
  eligibleFacts: number;
  candidatesGenerated: number;
  exactDuplicates: number;
  validationRejects: number;
  manualReviewRequired: number;
  autoVerified: number;
  competitiveCandidates: number;
  categoryBreakdown: Record<string, number>;
  difficultyBreakdown: Record<string, number>;
  rejectionReasons: Record<string, number>;
}
