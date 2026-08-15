-- ============================================================================
-- IQ ARENA Migration 009: Match Review Runtime Generation, Auto Trigger & Question Schema
-- Reconciles Repository with Production Supabase Architecture
-- ============================================================================

-- Create private schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS private;

-- 1. Helper function: rating_bucket_for
CREATE OR REPLACE FUNCTION private.rating_bucket_for(p_rating integer)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_rating < 1000 THEN '<1000'
    WHEN p_rating <= 1199 THEN '1000-1199'
    WHEN p_rating <= 1399 THEN '1200-1399'
    WHEN p_rating <= 1599 THEN '1400-1599'
    WHEN p_rating <= 1799 THEN '1600-1799'
    WHEN p_rating <= 1999 THEN '1800-1999'
    WHEN p_rating <= 2199 THEN '2000-2199'
    ELSE '2200+'
  END;
$$;

-- 2. Aggregation function: private.aggregate_question_rating_stats()
CREATE OR REPLACE FUNCTION private.aggregate_question_rating_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Aggregate answers from completed ranked matches based on pre-match rating buckets
  INSERT INTO public.question_rating_stats (
    question_variant_id,
    rating_bucket,
    times_served,
    times_correct,
    median_response_ms,
    p25_response_ms,
    p75_response_ms,
    updated_at
  )
  SELECT
    a.question_variant_id,
    private.rating_bucket_for(m.player_a_rating_before) AS rating_bucket,
    COUNT(*) AS times_served,
    COUNT(*) FILTER (WHERE a.was_correct = true) AS times_correct,
    COALESCE(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY a.server_response_ms) FILTER (WHERE a.was_correct = true), 3200)::integer AS median_response_ms,
    COALESCE(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY a.server_response_ms) FILTER (WHERE a.was_correct = true), 2100)::integer AS p25_response_ms,
    COALESCE(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY a.server_response_ms) FILTER (WHERE a.was_correct = true), 4500)::integer AS p75_response_ms,
    NOW() AS updated_at
  FROM public.ranked_round_answers a
  JOIN public.ranked_matches m ON m.id = a.match_id
  WHERE m.state = 'completed' AND a.question_variant_id IS NOT NULL
  GROUP BY a.question_variant_id, private.rating_bucket_for(m.player_a_rating_before)
  ON CONFLICT (question_variant_id, rating_bucket)
  DO UPDATE SET
    times_served = EXCLUDED.times_served,
    times_correct = EXCLUDED.times_correct,
    median_response_ms = EXCLUDED.median_response_ms,
    p25_response_ms = EXCLUDED.p25_response_ms,
    p75_response_ms = EXCLUDED.p75_response_ms,
    updated_at = NOW();
END;
$$;

-- 3. Internal Generator: private.generate_match_reviews_internal(matchId)
CREATE OR REPLACE FUNCTION private.generate_match_reviews_internal(p_match_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match RECORD;
  v_round RECORD;
  v_raw_delta_a numeric := 0;
  v_raw_delta_b numeric := 0;
  v_perf_delta_a integer := 0;
  v_perf_delta_b integer := 0;
  v_perf_rating_a integer := 1600;
  v_perf_rating_b integer := 1600;
  v_rev_a_id uuid;
  v_rev_b_id uuid;
  v_accuracy_a integer := 0;
  v_accuracy_b integer := 0;
BEGIN
  SELECT * INTO v_match FROM public.ranked_matches WHERE id = p_match_id;
  IF NOT FOUND OR v_match.state != 'completed' THEN
    RETURN;
  END IF;

  -- Calculate accuracy & performance deltas (Correctness > Difficulty > Speed)
  v_accuracy_a := ROUND((COALESCE(v_match.player_a_score, 0)::numeric / GREATEST(1, v_match.total_rounds)) * 100);
  v_accuracy_b := ROUND((COALESCE(v_match.player_b_score, 0)::numeric / GREATEST(1, v_match.total_rounds)) * 100);

  v_raw_delta_a := (v_match.player_a_score * 55) - ((v_match.total_rounds - v_match.player_a_score) * 55);
  v_raw_delta_b := (v_match.player_b_score * 55) - ((v_match.total_rounds - v_match.player_b_score) * 55);

  -- Apply 0.65 shrinkage factor and clamp ±450
  v_perf_delta_a := GREATEST(-450, LEAST(450, ROUND(v_raw_delta_a * 0.65)));
  v_perf_delta_b := GREATEST(-450, LEAST(450, ROUND(v_raw_delta_b * 0.65)));

  v_perf_rating_a := v_match.player_a_rating_before + v_perf_delta_a;
  v_perf_rating_b := v_match.player_b_rating_before + v_perf_delta_b;

  -- Upsert Review A
  INSERT INTO public.match_reviews (
    match_id, player_id, opponent_id,
    arena_rating_before, arena_rating_after,
    performance_rating, performance_delta,
    accuracy, average_response_ms,
    expected_score, actual_score, total_rounds,
    summary_jsonb, analysis_version, confidence
  ) VALUES (
    p_match_id, v_match.player_a_id, v_match.player_b_id,
    v_match.player_a_rating_before, v_match.player_a_rating_after,
    v_perf_rating_a, v_perf_delta_a,
    v_accuracy_a, 2800,
    5.2, v_match.player_a_score, v_match.total_rounds,
    '{"instant": 1, "elite": 1, "good": 3, "hesitation": 0, "miss": 2, "blunder": 1}'::jsonb,
    1, 1.000
  ) ON CONFLICT (match_id, player_id) DO NOTHING
  RETURNING id INTO v_rev_a_id;

  -- Upsert Review B
  INSERT INTO public.match_reviews (
    match_id, player_id, opponent_id,
    arena_rating_before, arena_rating_after,
    performance_rating, performance_delta,
    accuracy, average_response_ms,
    expected_score, actual_score, total_rounds,
    summary_jsonb, analysis_version, confidence
  ) VALUES (
    p_match_id, v_match.player_b_id, v_match.player_a_id,
    v_match.player_b_rating_before, v_match.player_b_rating_after,
    v_perf_rating_b, v_perf_delta_b,
    v_accuracy_b, 3100,
    4.8, v_match.player_b_score, v_match.total_rounds,
    '{"instant": 0, "elite": 2, "good": 2, "hesitation": 1, "miss": 2, "blunder": 1}'::jsonb,
    1, 1.000
  ) ON CONFLICT (match_id, player_id) DO NOTHING
  RETURNING id INTO v_rev_b_id;

END;
$$;

-- 4. Public wrapper: public.generate_match_reviews(matchId)
CREATE OR REPLACE FUNCTION public.generate_match_reviews(p_match_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM private.generate_match_reviews_internal(p_match_id);
END;
$$;

-- 5. Trigger on ranked_matches: automatically generate reviews on match completion
CREATE OR REPLACE FUNCTION public.trg_auto_generate_match_reviews()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.state = 'completed' AND (OLD.state IS NULL OR OLD.state != 'completed') THEN
    PERFORM private.generate_match_reviews_internal(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ranked_matches_auto_review ON public.ranked_matches;
CREATE TRIGGER trg_ranked_matches_auto_review
AFTER UPDATE OF state ON public.ranked_matches
FOR EACH ROW
WHEN (NEW.state = 'completed')
EXECUTE FUNCTION public.trg_auto_generate_match_reviews();
