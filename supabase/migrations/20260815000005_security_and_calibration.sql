-- ==============================================================================
-- IQ ARENA - Migration 005: Security Hardening & Authoritative Guest Calibration
-- ==============================================================================

-- 1. Guest Calibrations Table
create table if not exists public.guest_calibrations (
    id uuid primary key default gen_random_uuid(),
    guest_session_id text not null,
    provisional_rating integer not null check (provisional_rating between 500 and 2000),
    calculated_at timestamptz not null default now(),
    expires_at timestamptz not null default (now() + interval '24 hours'),
    claimed_at timestamptz,
    calibration_token_hash text not null unique,
    created_at timestamptz not null default now()
);

alter table public.guest_calibrations enable row level security;

-- Only trusted backend RPCs can read/write guest calibrations
create policy "No direct public client access to calibrations"
    on public.guest_calibrations
    for all using (false);

-- 2. Server RPC to Claim Guest Calibration Token
create or replace function public.claim_guest_calibration(
    p_token text,
    p_user_id uuid
)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
    v_calib record;
    v_token_hash text;
begin
    v_token_hash := encode(digest(p_token, 'sha256'), 'hex');

    select * into v_calib
    from public.guest_calibrations
    where calibration_token_hash = v_token_hash
      and claimed_at is null
      and expires_at > now()
    for update;

    if not found then
        return jsonb_build_object('success', false, 'reason', 'Invalid or expired calibration token');
    end if;

    -- Mark token as claimed
    update public.guest_calibrations
    set claimed_at = now()
    where id = v_calib.id;

    -- Update newly registered user profile with authoritative provisional rating
    update public.profiles
    set current_rating = v_calib.provisional_rating,
        peak_rating = v_calib.provisional_rating,
        world_rank_cached = greatest(1, round(28000 - v_calib.provisional_rating * 5.8)),
        country_rank_cached = greatest(1, round(1100 - v_calib.provisional_rating * 0.23))
    where id = p_user_id;

    return jsonb_build_object(
        'success', true,
        'provisional_rating', v_calib.provisional_rating
    );
end;
$$;

-- 3. Hardened complete_ranked_match RPC (Ignores any client score input!)
create or replace function public.complete_ranked_match_secure(
    p_match_id uuid,
    p_caller_id uuid
)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
    v_match record;
    v_score_a integer := 0;
    v_score_b integer := 0;
    v_ra integer;
    v_rb integer;
    v_ea numeric;
    v_eb numeric;
    v_sa numeric;
    v_sb numeric;
    v_delta_a integer;
    v_delta_b integer;
    v_new_ra integer;
    v_new_rb integer;
    v_k integer := 24;
    v_winner_id uuid := null;
begin
    select * into v_match from public.ranked_matches where id = p_match_id for update;

    if not found then
        raise exception 'Ranked match not found';
    end if;

    -- Participant authorization check
    if p_caller_id <> v_match.player_a_id and p_caller_id <> v_match.player_b_id then
        raise exception 'Unauthorized: Caller is not a participant in this match';
    end if;

    -- IDEMPOTENCY: If already completed, return existing completed record without double rating updates
    if v_match.status = 'completed' then
        return jsonb_build_object(
            'match_id', p_match_id,
            'status', 'already_completed',
            'player_a_rating_after', v_match.player_a_rating_after,
            'player_b_rating_after', v_match.player_b_rating_after,
            'winner_id', v_match.winner_id,
            'is_idempotent_replay', true
        );
    end if;

    -- Authoritatively derive scores strictly from recorded rounds
    select count(*) filter (where player_a_correct = true),
           count(*) filter (where player_b_correct = true)
    into v_score_a, v_score_b
    from public.ranked_match_rounds
    where match_id = p_match_id;

    v_ra := v_match.player_a_rating_before;
    v_rb := v_match.player_b_rating_before;

    -- Expected score calculation
    v_ea := 1.0 / (1.0 + power(10.0, (v_rb - v_ra)::numeric / 400.0));
    v_eb := 1.0 / (1.0 + power(10.0, (v_ra - v_rb)::numeric / 400.0));

    if v_score_a > v_score_b then
        v_sa := 1.0;
        v_sb := 0.0;
        v_winner_id := v_match.player_a_id;
    elsif v_score_a < v_score_b then
        v_sa := 0.0;
        v_sb := 1.0;
        v_winner_id := v_match.player_b_id;
    else
        v_sa := 0.5;
        v_sb := 0.5;
    end if;

    v_delta_a := round(v_k * (v_sa - v_ea));
    v_delta_b := round(v_k * (v_sb - v_eb));

    v_new_ra := greatest(100, v_ra + v_delta_a);
    v_new_rb := greatest(100, v_rb + v_delta_b);

    -- Mark match completed
    update public.ranked_matches
    set player_a_score = v_score_a,
        player_b_score = v_score_b,
        player_a_rating_after = v_new_ra,
        player_b_rating_after = v_new_rb,
        winner_id = v_winner_id,
        is_draw = (v_score_a = v_score_b),
        status = 'completed',
        completed_at = now()
    where id = p_match_id;

    -- Update player profiles and history atomically
    update public.profiles
    set current_rating = v_new_ra,
        peak_rating = greatest(peak_rating, v_new_ra),
        battles_played = battles_played + 1,
        battles_won = battles_won + (case when v_winner_id = v_match.player_a_id then 1 else 0 end),
        world_rank_cached = greatest(1, round(28000 - v_new_ra * 5.8)),
        current_streak = case when v_winner_id = v_match.player_a_id then current_streak + 1 else 0 end
    where id = v_match.player_a_id;

    insert into public.rating_history (user_id, match_id, rating_before, rating_after, delta)
    values (v_match.player_a_id, p_match_id, v_ra, v_new_ra, v_delta_a);

    update public.profiles
    set current_rating = v_new_rb,
        peak_rating = greatest(peak_rating, v_new_rb),
        battles_played = battles_played + 1,
        battles_won = battles_won + (case when v_winner_id = v_match.player_b_id then 1 else 0 end),
        world_rank_cached = greatest(1, round(28000 - v_new_rb * 5.8)),
        current_streak = case when v_winner_id = v_match.player_b_id then current_streak + 1 else 0 end
    where id = v_match.player_b_id;

    insert into public.rating_history (user_id, match_id, rating_before, rating_after, delta)
    values (v_match.player_b_id, p_match_id, v_rb, v_new_rb, v_delta_b);

    return jsonb_build_object(
        'match_id', p_match_id,
        'winner_id', v_winner_id,
        'player_a_score', v_score_a,
        'player_b_score', v_score_b,
        'player_a_rating_before', v_ra,
        'player_a_rating_after', v_new_ra,
        'player_a_delta', v_delta_a,
        'player_b_rating_before', v_rb,
        'player_b_rating_after', v_new_rb,
        'player_b_delta', v_delta_b,
        'is_idempotent_replay', false
    );
end;
$$;
