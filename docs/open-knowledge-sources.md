# 🏛️ IQ ARENA — Open Knowledge Sources & Ingestion Pipeline

## 1. Overview
IQ ARENA builds its competitive knowledge graph exclusively from **verified, open-licensed structured knowledge repositories**. This document specifies the multi-source adapter architecture, attribution requirements, and extraction policies.

---

## 2. Approved Primary Sources

### A. Wikidata Structured Data
* **Domain**: General Knowledge, History, Geography, Science, Cinema, Sports, Literature, Art, Technology, Food, Gaming.
* **License**: **Creative Commons CC0 1.0 Universal (Public Domain)**.
* **Schema Mapping**:
  - `QID`: Canonical entity identifier (e.g. `Q142` = France).
  - `PID`: Relational property identifier (e.g. `P36` = capital).
  - `Qualifiers`: Temporal bounds (`P580` start time, `P582` end time) used to enforce timelessness.

### B. MusicBrainz Core
* **Domain**: Music Artists, Bands, Releases, Tracks, Works, Composers, Instrumentation.
* **License**: **CC0 / Creative Commons CC-BY 2.0 (Core Metadata)**.
* **Usage**: Deepening `/train/music` with structured discographies and classical works. Biographies and copyrighted prose are strictly excluded.

### C. OpenAlex Open Scholarly Dataset
* **Domain**: Landmark Scientific Discoveries, Nobel Laureates, Physics/Chemistry Milestones, Academic Institutions.
* **License**: **CC0 (Public Domain)**.
* **Usage**: High-interest discoveries and researcher relationships filtered by notability scores to exclude obscure paper metadata.

---

## 3. Multi-Source Fact Merging & Fingerprinting
When a factual proposition is attested by multiple repositories (e.g. Mozart's birthplace confirmed by both Wikidata and MusicBrainz):
1. The **`canonical_fact_fingerprint`** (`sha256(predicate:subject:object)`) unifies the proposition into a **single canonical concept**.
2. Both sources are appended as citations in `canonical_fact_sources`.
3. Fact confidence is boosted while **the canonical question count remains strictly 1**.
