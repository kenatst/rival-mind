# IQ ARENA — Game Modes Architecture & Specification

## 1. Overview & Sacred Triad

IQ ARENA separates its gameplay into four distinct, non-overlapping mode families designed to satisfy time budgets from **20 seconds** to **an entire tournament evening**:

```
                              ┌────────────────────────┐
                              │    IQ ARENA HUB        │
                              └───────────┬────────────┘
         ┌──────────────────┬─────────────┴─────────────┬──────────────────┐
         ▼                  ▼                           ▼                  ▼
  ⚔️ COMPETE           ⚡ QUICK                     🧠 TRAIN           👥 SOCIAL
 (Arena Rating)     (Personal Bests)             (Skill Mastery)    (Duels & Leagues)
```

### Three Sacred Principles
1. **RANKED (Prestige)**: Pure server-authoritative fair play. Strict question timers. No second chances. Directly shifts official Arena Rating (Elo).
2. **ARCADE / QUICK (Records)**: High dopamine, rapid volume, personal bests (PBs). Never alters Arena Rating unless explicitly tagged as Ranked Blitz.
3. **TRAINING (Mastery)**: Zero-penalty practice. Targets weak categories and concepts detected in competitive play.

---

## 2. Mode Catalog by Family

### Family A: COMPETE (Prestige & Global Circuit)
| Mode | Time Budget | Rounds / Timer | Input | Scoring & Rules |
| :--- | :--- | :--- | :--- | :--- |
| **Ranked Classic** | 3 min | 8 questions, 10.0s/q | MCQ | Server-authoritative Elo (K=24), sequential serving, speed bonus XP |
| **Ranked Blitz** | 2 min | 12 questions, 5.0s/q | MCQ | Rapid 5s clock, tiebreaker decided by cumulative server response latency |
| **Free Answer Ranked** | 3 min | 8 questions, 7.0s/q | Typed Text | Deterministic recall engine, typo & alias tolerance, 150 pts/correct |
| **Weekend Cup** | Event | Knockout Brackets (64 -> 1) | MCQ | Weekly weekend tournament, single elimination, seasonal trophy |
| **Qualifiers** | 5 min | 15 hard questions | Mixed | Server check: Diamond+ OR Top 10% Daily eligibility |
| **King of the Hill** | 5 min | 100 -> 80 -> ... -> 1 | MCQ | Progressive elimination after every round (bottom 20% dropped) |
| **Sudden Death** | 1-3 min | Continuous (1 ошибка) | MCQ | 1 mistake terminates match. Winner is last competitor standing |
| **World Quiz** | Daily | 10 world-level hard Qs | Mixed | High-difficulty global test |

---

### Family B: QUICK (Arcade & Personal Bests)
| Mode | Time Budget | Timer Rule | Input | Scoring & Rules |
| :--- | :--- | :--- | :--- | :--- |
| **5-Second Blitz** | 50s | 10 Qs, 5.0s bar | MCQ | `1000 + (5000 - ms)*0.2 + streak*100`. Fast chaining |
| **60-Second Lightning** | 60s | 60.0s Master Deadline | MCQ | Max volume correct answers. Immediate skip & auto-chaining |
| **Perfect 10** | 1.5 min | 10 questions | MCQ | 10/10 target. Near-miss UX ("Question 7 cost you the run") |
| **Streak Mode** | Open | 1-Strike Out | MCQ | 1 error terminates run. Live tension meter when near all-time PB |
| **Double or Nothing** | 2 min | Checkpoints (Q3, Q6, Q8) | MCQ | Option to BANK accumulated score or DOUBLE with harder question |
| **The Ladder** | 3 min | 10 Stages | MCQ | Stage 1 (Easy) -> Stage 10 (Legendary). Global percentile feedback |
| **Daily Gem** | 20s | 1 Question / Day | Typed / MCQ | High-difficulty ritual. Single attempt. Global success rate |
| **Mystery Mode** | 2 min | Surprise Modifiers | Mixed | Inverted timers, double points, or blackout rounds |

---

### Family C: TRAIN (Skill Mastery)
| Mode | Target | Rules & Behavior |
| :--- | :--- | :--- |
| **Infinite Training** | Endless practice | Zero timer penalty, immediate fact explanations, category filters |
| **Adaptive Training** | Algorithmic weakness | Prioritizes questions in player's lowest accuracy categories |
| **Category Runs** | 11 Subject Sprints | 10 questions focused on History, Science, Cinema, Literature, etc. |
| **Category Towers** | 11 Subject Towers | Floors 1–100. Boss stages every 5 floors. Persistent progress |
| **Weakness Run** | 10–15 Targeted Qs | Drills concepts missed in previous Ranked & Daily matches |

---

### Family D: SOCIAL (Battles & Wars)
| Mode | Purpose | Mechanics |
| :--- | :--- | :--- |
| **Friend Battle** | Direct invitation duels | Format picker (Classic 10s, Blitz 5s, Free Answer, Perfect 10) |
| **Rivalries** | Head-to-Head series | Persistent series tracking (`KENAEL 7 — 6 LUCAS92`), revenge CTA |
| **Private Leagues** | Custom groups | Weekly leaderboard, custom question pools, member standings |
| **Country Wars** | National pride | Aggregates all national player scores to rank countries weekly |

---

## 3. Server Scoring & Rule Verification

All sessions run authoritatively:
- In **60-Second Lightning**, `deadlineAt = startedAt + 60000`. Answers submitted past `deadlineAt + 1000ms` are rejected.
- In **5-Second Blitz**, speed bonuses use server latency delta `answeredAt - servedAt`.
- In **Streak Mode**, an incorrect answer immediately sets `eliminated = true` and `completed = true`.
- In **Perfect 10**, near-miss alerts analyze `missedIndices` and output friendly feedback.
