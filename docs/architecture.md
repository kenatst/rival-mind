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

### Subsystem B: Guest Calibration & Claim Token Engine (`src/engine/calibrationEngine.ts`)
- Evaluates unauthenticated guest quizzes and calculates authoritative provisional rating.
- Generates signed single-use claim tokens.
- Consumes tokens during registration via atomic Postgres RPC `claim_guest_calibration`.

### Subsystem C: Industrial Question Factory V1 (`src/factory/`)
- **Wikidata Ingestor**: High-confidence whitelist across 12 categories with entity provenance (`Q...`, `P...`).
- **Eligibility Scorer**: Multi-criteria evaluator (0.00–1.00) filtering malformed or volatile facts.
- **Deterministic Templates**: Concise, natural French templates with concept lineage.
- **Semantic Distractor Engine**: 3 difficulty tiers (Easy, Medium, Hard) guaranteeing 4 distinct choices, 1 correct answer, and zero alias collisions.
- **Multi-Stage Validation Pipeline**: Schema, factual, ambiguity, distractor balance, and deduplication checks.
- **Trust Pools**: Dynamic classification into `training`, `verified`, `competitive`, and `championship`.

---

## 3. Security Boundary & Anti-Cheat

```mermaid
flowchart LR
    subgraph Client [Untrusted Client Zone]
        UI[UI Components]
        Tele[Client Telemetry]
    end

    subgraph Server [Authoritative Trust Zone]
        Engine[Authoritative Game Engine]
        DB[(PostgreSQL RLS)]
        Calib[Calibration Token Vault]
        Factory[Question Factory V1]
    end

    UI -->|1. startRankedMatch| Engine
    Engine -->|2. Round 1 Only (No Answer)| UI
    UI -->|3. submitRound(optionId, telemetry)| Engine
    Engine -->|4. Validate & Record Round| DB
    UI -->|5. completeMatch(matchId)| Engine
    Engine -->|6. Calculate Elo K=24 from DB Rounds| DB
    DB -->|7. Verified Elo Shift| UI
```
