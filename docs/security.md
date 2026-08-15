# IQ ARENA — Security, Integrity & Anti-Cheat

## 1. Ground Truth Protection
- **No Answer Leakage**: The client never receives correct answers prior to answer lock.
- **Server Authority**: Ratings, levels, XP, streaks, win records, and achievements are computed strictly by PostgreSQL RPC functions and server logic.

## 2. Row Level Security (RLS)
- `profiles`: Public can select; users can only update cosmetic preferences on own rows; rating/xp cannot be modified by client updates.
- `question_options`: Protected from public client access.
- `daily_results`: One official attempt per user per challenge enforced by database unique constraint.

## 3. Anti-Cheat & Fair Play Strategy
- **Time Authority**: Timestamps are stamped on server delivery and validation. Answers submitted faster than human physical threshold (<250ms) are flagged.
- **Duplicate & Replay Protection**: Each question instance is locked after submission. Subsequent attempts are rejected with idempotent handling.
- **Question Quarantining**: Flagged questions are immediately removed from the competitive ranked pool.
