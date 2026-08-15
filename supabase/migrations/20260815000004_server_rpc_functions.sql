-- ==============================================================================
-- IQ ARENA - Migration 004: Server-Authoritative RPC Stored Procedures & Functions
-- ==============================================================================

-- 1. Start Game Session RPC
create or replace function public.start_game_session(
    p_user_id uuid default null,
    p_mode text default 'training',
    p_category_slug text default null,
    p_language text default 'fr'
)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
    v_session_id uuid;
    v_category_id uuid := null;
    v_limit integer := 10;
    v_rec record;
    v_position integer := 1;
    v_instances jsonb := '[]'::jsonb;
    v_options jsonb;
    v_instance_id uuid;
begin
    if p_category_slug is not null then
        select id into v_category_id from public.categories where slug = p_category_slug limit 1;
    end if;

    if p_mode = 'daily' then
        v_limit := 12;
    end if;

    -- Create game session row
    insert into public.game_sessions (user_id, mode, category_id, language_code, questions_count)
    values (p_user_id, p_mode, v_category_id, p_language, v_limit)
    returning id into v_session_id;

    -- Select verified questions, preferring concepts not recently seen by user
    for v_rec in
        select qv.id as variant_id, qv.prompt, qv.difficulty_estimate, qv.version, c.name as category_name, qv.concept_id
        from public.question_variants qv
        join public.question_concepts qc on qv.concept_id = qc.id
        join public.categories c on qc.category_id = c.id
        where qv.active = true
          and qv.review_status = 'approved'
          and qv.language_code = p_language
          and (v_category_id is null or qc.category_id = v_category_id)
          and not exists (
              select 1 from public.player_question_history pqh
              where pqh.user_id = p_user_id
                and pqh.question_concept_id = qv.concept_id
                and pqh.last_seen_at > now() - interval '1 hour'
          )
        order by random()
        limit v_limit
    loop
        -- Create question instance
        insert into public.game_question_instances (
            game_session_id, question_variant_id, question_version, position, expires_at
        )
        values (
            v_session_id, v_rec.variant_id, v_rec.version, v_position, now() + interval '20 seconds'
        )
        returning id into v_instance_id;

        -- Fetch sanitized options without is_correct!
        select jsonb_agg(
            jsonb_build_object('id', qo.id, 'label', qo.option_text)
            order by qo.position
        )
        into v_options
        from public.question_options qo
        where qo.question_variant_id = v_rec.variant_id;

        -- Append sanitized question to payload
        v_instances := v_instances || jsonb_build_array(
            jsonb_build_object(
                'instance_id', v_instance_id,
                'question_id', v_rec.variant_id,
                'prompt', v_rec.prompt,
                'category', v_rec.category_name,
                'difficulty', v_rec.difficulty_estimate,
                'seconds', 10,
                'position', v_position,
                'answers', v_options
            )
        );

        v_position := v_position + 1;
    end loop;

    return jsonb_build_object(
        'session_id', v_session_id,
        'mode', p_mode,
        'questions_count', jsonb_array_length(v_instances),
        'questions', v_instances
    );
end;
$$;

-- 2. Submit Game Answer RPC (Server-Authoritative Validation)
create or replace function public.submit_game_answer(
    p_session_id uuid,
    p_instance_id uuid,
    p_selected_option_id uuid,
    p_response_time_ms integer default 2000
)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
    v_inst record;
    v_variant record;
    v_is_correct boolean := false;
    v_correct_opt_id uuid;
    v_explanation text;
    v_score_awarded integer := 0;
    v_xp_awarded integer := 12;
    v_user_id uuid;
begin
    -- 1. Lock and verify question instance
    select gqi.*, gs.user_id
    into v_inst
    from public.game_question_instances gqi
    join public.game_sessions gs on gqi.game_session_id = gs.id
    where gqi.id = p_instance_id and gqi.game_session_id = p_session_id
    for update;

    if not found then
        raise exception 'Question instance not found or invalid session';
    end if;

    if v_inst.answered_at is not null then
        raise exception 'Question already answered';
    end if;

    v_user_id := v_inst.user_id;

    -- 2. Find correct option and variant metadata
    select qo.id, qo.question_variant_id, qv.explanation, qv.concept_id
    into v_correct_opt_id, v_variant.id, v_explanation, v_variant.concept_id
    from public.question_options qo
    join public.question_variants qv on qo.question_variant_id = qv.id
    where qo.question_variant_id = v_inst.question_variant_id and qo.is_correct = true
    limit 1;

    v_is_correct := (p_selected_option_id = v_correct_opt_id);

    if v_is_correct then
        v_score_awarded := 1;
        -- Speed bonus XP
        v_xp_awarded := 80 + greatest(0, (10000 - p_response_time_ms) / 1000) * 8;
    else
        v_xp_awarded := 15;
    end if;

    -- 3. Record instance result
    update public.game_question_instances
    set answered_at = now(),
        selected_option_id = p_selected_option_id,
        was_correct = v_is_correct,
        response_time_ms = p_response_time_ms,
        score_awarded = v_score_awarded
    where id = p_instance_id;

    -- 4. Update session total score
    update public.game_sessions
    set total_score = total_score + v_score_awarded
    where id = p_session_id;

    -- 5. Update question telemetry asynchronously
    update public.question_variants
    set times_served = times_served + 1,
        times_correct = times_correct + (case when v_is_correct then 1 else 0 end)
    where id = v_inst.question_variant_id;

    -- 6. Record player question history if authenticated
    if v_user_id is not null then
        insert into public.player_question_history (
            user_id, question_concept_id, question_variant_id, last_seen_at, times_seen, times_correct
        )
        values (
            v_user_id, v_variant.concept_id, v_inst.question_variant_id, now(), 1, case when v_is_correct then 1 else 0 end
        )
        on conflict (user_id, question_concept_id) do update set
            last_seen_at = now(),
            times_seen = public.player_question_history.times_seen + 1,
            times_correct = public.player_question_history.times_correct + (case when v_is_correct then 1 else 0 end);

        -- Update user XP
        update public.profiles
        set xp = xp + v_xp_awarded,
            level = (xp + v_xp_awarded) / 700 + 1
        where id = v_user_id;
    end if;

    return jsonb_build_object(
        'instance_id', p_instance_id,
        'was_correct', v_is_correct,
        'correct_option_id', v_correct_opt_id,
        'explanation', v_explanation,
        'xp_awarded', v_xp_awarded,
        'score_awarded', v_score_awarded
    );
end;
$$;

-- 3. Complete Ranked Match RPC (Atomic Elo calculation with K=24)
create or replace function public.complete_ranked_match(
    p_match_id uuid,
    p_player_a_score integer,
    p_player_b_score integer
)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
    v_match record;
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

    if v_match.status = 'completed' then
        return jsonb_build_object(
            'match_id', p_match_id,
            'status', 'already_completed',
            'player_a_rating_after', v_match.player_a_rating_after,
            'player_b_rating_after', v_match.player_b_rating_after
        );
    end if;

    v_ra := v_match.player_a_rating_before;
    v_rb := v_match.player_b_rating_before;

    -- Expected scores formula
    v_ea := 1.0 / (1.0 + power(10.0, (v_rb - v_ra)::numeric / 400.0));
    v_eb := 1.0 / (1.0 + power(10.0, (v_ra - v_rb)::numeric / 400.0));

    -- Actual scores outcome
    if p_player_a_score > p_player_b_score then
        v_sa := 1.0;
        v_sb := 0.0;
        v_winner_id := v_match.player_a_id;
    elsif p_player_a_score < p_player_b_score then
        v_sa := 0.0;
        v_sb := 1.0;
        v_winner_id := v_match.player_b_id;
    else
        v_sa := 0.5;
        v_sb := 0.5;
    end if;

    -- Delta calculations
    v_delta_a := round(v_k * (v_sa - v_ea));
    v_delta_b := round(v_k * (v_sb - v_eb));

    v_new_ra := greatest(100, v_ra + v_delta_a);
    v_new_rb := greatest(100, v_rb + v_delta_b);

    -- Update match row
    update public.ranked_matches
    set player_a_score = p_player_a_score,
        player_b_score = p_player_b_score,
        player_a_rating_after = v_new_ra,
        player_b_rating_after = v_new_rb,
        winner_id = v_winner_id,
        is_draw = (p_player_a_score = p_player_b_score),
        status = 'completed',
        completed_at = now()
    where id = p_match_id;

    -- Update Player A Profile
    update public.profiles
    set current_rating = v_new_ra,
        peak_rating = greatest(peak_rating, v_new_ra),
        battles_played = battles_played + 1,
        battles_won = battles_won + (case when v_winner_id = v_match.player_a_id then 1 else 0 end),
        world_rank_cached = greatest(1, round(28000 - v_new_ra * 5.8)),
        current_streak = case when v_winner_id = v_match.player_a_id then current_streak + 1 else 0 end
    where id = v_match.player_a_id;

    -- Insert rating history for Player A
    insert into public.rating_history (user_id, match_id, rating_before, rating_after, delta)
    values (v_match.player_a_id, p_match_id, v_ra, v_new_ra, v_delta_a);

    -- Update Player B Profile
    update public.profiles
    set current_rating = v_new_rb,
        peak_rating = greatest(peak_rating, v_new_rb),
        battles_played = battles_played + 1,
        battles_won = battles_won + (case when v_winner_id = v_match.player_b_id then 1 else 0 end),
        world_rank_cached = greatest(1, round(28000 - v_new_rb * 5.8)),
        current_streak = case when v_winner_id = v_match.player_b_id then current_streak + 1 else 0 end
    where id = v_match.player_b_id;

    -- Insert rating history for Player B
    insert into public.rating_history (user_id, match_id, rating_before, rating_after, delta)
    values (v_match.player_b_id, p_match_id, v_rb, v_new_rb, v_delta_b);

    return jsonb_build_object(
        'match_id', p_match_id,
        'winner_id', v_winner_id,
        'player_a_score', p_player_a_score,
        'player_b_score', p_player_b_score,
        'player_a_rating_before', v_ra,
        'player_a_rating_after', v_new_ra,
        'player_a_delta', v_delta_a,
        'player_b_rating_before', v_rb,
        'player_b_rating_after', v_new_rb,
        'player_b_delta', v_delta_b
    );
end;
$$;

-- 4. Submit Daily Result RPC
create or replace function public.submit_daily_result(
    p_challenge_id uuid,
    p_user_id uuid,
    p_score integer,
    p_duration_ms integer default 60000
)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
    v_res_id uuid;
    v_percentile numeric;
    v_country_rank integer;
begin
    v_percentile := greatest(0.5, round((100.0 - (p_score::numeric / 12.0 * 95.0))::numeric, 1));
    v_country_rank := greatest(1, round(12000 - p_score * 900));

    insert into public.daily_results (
        daily_challenge_id, user_id, score, correct_answers, total_questions, duration_ms, percentile_cached, country_rank_cached
    )
    values (
        p_challenge_id, p_user_id, p_score, p_score, 12, p_duration_ms, v_percentile, v_country_rank
    )
    returning id into v_res_id;

    -- Update player streak and XP
    update public.profiles
    set current_streak = current_streak + 1,
        longest_streak = greatest(longest_streak, current_streak + 1),
        xp = xp + (p_score * 60)
    where id = p_user_id;

    return jsonb_build_object(
        'id', v_res_id,
        'score', p_score,
        'percentile', v_percentile,
        'country_rank', v_country_rank,
        'status', 'recorded'
    );
end;
$$;

-- 5. Admin Quarantine Question RPC
create or replace function public.admin_quarantine_question(
    p_variant_id uuid,
    p_admin_id uuid,
    p_reason text
)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
    v_before jsonb;
    v_after jsonb;
begin
    -- Verify admin authorization
    if not exists (
        select 1 from public.user_roles where user_id = p_admin_id and role in ('admin', 'moderator')
    ) then
        raise exception 'Unauthorized: Admin role required';
    end if;

    select to_jsonb(qv) into v_before from public.question_variants qv where id = p_variant_id;

    update public.question_variants
    set active = false,
        review_status = 'quarantined',
        updated_at = now()
    where id = p_variant_id
    returning to_jsonb(public.question_variants.*) into v_after;

    insert into public.admin_audit_logs (admin_user_id, action, entity_type, entity_id, before_data, after_data)
    values (p_admin_id, 'quarantine_question', 'question_variant', p_variant_id, v_before, v_after);

    return jsonb_build_object('status', 'quarantined', 'variant_id', p_variant_id);
end;
$$;
