# IQ ARENA — Industrial Question Factory V1 Architecture & Implementation

---

## 1. Overview & Core Philosophy

The IQ ARENA Question Factory is a modular, observable, resumable, and auditable data production system capable of generating, validating, deduplicating, and publishing pristine trivia questions at scale.

**Guiding Axioms**:
- *"The client displays. The server decides."*
- *"Quality > Quantity. Provenance > Hallucination. Server Authority > Client Trust. 1,000 Excellent Questions > 1,000,000 Mediocre Questions."*

---

## 2. Factory Architecture & Pipeline Stages

```
┌────────────────────────────────────────────────────────┐
│ 1. INGESTION (Wikidata Whitelist)                      │
│    • Curated SPARQL / Wikidata Entity Triples          │
│    • Provenance, QIDs, PIDs, Timestamps, Source URLs    │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ 2. FACT ELIGIBILITY EVALUATION (0.00 – 1.00)          │
│    • Rejects internal IDs (Q1234), malformed labels    │
│    • Rejects volatile time-dependent items             │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ 3. DETERMINISTIC TEMPLATE PAIRING                      │
│    • Native French templates with {subject}/{object}   │
│    • Bi-directional (Direct / Reverse) queries        │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ 4. SEMANTIC DISTRACTOR ENGINE (3 Difficulty Tiers)     │
│    • Easy / Medium / Hard semantic candidate pool     │
│    • 4 distinct choices, 1 correct, 0 alias collisions │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ 5. 5-STAGE VALIDATION PIPELINE & QUALITY SCORER        │
│    • Schema / Factual / Ambiguity / Length / Deduplication │
│    • Composite Quality Score: 0.00 – 1.00              │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ 6. TRUST POOL ASSIGNMENT & LIVE PUBLISHING             │
│    • Training (Practice) · Verified (1,160 Live)       │
│    • Competitive (1,160 High-Elo) · Championship       │
└────────────────────────────────────────────────────────┘
```

---

## 3. Whitelisted Relations & Categories

| Category | Predicate / Property | French Template Sample |
| :--- | :--- | :--- |
| **Geography** | `capital` (`P36`) | *"Quelle est la capitale de {subject} ?"* |
| **Geography** | `capital_of` (`P1376`) | *"{subject} est la capitale de quel pays ?"* |
| **Geography** | `continent` (`P30`) | *"Sur quel continent se situe {subject} ?"* |
| **Geography** | `currency` (`P38`) | *"Quelle est la monnaie officielle de {subject} ?"* |
| **Geography** | `highest_point` (`P610`) | *"Quel est le point culminant de {subject} ?"* |
| **Art** | `created_by_painter` (`P170`) | *"Quel artiste a peint le célèbre chef-d'œuvre « {subject} » ?"* |
| **Art** | `created_by_sculptor` (`P170`) | *"Quel sculpteur est l'auteur de la sculpture « {subject} » ?"* |
| **Literature** | `authored_by` (`P50`) | *"Quel écrivain est l'auteur de l'ouvrage « {subject} » ?"* |
| **Literature** | `author_nationality` (`P27`) | *"De quelle nationalité était l'écrivain {subject} ?"* |
| **Cinema** | `directed_by` (`P57`) | *"Quel cinéaste a réalisé le film « {subject} » ?"* |
| **Music** | `composed_by` (`P86`) | *"Quel compositeur est l'auteur de l'œuvre musicale « {subject} » ?"* |
| **Science** | `chemical_symbol` (`P246`) | *"Quel est le symbole chimique de l'élément « {subject} » ?"* |
| **Science** | `atomic_number` (`P1086`) | *"Quel élément chimique a pour numéro atomique {subject} ?"* |
| **Science** | `discovered_by` (`P61`) | *"Quel scientifique a découvert ou formulé « {subject} » ?"* |
| **History** | `event_year` (`P585`) | *"En quelle année s'est déroulé l'événement historique « {subject} » ?"* |
| **History** | `dynasty` (`P53`) | *"À quelle dynastie régnante appartenait {subject} ?"* |
| **Nature** | `taxonomic_class` (`P279`) | *"À quelle classe animale appartient {subject} ?"* |
| **Technology** | `tech_creator` (`P61`) | *"Qui est le créateur ou inventeur principal de « {subject} » ?"* |
| **Food & Culture** | `origin_country` (`P495`) | *"De quel pays est originaire la spécialité culinaire « {subject} » ?"* |

---

## 4. Production Metrics & Distribution (Factory V1 Run)

- **Total Ingested Facts**: 1,171
- **Eligible Facts**: 1,171 (100% eligibility score >= 0.80)
- **Candidate Questions Generated**: 1,171
- **Auto-Verified Questions Published**: 1,160
- **Validation Pass Rate**: 99.1%
- **Audit Export**: `docs/factory-audit-sample.json` (100-question sample)

---

## 5. Trust Pools & Anti-Cheat Quarantining

Questions with a composite score >= 0.92 are published into `verified` and `competitive` pools.
If a question receives player ambiguity reports or administrator flags, `authoritativeGameEngine.quarantineQuestion(id)` immediately pulls the variant from all active ranked match pools.
