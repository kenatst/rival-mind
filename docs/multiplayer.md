# IQ ARENA — Real Multiplayer Architecture & Engineering Guide

## 1. System Overview

IQ ARENA's multiplayer engine is designed with one unwavering rule:
> **"THE CLIENT DISPLAYS. THE SERVER DECIDES."**

Postgres is the durable source of truth. Supabase Realtime is the low-latency state transport. No client can claim an answer correctness, response timestamp, round score, or Elo rating shift.

```
┌─────────────────────────────────────────────────────────────┐
│                 BROWSER A (e.g. KENAEL)                     │
│               React 19 / TanStack Router                    │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / WSS
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  SUPABASE POSTGRES + RLS                    │
│  matchmaking_queue · ranked_matches · ranked_round_answers  │
└──────────────────────────────▲──────────────────────────────┘
                               │ HTTPS / WSS
                               │
┌──────────────────────────────┴──────────────────────────────┐
│                 BROWSER B (e.g. LUCAS92)                    │
│               React 19 / TanStack Router                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Matchmaking Engine & Widening Algorithm

When a player enters Ranked Classic:
1. `find_or_create_match` is called via atomic Postgres RPC or repository.
2. The matcher searches `matchmaking_queue` using `SELECT ... FOR UPDATE SKIP LOCKED` for the longest-waiting candidate within the rating bracket.
3. Widening Policy:
   - **$0\text{--}5\text{s}$**: $\pm 50$ Elo (Fair tier).
   - **$5\text{--}10\text{s}$**: $\pm 100$ Elo (Standard tier).
   - **$10\text{--}20\text{s}$**: $\pm 200$ Elo (Extended tier).
   - **$20\text{s}+$**: All active divisions.
4. When paired, the match is created atomically:
   - 8 questions chosen from the verified factory pool.
   - Both queue rows updated to `matched` with the shared `match_id`.

---

## 3. Round Lifecycle & Realtime Event Contract

```
      COUNTDOWN (3.0s Synchronized Start)
                    │
                    ▼
      ROUND_ACTIVE (10.0s Question Clock)
                    │
    ┌───────────────┴───────────────┐
    ▼                               ▼
Player A Locks In               Player B Locks In
(Realtime: opponentLocked=true) (Realtime: opponentLocked=true)
    │                               │
    └───────────────┬───────────────┘
                    ▼
     ROUND_REVEAL (2.5s Reveal & Correct Answer)
                    │
                    ▼
     BETWEEN_ROUNDS (Advance to Round N+1)
                    │ (If Round 8)
                    ▼
     COMPLETED (Atomic Elo Transaction)
```

### Realtime Security & Answer Privacy
- When a player answers, only `opponentLocked: true` is broadcast over the Realtime channel.
- The `selected_option_id`, `was_correct`, and `correct_option_id` remain strictly hidden in Postgres until the reveal phase is triggered.

---

## 4. Mid-Match Resilience & Reconnects

- **Mid-Match Page Refresh**: `/match?matchId=...` fetches the canonical server snapshot via `getMatchSnapshot`. It restores the active round, player lock state, and derives remaining time from `expires_at - now()`.
- **Disconnect Grace (15s)**: If connection drops, opponent sees `Opponent Reconnecting...`. If the player returns within grace, state hydrates with zero reset.
- **Forfeits**: Handled strictly on the server if a disconnected player fails to return before round expiry.

---

## 5. Scaling Path

- **V1 (Current)**: Supabase Postgres + Supabase Realtime + Atomic RPCs.
- **V2 (Large Scale)**: Game Session coordination layer with Cloudflare Durable Objects / WebSockets, Redis for hot leaderboard sorted sets, and Postgres for durable rating history.
