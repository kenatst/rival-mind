-- ==============================================================================
-- IQ ARENA - Migration 001: Core Identity, Profiles, Roles, and Countries
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Countries lookup table
create table if not exists public.countries (
    code text primary key check (char_length(code) = 2),
    name text not null,
    flag_emoji text not null,
    active boolean not null default true,
    created_at timestamptz not null default now()
);

-- Seed top active countries
insert into public.countries (code, name, flag_emoji) values
    ('FR', 'France', '🇫🇷'),
    ('JP', 'Japan', '🇯🇵'),
    ('DE', 'Germany', '🇩🇪'),
    ('GB', 'United Kingdom', '🇬🇧'),
    ('CA', 'Canada', '🇨🇦'),
    ('US', 'United States', '🇺🇸'),
    ('ES', 'Spain', '🇪🇸'),
    ('BR', 'Brazil', '🇧🇷'),
    ('IT', 'Italy', '🇮🇹'),
    ('KR', 'South Korea', '🇰🇷')
on conflict (code) do nothing;

-- 2. User Roles
create table if not exists public.user_roles (
    user_id uuid primary key references auth.users(id) on delete cascade,
    role text not null check (role in ('user', 'moderator', 'admin')) default 'user',
    created_at timestamptz not null default now()
);

-- 3. Profiles table
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    username text not null unique check (char_length(username) >= 3 and char_length(username) <= 20),
    display_name text,
    country_code text not null references public.countries(code) default 'FR',
    avatar_url text,
    avatar_color text not null default 'oklch(0.88 0.21 122)',
    initials text not null default 'IQ',
    level integer not null default 1 check (level >= 1),
    xp integer not null default 0 check (xp >= 0),
    current_rating integer not null default 1200 check (current_rating >= 100),
    peak_rating integer not null default 1200 check (peak_rating >= 100),
    world_rank_cached integer default 18429,
    country_rank_cached integer default 721,
    current_streak integer not null default 0 check (current_streak >= 0),
    longest_streak integer not null default 0 check (longest_streak >= 0),
    battles_played integer not null default 0 check (battles_played >= 0),
    battles_won integer not null default 0 check (battles_won >= 0),
    accuracy_percent integer not null default 50 check (accuracy_percent >= 0 and accuracy_percent <= 100),
    preferences jsonb not null default '{"audio_muted": false, "preferred_language": "fr"}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Case-insensitive unique username index
create unique index if not exists idx_profiles_username_lower on public.profiles (lower(username));
create index if not exists idx_profiles_current_rating on public.profiles (current_rating desc);
create index if not exists idx_profiles_country_code on public.profiles (country_code);

-- Enable RLS
alter table public.countries enable row level security;
alter table public.user_roles enable row level security;
alter table public.profiles enable row level security;

-- Policies
create policy "Public can view active countries" on public.countries
    for select using (active = true);

create policy "Users can view roles" on public.user_roles
    for select using (auth.uid() = user_id or exists (
        select 1 from public.user_roles where user_id = auth.uid() and role = 'admin'
    ));

create policy "Public can view basic profiles" on public.profiles
    for select using (true);

-- CRITICAL: Users can ONLY update self-service aesthetic fields, NOT rating/xp/stats!
create policy "Users can update own aesthetic fields" on public.profiles
    for update using (auth.uid() = id)
    with check (
        auth.uid() = id
    );

-- Trigger to automatically create a profile on new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
    v_username text;
    v_initials text;
begin
    v_username := coalesce(new.raw_user_meta_data->>'username', 'Player_' || substr(new.id::text, 1, 6));
    v_initials := upper(substr(v_username, 1, 2));

    insert into public.profiles (id, username, display_name, initials, country_code, avatar_color)
    values (
        new.id,
        v_username,
        v_username,
        v_initials,
        coalesce(new.raw_user_meta_data->>'country_code', 'FR'),
        coalesce(new.raw_user_meta_data->>'avatar_color', 'oklch(0.88 0.21 122)')
    )
    on conflict (id) do nothing;

    insert into public.user_roles (user_id, role)
    values (new.id, 'user')
    on conflict (user_id) do nothing;

    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
