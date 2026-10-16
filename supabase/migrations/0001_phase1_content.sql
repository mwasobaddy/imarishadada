-- Imarisha Dada — Phase 1 content schema
-- Home page reads: programmes, impact_stats, giving_tiers, stories
--
-- RLS doctrine (.opencode/rules/backend.md):
--   * RLS enabled on every table
--   * default-deny — every access path is an explicit policy
--   * public READ only on published content
--   * zero public WRITE on anything, ever

-- ---------------------------------------------------------------------------
-- programmes
-- ---------------------------------------------------------------------------
create table if not exists public.programmes (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title         text not null,
  summary       text not null default '',
  body          text not null default '',
  icon          text not null default 'heart',
  stat          text,
  image_path    text,
  sort_order    int  not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint programmes_slug_format check (slug ~ '^[a-z0-9-]+$')
);

comment on table public.programmes is 'The three Imarisha Dada programmes. slug is a stable key and is never renamed.';

create index if not exists programmes_active_order_idx
  on public.programmes (active, sort_order);

-- ---------------------------------------------------------------------------
-- impact_stats
-- ---------------------------------------------------------------------------
create table if not exists public.impact_stats (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  programme_id  uuid references public.programmes (id) on delete set null,
  value         numeric(12,2) not null,
  unit          text,
  label         text not null,
  period        text not null,
  display_value text,
  sort_order    int  not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- An undated impact figure is an unverifiable claim. period is mandatory.
  constraint impact_stats_period_required check (length(btrim(period)) > 0),
  constraint impact_stats_value_finite check (value >= 0)
);

comment on table public.impact_stats is
  'Every figure published on the site. period is NOT NULL by design — an undated number is a claim we cannot defend.';

create index if not exists impact_stats_active_order_idx
  on public.impact_stats (active, sort_order);

-- ---------------------------------------------------------------------------
-- giving_tiers
-- ---------------------------------------------------------------------------
create table if not exists public.giving_tiers (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  programme_id   uuid references public.programmes (id) on delete set null,
  tier_type      text not null default 'one_time'
                 check (tier_type in ('one_time', 'monthly', 'cohort')),
  cadence        text not null default 'one_time'
                 check (cadence in ('one_time', 'monthly')),
  amount         numeric(12,2) not null check (amount > 0),
  currency       text not null default 'KES' check (currency ~ '^[A-Z]{3}$'),
  outcome_label  text not null,
  programme_id_note text,
  sort_order     int  not null default 0,
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint giving_tiers_slug_format check (slug ~ '^[a-z0-9-]+$')
);

comment on table public.giving_tiers is
  'Donation amounts and their outcome labels. Editing an amount here must never require a redeploy.';

create index if not exists giving_tiers_active_order_idx
  on public.giving_tiers (active, sort_order);

-- ---------------------------------------------------------------------------
-- stories
-- ---------------------------------------------------------------------------
create table if not exists public.stories (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  programme_id      uuid references public.programmes (id) on delete set null,
  title             text not null,
  excerpt           text not null default '',
  body              text not null default '',
  quote             text,
  attribution       text,
  -- Safeguarding control. See doc/roadmap/story-detail.md §5.
  consent_tier      text not null default 'anonymised'
                    check (consent_tier in ('named_full', 'named_no_face', 'anonymised')),
  consent_expires_at timestamptz,
  image_path        text,
  reading_minutes   int check (reading_minutes > 0),
  featured          boolean not null default false,
  published         boolean not null default false,
  published_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint stories_slug_format check (slug ~ '^[a-z0-9-]+$')
);

comment on table public.stories is
  'Case studies. consent_tier gates image and name rendering. Expired consent must be treated as anonymised.';

create index if not exists stories_published_idx
  on public.stories (published, published_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security — enabled everywhere
-- ---------------------------------------------------------------------------
alter table public.programmes    enable row level security;
alter table public.impact_stats  enable row level security;
alter table public.giving_tiers  enable row level security;
alter table public.stories       enable row level security;

-- Public read: only what is safe to publish.
create policy "programmes_public_read"
  on public.programmes for select
  to anon, authenticated
  using (active = true);

create policy "impact_stats_public_read"
  on public.impact_stats for select
  to anon, authenticated
  using (active = true);

create policy "giving_tiers_public_read"
  on public.giving_tiers for select
  to anon, authenticated
  using (active = true);

-- Stories: published, not future-dated, consent not expired.
create policy "stories_public_read"
  on public.stories for select
  to anon, authenticated
  using (
    published = true
    and published_at <= now()
    and (consent_expires_at is null or consent_expires_at > now())
  );

-- Default-deny: no INSERT/UPDATE/DELETE policy exists on any of these tables,
-- so all writes are denied for anon and authenticated. Writes happen only
-- through Server Actions that re-verify a staff session server-side.

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists programmes_set_updated_at    on public.programmes;
create trigger programmes_set_updated_at    before update on public.programmes
  for each row execute function public.set_updated_at();

drop trigger if exists impact_stats_set_updated_at  on public.impact_stats;
create trigger impact_stats_set_updated_at  before update on public.impact_stats
  for each row execute function public.set_updated_at();

drop trigger if exists giving_tiers_set_updated_at  on public.giving_tiers;
create trigger giving_tiers_set_updated_at  before update on public.giving_tiers
  for each row execute function public.set_updated_at();

drop trigger if exists stories_set_updated_at       on public.stories;
create trigger stories_set_updated_at       before update on public.stories
  for each row execute function public.set_updated_at();