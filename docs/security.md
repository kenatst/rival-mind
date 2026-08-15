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

## 2. Realtime Channel Security & Answer Privacy

1. **Broadcast Sanitization**: When a player locks in an answer, the Realtime event payload contains ONLY `{ opponentLocked: true, lockedAt: timestamp }`.
2. **Hidden Option Secrecy**: The `selected_option_id`, correctness, and point value remain strictly sequestered in the PostgreSQL `ranked_round_answers` table until both competitors have answered or the 10.0s round deadline expires.
3. **RLS Authorization**: Row Level Security prevents any third-party user from reading private round answers or subscribing to unauthorized match channels.

---

## 3. Cryptographic Guest Calibration Claims

1. Guest plays unauthenticated quiz.
2. Server evaluates accuracy: `provisionalRating = 820 + correctCount * 38`.
3. Server generates opaque token: `iq_tok_<entropy>_<timestamp>` and stores hash in `guest_calibrations`.
4. User registers account with token: `claim_guest_calibration(token, new_user_id)`.
5. DB validates token is unexpired (24h) and unconsumed, atomically sets profile rating to calibrated rating, and burns the token.

---

## 4. Anti-Cheat Telemetry, Anti-Farming & Collusion Auditing

- **Human Physical Latency Gate**: Responses faster than 250ms are flagged for anomaly inspection.
- **Collusion & Elo Farming Audits**: Tracks repeated pairings between the same user IDs in a 24-hour window, abnormal forfeit ratios, and non-random rating transfer patterns.
- **Reporting System**: Users can flag question ambiguity or errors; reaching report threshold triggers automated quarantine.
- **Quarantine RPC**: Quarantined variants are removed from matchmaking in O(1) time without system downtime.
