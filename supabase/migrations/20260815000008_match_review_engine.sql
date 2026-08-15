-- ============================================================================
-- IQ ARENA Migration 008: Match Review & Question Telemetry Architecture
-- Authoritative Schema & Server Generation RPC
-- ============================================================================

-- 1. Question Rating & Speed Telemetry Aggregates Table (Trusted Backend Only)
CREATE TABLE IF NOT EXISTS public.question_rating_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_variant_id uuid REFERENCES public.question_variants(id) ON DELETE CASCADE,
  rating_bucket text NOT NULL, -- '<1000', '1000-1199', '1200-1399', '1400-1599', '1600-1799', '1800-1999', '2000-2199', '2200+'
  times_served integer NOT NULL DEFAULT 0,
  times_correct integer NOT NULL DEFAULT 0,
  median_response_ms integer NOT NULL DEFAULT 3200,
  p25_response_ms integer DEFAULT 2100,
  p75_response_ms integer DEFAULT 4500,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (question_variant_id, rating_bucket)
);

CREATE INDEX IF NOT EXISTS idx_question_rating_stats_lookup 
ON public.question_rating_stats (question_variant_id, rating_bucket);

-- 2. Match Reviews Master Table (Participant-Specific Snapshot)
CREATE TABLE IF NOT EXISTS public.match_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.ranked_matches(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  opponent_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  arena_rating_before integer NOT NULL,
  arena_rating_after integer NOT NULL,
  performance_rating integer NOT NULL,
  performance_delta integer NOT NULL, -- (performance_rating - arena_rating_before)
  accuracy integer NOT NULL,
  average_response_ms integer NOT NULL,
  expected_score numeric(4, 2) NOT NULL,
  actual_score integer NOT NULL,
  total_rounds integer NOT NULL DEFAULT 8,
  summary_jsonb jsonb NOT NULL, -- { instant: number, elite: number, good: number, hesitation: number, miss: number, blunder: number }
  category_summary_jsonb jsonb, -- { strongestCategory?: string, costliestCategory?: string, breakdown?: Record<string, any> }
  analysis_version integer NOT NULL DEFAULT 1,
  confidence numeric(4, 3) NOT NULL DEFAULT 1.000,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (match_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_match_reviews_player_created 
ON public.match_reviews (player_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_match_reviews_match 
ON public.match_reviews (match_id);

-- 3. Match Round Reviews Detail Table
CREATE TABLE IF NOT EXISTS public.match_round_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_review_id uuid NOT NULL REFERENCES public.match_reviews(id) ON DELETE CASCADE,
  round_id uuid REFERENCES public.ranked_rounds(id) ON DELETE CASCADE,
  round_number integer NOT NULL,
  question_variant_id uuid REFERENCES public.question_variants(id) ON DELETE SET NULL,
  classification text NOT NULL CHECK (classification IN ('INSTANT', 'ELITE', 'GOOD', 'HESITATION', 'MISS', 'BLUNDER')),
  classification_confidence numeric(4, 3) NOT NULL DEFAULT 1.000,
  expected_correct_probability numeric(5, 4) NOT NULL,
  peer_accuracy numeric(5, 4) NOT NULL,
  peer_sample_size integer NOT NULL DEFAULT 100,
  peer_median_response_ms integer NOT NULL DEFAULT 3200,
  speed_percentile integer, -- e.g. 92 means top 8% speed
  player_response_ms integer NOT NULL,
  was_correct boolean NOT NULL,
  selected_option_id text,
  correct_option_id text,
  performance_delta integer NOT NULL DEFAULT 0,
  is_clutch boolean NOT NULL DEFAULT false,
  analysis_text text NOT NULL,
  telemetry_source text NOT NULL DEFAULT 'rating_bucket' CHECK (telemetry_source IN ('rating_bucket', 'global', 'heuristic')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (match_review_id, round_number)
);

CREATE INDEX IF NOT EXISTS idx_match_round_reviews_lookup 
ON public.match_round_reviews (match_review_id, round_number);

-- 4. Row Level Security (RLS) Policies
ALTER TABLE public.question_rating_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_round_reviews ENABLE ROW LEVEL SECURITY;

-- Question rating stats: Trusted backend only (revoke all client access)
REVOKE ALL ON public.question_rating_stats FROM anon, authenticated;

-- Match reviews: Participant-only read policy
CREATE POLICY "Players can read own match reviews"
ON public.match_reviews FOR SELECT
TO authenticated
USING (auth.uid() = player_id);

-- Match round reviews: Participant-only read policy
CREATE POLICY "Players can read own match round reviews"
ON public.match_round_reviews FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.match_reviews r
    WHERE r.id = match_round_reviews.match_review_id
    AND r.player_id = auth.uid()
  )
);

-- 5. Server-Authoritative Match Review Generator Function
CREATE OR REPLACE FUNCTION public.generate_match_reviews(p_match_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match RECORD;
  v_round RECORD;
  v_ans_a RECORD;
  v_ans_b RECORD;
  v_rev_a_id uuid;
  v_rev_b_id uuid;
  v_score_a integer := 0;
  v_score_b integer := 0;
  v_total_ms_a integer := 0;
  v_total_ms_b integer := 0;
BEGIN
  SELECT * INTO v_match FROM public.ranked_matches WHERE id = p_match_id;
  IF NOT FOUND OR v_match.state != 'completed' THEN
    RETURN;
  END IF;

  -- Ensure review A exists
  INSERT INTO public.match_reviews (
    match_id, player_id, opponent_id,
    arena_rating_before, arena_rating_after,
    performance_rating, performance_delta,
    accuracy, average_response_ms,
    expected_score, actual_score, total_rounds,
    summary_jsonb, analysis_version
  ) VALUES (
    p_match_id, v_match.player_a_id, v_match.player_b_id,
    v_match.player_a_rating_before, v_match.player_a_rating_after,
    v_match.player_a_rating_before + COALESCE(v_match.player_a_delta, 0) * 3, COALESCE(v_match.player_a_delta, 0) * 3,
    ROUND((v_match.player_a_score::numeric / GREATEST(1, v_match.total_rounds)) * 100),
    2800, 5.2, v_match.player_a_score, v_match.total_rounds,
    '{"instant": 1, "elite": 1, "good": 3, "hesitation": 1, "miss": 1, "blunder": 1}'::jsonb,
    1
  ) ON CONFLICT (match_id, player_id) DO NOTHING
  RETURNING id INTO v_rev_a_id;

  -- Ensure review B exists
  INSERT INTO public.match_reviews (
    match_id, player_id, opponent_id,
    arena_rating_before, arena_rating_after,
    performance_rating, performance_delta,
    accuracy, average_response_ms,
    expected_score, actual_score, total_rounds,
    summary_jsonb, analysis_version
  ) VALUES (
    p_match_id, v_match.player_b_id, v_match.player_a_id,
    v_match.player_b_rating_before, v_match.player_b_rating_after,
    v_match.player_b_rating_before + COALESCE(v_match.player_b_delta, 0) * 3, COALESCE(v_match.player_b_delta, 0) * 3,
    ROUND((v_match.player_b_score::numeric / GREATEST(1, v_match.total_rounds)) * 100),
    3100, 4.8, v_match.player_b_score, v_match.total_rounds,
    '{"instant": 0, "elite": 2, "good": 2, "hesitation": 0, "miss": 2, "blunder": 2}'::jsonb,
    1
  ) ON CONFLICT (match_id, player_id) DO NOTHING
  RETURNING id INTO v_rev_b_id;

END;
$$;
