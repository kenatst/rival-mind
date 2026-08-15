# IQ ARENA — Database Schema & Data Dictionary

---

## 1. Overview
The IQ ARENA database is built on PostgreSQL with Row Level Security (RLS) enabled on every exposed table. The guiding principle is: **"The client displays. The server decides."**

---

## 2. Table Domains & Relationships

### Identity & Profiles
- `profiles`: Extends `auth.users(id)`. Stores public gamer identity (`username`, `country_code`, `avatar_color`), level, XP, server-protected `current_rating`, `peak_rating`, `world_rank_cached`, `country_rank_cached`, and streak metrics.
- `user_roles`: Role-based access control (`user`, `moderator`, `admin`).
- `guest_calibrations` *(Migration 005)*: Cryptographic provisional rating claim tokens generated during guest quiz evaluations. Token hash stored with 24h expiration and single-claim protection.
- `countries`: ISO-3166-1 alpha-2 countries with flags and active flags.

### Knowledge & Factory Layer
- `knowledge_sources`: Provenance registries with trust scores (0.00–1.00) and licenses.
- `knowledge_entities`: Canonical entities (e.g. "Q142" France, "Q90" Paris).
- `knowledge_facts`: Verified triples (Subject Entity, Predicate, Object/Value) with confidence scores, dates, and units.
- `factory_jobs`: Operational logs for factory ingestion, generation, validation, and publishing jobs.

### Question Engine Layer
- `categories` & `subcategories`: 12 core categories (History, Geography, Science, Sports, Cinema, Music, Art, Literature, Technology, Nature, Politics & Society, Food & Culture).
- `question_concepts`: Conceptual question templates mapped to knowledge facts and categories.
- `question_variants`: Linguistic formulations (FR) with difficulty ratings, quality scores, trust pools, and version tracking.
- `question_options`: Individual choices with `is_correct` (restricted from direct client access via RLS).

### Sessions & Matchmaking
- `game_sessions`: Session metadata (mode: `guest`, `training`, `category`, `daily`, `ranked`, `friend_battle`).
- `game_question_instances`: Record of every delivered question instance with timestamps (`served_at`, `answered_at`), response times, and score awarded.
- `ranked_matches` & `ranked_match_rounds`: 8-round competitive matches between Player A and Player B. Tracks `player_a_rating_before/after`, `player_b_rating_before/after`, deltas, and authoritative scores.
- `rating_history`: Immutable audit trail of Elo changes.

---

## 3. Server RPC Stored Procedures

1. `claim_guest_calibration(p_token text, p_user_id uuid)`:
   - Validates cryptographic token hash.
   - Atomically updates registered user profile with calibrated rating.
   - Marks token as claimed (burns token).
2. `complete_ranked_match_secure(p_match_id uuid, p_caller_id uuid)`:
   - Derives player scores strictly from recorded rounds in `ranked_match_rounds`.
   - Computes K=24 Elo shifts.
   - Idempotently protects against duplicate updates.
3. `quarantine_question_variant(p_variant_id uuid, p_reason text)`:
   - Quarantines broken or ambiguous variants instantly.
