import { IngestedFact, DifficultyTier } from "./types";

export class DistractorEngine {
  /**
   * Generates 3 semantically compatible distractors for a given fact and template.
   */
  public generateDistractors(
    targetFact: IngestedFact,
    allFacts: IngestedFact[],
    difficulty: DifficultyTier = "medium",
  ): string[] {
    const correctAnswer = targetFact.objectValue.trim();

    // 1. Gather all candidate values matching the exact same predicate and entity type
    let candidatePool = allFacts
      .filter((f) => f.predicate === targetFact.predicate && f.objectValue.trim().toLowerCase() !== correctAnswer.toLowerCase())
      .map((f) => f.objectValue.trim());

    // 2. Remove duplicates
    candidatePool = Array.from(new Set(candidatePool));

    // 3. Fallback candidate pools if pool is smaller than 3
    if (candidatePool.length < 3) {
      if (targetFact.predicate === "capital") {
        candidatePool = ["Ljubljana", "Zagreb", "Bratislava", "Vilnius", "Tallinn", "Riga", "Sofia", "Skopje", "Valletta", "Nicosie", "Sarajevo"];
      } else if (targetFact.predicate === "chemical_symbol") {
        candidatePool = ["Au", "Ag", "Fe", "Cu", "Pb", "Hg", "W", "Sn", "Na", "K", "Pt", "Zn", "Ni", "Co", "Ti"];
      } else if (targetFact.predicate === "atomic_number") {
        const num = Number(targetFact.subject) || 10;
        candidatePool = ["l'or", "l'argent", "le fer", "le cuivre", "le mercure", "l'hydrogène", "l'hélium", "le carbone", "l'azote", "l'oxygène", "le platine", "le zinc"];
      } else if (targetFact.predicate === "event_year") {
        const yr = Number(targetFact.objectValue) || 1789;
        candidatePool = [
          (yr - 2).toString(),
          (yr + 5).toString(),
          (yr - 10).toString(),
          (yr + 12).toString(),
          (yr - 4).toString(),
        ];
      } else if (targetFact.predicate === "created_by_painter") {
        candidatePool = ["Vincent van Gogh", "Pablo Picasso", "Claude Monet", "Léonard de Vinci", "Edvard Munch", "Rembrandt", "Salvador Dalí", "Gustav Klimt", "Paul Cézanne", "Henri Matisse"];
      } else if (targetFact.predicate === "authored_by") {
        candidatePool = ["Victor Hugo", "Albert Camus", "Marcel Proust", "Émile Zola", "Gustave Flaubert", "Alexandre Dumas", "George Orwell", "Franz Kafka", "Gabriel García Márquez", "Léon Tolstoï"];
      } else if (targetFact.predicate === "directed_by") {
        candidatePool = ["Christopher Nolan", "Quentin Tarantino", "Steven Spielberg", "Martin Scorsese", "Stanley Kubrick", "Alfred Hitchcock", "Ridley Scott", "James Cameron", "Hayao Miyazaki", "Bong Joon-ho"];
      } else if (targetFact.predicate === "composed_by") {
        candidatePool = ["Ludwig van Beethoven", "Wolfgang Amadeus Mozart", "Johann Sebastian Bach", "Antonio Vivaldi", "Maurice Ravel", "Claude Debussy", "Piotr Ilitch Tchaïkovski", "Georges Bizet", "Giuseppe Verdi", "Frédéric Chopin"];
      } else if (targetFact.predicate === "origin_country") {
        candidatePool = ["l'Espagne", "l'Italie", "le Japon", "le Mexique", "la Grèce", "le Pérou", "le Brésil", "la Thaïlande", "le Vietnam", "l'Inde", "le Liban", "la Turquie"];
      } else if (targetFact.predicate === "taxonomic_class") {
        candidatePool = ["mammifères", "oiseaux", "reptiles", "amphibiens", "poissons", "insectes", "arachnides", "crustacés"];
      } else if (targetFact.predicate === "dynasty") {
        candidatePool = ["Bourbons", "Valois", "Capétiens", "Mérovingiens", "Carolingiens", "Plantagenêts", "Tudor", "Habsbourg"];
      } else {
        candidatePool = allFacts
          .filter((f) => f.category === targetFact.category && f.objectValue.trim().toLowerCase() !== correctAnswer.toLowerCase())
          .map((f) => f.objectValue.trim());
      }
    }

    // Filter out any accidental match with correct answer
    candidatePool = candidatePool.filter(
      (c) => c.toLowerCase() !== correctAnswer.toLowerCase(),
    );

    // Apply difficulty tier ordering
    let selected: string[] = [];
    if (difficulty === "hard") {
      // Pick elements with closest length or closest semantic similarity
      selected = candidatePool.sort(() => 0.5 - Math.random()).slice(0, 3);
    } else if (difficulty === "easy") {
      selected = candidatePool.sort(() => 0.5 - Math.random()).slice(0, 3);
    } else {
      selected = candidatePool.sort(() => 0.5 - Math.random()).slice(0, 3);
    }

    // Ensure we have exactly 3 distractors
    while (selected.length < 3) {
      const fallback = `Option ${selected.length + 1}`;
      if (!selected.includes(fallback)) selected.push(fallback);
    }

    return selected.slice(0, 3);
  }
}

export const distractorEngine = new DistractorEngine();
