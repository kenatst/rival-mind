-- ==============================================================================
-- IQ ARENA - Migration 003: Game Sessions, Ranked Matches, Daily 12, Leagues & Social
-- ==============================================================================

-- 1. Seasons
create table if not exists public.seasons (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    slug text not null unique,
    starts_at timestamptz not null,
    ends_at timestamptz not null,
    status text not null check (status in ('upcoming', 'active', 'completed')) default 'active',
    created_at timestamptz not null default now()
);

-- Seed Season 1
insert into public.seasons (name, slug, starts_at, ends_at, status) values
    ('Season 1 · Genesis', 'season-1-genesis', now() - interval '10 days', now() + interval '38 days', 'active')
on conflict (slug) do nothing;

-- 2. Game Sessions
create table if not exists public.game_sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete set null,
    anonymous_token text,
    mode text not null check (mode in ('guest', 'training', 'category', 'daily', 'ranked', 'friend_battle')),
    category_id uuid references public.categories(id) on delete set null,
    status text not null check (status in ('active', 'completed', 'abandoned')) default 'active',
    total_score integer not null default 0,
    questions_count integer not null default 10,
    started_at timestamptz not null default now(),
    completed_at timestamptz,
    language_code text not null default 'fr',
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create table if not exists public.game_question_instances (
    id uuid primary key default gen_random_uuid(),
    game_session_id uuid not null references public.game_sessions(id) on delete cascade,
    question_variant_id uuid not null references public.question_variants(id) on delete cascade,
    question_version integer not null default 1,
    position integer not null default 0,
    served_at timestamptz not null default now(),
    expires_at timestamptz,
    answered_at timestamptz,
    selected_option_id uuid references public.question_options(id) on delete set null,
    was_correct boolean,
    response_time_ms integer,
    score_awarded integer default 0,
    created_at timestamptz not null default now()
);

-- 3. Ranked Matches & Rating History
create table if not exists public.ranked_matches (
    id uuid primary key default gen_random_uuid(),
    season_id uuid references public.seasons(id) on delete set null,
    player_a_id uuid not null references auth.users(id) on delete cascade,
    player_b_id uuid not null references auth.users(id) on delete cascade,
    player_a_rating_before integer not null,
    player_b_rating_before integer not null,
    player_a_rating_after integer,
    player_b_rating_after integer,
    player_a_score integer not null default 0,
    player_b_score integer not null default 0,
    winner_id uuid references auth.users(id) on delete set null,
    is_draw boolean not null default false,
    status text not null check (status in ('matchmaking', 'in_progress', 'completed', 'cancelled')) default 'in_progress',
    started_at timestamptz not null default now(),
    completed_at timestamptz,
    created_at timestamptz not null default now()
);

create table if not exists public.ranked_match_rounds (
    id uuid primary key default gen_random_uuid(),
    match_id uuid not null references public.ranked_matches(id) on delete cascade,
    round_number integer not null check (round_number >= 1 and round_number <= 8),
    question_variant_id uuid not null references public.question_variants(id) on delete cascade,
    question_version integer not null default 1,
    player_a_option_id uuid references public.question_options(id) on delete set null,
    player_b_option_id uuid references public.question_options(id) on delete set null,
    player_a_correct boolean,
    player_b_correct boolean,
    player_a_time_ms integer,
    player_b_time_ms integer,
    round_winner_id uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    unique(match_id, round_number)
);

create table if not exists public.rating_history (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    match_id uuid references public.ranked_matches(id) on delete cascade,
    rating_before integer not null,
    rating_after integer not null,
    delta integer not null,
    created_at timestamptz not null default now()
);

-- 4. Daily Challenge & Official Results
create table if not exists public.daily_challenges (
    id uuid primary key default gen_random_uuid(),
    challenge_date date not null unique default current_date,
    language_code text not null default 'fr',
    status text not null check (status in ('active', 'closed')) default 'active',
    created_at timestamptz not null default now()
);

create table if not exists public.daily_challenge_questions (
    id uuid primary key default gen_random_uuid(),
    daily_challenge_id uuid not null references public.daily_challenges(id) on delete cascade,
    question_variant_id uuid not null references public.question_variants(id) on delete cascade,
    position integer not null check (position >= 1 and position <= 12),
    unique(daily_challenge_id, position)
);

create table if not exists public.daily_results (
    id uuid primary key default gen_random_uuid(),
    daily_challenge_id uuid not null references public.daily_challenges(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    score integer not null check (score >= 0 and score <= 12),
    correct_answers integer not null default 0,
    total_questions integer not null default 12,
    duration_ms integer not null,
    percentile_cached numeric(5,2),
    country_rank_cached integer,
    completed_at timestamptz not null default now(),
    -- CRITICAL: Exactly one official result per user per Daily challenge
    unique(daily_challenge_id, user_id)
);

-- 5. Friendships & Friend Battles
create table if not exists public.friendships (
    id uuid primary key default gen_random_uuid(),
    requester_id uuid not null references auth.users(id) on delete cascade,
    addressee_id uuid not null references auth.users(id) on delete cascade,
    status text not null check (status in ('pending', 'accepted', 'blocked')) default 'pending',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check (requester_id <> addressee_id),
    unique(requester_id, addressee_id)
);

create table if not exists public.friend_battles (
    id uuid primary key default gen_random_uuid(),
    creator_id uuid not null references auth.users(id) on delete cascade,
    opponent_id uuid references auth.users(id) on delete set null,
    invite_code text not null unique,
    question_count integer not null default 10,
    status text not null check (status in ('pending', 'active', 'completed', 'expired')) default 'pending',
    creator_score integer not null default 0,
    opponent_score integer not null default 0,
    winner_id uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    completed_at timestamptz
);

-- 6. Private Leagues
create table if not exists public.leagues (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    owner_id uuid not null references auth.users(id) on delete cascade,
    invite_code text not null unique,
    visibility text not null check (visibility in ('private', 'public')) default 'private',
    season_id uuid references public.seasons(id) on delete set null,
    created_at timestamptz not null default now()
);

create table if not exists public.league_members (
    id uuid primary key default gen_random_uuid(),
    league_id uuid not null references public.leagues(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    role text not null check (role in ('owner', 'admin', 'member')) default 'member',
    season_points integer not null default 0,
    joined_at timestamptz not null default now(),
    unique(league_id, user_id)
);

-- 7. In-App Notifications
create table if not exists public.notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    type text not null check (type in ('rival', 'rematch', 'country', 'streak', 'league', 'event', 'system')),
    title text not null,
    body text not null,
    action_type text,
    action_payload jsonb default '{}'::jsonb,
    read_at timestamptz,
    created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.seasons enable row level security;
alter table public.game_sessions enable row level security;
alter table public.game_question_instances enable row level security;
alter table public.ranked_matches enable row level security;
alter table public.ranked_match_rounds enable row level security;
alter table public.rating_history enable row level security;
alter table public.daily_challenges enable row level security;
alter table public.daily_challenge_questions enable row level security;
alter table public.daily_results enable row level security;
alter table public.friendships enable row level security;
alter table public.friend_battles enable row level security;
alter table public.leagues enable row level security;
alter table public.league_members enable row level security;
alter table public.notifications enable row level security;

-- Policies
create policy "Public can view active seasons" on public.seasons for select using (true);
create policy "Users can view own game sessions" on public.game_sessions for select using (auth.uid() = user_id);
create policy "Users can view own rating history" on public.rating_history for select using (auth.uid() = user_id);
create policy "Public can view daily challenges" on public.daily_challenges for select using (status = 'active');
create policy "Public can view daily results" on public.daily_results for select using (true);
create policy "Users can view own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "Users can update own notifications" on public.notifications for update using (auth.uid() = user_id);
create policy "League members can view leagues" on public.leagues for select using (true);
create policy "League members can view members" on public.league_members for select using (true);
