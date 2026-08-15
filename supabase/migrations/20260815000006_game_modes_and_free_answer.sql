-- ============================================================================
-- Migration: 20260815000006_game_modes_and_free_answer.sql
-- Description: Game Modes Taxonomy, Free Answer Engine, Personal Bests,
--              Rivalries, Category Towers, and Competition Events.
-- ============================================================================

-- 1. GAME MODE DEFINITIONS
CREATE TABLE IF NOT EXISTS public.game_mode_definitions (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    family TEXT NOT NULL CHECK (family IN ('compete', 'quick', 'train', 'social')),
    display_name TEXT NOT NULL,
    description TEXT NOT NULL,
    ranked BOOLEAN NOT NULL DEFAULT false,
    question_count INTEGER,
    time_per_question_ms INTEGER,
    total_time_ms INTEGER,
    answer_input_type TEXT NOT NULL DEFAULT 'mcq' CHECK (answer_input_type IN ('mcq', 'free_text', 'hybrid')),
    elimination_rule TEXT NOT NULL DEFAULT 'none' CHECK (elimination_rule IN ('none', 'one_strike', 'bottom_percentile', 'bracket')),
    scoring_rule TEXT NOT NULL DEFAULT 'standard',
    difficulty_rule TEXT NOT NULL DEFAULT 'balanced',
    category_rule TEXT NOT NULL DEFAULT 'all',
    allows_retry BOOLEAN NOT NULL DEFAULT true,
    official_leaderboard BOOLEAN NOT NULL DEFAULT false,
    rating_pool TEXT,
    shareable BOOLEAN NOT NULL DEFAULT true,
    active BOOLEAN NOT NULL DEFAULT true,
    feature_flag TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. QUESTION ANSWER ALIASES (FOR FREE ANSWER DETERMINISTIC ENGINE)
CREATE TABLE IF NOT EXISTS public.question_answer_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_variant_id TEXT NOT NULL,
    language_code TEXT NOT NULL DEFAULT 'fr',
    alias TEXT NOT NULL,
    normalized_alias TEXT NOT NULL,
    alias_type TEXT NOT NULL CHECK (alias_type IN ('canonical', 'common', 'abbreviation', 'alternate_spelling', 'transliteration', 'accepted_short_form')),
    confidence NUMERIC(3,2) NOT NULL DEFAULT 1.00,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aliases_lookup ON public.question_answer_aliases (question_variant_id, normalized_alias) WHERE active = true;

-- 3. FREE ANSWER ATTEMPTS & AUDIT TRAIL
CREATE TABLE IF NOT EXISTS public.free_answer_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    question_instance_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    raw_answer_text TEXT NOT NULL,
    normalized_answer TEXT NOT NULL,
    matched_alias_id UUID REFERENCES public.question_answer_aliases(id) ON DELETE SET NULL,
    match_method TEXT NOT NULL CHECK (match_method IN ('exact', 'normalized', 'alias', 'fuzzy', 'transliteration', 'none', 'disputed')),
    similarity_score NUMERIC(3,2) DEFAULT 0.00,
    was_correct BOOLEAN NOT NULL,
    disputed BOOLEAN NOT NULL DEFAULT false,
    dispute_reason TEXT,
    dispute_status TEXT DEFAULT 'none' CHECK (dispute_status IN ('none', 'pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. PLAYER MODE RECORDS (SERVER-AUTHORITATIVE PERSONAL BESTS)
CREATE TABLE IF NOT EXISTS public.player_mode_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mode_slug TEXT NOT NULL,
    record_type TEXT NOT NULL,
    value_numeric NUMERIC(10,2) NOT NULL,
    achieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT uq_player_mode_record UNIQUE (user_id, mode_slug, record_type)
);

-- 5. CATEGORY TOWER PROGRESSION
CREATE TABLE IF NOT EXISTS public.category_tower_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_slug TEXT NOT NULL,
    highest_floor INTEGER NOT NULL DEFAULT 1,
    current_floor INTEGER NOT NULL DEFAULT 1,
    bosses_defeated INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_category_tower UNIQUE (user_id, category_slug)
);

-- 6. PLAYER RIVALRIES (FRIEND HEAD-TO-HEAD SERIES)
CREATE TABLE IF NOT EXISTS public.player_rivalries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_a_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    player_b_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    matches_count INTEGER NOT NULL DEFAULT 0,
    wins_a INTEGER NOT NULL DEFAULT 0,
    wins_b INTEGER NOT NULL DEFAULT 0,
    draws INTEGER NOT NULL DEFAULT 0,
    last_match_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_streak_holder_id UUID,
    current_streak INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT uq_player_rivalry UNIQUE (player_a_id, player_b_id)
);

-- 7. COMPETITION EVENTS & TOURNAMENTS (WEEKEND CUP, QUALIFIERS, KING OF THE HILL, SUDDEN DEATH)
CREATE TABLE IF NOT EXISTS public.competition_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL CHECK (event_type IN ('weekend_cup', 'qualifiers', 'king_of_hill', 'sudden_death', 'world_quiz', 'country_war')),
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'registration_open', 'active', 'completed', 'cancelled')),
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    registration_starts_at TIMESTAMPTZ,
    registration_ends_at TIMESTAMPTZ,
    eligibility_rule TEXT NOT NULL DEFAULT 'open',
    min_rating INTEGER DEFAULT 0,
    bracket_size INTEGER,
    question_pool TEXT NOT NULL DEFAULT 'competitive',
    rules JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.game_mode_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_answer_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.free_answer_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_mode_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_tower_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_rivalries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_events ENABLE ROW LEVEL SECURITY;

-- Read policies
CREATE POLICY "Public read game modes" ON public.game_mode_definitions FOR SELECT USING (active = true);
CREATE POLICY "Public read competition events" ON public.competition_events FOR SELECT USING (true);
CREATE POLICY "Users read own mode records" ON public.player_mode_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users read own tower progress" ON public.category_tower_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users read own rivalries" ON public.player_rivalries FOR SELECT USING (auth.uid() = player_a_id OR auth.uid() = player_b_id);

-- SECURITY INVARIANT: Aliases are NEVER exposed directly to users to prevent cheat scraping
CREATE POLICY "Admins read aliases" ON public.question_answer_aliases FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'moderator'))
);
