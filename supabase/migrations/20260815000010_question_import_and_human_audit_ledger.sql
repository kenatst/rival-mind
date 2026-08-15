-- ============================================================================
-- IQ ARENA Migration 010: Question Import Jobs & Human Audit Ledger
-- Reconciles Repository with Production Supabase Architecture
-- ============================================================================

-- 1. Table: question_import_jobs
CREATE TABLE IF NOT EXISTS public.question_import_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')) DEFAULT 'pending',
    expected_count INTEGER,
    records_seen INTEGER NOT NULL DEFAULT 0,
    records_valid INTEGER NOT NULL DEFAULT 0,
    records_inserted INTEGER NOT NULL DEFAULT 0,
    records_updated INTEGER NOT NULL DEFAULT 0,
    records_skipped INTEGER NOT NULL DEFAULT 0,
    records_rejected INTEGER NOT NULL DEFAULT 0,
    error_summary TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 2. Add source_key and import_job_id to question_variants if not existing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'question_variants' AND column_name = 'source_key'
    ) THEN
        ALTER TABLE public.question_variants ADD COLUMN source_key TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'question_variants' AND column_name = 'import_job_id'
    ) THEN
        ALTER TABLE public.question_variants ADD COLUMN import_job_id UUID REFERENCES public.question_import_jobs(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_question_variants_source_key 
ON public.question_variants (source_key) 
WHERE source_key IS NOT NULL;

-- 3. Table: question_audit_samples
CREATE TABLE IF NOT EXISTS public.question_audit_samples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    target_size INTEGER NOT NULL DEFAULT 200,
    status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'cancelled')) DEFAULT 'in_progress',
    selection_method TEXT NOT NULL DEFAULT 'stratified_random',
    criteria_version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 4. Table: question_audit_sample_items
CREATE TABLE IF NOT EXISTS public.question_audit_sample_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sample_id UUID NOT NULL REFERENCES public.question_audit_samples(id) ON DELETE CASCADE,
    question_variant_id UUID NOT NULL REFERENCES public.question_variants(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    factual_correct BOOLEAN,
    unambiguous BOOLEAN,
    good_french BOOLEAN,
    good_distractors BOOLEAN,
    interesting BOOLEAN,
    difficulty_appropriate BOOLEAN,
    trust_for_elo BOOLEAN,
    trust_for_blitz BOOLEAN,
    verdict TEXT CHECK (verdict IN ('pending', 'pass', 'fail', 'critical')) DEFAULT 'pending',
    notes TEXT,
    reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(sample_id, question_variant_id)
);

-- 5. Trigger: audit completion validation
CREATE OR REPLACE FUNCTION public.trg_validate_audit_sample_completion()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_items INTEGER;
    v_reviewed_items INTEGER;
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        SELECT COUNT(*), COUNT(*) FILTER (WHERE verdict != 'pending')
        INTO v_total_items, v_reviewed_items
        FROM public.question_audit_sample_items
        WHERE sample_id = NEW.id;

        IF v_total_items < NEW.target_size OR v_reviewed_items < NEW.target_size THEN
            RAISE EXCEPTION 'Cannot complete audit sample %: only %/% items reviewed (target: %).',
                NEW.id, v_reviewed_items, v_total_items, NEW.target_size;
        END IF;

        NEW.completed_at := NOW();
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_audit_sample_completion ON public.question_audit_samples;
CREATE TRIGGER trg_check_audit_sample_completion
BEFORE UPDATE OF status ON public.question_audit_samples
FOR EACH ROW
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION public.trg_validate_audit_sample_completion();

-- 6. RLS Policies
ALTER TABLE public.question_import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_audit_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_audit_sample_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view and manage import jobs"
ON public.question_import_jobs
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can view and manage audit samples"
ON public.question_audit_samples
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can view and manage audit sample items"
ON public.question_audit_sample_items
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
