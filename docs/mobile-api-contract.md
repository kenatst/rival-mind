# IQ ARENA — Mobile & Client API Contract

All frontend clients (Web, iOS, Android via React Native / Expo) interact with the exact same server-authoritative API.

## 1. Authentication & Profiles
- `POST /api/auth/register`: `{ email, password, username, countryCode, estimatedElo? }`
- `POST /api/auth/login`: `{ email, password }`
- `GET /api/profile/me`: Returns user profile with server-controlled Elo, rank, streak, and stats.
- `PATCH /api/profile/me`: Update display name, avatar color, or audio preferences.

## 2. Question Delivery & Game Sessions
- `POST /api/game/session`: `{ mode: "guest"|"training"|"category"|"daily"|"ranked"|"battle", categorySlug?: string, language?: string }`
  - **Response**: `{ sessionId, questions: [{ instanceId, prompt, category, difficulty, seconds, position, answers: [{ id, label }] }] }`
  - **CRITICAL**: No `isCorrect` or `correctOptionId` in response!
- `POST /api/game/answer`: `{ sessionId, instanceId, selectedOptionId, responseTimeMs }`
  - **Response**: `{ instanceId, wasCorrect, correctOptionId, explanation, scoreAwarded, xpAwarded, totalSessionScore }`

## 3. Ranked Matches
- `POST /api/game/ranked/matchmake`: `{ userId }` ➔ Returns `{ matchId, opponent, rounds }`
- `POST /api/game/ranked/complete`: `{ matchId, playerAScore, playerBScore }`
  - **Response**: `{ matchId, winnerId, eloBefore, eloAfter, deltaElo, worldRankAfter }`

## 4. Daily Challenge
- `GET /api/game/daily`: Returns today's 12 curated questions or user's completed results.
- `POST /api/game/daily/submit`: `{ challengeId, score, durationMs }` ➔ Returns official percentile and France rank (strictly 1 attempt per day).

## 5. Question Reporting & Moderation
- `POST /api/game/report`: `{ questionId, reason, details }`
