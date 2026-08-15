export type FreeAnswerMatchMethod =
  | "exact"
  | "normalized"
  | "alias"
  | "fuzzy"
  | "transliteration"
  | "none";

export type FreeAnswerResultState =
  | "CORRECT"
  | "TYPO_ACCEPTED"
  | "ALIAS_ACCEPTED"
  | "INCORRECT";

export interface FreeAnswerEvaluationResult {
  isCorrect: boolean;
  state: FreeAnswerResultState;
  displayCorrectAnswer: string;
  matchMethod: FreeAnswerMatchMethod;
  similarityScore: number;
  explanation?: string | undefined;
  matchedAlias?: string | undefined;
  feedbackMessage: string;
}

export interface FreeAnswerAliasRecord {
  id: string;
  conceptId?: string | undefined;
  canonicalAnswer: string;
  languageCode: "fr" | "en";
  aliases: {
    alias: string;
    type: "canonical" | "common" | "abbreviation" | "alternate_spelling" | "transliteration" | "accepted_short_form";
    confidence: number;
  }[];
}

export interface FreeAnswerDispute {
  id: string;
  questionId: string;
  rawInput: string;
  canonicalAnswer: string;
  reason?: string | undefined;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

/**
 * Common Canonical Aliases & Transliterations Database for Free Answer Mode.
 */
export const CANONICAL_ALIASES_REGISTRY: Record<string, string[]> = {
  // Geography & Countries
  "états-unis": ["etats unis", "etats-unis", "usa", "u.s.a.", "united states", "united states of america", "les etats unis"],
  "royaume-uni": ["royaume uni", "royaume-uni", "uk", "u.k.", "grande bretagne", "great britain", "united kingdom", "le royaume uni"],
  "pays-bas": ["pays bas", "pays-bas", "hollande", "netherlands", "les pays bas"],
  "paris": ["paris", "ville lumiere"],
  "londres": ["londres", "london"],
  "rome": ["rome", "roma"],
  "tokyo": ["tokyo", "tokio"],
  "washington": ["washington", "washington d.c.", "washington dc"],
  "ottawa": ["ottawa"],
  "canberra": ["canberra"],
  "océan pacifique": ["pacifique", "ocean pacifique", "l'ocean pacifique"],
  "océan atlantique": ["atlantique", "ocean atlantique", "l'ocean atlantique"],
  "mont blanc": ["mont blanc", "le mont blanc"],
  "everest": ["everest", "mont everest", "le mont everest"],

  // Art & Literature
  "léonard de vinci": ["leonard de vinci", "de vinci", "da vinci", "leonardo da vinci", "vinci"],
  "vincent van gogh": ["van gogh", "vincent van gogh"],
  "claude monet": ["monet", "claude monet"],
  "pablo picasso": ["picasso", "pablo picasso"],
  "auguste rodin": ["rodin", "auguste rodin"],
  "victor hugo": ["victor hugo", "hugo"],
  "marcel proust": ["marcel proust", "proust"],
  "gustave flaubert": ["gustave flaubert", "flaubert"],
  "émile zola": ["emile zola", "zola"],
  "albert camus": ["albert camus", "camus"],
  "fiodor dostoïevski": ["dostoievski", "dostoevsky", "dostoievsky", "fiodor dostoievski", "fyodor dostoevsky"],
  "léon tolstoï": ["tolstoi", "tolstoy", "leon tolstoi", "leo tolstoy"],
  "alexandre dumas": ["alexandre dumas", "dumas"],
  "william shakespeare": ["shakespeare", "william shakespeare"],
  "molière": ["moliere", "jean baptiste poquelin"],

  // Science & Discoveries
  "albert einstein": ["albert einstein", "einstein"],
  "marie curie": ["marie curie", "curie", "marie sklodowska-curie"],
  "isaac newton": ["isaac newton", "newton"],
  "charles darwin": ["charles darwin", "darwin"],
  "louis pasteur": ["louis pasteur", "pasteur"],
  "galilée": ["galilee", "galileo", "galileo galilei"],
  "or": ["or", "gold", "au"],
  "fer": ["fer", "iron", "fe"],
  "argent": ["argent", "silver", "ag"],
  "cuivre": ["cuivre", "copper", "cu"],
  "oxygène": ["oxygene", "o", "dioxygene"],
  "hydrogène": ["hydrogene", "h"],
  "azote": ["azote", "n"],
  "hélium": ["helium", "he"],

  // Cinema & Music
  "steven spielberg": ["steven spielberg", "spielberg"],
  "christopher nolan": ["christopher nolan", "nolan"],
  "alfred hitchcock": ["alfred hitchcock", "hitchcock"],
  "stanley kubrick": ["stanley kubrick", "kubrick"],
  "martin scorsese": ["martin scorsese", "scorsese"],
  "ludwig van beethoven": ["beethoven", "ludwig van beethoven"],
  "wolfgang amadeus mozart": ["mozart", "wolfgang amadeus mozart"],
  "jean-sébastien bach": ["bach", "jean sebastien bach", "j.s. bach", "js bach"],
  "frederic chopin": ["chopin", "frederic chopin", "frédéric chopin"],
  "piotr ilitch tchaïkovski": ["tchaikovski", "tchaikovsky", "piotr tchaikovski", "pyotr tchaikovsky"],
  "antonio vivaldi": ["vivaldi", "antonio vivaldi"],

  // History
  "napoléon bonaparte": ["napoleon", "napoleon bonaparte", "napoleon ier", "bonaparte"],
  "louis xiv": ["louis xiv", "louis 14", "roi soleil", "le roi soleil"],
  "jules césar": ["jules cesar", "cesar", "julius caesar"],
  "charlemagne": ["charlemagne", "charles le grand"],
  "traité de versailles": ["traite de versailles", "versailles"],
  "révolution française": ["revolution francaise", "1789", "la revolution francaise"],
};

export class FreeAnswerEvaluationEngine {
  private disputes: Map<string, FreeAnswerDispute> = new Map();
  private dynamicAliases: Map<string, Set<string>> = new Map(); // questionId/canonical -> Set of aliases

  /**
   * Complete multi-stage normalization pipeline for text.
   */
  public normalize(text: string, stripArticles: boolean = true): string {
    if (!text) return "";

    let s = text.trim().toLowerCase();

    // 1. Normalize Unicode (remove combining diacritics where appropriate)
    s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // 2. Normalize quotes & apostrophes
    s = s.replace(/[\u2018\u2019\u0027\u02BC\u0060\u00B4]/g, "'");
    s = s.replace(/[\u00AB\u00BB\u201C\u201D"]/g, " ");

    // 3. Remove leading French/English articles if permitted
    if (stripArticles) {
      s = s.replace(/^(le|la|les|l'|un|une|des|du|de|d'|the|a|an)\s+/i, "");
      s = s.replace(/^l'/, "");
      s = s.replace(/^d'/, "");
    }

    // 4. Replace punctuation & hyphens with space
    s = s.replace(/[-_.,;:!?()[\]{}/*#+]/g, " ");

    // 5. Collapse whitespace
    s = s.replace(/\s+/g, " ").trim();

    return s;
  }

  /**
   * Bounded Damerau-Levenshtein Edit Distance (including transpositions).
   */
  public computeDamerauLevenshtein(a: string, b: string): number {
    const lenA = a.length;
    const lenB = b.length;

    if (lenA === 0) return lenB;
    if (lenB === 0) return lenA;

    const matrix: number[][] = [];

    for (let i = 0; i <= lenA; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= lenB; j++) {
      matrix[0]![j] = j;
    }

    for (let i = 1; i <= lenA; i++) {
      for (let j = 1; j <= lenB; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i]![j] = Math.min(
          matrix[i - 1]![j]! + 1, // deletion
          matrix[i]![j - 1]! + 1, // insertion
          matrix[i - 1]![j - 1]! + cost, // substitution
        );

        // Transposition
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
          matrix[i]![j] = Math.min(matrix[i]![j]!, matrix[i - 2]![j - 2]! + cost);
        }
      }
    }

    return matrix[lenA]![lenB]!;
  }

  /**
   * Evaluates a user's typed free-text answer against ground truth.
   * Deterministic, safe, typo-tolerant, and secret.
   */
  public evaluateAnswer(
    userRawInput: string,
    canonicalAnswer: string,
    additionalAliases: string[] = [],
    explanation?: string,
  ): FreeAnswerEvaluationResult {
    if (!userRawInput || userRawInput.trim().length === 0) {
      return {
        isCorrect: false,
        state: "INCORRECT",
        displayCorrectAnswer: canonicalAnswer,
        matchMethod: "none",
        similarityScore: 0,
        explanation,
        feedbackMessage: "No answer provided.",
      };
    }

    const normInput = this.normalize(userRawInput);
    const normCanonical = this.normalize(canonicalAnswer);

    // 1. EXACT / NORMALIZED MATCH
    if (normInput === normCanonical) {
      return {
        isCorrect: true,
        state: "CORRECT",
        displayCorrectAnswer: canonicalAnswer,
        matchMethod: "normalized",
        similarityScore: 1.0,
        explanation,
        feedbackMessage: "Exact match! Outstanding recall.",
      };
    }

    // 2. ALIAS / TRANSLITERATION MATCH
    const allKnownAliases = new Set<string>();

    // Lookup preconfigured canonical aliases
    const canonicalKey = this.normalize(canonicalAnswer);
    for (const [key, aliasList] of Object.entries(CANONICAL_ALIASES_REGISTRY)) {
      if (this.normalize(key) === canonicalKey) {
        aliasList.forEach((a) => allKnownAliases.add(this.normalize(a)));
      }
    }

    // Include dynamically supplied question aliases
    additionalAliases.forEach((a) => allKnownAliases.add(this.normalize(a)));

    // Check dynamic community approved aliases
    const dynamicSet = this.dynamicAliases.get(canonicalKey);
    if (dynamicSet) {
      dynamicSet.forEach((a) => allKnownAliases.add(a));
    }

    for (const alias of allKnownAliases) {
      if (normInput === alias) {
        return {
          isCorrect: true,
          state: "ALIAS_ACCEPTED",
          displayCorrectAnswer: canonicalAnswer,
          matchMethod: "alias",
          matchedAlias: alias,
          similarityScore: 1.0,
          explanation,
          feedbackMessage: `Accepted (${canonicalAnswer}).`,
        };
      }
    }

    // 3. BOUNDED TYPO TOLERANCE (Damerau-Levenshtein)
    // Check against canonical and all known aliases
    const targets = [normCanonical, ...Array.from(allKnownAliases)];
    let bestTarget = "";
    let minDistance = Infinity;

    for (const target of targets) {
      if (!target || target.length < 3) continue;

      const dist = this.computeDamerauLevenshtein(normInput, target);
      if (dist < minDistance) {
        minDistance = dist;
        bestTarget = target;
      }
    }

    // Length-dependent thresholding to protect short answers (e.g. "Paris", "Rome", "Tokyo")
    const targetLen = bestTarget.length;
    let allowedDistance = 0;

    if (targetLen <= 5) {
      allowedDistance = 0; // Strict: 0 typos for short words like "Paris", "Rome", "Tokyo", "Chine"
    } else if (targetLen <= 8) {
      allowedDistance = 1; // 1 typo allowed for "Canada", "Madrid", "Londres", "Mozart"
    } else {
      allowedDistance = 2; // 2 typos allowed for "Dostoïevski", "Tchaïkovski", "Pacifique"
    }

    if (minDistance > 0 && minDistance <= allowedDistance) {
      const similarity = 1 - minDistance / Math.max(normInput.length, targetLen);
      return {
        isCorrect: true,
        state: "TYPO_ACCEPTED",
        displayCorrectAnswer: canonicalAnswer,
        matchMethod: "fuzzy",
        similarityScore: Math.round(similarity * 100) / 100,
        explanation,
        feedbackMessage: `Typo accepted: ${canonicalAnswer}`,
      };
    }

    // 4. INCORRECT
    return {
      isCorrect: false,
      state: "INCORRECT",
      displayCorrectAnswer: canonicalAnswer,
      matchMethod: "none",
      similarityScore: Math.max(0, 1 - minDistance / Math.max(normInput.length, normCanonical.length)),
      explanation,
      feedbackMessage: `Incorrect. The correct answer was: ${canonicalAnswer}`,
    };
  }

  /**
   * Records a user dispute for community alias expansion.
   */
  public submitDispute(questionId: string, rawInput: string, canonicalAnswer: string, reason?: string): FreeAnswerDispute {
    const id = "disp-" + Math.random().toString(36).substring(2, 10);
    const dispute: FreeAnswerDispute = {
      id,
      questionId,
      rawInput,
      canonicalAnswer,
      reason,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    this.disputes.set(id, dispute);
    return dispute;
  }

  /**
   * Admin approves a disputed alias and registers it permanently.
   */
  public approveDispute(disputeId: string): { success: boolean; dispute: FreeAnswerDispute } {
    const dispute = this.disputes.get(disputeId);
    if (!dispute) throw new Error("Dispute not found");

    dispute.status = "approved";
    const canonicalKey = this.normalize(dispute.canonicalAnswer);
    const normInput = this.normalize(dispute.rawInput);

    if (!this.dynamicAliases.has(canonicalKey)) {
      this.dynamicAliases.set(canonicalKey, new Set());
    }
    this.dynamicAliases.get(canonicalKey)!.add(normInput);

    return { success: true, dispute };
  }

  public getDisputes(): FreeAnswerDispute[] {
    return Array.from(this.disputes.values());
  }
}

export const freeAnswerEngine = new FreeAnswerEvaluationEngine();
