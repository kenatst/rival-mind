# IQ ARENA — Security Hardening, Anti-Cheat & Competitive Integrity

> *"The client displays. The server decides."*

---

## 1. The 6 Hardened Competitive Invariants

| # | Invariant | Threat Mitigated | Technical Implementation |
| :- | :--- | :--- | :--- |
| **1** | **Server-Derived Scores** | Client tampering with match scores (e.g. submitting `{ scoreA: 8, scoreB: 0 }`) | `completeRankedMatch` / `complete_ranked_match_secure` requires only `matchId` and derives scores exclusively from recorded rounds. |
| **2** | **Server Response Time Authority** | Speedbot manipulation passing `responseTimeMs: 1` | `server_response_time_ms = answered_at - served_at`. Client `responseTimeMs` is telemetry only. |
| **3** | **Sequential Question Delivery** | Cheating scripts inspecting all 8 match questions in memory upfront | `startRankedMatch` yields Round 1 only. Subsequent rounds can only be fetched sequentially after the previous round is answered. |
| **4** | **Authoritative Guest Calibration** | New accounts forging provisional rating (e.g. self-claiming 2400 Legend) | Cryptographic `calibrationToken` issued by server evaluation of guest quiz. Consumed atomically during registration. |
| **5** | **Idempotent Match Completion** | Network replay or malicious duplicate RPC calls multiplying Elo shifts | `complete_ranked_match` records `playerARatingBefore/After` and returns cached outcome without recalculating rating updates. |
| **6** | **Anti-Leak Option Sanitization** | Answer peeking via DevTools / Network tab | Question payload sent to client strips `is_correct`, `correct_option_id`, and explanation until the round answer is submitted. |

---

## 2. Sequential Round Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Client as Player Client
    participant Engine as Authoritative Game Engine
    participant DB as PostgreSQL / Supabase

    Client->>Engine: startRankedMatch(userId)
    Engine->>Engine: Generate 8 rounds server-side, set servedAt for Round 1
    Engine-->>Client: { matchId, totalRounds: 8, initialRoundQuestion (Round 1 only) }
    
    Note over Client: Player sees Round 1 timer & options (no correct flags)
    
    Client->>Engine: submitRankedRound(matchId, round: 1, optionId, telemetryMs)
    Engine->>Engine: serverTimeMs = now - servedAt; check answer & record round 1
    Engine-->>Client: { wasCorrect, correctOptionId, explanation, scoreA, scoreB }

    Client->>Engine: getRankedRoundQuestion(matchId, round: 2)
    Engine->>Engine: Verify Round 1 completed; set servedAt for Round 2
    Engine-->>Client: { questionInstance (Round 2) }

    Note over Client: Repeat through Round 8...

    Client->>Engine: completeRankedMatch(matchId)
    Engine->>DB: complete_ranked_match_secure(matchId, callerId)
    DB->>DB: Read 8 server rounds, calculate Elo shifts (K=24), update profiles
    DB-->>Engine: { winnerId, playerAScore, playerARatingAfter, deltaA }
    Engine-->>Client: Final Verified Match Outcome
```

---

## 3. Cryptographic Guest Calibration Claims

1. Guest plays unauthenticated quiz.
2. Server evaluates accuracy: `provisionalRating = 820 + correctCount * 38`.
3. Server generates opaque token: `iq_tok_<entropy>_<timestamp>` and stores hash in `guest_calibrations`.
4. User registers account with token: `claim_guest_calibration(token, new_user_id)`.
5. DB validates token is unexpired (24h) and unconsumed, atomically sets profile rating to calibrated rating, and burns the token.

---

## 4. Anti-Cheat Telemetry & Quarantining

- **Human Physical Threshold**: Responses faster than 250ms are flagged for review.
- **Reporting System**: Users can flag question ambiguity or errors; reaching threshold triggers automated quarantine.
- **Quarantine RPC**: Quarantined variants are removed from matchmaking in O(1) time without system downtime.
