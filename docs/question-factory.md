# IQ ARENA — Question Factory & Knowledge Scaling Roadmap

## 1. Vision & Pipeline
The Question Factory is the pipeline through which IQ ARENA grows from **300 seed questions** to **1,000,000+ verified, high-quality, unambiguous questions**.

```
┌────────────────────────────────────────────────────────┐
│             OPEN & STRUCTURED DATA INGESTION           │
│        Wikidata, Academic Datasets, Open Repos         │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│             CANONICAL KNOWLEDGE FACTS LAYER            │
│       Triples (Entity ➔ Predicate ➔ Value) + Provenance │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│             FACT ELIGIBILITY & QUALITY SCORING         │
│          Trivia Worthiness, Age-Rating, Timelessness   │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│             AI VARIANT & DISTRACTOR GENERATION         │
│        Plausible Distractor Generation + Context       │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│             AUTOMATED FACTUAL VALIDATOR CRITIC         │
│           Ambiguity Detection & Unambiguity Check      │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│             SEMANTIC DEDUPLICATION (PGVECTOR)          │
│       Cosine Distance Thresholding Across Variants     │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│             HUMAN-IN-THE-LOOP ADMIN REVIEW             │
│        Admin Question Center (Approve / Quarantine)    │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│             LIVE PLAYER TELEMETRY & CALIBRATION        │
│       Empirical Difficulty & Quarantine Telemetry      │
└────────────────────────────────────────────────────────┘
```

## 2. Scaling Milestones
- **Phase 1 (V1 Current)**: 120+ Curated Verified Seed Questions with full schema validation.
- **Phase 2 (1,000 Qs)**: Wikidata factual triple ingestion + Human Review.
- **Phase 3 (10,000 Qs)**: Automated multi-model critic pipeline with AI distractor generators.
- **Phase 4 (100,000 Qs)**: Category MMR balancing, dynamic player exposure cooldowns, and multilingual translation.
- **Phase 5 (1,000,000+ Qs)**: Global partitioned pools, live telemetric quarantine, and real-time auto-recalibration.
