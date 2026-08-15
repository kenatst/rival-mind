# IQ ARENA — Database Schema & Data Dictionary

## 1. Overview
The IQ ARENA database is built on PostgreSQL with Row Level Security (RLS) enabled on every exposed table.

## 2. Table Domains & Relationships

### Identity & Profiles
- `profiles`: Extends `auth.users(id)`. Stores public gamer identity (`username`, `country_code`, `avatar_color`), level, XP, server-protected `current_rating`, `peak_rating`, `world_rank_cached`, `country_rank_cached`, and streak metrics.
- `user_roles`: Role-based access control (`user`, `moderator`, `admin`).
- `countries`: ISO-3166-1 alpha-2 countries with flags and active flags.

### Knowledge Layer
- `knowledge_sources`: Provenance registries with trust scores (0.00–1.00) and licenses.
- `knowledge_entities`: Canonical entities (e.g. "Canada", "Machu Picchu", "Tungsten").
- `knowledge_facts`: Verified triples (Subject Entity, Predicate, Object/Value) with confidence scores and verification dates.

### Question Engine Layer
- `categories` & `subcategories`: 12 core categories (History, Geography, Science, Sports, Cinema, Music, Art, Literature, Technology, Nature, Politics & Society, Food & Culture).
- `question_concepts`: Conceptual question templates mapped to knowledge facts and categories.
- `question_variants`: Linguistic formulations (FR, EN) with difficulty ratings and version tracking.
- `question_options`: Individual choices with `is_correct` (restricted from direct client access via RLS).

### Sessions & Matchmaking
- `game_sessions`: Session metadata (mode: `guest`, `training`, `category`, `daily`, `ranked`, `friend_battle`).
- `game_question_instances`: Record of every delivered question instance with timestamps (`served_at`, `answered_at`), response times, and score awarded.
- `ranked_matches` & `ranked_match_rounds`: 8-round competitive matches between Player A and Player B.
- `rating_history`: Immutable audit trail of Elo changes.

### Daily 12 & Social
- `daily_challenges`: Curated 12-question daily challenges.
- `daily_results`: Official player attempts (strictly 1 attempt per user per day enforced by unique constraint).
- `leagues` & `league_members`: Private fantasy leagues.
- `friendships` & `friend_battles`: 1v1 asynchronous and synchronous friend duels.
- `question_reports`: Player-reported issues for knowledge moderation.
- `admin_audit_logs`: Operational trail of admin edits and quarantine actions.
