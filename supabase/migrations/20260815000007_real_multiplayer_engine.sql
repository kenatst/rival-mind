-- ============================================================================
-- IQ ARENA Migration 007: Real Multi-Player Matchmaking, Rounds, & State Engine
-- ============================================================================

-- 1. Matchmaking Queue Table
CREATE TABLE IF NOT EXISTS public.matchmaking_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mode text NOT NULL DEFAULT 'ranked_classic',
  rating_snapshot integer NOT NULL,
  region text,
  status text NOT NULL CHECK (status IN ('waiting', 'matched', 'cancelled', 'expired')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  matched_at timestamptz,
  match_id uuid REFERENCES public.ranked_matches(id) ON DELETE SET NULL,
  client_session_id text
);

-- Unique index to ensure 1 active queue entry per user per mode
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_queue_per_user 
ON public.matchmaking_queue (user_id, mode) 
WHERE status = 'waiting';

CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_search 
ON public.matchmaking_queue (mode, status, rating_snapshot, joined_at);

-- 2. Ensure ranked_matches Columns & State Machine
ALTER TABLE public.ranked_matches 
ADD COLUMN IF NOT EXISTS state text NOT NULL DEFAULT 'matched' 
  CHECK (state IN ('matched', 'countdown', 'round_active', 'round_locked', 'round_reveal', 'between_rounds', 'completed', 'cancelled', 'abandoned')),
ADD COLUMN IF NOT EXISTS starts_at timestamptz,
ADD COLUMN IF NOT EXISTS current_round integer NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_rounds integer NOT NULL DEFAULT 8,
ADD COLUMN IF NOT EXISTS player_a_score integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS player_b_score integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS player_a_rating_before integer,
ADD COLUMN IF NOT EXISTS player_a_rating_after integer,
ADD COLUMN IF NOT EXISTS player_b_rating_before integer,
ADD COLUMN IF NOT EXISTS player_b_rating_after integer,
ADD COLUMN IF NOT EXISTS player_a_delta integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS player_b_delta integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS winner_id uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS forfeit_user_id uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS rematch_requested_by uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS rematch_match_id uuid REFERENCES public.ranked_matches(id);

CREATE INDEX IF NOT EXISTS idx_ranked_matches_player_a ON public.ranked_matches(player_a_id, state);
CREATE INDEX IF NOT EXISTS idx_ranked_matches_player_b ON public.ranked_matches(player_b_id, state);

-- 3. Ranked Rounds Table
CREATE TABLE IF NOT EXISTS public.ranked_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.ranked_matches(id) ON DELETE CASCADE,
  round_number integer NOT NULL,
  question_id text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  difficulty text NOT NULL DEFAULT 'medium',
  prompt text NOT NULL,
  options jsonb NOT NULL, -- Array of { id, label }
  correct_option_id text NOT NULL,
  explanation text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'locked', 'revealed', 'completed')),
  served_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revealed_at timestamptz,
  round_winner_id uuid REFERENCES public.profiles(id),
  UNIQUE (match_id, round_number)
);

CREATE INDEX IF NOT EXISTS idx_ranked_rounds_match_round ON public.ranked_rounds(match_id, round_number);

-- 4. Ranked Round Answers Table
CREATE TABLE IF NOT EXISTS public.ranked_round_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id uuid NOT NULL REFERENCES public.ranked_rounds(id) ON DELETE CASCADE,
  match_id uuid NOT NULL REFERENCES public.ranked_matches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  selected_option_id text NOT NULL,
  answered_at timestamptz NOT NULL DEFAULT now(),
  server_response_ms integer NOT NULL,
  client_telemetry_ms integer,
  was_correct boolean NOT NULL,
  locked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (round_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ranked_round_answers_lookup ON public.ranked_round_answers(round_id, user_id);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.matchmaking_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranked_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranked_round_answers ENABLE ROW LEVEL SECURITY;

-- Matchmaking queue policies
CREATE POLICY "Users can read own queue entries"
ON public.matchmaking_queue FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own queue entries"
ON public.matchmaking_queue FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own queue entries"
ON public.matchmaking_queue FOR UPDATE
USING (auth.uid() = user_id);

-- Ranked rounds policies (Participants can read rounds of their matches)
CREATE POLICY "Participants can read their match rounds"
ON public.ranked_rounds FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ranked_matches m
    WHERE m.id = ranked_rounds.match_id
    AND (m.player_a_id = auth.uid() OR m.player_b_id = auth.uid())
  )
);

-- Ranked round answers policies (Participants can read answers of their match rounds)
CREATE POLICY "Participants can read match round answers"
ON public.ranked_round_answers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ranked_matches m
    WHERE m.id = ranked_round_answers.match_id
    AND (m.player_a_id = auth.uid() OR m.player_b_id = auth.uid())
  )
);

CREATE POLICY "Users can submit own round answers"
ON public.ranked_round_answers FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 6. Enable Supabase Realtime Publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.matchmaking_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ranked_matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ranked_rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ranked_round_answers;
