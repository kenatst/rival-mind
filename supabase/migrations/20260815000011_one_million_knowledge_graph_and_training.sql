-- ============================================================================
-- IQ ARENA Migration 011: One Million Knowledge Graph, Hierarchical Topics & Training Engine
-- ============================================================================

-- 1. HIERARCHICAL KNOWLEDGE TOPICS
CREATE TABLE IF NOT EXISTS public.knowledge_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES public.knowledge_topics(id) ON DELETE SET NULL,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    domain TEXT NOT NULL,
    category TEXT NOT NULL,
    depth INTEGER NOT NULL DEFAULT 0,
    path TEXT NOT NULL, -- Materialized path, e.g., 'culture/cinema/directors/nolan'
    description TEXT,
    icon_key TEXT NOT NULL DEFAULT 'layers',
    active BOOLEAN NOT NULL DEFAULT true,
    question_count_cached INTEGER NOT NULL DEFAULT 0,
    competitive_count_cached INTEGER NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_topics_path ON public.knowledge_topics (path);
CREATE INDEX IF NOT EXISTS idx_topics_category ON public.knowledge_topics (category);
CREATE INDEX IF NOT EXISTS idx_topics_parent ON public.knowledge_topics (parent_id);

-- 2. QUESTION TOPIC MAPPING (MANY-TO-MANY)
CREATE TABLE IF NOT EXISTS public.question_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_concept_id UUID NOT NULL REFERENCES public.question_concepts(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES public.knowledge_topics(id) ON DELETE CASCADE,
    weight NUMERIC(3,2) NOT NULL DEFAULT 1.00,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(question_concept_id, topic_id)
);

CREATE INDEX IF NOT EXISTS idx_qt_topic ON public.question_topics (topic_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_qt_concept ON public.question_topics (question_concept_id);

-- 3. EXTEND QUESTION_CONCEPTS FOR 1M SCALE
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'question_concepts' AND column_name = 'canonical_hash') THEN
        ALTER TABLE public.question_concepts ADD COLUMN canonical_hash TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'question_concepts' AND column_name = 'selection_bucket') THEN
        ALTER TABLE public.question_concepts ADD COLUMN selection_bucket INTEGER NOT NULL DEFAULT floor(random() * 4096)::integer;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'question_concepts' AND column_name = 'trust_tier') THEN
        ALTER TABLE public.question_concepts ADD COLUMN trust_tier TEXT NOT NULL DEFAULT 'training' CHECK (trust_tier IN ('training', 'verified', 'competitive', 'championship'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'question_concepts' AND column_name = 'obscurity_tier') THEN
        ALTER TABLE public.question_concepts ADD COLUMN obscurity_tier TEXT NOT NULL DEFAULT 'core' CHECK (obscurity_tier IN ('core', 'deep', 'expert'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'question_concepts' AND column_name = 'eligible_ranked') THEN
        ALTER TABLE public.question_concepts ADD COLUMN eligible_ranked BOOLEAN NOT NULL DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'question_concepts' AND column_name = 'eligible_blitz') THEN
        ALTER TABLE public.question_concepts ADD COLUMN eligible_blitz BOOLEAN NOT NULL DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'question_concepts' AND column_name = 'eligible_free_answer') THEN
        ALTER TABLE public.question_concepts ADD COLUMN eligible_free_answer BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_question_concepts_canonical_hash 
ON public.question_concepts (canonical_hash) 
WHERE canonical_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_concepts_selector 
ON public.question_concepts (category_id, trust_tier, selection_bucket) 
WHERE status = 'verified';

-- 4. PLAYER TOPIC SKILL MODEL
CREATE TABLE IF NOT EXISTS public.player_topic_skill (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES public.knowledge_topics(id) ON DELETE CASCADE,
    skill_rating INTEGER NOT NULL DEFAULT 1500,
    mastery_score NUMERIC(5,2) NOT NULL DEFAULT 0.00, -- 0 to 100%
    questions_seen INTEGER NOT NULL DEFAULT 0,
    questions_correct INTEGER NOT NULL DEFAULT 0,
    recent_accuracy NUMERIC(4,3) NOT NULL DEFAULT 0.000,
    lifetime_accuracy NUMERIC(4,3) NOT NULL DEFAULT 0.000,
    median_response_ms INTEGER NOT NULL DEFAULT 3200,
    weakness_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    confidence NUMERIC(4,3) NOT NULL DEFAULT 0.000,
    last_trained_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, topic_id)
);

CREATE INDEX IF NOT EXISTS idx_pts_user_weakness ON public.player_topic_skill (user_id, weakness_score DESC);
CREATE INDEX IF NOT EXISTS idx_pts_user_mastery ON public.player_topic_skill (user_id, mastery_score DESC);

-- 5. PLAYER QUESTION STATE (SPACED REPETITION & MASTERY)
CREATE TABLE IF NOT EXISTS public.player_question_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_concept_id UUID NOT NULL REFERENCES public.question_concepts(id) ON DELETE CASCADE,
    times_seen INTEGER NOT NULL DEFAULT 1,
    times_correct INTEGER NOT NULL DEFAULT 0,
    times_wrong INTEGER NOT NULL DEFAULT 0,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_result BOOLEAN NOT NULL DEFAULT false,
    last_response_ms INTEGER NOT NULL DEFAULT 3000,
    mastery_state TEXT NOT NULL CHECK (mastery_state IN ('unseen', 'learning', 'familiar', 'strong', 'mastered')) DEFAULT 'learning',
    review_due_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '1 day',
    stability_days NUMERIC(5,2) NOT NULL DEFAULT 1.00,
    difficulty_for_player NUMERIC(4,2) NOT NULL DEFAULT 0.50,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, question_concept_id)
);

CREATE INDEX IF NOT EXISTS idx_pqs_user_due ON public.player_question_state (user_id, review_due_at);
CREATE INDEX IF NOT EXISTS idx_pqs_user_state ON public.player_question_state (user_id, mastery_state);

-- 6. TRAINING SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.training_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES public.knowledge_topics(id) ON DELETE SET NULL,
    session_mode TEXT NOT NULL CHECK (session_mode IN ('quick', 'standard', 'deep', 'marathon', 'endless', 'free_answer', 'speed', 'mastery_run', 'mistakes_only', 'unseen_only', 'custom')),
    configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
    question_count INTEGER NOT NULL DEFAULT 0,
    correct_count INTEGER NOT NULL DEFAULT 0,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    mastery_gain NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ts_user_time ON public.training_sessions (user_id, started_at DESC);

-- 7. RLS POLICIES FOR TRAINING & KNOWLEDGE GRAPH
ALTER TABLE public.knowledge_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_topic_skill ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_question_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Topics are publicly readable" ON public.knowledge_topics FOR SELECT TO anon, authenticated USING (active = true);
CREATE POLICY "Question topics are publicly readable" ON public.question_topics FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Users own their topic skills" ON public.player_topic_skill FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users own their question mastery states" ON public.player_question_state FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users own their training sessions" ON public.training_sessions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
