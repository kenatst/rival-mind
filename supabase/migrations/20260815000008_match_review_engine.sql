-- ============================================================================
-- IQ ARENA Migration 008: Match Review & Question Telemetry Architecture
-- ============================================================================

-- 1. Question Rating & Speed Telemetry Aggregates Table
CREATE TABLE IF NOT EXISTS public.question_rating_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id text NOT NULL,
  rating_bucket text NOT NULL, -- e.g. '<1000', '1000-1199', '1200-1399', '1400-1599', '1600-1799', '1800-1999', '2000-2199', '2200+'
  times_served integer NOT NULL DEFAULT 0,
  times_correct integer NOT NULL DEFAULT 0,
  accuracy numeric(5, 4) NOT NULL DEFAULT 0.5000,
  median_response_ms integer NOT NULL DEFAULT 3200,
  fastest_response_ms integer DEFAULT 800,
  last_updated timestamptz NOT NULL DEFAULT now(),
  UNIQUE (question_id, rating_bucket)
);

CREATE INDEX IF NOT EXISTS idx_question_rating_stats_lookup 
ON public.question_rating_stats (question_id, rating_bucket);

-- 2. Match Reviews Master Table (Participant-Specific Snapshot)
CREATE TABLE IF NOT EXISTS public.match_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.ranked_matches(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  arena_rating_at_match integer NOT NULL,
  performance_rating integer NOT NULL,
  performance_delta integer NOT NULL, -- (performance_rating - arena_rating_at_match)
  accuracy_percent integer NOT NULL,
  avg_response_ms integer NOT NULL,
  expected_score numeric(4, 2) NOT NULL,
  actual_score integer NOT NULL,
  summary_jsonb jsonb NOT NULL, -- { instant: number, elite: number, good: number, hesitation: number, miss: number, blunder: number }
  strongest_category text,
  costliest_category text,
  analysis_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (match_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_match_reviews_player_lookup 
ON public.match_reviews (player_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_match_reviews_match 
ON public.match_reviews (match_id);

-- 3. Match Round Reviews Detail Table
CREATE TABLE IF NOT EXISTS public.match_round_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_review_id uuid NOT NULL REFERENCES public.match_reviews(id) ON DELETE CASCADE,
  round_number integer NOT NULL,
  question_id text NOT NULL,
  category text NOT NULL,
  subcategory text,
  prompt text NOT NULL,
  player_selected_id text NOT NULL,
  player_selected_label text NOT NULL,
  correct_option_id text NOT NULL,
  correct_option_label text NOT NULL,
  was_correct boolean NOT NULL,
  player_response_ms integer NOT NULL,
  peer_median_response_ms integer NOT NULL DEFAULT 3200,
  speed_percentile integer, -- e.g. 92 means top 8% speed
  expected_correct_probability numeric(5, 4) NOT NULL,
  peer_accuracy numeric(5, 4) NOT NULL,
  peer_sample_size integer NOT NULL DEFAULT 100,
  classification text NOT NULL CHECK (classification IN ('INSTANT', 'ELITE', 'GOOD', 'HESITATION', 'MISS', 'BLUNDER')),
  classification_confidence numeric(4, 3) NOT NULL DEFAULT 1.000,
  performance_delta integer NOT NULL DEFAULT 0,
  analysis_text text NOT NULL,
  explanation text,
  is_clutch boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (match_review_id, round_number)
);

CREATE INDEX IF NOT EXISTS idx_match_round_reviews_lookup 
ON public.match_round_reviews (match_review_id, round_number);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.question_rating_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_round_reviews ENABLE ROW LEVEL SECURITY;

-- Question rating stats: public read for all authenticated users
CREATE POLICY "Public read for question rating stats"
ON public.question_rating_stats FOR SELECT
TO authenticated, anon
USING (true);

-- Match reviews: Participant-only read policy
CREATE POLICY "Players can read own match reviews"
ON public.match_reviews FOR SELECT
USING (auth.uid() = player_id);

-- Match round reviews: Participant-only read policy
CREATE POLICY "Players can read own match round reviews"
ON public.match_round_reviews FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.match_reviews r
    WHERE r.id = match_round_reviews.match_review_id
    AND r.player_id = auth.uid()
  )
);
