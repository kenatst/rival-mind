# IQ ARENA — System Architecture & Industrial Subsystems

---

## 1. System Vision & Overview
IQ ARENA is a high-performance global competitive general knowledge sport designed for millions of concurrent competitors, server-authoritative scoring, strict anti-cheat, global and national rankings, private leagues, and esports-style live tournaments.

```
┌────────────────────────────────────────────────────────┐
│             CLIENTS (Web / iOS / Android)              │
│       React 19 + TypeScript + Vite + React Native      │
└──────────────────────────┬─────────────────────────────┘
                           │ (HTTPS / WSS)
                           ▼
┌────────────────────────────────────────────────────────┐
│             SERVER-AUTHORITATIVE GAME ENGINE           │
│       Sequential Delivery · Time Authority · Elo K=24 │
└──────────────┬───────────────────────────┬─────────────┘
               │                           │
               ▼                           ▼
┌───────────────────────────┐ ┌──────────────────────────┐
│   SUPABASE POSTGRES RLS   │ │   QUESTION FACTORY V1    │
│ Profiles, Rounds, History │ │ Ingest → Validate → Pool │
└──────────────┬────────────┘ └────────────┬─────────────┘
               │                           │
               └─────────────┬─────────────┘
                             ▼
┌────────────────────────────────────────────────────────┐
│          1,000+ VERIFIED FRENCH KNOWLEDGE POOL         │
│  Geography · History · Science · Art · Lit · Cinema    │
└────────────────────────────────────────────────────────┘
```

---

## 2. Core Architectural Subsystems

### Subsystem A: Server-Authoritative Game Engine (`src/engine/gameEngine.ts`)
- **Sequential Question Delivery**: Client only gets Round N after completing Round N-1.
- **Server Response Time Authority**: `server_time_ms = now - served_at`. Client telemetry is stored as optional metadata only.
- **Score-less Match Completion**: `completeRankedMatch(matchId)` calculates scores strictly from server-evaluated rounds.
- **Pure Idempotency**: Match results and rating deltas are cached on completion; replay returns identical outcome without double mutations.

### Subsystem B: Deterministic Free Answer Engine (`src/engine/freeAnswerEngine.ts`)
- Multi-stage normalization (accents, punctuation, leading French articles `le`, `la`, `l'`).
- Bounded Damerau-Levenshtein typo tolerance with length thresholding (<= 5 chars: 0 typos; 6-8 chars: 1 typo; >= 9 chars: 2 typos).
- Transliteration and alias matching (`USA`, `UK`, `Da Vinci`, `Tchaikovsky`).
- Community dispute submission and admin adjudication workflow.

### Subsystem C: Unified Mode Engine & Scoring Handlers (`src/engine/modeEngine.ts`)
- 4 Sacred Families: **COMPETE**, **QUICK**, **TRAIN**, **SOCIAL**.
- 5s Blitz timer bar & speed scoring bonuses.
- 60s Lightning master countdown with strict deadline enforcement (`deadlineAt = startedAt + 60000`).
- Streak 1-strike elimination.
- Perfect 10 near-miss calculation ("Question 7 cost you the run").
- Category Towers (Floors 1-100 across 11 domains with boss floors).
- Double or Nothing checkpoint banking.
- Ladder 10 stages with global percentile tracking.

### Subsystem D: Industrial Question Factory V1 (`src/factory/`)
- **Wikidata Ingestor**: High-confidence whitelist across 12 categories with entity provenance (`Q...`, `P...`).
- **Eligibility Scorer**: Multi-criteria evaluator (0.00–1.00) filtering malformed or volatile facts.
- **Deterministic Templates**: Concise, natural French templates with concept lineage.
- **Semantic Distractor Engine**: 3 difficulty tiers (Easy, Medium, Hard) guaranteeing 4 distinct choices, 1 correct answer, and zero alias collisions.
- **Multi-Stage Validation Pipeline**: Schema, factual, ambiguity, distractor balance, and deduplication checks.
- **Trust Pools**: Dynamic classification into `training`, `verified`, `competitive`, and `championship`.

### Subsystem E: Personal Bests & Skill Telemetry (`src/engine/recordsEngine.ts`)
- Tracks player records across all arcade and competitive formats.
- Computes game skill telemetry (Speed, Recall, Precision, Knowledge) for gamer profiles.

### Subsystem F: Social Rivalries & Head-to-Head Engine (`src/engine/socialEngine.ts`)
- Persistent match series tracking (`KENAEL 7 — 6 LUCAS92`).
- Custom battle format generation (Classic, Blitz, Free Answer, Perfect 10).

---

## 3. Security Boundary & Anti-Cheat

1. **Answer Masking**: Answer options sent to clients omit `is_correct` and `explanation`.
2. **Server Timestamps**: Question issuance and submission timestamps are signed server-side.
3. **No Client Score Trust**: Scores, accuracy, streaks, Elo deltas, and PBs are computed strictly on the server.
