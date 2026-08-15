# IQ ARENA — Mobile & Client API Contract

All frontend clients (Web, iOS, Android via React Native / Expo) interact with the exact same server-authoritative API.

---

## 1. Authentication & Profiles
- `POST /api/auth/register`: `{ email, password, username, countryCode, estimatedElo? }`
- `POST /api/auth/login`: `{ email, password }`
- `GET /api/profile/me`: Returns user profile with server-controlled Elo, rank, streak, and stats.
- `PATCH /api/profile/me`: Update display name, avatar color, or audio preferences.

---

## 2. Question Delivery & Game Sessions
- `POST /api/game/session`: `{ mode: "guest"|"training"|"category"|"daily"|"ranked"|"battle", categorySlug?: string, language?: string }`
  - **Response**: `{ sessionId, questions: [{ instanceId, prompt, category, difficulty, seconds, position, answers: [{ id, label }] }] }`
  - **CRITICAL**: No `isCorrect` or `correctOptionId` in response!
- `POST /api/game/answer`: `{ sessionId, instanceId, selectedOptionId, responseTimeMs }`
  - **Response**: `{ instanceId, wasCorrect, correctOptionId, explanation, scoreAwarded, xpAwarded, totalSessionScore }`

---

## 3. Ranked Matches
- `POST /api/game/ranked/matchmake`: `{ userId }` ➔ Returns `{ matchId, opponent, rounds }`
- `POST /api/game/ranked/complete`: `{ matchId }` (Authoritative: ignores client scores)
  - **Response**: `{ matchId, winnerId, eloBefore, eloAfter, deltaElo, worldRankAfter }`

---

## 4. Daily Challenge & Daily Gem
- `GET /api/game/daily`: Returns today's 12 curated questions or user's completed results.
- `POST /api/game/daily/submit`: `{ challengeId, score, durationMs }` ➔ Returns official percentile and France rank (strictly 1 attempt per day).
- `GET /api/game/daily-gem`: Returns today's single hard question metadata and global solve rate.

---

## 5. Unified Mode Engine (Blitz, Lightning, Streak, Towers, Ladder)
- `POST /api/modes/session`: `{ modeSlug: string, category?: string }`
  - **Response**: `{ sessionId, modeSlug, totalQuestions?, deadlineAt?, firstQuestion }`
- `POST /api/modes/answer`: `{ sessionId, userInput: string, telemetryMs?: number }`
  - **Response**: `{ isCorrect, pointsAwarded, correctAnswer, nextQuestion?, completed, eliminated, freeAnswerResult? }`
- `POST /api/modes/finish`: `{ sessionId }`
  - **Response**: `{ sessionId, score, accuracy, bestStreak, isPersonalBest, nearMissMessage?, shareCardText, reviewQuestions }`

---

## 6. Free Answer Evaluation & Dispute Reporting
- `POST /api/free-answer/evaluate`: `{ userInput: string, questionId: string }`
  - **Response**: `{ isCorrect, state: "CORRECT"|"TYPO_ACCEPTED"|"ALIAS_ACCEPTED"|"INCORRECT", matchMethod }`
- `POST /api/free-answer/dispute`: `{ questionId, rawInput, canonicalAnswer, reason? }`
  - **Response**: `{ disputeId, status: "pending" }`

---

## 7. Personal Bests & Skill Telemetry
- `GET /api/records/summary`: Returns all-time PBs for Lightning, Blitz, Streak, Perfect 10, Ladder, and Category Tower floors.
- `GET /api/records/skills`: Returns derived telemetry dimensions: `speed`, `recall`, `precision`, `knowledge` (0–100 scale).

---

## 8. Tournaments & Events (Weekend Cup, King of the Hill)
- `GET /api/tournaments/weekend-cup`: Returns current knockout bracket matches and user standing.
- `POST /api/tournaments/qualifiers/check`: Server check for Diamond+ OR Top 1,000 Daily eligibility.

---

## 9. Social Duels & Rivalries
- `GET /api/social/rivalries`: Returns head-to-head records and streak tracking across opponents.
- `POST /api/social/challenge`: `{ format: "classic"|"blitz"|"free_answer"|"perfect10", opponentId?: string }` ➔ Returns invite link.

---

## 10. Question Reporting & Moderation
- `POST /api/game/report`: `{ questionId, reason, details }`
- `POST /api/admin/questions/quarantine`: `{ questionId, reason }` (Admin only)
- `POST /api/admin/questions/restore`: `{ questionId }` (Admin only)
- `POST /api/admin/disputes/approve`: `{ disputeId }` (Admin only)
