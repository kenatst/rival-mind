# IQ ARENA — System Architecture

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
│             SERVER-AUTHORITATIVE GAME API              │
│       TanStack Start / Nitro / Cloudflare Workers      │
└──────────────┬───────────────────────────┬─────────────┘
               │                           │
               ▼                           ▼
┌───────────────────────────┐ ┌──────────────────────────┐
│   SUPABASE POSTGRES RLS   │ │   HOT REDIS CACHE (V2)   │
│ Durable Data & Knowledge  │ │ Matchmaking & Live Feeds │
└──────────────┬────────────┘ └──────────────────────────┘
               │
               ▼
┌────────────────────────────────────────────────────────┐
│               QUESTION ENGINE & REGISTRY               │
│    Entities → Facts → Concepts → Variants → Options   │
└────────────────────────────────────────────────────────┘
```

## 2. Core Architectural Principles
1. **The Client Displays, The Server Decides**:
   - The browser or mobile client never receives correct answers (`isCorrect`), internal weights, or raw ratings before answer lock.
   - The server validates timestamps, calculates correctness, determines Elo rating deltas (K=24 formula), awards XP, and updates streaks.
2. **Knowledge & Question Decoupling**:
   - Facts exist independently of language variants.
   - Multiple linguistic formulations point to the same underlying factual concept.
3. **Multi-Platform Ready**:
   - Domain logic and API contracts are platform-agnostic, supporting future Expo/React Native mobile apps with the exact same backend endpoints.
4. **Idempotency & Replay Protection**:
   - Answer submissions and ranked match completions use idempotency keys to guarantee duplicate clicks or network retries never double-award rating or XP.
