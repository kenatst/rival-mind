# IQ ARENA — Deterministic Free Answer Evaluation Engine

## 1. Design Philosophy

> *"Recall is a completely different cognitive skill than recognition. A true knowledge athlete can produce the answer from memory, not just spot it among four options."*

The IQ ARENA Free Answer Engine uses a **multi-stage deterministic evaluation pipeline** before any fallback:
- **Zero LLM cost/latency** for standard typing evaluation (runs under 1ms).
- **Zero answer leaks** to the browser prior to evaluation.
- **Bounded typo tolerance** with length-dependent thresholds.
- **Transliterations & Canonical Aliases Dictionary** for historical, international, and colloquial naming.
- **Community Dispute Workflow** to continuously improve the alias dictionary.

---

## 2. Five-Stage Normalization Pipeline

```
Raw User Input ("  L'Océan Pacifque  ")
  │
  ▼ Stage 1: Trim & Casefold ("l'océan pacifque")
  │
  ▼ Stage 2: Strip Diacritics & Accents ("l'ocean pacifque")
  │
  ▼ Stage 3: Strip Punctuation & Quotes ("l ocean pacifque")
  │
  ▼ Stage 4: Strip Leading French/English Articles ("ocean pacifque")
  │
  ▼ Stage 5: Normalize Whitespace ("ocean pacifque")
```

Articles automatically stripped in Stage 4:
`le`, `la`, `les`, `l'`, `un`, `une`, `des`, `du`, `de`, `d'`, `the`, `a`, `an`.

---

## 3. Typo Tolerance with Length Thresholding

To prevent short answers like `Paris`, `Rome`, or `Tokyo` from accepting incorrect words (`Pares`, `Oslo`), the allowable Damerau-Levenshtein edit distance strictly depends on target string length:

| Target Length | Allowed Edit Distance | Examples |
| :--- | :--- | :--- |
| **<= 5 chars** | **0 typos (Strict)** | `Paris`, `Rome`, `Tokyo`, `Chine`, `Inde`, `Fer`, `Or` |
| **6 to 8 chars** | **1 typo** | `Canada` -> `Canade`, `Londres` -> `Londre`, `Mozart` -> `Mozarte` |
| **>= 9 chars** | **2 typos** | `Dostoïevski` -> `Dostoyevski`, `Tchaïkovski` -> `Tchaikovski` |

---

## 4. Canonical Aliases & Transliterations

The engine checks both the canonical answer and registered aliases in `question_answer_aliases`:

```json
{
  "États-Unis": ["USA", "Etats Unis", "Etats-Unis d'Amérique", "United States", "US"],
  "Royaume-Uni": ["UK", "Grande-Bretagne", "Angleterre", "Great Britain", "United Kingdom"],
  "Léonard de Vinci": ["Da Vinci", "Leonardo da Vinci", "Vinci"],
  "Piotr Ilitch Tchaïkovski": ["Tchaikovsky", "Tchaikovski", "Pyotr Tchaikovsky"]
}
```

---

## 5. Dispute & Adjudication Protocol

When a player types a valid alternative that is rejected:
1. In the result review, the player taps **"My answer should have been accepted"**.
2. A dispute is submitted to `free_answer_attempts` with status `pending`.
3. In **Admin Question Center**, moderators review pending disputes.
4. Tapping **"Approve Alias"** instantly registers the alias into `question_answer_aliases`, benefiting all future players globally.
