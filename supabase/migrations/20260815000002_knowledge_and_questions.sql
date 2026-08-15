-- ==============================================================================
-- IQ ARENA - Migration 002: Knowledge Layer, Questions, Variants, Options, and Moderation
-- ==============================================================================

-- 1. Categories
create table if not exists public.categories (
    id uuid primary key default gen_random_uuid(),
    slug text not null unique,
    name text not null,
    icon_key text not null default 'layers',
    sort_order integer not null default 0,
    active boolean not null default true,
    created_at timestamptz not null default now()
);

create table if not exists public.subcategories (
    id uuid primary key default gen_random_uuid(),
    category_id uuid not null references public.categories(id) on delete cascade,
    slug text not null,
    name text not null,
    active boolean not null default true,
    created_at timestamptz not null default now(),
    unique(category_id, slug)
);

-- Seed 12 main categories
insert into public.categories (slug, name, icon_key, sort_order) values
    ('history', 'History', 'landmark', 1),
    ('geography', 'Geography', 'globe', 2),
    ('science', 'Science', 'atom', 3),
    ('sports', 'Sports', 'trophy', 4),
    ('cinema', 'Cinema', 'film', 5),
    ('music', 'Music', 'music', 6),
    ('art', 'Art', 'palette', 7),
    ('literature', 'Literature', 'book', 8),
    ('technology', 'Technology', 'cpu', 9),
    ('nature', 'Nature', 'tree', 10),
    ('society', 'Politics & Society', 'scale', 11),
    ('food', 'Food & Culture', 'utensils', 12)
on conflict (slug) do nothing;

-- 2. Knowledge Layer
create table if not exists public.knowledge_sources (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    base_url text,
    license text not null default 'CC-BY-SA',
    source_type text not null check (source_type in ('curated', 'open_data', 'encyclopedia', 'academic')),
    trust_score numeric(4,2) not null default 0.95 check (trust_score between 0 and 1),
    created_at timestamptz not null default now()
);

create table if not exists public.knowledge_entities (
    id uuid primary key default gen_random_uuid(),
    canonical_name text not null,
    entity_type text not null,
    external_source text,
    external_id text,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.knowledge_facts (
    id uuid primary key default gen_random_uuid(),
    subject_entity_id uuid not null references public.knowledge_entities(id) on delete cascade,
    predicate text not null,
    object_entity_id uuid references public.knowledge_entities(id) on delete set null,
    text_value text,
    numeric_value numeric,
    date_value date,
    unit text,
    source_id uuid references public.knowledge_sources(id) on delete set null,
    source_reference text,
    confidence_score numeric(4,2) not null default 1.00 check (confidence_score between 0 and 1),
    status text not null check (status in ('pending', 'verified', 'deprecated', 'disputed')) default 'verified',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 3. Question Concepts & Variants
create table if not exists public.question_concepts (
    id uuid primary key default gen_random_uuid(),
    primary_fact_id uuid references public.knowledge_facts(id) on delete set null,
    category_id uuid not null references public.categories(id) on delete cascade,
    subcategory_id uuid references public.subcategories(id) on delete set null,
    question_type text not null check (question_type in ('multiple_choice', 'true_false', 'ordering', 'numeric')) default 'multiple_choice',
    difficulty_estimate text not null check (difficulty_estimate in ('easy', 'medium', 'hard', 'expert')) default 'medium',
    timeless boolean not null default true,
    quality_score numeric(4,2) not null default 0.90 check (quality_score between 0 and 1),
    status text not null check (status in ('draft', 'pending_review', 'verified', 'quarantined', 'deprecated')) default 'verified',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.question_variants (
    id uuid primary key default gen_random_uuid(),
    concept_id uuid not null references public.question_concepts(id) on delete cascade,
    language_code text not null default 'fr' check (char_length(language_code) = 2),
    prompt text not null,
    explanation text,
    difficulty_estimate text not null check (difficulty_estimate in ('easy', 'medium', 'hard', 'expert')) default 'medium',
    quality_score numeric(4,2) not null default 0.90,
    generation_method text not null check (generation_method in ('human_curated', 'ai_generated', 'imported')) default 'human_curated',
    review_status text not null check (review_status in ('draft', 'pending', 'approved', 'quarantined', 'deprecated')) default 'approved',
    active boolean not null default true,
    times_served integer not null default 0,
    times_correct integer not null default 0,
    median_response_ms integer,
    report_count integer not null default 0,
    version integer not null default 1,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 4. Question Options
create table if not exists public.question_options (
    id uuid primary key default gen_random_uuid(),
    question_variant_id uuid not null references public.question_variants(id) on delete cascade,
    option_text text not null,
    is_correct boolean not null default false,
    position integer not null default 0,
    distractor_type text,
    created_at timestamptz not null default now()
);

-- 5. Statistics, History & Category Skills
create table if not exists public.player_question_history (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    question_concept_id uuid not null references public.question_concepts(id) on delete cascade,
    question_variant_id uuid not null references public.question_variants(id) on delete cascade,
    first_seen_at timestamptz not null default now(),
    last_seen_at timestamptz not null default now(),
    times_seen integer not null default 1,
    times_correct integer not null default 0,
    unique(user_id, question_concept_id)
);

create table if not exists public.player_category_skill (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    category_id uuid not null references public.categories(id) on delete cascade,
    skill_rating integer not null default 1200,
    questions_answered integer not null default 0,
    correct_answers integer not null default 0,
    updated_at timestamptz not null default now(),
    unique(user_id, category_id)
);

-- 6. Reporting & Admin Audit
create table if not exists public.question_reports (
    id uuid primary key default gen_random_uuid(),
    question_variant_id uuid not null references public.question_variants(id) on delete cascade,
    user_id uuid references auth.users(id) on delete set null,
    reason text not null check (reason in ('wrong_answer', 'ambiguous', 'outdated', 'bad_translation', 'typo', 'other')),
    details text,
    status text not null check (status in ('pending', 'resolved', 'dismissed')) default 'pending',
    resolution text,
    resolved_by uuid references auth.users(id) on delete set null,
    resolved_at timestamptz,
    created_at timestamptz not null default now()
);

create table if not exists public.admin_audit_logs (
    id uuid primary key default gen_random_uuid(),
    admin_user_id uuid not null references auth.users(id),
    action text not null,
    entity_type text not null,
    entity_id uuid not null,
    before_data jsonb,
    after_data jsonb,
    created_at timestamptz not null default now()
);

-- Indexes for performance & scaling
create index if not exists idx_qv_active_lang on public.question_variants (active, language_code, review_status);
create index if not exists idx_qv_concept on public.question_variants (concept_id);
create index if not exists idx_qo_variant on public.question_options (question_variant_id);
create index if not exists idx_pqh_user_concept on public.player_question_history (user_id, question_concept_id);
create index if not exists idx_reports_status on public.question_reports (status);

-- Enable RLS
alter table public.categories enable row level security;
alter table public.subcategories enable row level security;
alter table public.knowledge_sources enable row level security;
alter table public.knowledge_entities enable row level security;
alter table public.knowledge_facts enable row level security;
alter table public.question_concepts enable row level security;
alter table public.question_variants enable row level security;
alter table public.question_options enable row level security;
alter table public.player_question_history enable row level security;
alter table public.player_category_skill enable row level security;
alter table public.question_reports enable row level security;
alter table public.admin_audit_logs enable row level security;

-- Public can read active categories
create policy "Public can view active categories" on public.categories
    for select using (active = true);

create policy "Public can view active subcategories" on public.subcategories
    for select using (active = true);

-- CRITICAL RLS SECURITY:
-- Public can ONLY view sanitized question variants if active & approved.
create policy "Public can view approved question variants" on public.question_variants
    for select using (active = true and review_status = 'approved');

-- CRITICAL RLS SECURITY:
-- question_options: DO NOT ALLOW PUBLIC CLIENT TO DIRECTLY READ is_correct!
-- Only trusted backend functions / admins can read full options with is_correct.
create policy "Admins can view question options" on public.question_options
    for select using (exists (
        select 1 from public.user_roles where user_id = auth.uid() and role in ('admin', 'moderator')
    ));

create policy "Users can view own question history" on public.player_question_history
    for select using (auth.uid() = user_id);

create policy "Users can view own category skills" on public.player_category_skill
    for select using (auth.uid() = user_id);

create policy "Users can create question reports" on public.question_reports
    for insert with check (auth.uid() = user_id or user_id is null);

create policy "Admins can view and manage reports" on public.question_reports
    for all using (exists (
        select 1 from public.user_roles where user_id = auth.uid() and role in ('admin', 'moderator')
    ));

create policy "Admins can view audit logs" on public.admin_audit_logs
    for select using (exists (
        select 1 from public.user_roles where user_id = auth.uid() and role = 'admin'
    ));
