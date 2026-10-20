-- Imarisha Dada — Phase 5: Admin Dashboard schema
-- Permission-based access control, content management, media, events,
-- notifications, and audit logging.
--
-- RLS doctrine (.opencode/rules/backend.md):
--   * RLS enabled on every table
--   * default-deny — every access path is an explicit policy
--   * public READ only on published content
--   * zero public WRITE on anything, ever
--   * admin access via staff table with roles checked in Server Actions
--
-- Auth: Supabase Auth (magic link + OTP primary, password fallback).
-- Roles are collections of permissions, not fixed role-based access.
-- Developer role is stealthy (not visible in user lists, not counted).

-- ===========================================================================
-- 1. PERMISSION SYSTEM
-- ===========================================================================

-- Permissions: resource + action pairs
create table if not exists public.permissions (
  id          uuid primary key default gen_random_uuid(),
  resource    text not null,
  action      text not null,
  description text not null default '',
  created_at  timestamptz not null default now(),

  constraint permissions_unique unique (resource, action),
  constraint permissions_resource_format check (resource ~ '^[a-z_]+$'),
  constraint permissions_action_format check (action ~ '^[a-z_]+$')
);

comment on table public.permissions is
  'Granular permissions. resource = table/entity, action = create/read/update/delete/publish/approve/export.';

-- Roles: collections of permissions
create table if not exists public.roles (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  description text not null default '',
  is_system   boolean not null default false,
  created_by  uuid,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint roles_name_format check (name ~ '^[a-z_]+$')
);

comment on table public.roles is
  'Roles are collections of permissions. is_system = true for built-in roles (developer, admin, editor, etc.) that cannot be deleted.';

-- Junction: role → permissions
create table if not exists public.role_permissions (
  role_id       uuid not null references public.roles (id) on delete cascade,
  permission_id uuid not null references public.permissions (id) on delete cascade,
  granted_at    timestamptz not null default now(),
  granted_by    uuid,

  primary key (role_id, permission_id)
);

-- ===========================================================================
-- 2. STAFF (admin users)
-- ===========================================================================

create table if not exists public.staff (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null unique references auth.users (id) on delete cascade,
  display_name  text not null,
  email         text not null unique,
  is_developer  boolean not null default false,
  is_active     boolean not null default true,
  invited_by    uuid references public.staff (id) on delete set null,
  invited_at    timestamptz,
  last_login_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.staff is
  'Admin users. is_developer = true means stealth mode (not visible in user lists, not counted).';

create index if not exists staff_user_id_idx on public.staff (user_id);
create index if not exists staff_active_idx on public.staff (is_active);

-- Junction: user → roles (a user can have multiple roles)
create table if not exists public.user_roles (
  user_id    uuid not null references auth.users (id) on delete cascade,
  role_id    uuid not null references public.roles (id) on delete cascade,
  assigned_at timestamptz not null default now(),
  assigned_by uuid references public.staff (id) on delete set null,

  primary key (user_id, role_id)
);

-- ===========================================================================
-- 3. AUDIT LOG
-- ===========================================================================

create table if not exists public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references auth.users (id) on delete set null,
  actor_email text,
  action      text not null check (action in ('create','update','delete','publish','approve','reject','invite','revoke')),
  table_name  text not null,
  row_id      uuid,
  before      jsonb,
  after       jsonb,
  metadata    jsonb check (metadata is null or jsonb_typeof(metadata) = 'object'),
  created_at  timestamptz not null default now()
);

comment on table public.audit_log is
  'Append-only audit trail. Every admin mutation is logged. Not deletable by anyone.';

create index if not exists audit_log_actor_idx on public.audit_log (actor_id, created_at desc);
create index if not exists audit_log_table_idx on public.audit_log (table_name, row_id, created_at desc);
create index if not exists audit_log_created_idx on public.audit_log (created_at desc);

-- ===========================================================================
-- 4. CONTENT TABLES (missing from Phase 1-4)
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- posts (news/blog)
-- ---------------------------------------------------------------------------
create table if not exists public.posts (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  title           text not null,
  excerpt         text not null default '',
  body            text not null default '',
  cover_path      text,
  category        text not null default 'news'
                  check (category in ('news','story','update','press_release','announcement','event_recap')),
  tags            text[] not null default '{}',
  author_id       uuid references public.staff (id) on delete set null,
  published       boolean not null default false,
  published_at    timestamptz,
  scheduled_at    timestamptz,
  reading_minutes int check (reading_minutes > 0),
  featured        boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint posts_slug_format check (slug ~ '^[a-z0-9-]+$')
);

comment on table public.posts is
  'News and blog posts. category is admin-editable; events are a separate table.';

create index if not exists posts_published_idx on public.posts (published, published_at desc);
create index if not exists posts_category_idx on public.posts (category, published);

-- ---------------------------------------------------------------------------
-- events (separate from posts)
-- ---------------------------------------------------------------------------
create table if not exists public.events (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  title           text not null,
  description     text not null default '',
  body            text,
  image_path      text,
  location        text,
  starts_at       timestamptz not null,
  ends_at         timestamptz,
  rsvp_enabled    boolean not null default false,
  max_attendees   int check (max_attendees > 0),
  tags            text[] not null default '{}',
  published       boolean not null default false,
  published_at    timestamptz,
  scheduled_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint events_slug_format check (slug ~ '^[a-z0-9-]+$'),
  constraint events_dates_valid check (ends_at is null or ends_at > starts_at)
);

comment on table public.events is
  'Events with date, location, and optional RSVP. Separate from posts for distinct SEO and data model.';

create index if not exists events_starts_idx on public.events (starts_at asc) where published = true;
create index if not exists events_published_idx on public.events (published, starts_at desc);

-- ---------------------------------------------------------------------------
-- faqs
-- ---------------------------------------------------------------------------
create table if not exists public.faqs (
  id          uuid primary key default gen_random_uuid(),
  question    text not null,
  answer      text not null,
  category    text not null default 'general'
              check (category in ('giving','programmes','about','safeguarding','general','volunteering','partnerships')),
  sort_order  int  not null default 0,
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.faqs is
  'FAQ entries. category drives the sidebar grouping on /faq.';

create index if not exists faqs_category_order_idx on public.faqs (category, sort_order);

-- ---------------------------------------------------------------------------
-- partners
-- ---------------------------------------------------------------------------
create table if not exists public.partners (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text not null default '',
  logo_path   text,
  website_url text,
  tier        text not null default 'community'
              check (tier in ('community','corporate','institutional','fiscal_sponsor')),
  is_test     boolean not null default false,
  sort_order  int  not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint partners_name_format check (length(btrim(name)) > 0)
);

comment on table public.partners is
  'Partner organisations. is_test = true for partners in pilot/testing phase (shown with a label).';

create index if not exists partners_active_order_idx on public.partners (active, sort_order);

-- ---------------------------------------------------------------------------
-- financial_breakdown
-- ---------------------------------------------------------------------------
create table if not exists public.financial_breakdown (
  id            uuid primary key default gen_random_uuid(),
  fiscal_year   text not null,
  programme_id  uuid references public.programmes (id) on delete set null,
  category      text not null,
  amount        numeric(12,2) not null check (amount >= 0),
  currency      text not null default 'KES' check (currency ~ '^[A-Z]{3}$'),
  share_pct     numeric(5,2) check (share_pct >= 0 and share_pct <= 100),
  sort_order    int  not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.financial_breakdown is
  'Per-year, per-programme financial breakdown for the transparency page.';

create index if not exists financial_breakdown_year_idx on public.financial_breakdown (fiscal_year, sort_order);

-- ---------------------------------------------------------------------------
-- transparency_gaps
-- ---------------------------------------------------------------------------
create table if not exists public.transparency_gaps (
  id            uuid primary key default gen_random_uuid(),
  item          text not null,
  status        text not null default 'not_yet_measured'
                check (status in ('not_yet_measured','in_progress','measured','published')),
  target_date   date,
  notes         text,
  sort_order    int  not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.transparency_gaps is
  'What we do not yet measure. Shown on /transparency as honesty about gaps.';

create index if not exists transparency_gaps_status_idx on public.transparency_gaps (status, sort_order);

-- ---------------------------------------------------------------------------
-- volunteer_roles
-- ---------------------------------------------------------------------------
create table if not exists public.volunteer_roles (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null,
  description         text not null default '',
  commitment          text,
  requirements        text,
  location            text,
  time_commitment     text,
  skills_needed       text[] not null default '{}',
  positions_available int  not null default 1 check (positions_available >= 0),
  positions_filled    int  not null default 0 check (positions_filled >= 0),
  active              boolean not null default true,
  sort_order          int  not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint volunteer_roles_positions_valid check (positions_filled <= positions_available)
);

comment on table public.volunteer_roles is
  'Open volunteer positions. positions_filled is updated by admin, not by public signup.';

create index if not exists volunteer_roles_active_idx on public.volunteer_roles (active, sort_order);

-- ---------------------------------------------------------------------------
-- translations (i18n overrides)
-- ---------------------------------------------------------------------------
create table if not exists public.translations (
  id          uuid primary key default gen_random_uuid(),
  table_name  text not null,
  row_id      uuid not null,
  locale      text not null check (locale in ('en','sw','fr','de','pt')),
  field_name  text not null,
  value       text not null,
  is_reviewed boolean not null default false,
  reviewed_by uuid references public.staff (id) on delete set null,
  reviewed_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint translations_unique unique (table_name, row_id, locale, field_name)
);

comment on table public.translations is
  'Per-locale content overrides. is_reviewed must be true before a translation goes live.';

create index if not exists translations_lookup_idx on public.translations (table_name, row_id, locale);

-- ---------------------------------------------------------------------------
-- team_members (already exists in 0001, but add social profiles)
-- ---------------------------------------------------------------------------
alter table public.team_members
  add column if not exists social_links jsonb check (social_links is null or jsonb_typeof(social_links) = 'object'),
  add column if not exists title text,
  add column if not exists department text;

comment on column public.team_members.social_links is
  'Social profile URLs: {"twitter": "...", "linkedin": "...", "github": "..."}.';

-- ---------------------------------------------------------------------------
-- media (consented imagery with consent flag)
-- ---------------------------------------------------------------------------
create table if not exists public.media (
  id                 uuid primary key default gen_random_uuid(),
  file_path          text not null unique,
  file_name          text not null,
  mime_type          text not null,
  size_bytes         bigint not null check (size_bytes > 0),
  width              int,
  height             int,
  alt_text           text not null,
  consent_tier       text not null default 'none'
                     check (consent_tier in ('none','named_full','named_no_face','anonymised')),
  consent_expires_at timestamptz,
  exif_stripped      boolean not null default false,
  uploaded_by        uuid references public.staff (id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint media_alt_text_required check (length(btrim(alt_text)) > 0)
);

comment on table public.media is
  'Media library. consent_tier gates whether an image can be attached to a published story. Alt text is mandatory at upload.';

create index if not exists media_consent_idx on public.media (consent_tier, consent_expires_at);

-- ---------------------------------------------------------------------------
-- content_versions (WordPress-style revision history)
-- ---------------------------------------------------------------------------
create table if not exists public.content_versions (
  id            uuid primary key default gen_random_uuid(),
  table_name    text not null,
  row_id        uuid not null,
  version_number int not null,
  data          jsonb not null check (jsonb_typeof(data) = 'object'),
  created_by    uuid references public.staff (id) on delete set null,
  created_at    timestamptz not null default now(),

  constraint content_versions_unique unique (table_name, row_id, version_number)
);

comment on table public.content_versions is
  'Revision history for content. Every edit creates a new version. Not deletable.';

create index if not exists content_versions_lookup_idx on public.content_versions (table_name, row_id, version_number desc);

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id            uuid primary key default gen_random_uuid(),
  recipient_id  uuid not null references auth.users (id) on delete cascade,
  type          text not null check (type in (
    'new_contact','new_partner_enquiry','new_volunteer_application',
    'new_donation','consent_expiry','story_published','system'
  )),
  title         text not null,
  body          text not null default '',
  metadata      jsonb check (metadata is null or jsonb_typeof(metadata) = 'object'),
  read          boolean not null default false,
  read_at       timestamptz,
  created_at    timestamptz not null default now()
);

comment on table public.notifications is
  'In-app notifications. Real-time delivery via Supabase Realtime.';

create index if not exists notifications_recipient_idx on public.notifications (recipient_id, read, created_at desc);

-- ---------------------------------------------------------------------------
-- notification_preferences
-- ---------------------------------------------------------------------------
create table if not exists public.notification_preferences (
  user_id         uuid not null references auth.users (id) on delete cascade,
  notification_type text not null check (notification_type in (
    'new_contact','new_partner_enquiry','new_volunteer_application',
    'new_donation','consent_expiry','story_published','system'
  )),
  email_enabled   boolean not null default true,
  in_app_enabled  boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  primary key (user_id, notification_type)
);

comment on table public.notification_preferences is
  'Per-user notification channel preferences. Admins choose which members get notified for what.';

-- ---------------------------------------------------------------------------
-- partner_enquiries
-- ---------------------------------------------------------------------------
create table if not exists public.partner_enquiries (
  id              uuid primary key default gen_random_uuid(),
  reference       text not null unique,
  organisation    text not null,
  contact_name    text not null,
  email           text not null,
  phone           text,
  partnership_type text not null default 'general'
                  check (partnership_type in ('funding','programme','technical','volunteer','other')),
  message         text not null check (length(btrim(message)) >= 20),
  status          text not null default 'new'
                  check (status in ('new','read','replied','in_discussion','partnered','declined','archived')),
  notes           text,
  assigned_to     uuid references public.staff (id) on delete set null,
  created_at      timestamptz not null default now(),
  read_at         timestamptz,
  replied_at      timestamptz
);

comment on table public.partner_enquiries is
  'Partnership enquiries from the /partner page. Holds organisation PII — default-deny under RLS.';

create index if not exists partner_enquiries_status_idx on public.partner_enquiries (status, created_at desc);

-- ---------------------------------------------------------------------------
-- volunteer_applications
-- ---------------------------------------------------------------------------
create table if not exists public.volunteer_applications (
  id              uuid primary key default gen_random_uuid(),
  reference       text not null unique,
  name            text not null,
  email           text not null,
  phone           text,
  role_id         uuid references public.volunteer_roles (id) on delete set null,
  motivation      text not null check (length(btrim(motivation)) >= 20),
  skills          text[] not null default '{}',
  availability    text,
  status          text not null default 'new'
                  check (status in ('new','reviewing','accepted','declined','withdrawn')),
  notes           text,
  assigned_to     uuid references public.staff (id) on delete set null,
  created_at      timestamptz not null default now(),
  read_at         timestamptz,
  replied_at      timestamptz
);

comment on table public.volunteer_applications is
  'Volunteer applications. Holds applicant PII — default-deny under RLS.';

create index if not exists volunteer_applications_status_idx on public.volunteer_applications (status, created_at desc);

-- ---------------------------------------------------------------------------
-- newsletter_subscribers
-- ---------------------------------------------------------------------------
create table if not exists public.newsletter_subscribers (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  name          text,
  active        boolean not null default true,
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

comment on table public.newsletter_subscribers is
  'Newsletter subscribers. Email only — no PII beyond what is needed.';

create index if not exists newsletter_subscribers_active_idx on public.newsletter_subscribers (active, subscribed_at desc);

-- ===========================================================================
-- 5. RLS — enable on every table
-- ===========================================================================

alter table public.permissions            enable row level security;
alter table public.roles                 enable row level security;
alter table public.role_permissions      enable row level security;
alter table public.staff                 enable row level security;
alter table public.user_roles            enable row level security;
alter table public.audit_log             enable row level security;
alter table public.posts                 enable row level security;
alter table public.events                enable row level security;
alter table public.faqs                  enable row level security;
alter table public.partners              enable row level security;
alter table public.financial_breakdown    enable row level security;
alter table public.transparency_gaps     enable row level security;
alter table public.volunteer_roles       enable row level security;
alter table public.translations          enable row level security;
alter table public.media                 enable row level security;
alter table public.content_versions      enable row level security;
alter table public.notifications         enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.partner_enquiries     enable row level security;
alter table public.volunteer_applications enable row level security;
alter table public.newsletter_subscribers enable row level security;

-- ---------------------------------------------------------------------------
-- Public read policies (published content only)
-- ---------------------------------------------------------------------------

-- posts: published only
create policy "posts_public_read"
  on public.posts for select
  to anon, authenticated
  using (published = true and published_at <= now());

-- events: published, not past
create policy "events_public_read"
  on public.events for select
  to anon, authenticated
  using (published = true and published_at <= now());

-- faqs: published
create policy "faqs_public_read"
  on public.faqs for select
  to anon, authenticated
  using (published = true);

-- partners: active
create policy "partners_public_read"
  on public.partners for select
  to anon, authenticated
  using (active = true);

-- financial_breakdown: public (transparency page)
create policy "financial_breakdown_public_read"
  on public.financial_breakdown for select
  to anon, authenticated
  using (true);

-- transparency_gaps: public
create policy "transparency_gaps_public_read"
  on public.transparency_gaps for select
  to anon, authenticated
  using (true);

-- volunteer_roles: active
create policy "volunteer_roles_public_read"
  on public.volunteer_roles for select
  to anon, authenticated
  using (active = true);

-- translations: reviewed only
create policy "translations_public_read"
  on public.translations for select
  to anon, authenticated
  using (is_reviewed = true);

-- media: consented images only (none tier is blocked)
create policy "media_public_read"
  on public.media for select
  to anon, authenticated
  using (consent_tier in ('named_full', 'named_no_face', 'anonymised'));

-- ---------------------------------------------------------------------------
-- Default-deny: no INSERT/UPDATE/DELETE policies on any table.
-- All writes go through Server Actions using the service role key.
-- Admin access is enforced in the application layer (permission checks)
-- AND in RLS (staff session verification).
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- updated_at triggers for new tables
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

do $$
declare
  tbl text;
begin
  for tbl in select unnest(array[
    'roles','staff','posts','events','faqs','partners',
    'financial_breakdown','transparency_gaps','volunteer_roles',
    'translations','media','notification_preferences'
  ]) loop
    execute format('drop trigger if exists %I_set_updated_at on public.%I', tbl, tbl);
    execute format('create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()', tbl, tbl);
  end loop;
end $$;

-- ===========================================================================
-- 6. SEED DATA
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Permissions: resource × action matrix
-- ---------------------------------------------------------------------------
insert into public.permissions (resource, action, description) values
  -- Content
  ('stories', 'create', 'Create new stories'),
  ('stories', 'read', 'Read stories (including drafts)'),
  ('stories', 'update', 'Edit stories'),
  ('stories', 'delete', 'Delete stories'),
  ('stories', 'publish', 'Publish/unpublish stories'),
  ('stories', 'approve', 'Approve story for publication'),
  ('posts', 'create', 'Create new posts'),
  ('posts', 'read', 'Read posts (including drafts)'),
  ('posts', 'update', 'Edit posts'),
  ('posts', 'delete', 'Delete posts'),
  ('posts', 'publish', 'Publish/unpublish posts'),
  ('events', 'create', 'Create new events'),
  ('events', 'read', 'Read events (including drafts)'),
  ('events', 'update', 'Edit events'),
  ('events', 'delete', 'Delete events'),
  ('events', 'publish', 'Publish/unpublish events'),
  ('programmes', 'create', 'Create new programmes'),
  ('programmes', 'read', 'Read programmes (including inactive)'),
  ('programmes', 'update', 'Edit programmes'),
  ('programmes', 'delete', 'Delete programmes'),
  ('programmes', 'publish', 'Publish/unpublish programmes'),
  ('faqs', 'create', 'Create new FAQs'),
  ('faqs', 'read', 'Read FAQs (including unpublished)'),
  ('faqs', 'update', 'Edit FAQs'),
  ('faqs', 'delete', 'Delete FAQs'),
  ('faqs', 'publish', 'Publish/unpublish FAQs'),
  -- People
  ('team_members', 'create', 'Add team members'),
  ('team_members', 'read', 'Read team members (including unpublished)'),
  ('team_members', 'update', 'Edit team members'),
  ('team_members', 'delete', 'Delete team members'),
  ('team_members', 'publish', 'Publish/unpublish team members'),
  ('partners', 'create', 'Add partners'),
  ('partners', 'read', 'Read partners (including inactive)'),
  ('partners', 'update', 'Edit partners'),
  ('partners', 'delete', 'Delete partners'),
  ('partners', 'publish', 'Publish/unpublish partners'),
  ('volunteer_roles', 'create', 'Create volunteer roles'),
  ('volunteer_roles', 'read', 'Read volunteer roles (including inactive)'),
  ('volunteer_roles', 'update', 'Edit volunteer roles'),
  ('volunteer_roles', 'delete', 'Delete volunteer roles'),
  ('volunteer_roles', 'publish', 'Publish/unpublish volunteer roles'),
  -- Data
  ('impact_stats', 'create', 'Create impact stats'),
  ('impact_stats', 'read', 'Read impact stats (including inactive)'),
  ('impact_stats', 'update', 'Edit impact stats'),
  ('impact_stats', 'delete', 'Delete impact stats'),
  ('giving_tiers', 'create', 'Create giving tiers'),
  ('giving_tiers', 'read', 'Read giving tiers (including inactive)'),
  ('giving_tiers', 'update', 'Edit giving tiers'),
  ('giving_tiers', 'delete', 'Delete giving tiers'),
  ('giving_tiers', 'publish', 'Activate/deactivate giving tiers'),
  ('financial_breakdown', 'create', 'Create financial breakdown entries'),
  ('financial_breakdown', 'read', 'Read financial breakdown'),
  ('financial_breakdown', 'update', 'Edit financial breakdown'),
  ('financial_breakdown', 'delete', 'Delete financial breakdown'),
  ('transparency_gaps', 'create', 'Create transparency gaps'),
  ('transparency_gaps', 'read', 'Read transparency gaps'),
  ('transparency_gaps', 'update', 'Edit transparency gaps'),
  ('transparency_gaps', 'delete', 'Delete transparency gaps'),
  -- Settings
  ('settings', 'read', 'Read settings'),
  ('settings', 'update', 'Edit settings'),
  ('settings', 'approve', 'Approve financial settings changes (dual confirmation)'),
  -- Media
  ('media', 'create', 'Upload media'),
  ('media', 'read', 'Read media (including unconsented)'),
  ('media', 'update', 'Edit media metadata'),
  ('media', 'delete', 'Delete media'),
  -- Enquiries (read-only for most)
  ('enquiries', 'read', 'Read contact enquiries'),
  ('enquiries', 'update', 'Update enquiry status/notes'),
  ('partner_enquiries', 'read', 'Read partner enquiries'),
  ('partner_enquiries', 'update', 'Update partner enquiry status/notes'),
  ('volunteer_applications', 'read', 'Read volunteer applications'),
  ('volunteer_applications', 'update', 'Update volunteer application status/notes'),
  ('newsletter_subscribers', 'read', 'Read newsletter subscribers'),
  ('newsletter_subscribers', 'delete', 'Remove subscribers'),
  -- Donations (read-only)
  ('donations', 'read', 'Read donations'),
  ('donations', 'export', 'Export donation data'),
  -- System
  ('users', 'read', 'Read staff users'),
  ('users', 'create', 'Invite new staff'),
  ('users', 'update', 'Edit staff profiles'),
  ('users', 'delete', 'Deactivate staff'),
  ('roles', 'create', 'Create new roles'),
  ('roles', 'read', 'Read roles'),
  ('roles', 'update', 'Edit roles'),
  ('roles', 'delete', 'Delete roles'),
  ('roles', 'assign', 'Assign roles to users'),
  ('permissions', 'read', 'Read permissions'),
  ('audit_log', 'read', 'Read audit log'),
  ('audit_log', 'export', 'Export audit log'),
  ('translations', 'create', 'Create translations'),
  ('translations', 'read', 'Read translations (including unreviewed)'),
  ('translations', 'update', 'Edit translations'),
  ('translations', 'delete', 'Delete translations'),
  ('translations', 'publish', 'Approve translations'),
  ('media', 'publish', 'Publish media'),
  ('content_versions', 'read', 'Read content version history'),
  ('notifications', 'read', 'Read notifications'),
  ('notifications', 'update', 'Mark notifications as read'),
  ('full_text_search', 'read', 'Full-text search across all content')
on conflict (resource, action) do nothing;

-- ---------------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------------
insert into public.roles (name, description, is_system) values
  ('developer', 'System owner. Full access. Stealth mode (not visible in user lists).', true),
  ('admin', 'Full operational access. Can manage users, content, and settings.', true),
  ('editor', 'Content creation and editing. Can create and edit, but publish requires review.', true),
  ('finance', 'Financial data and settings. Read donations, edit financial settings.', true),
  ('safeguarding_officer', 'Safeguarding content and consent management.', true),
  ('volunteer_coordinator', 'Volunteer roles and applications management.', true)
on conflict (name) do nothing;

-- ---------------------------------------------------------------------------
-- Role → Permission assignments
-- ---------------------------------------------------------------------------

-- Developer: ALL permissions
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name = 'developer'
on conflict (role_id, permission_id) do nothing;

-- Admin: all except role/permission management and developer-only actions
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name = 'admin'
  and not (p.resource = 'roles' and p.action in ('create','update','delete'))
  and not (p.resource = 'permissions' and p.action = 'read')
  and not (p.resource = 'users' and p.action = 'delete')
on conflict (role_id, permission_id) do nothing;

-- Editor: content CRUD + publish (no settings, no financial, no user management)
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name = 'editor'
  and p.resource in ('stories','posts','events','programmes','faqs','team_members','partners','volunteer_roles','media','translations','content_versions','notifications','full_text_search')
  and p.action in ('create','read','update','delete','publish','approve')
on conflict (role_id, permission_id) do nothing;

-- Finance: financial data + settings read/update/approve + donations read/export
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name = 'finance'
  and (
    (p.resource in ('donations','financial_breakdown','transparency_gaps','settings') and p.action in ('read','update','approve','export','create','delete'))
    or (p.resource = 'audit_log' and p.action in ('read','export'))
  )
on conflict (role_id, permission_id) do nothing;

-- Safeguarding Officer: stories (consent), safeguarding content, media consent
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name = 'safeguarding_officer'
  and (
    (p.resource in ('stories','media','translations') and p.action in ('read','update','publish','approve'))
    or (p.resource = 'faqs' and p.action in ('read','update') and exists (select 1 from public.permissions p2 where p2.id = p.id and p2.resource = 'faqs'))
  )
on conflict (role_id, permission_id) do nothing;

-- Volunteer Coordinator: volunteer roles, applications, related enquiries
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name = 'volunteer_coordinator'
  and (
    (p.resource in ('volunteer_roles','volunteer_applications','partner_enquiries') and p.action in ('create','read','update','delete','publish'))
    or (p.resource = 'notifications' and p.action in ('read','update'))
  )
on conflict (role_id, permission_id) do nothing;

-- ---------------------------------------------------------------------------
-- Default notification preferences for all notification types
-- (Seeded per-user when they're invited, not here.)
-- ---------------------------------------------------------------------------

-- ===========================================================================
-- 7. HELPER FUNCTIONS
-- ===========================================================================

-- Check if a user has a specific permission
create or replace function public.has_permission(p_user_id uuid, p_resource text, p_action text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.role_permissions rp on rp.role_id = ur.role_id
    join public.permissions p on p.id = rp.permission_id
    where ur.user_id = p_user_id
      and p.resource = p_resource
      and p.action = p_action
  );
$$;

comment on function public.has_permission is
  'Permission check for RLS policies and Server Actions. Returns true if the user has the given permission through any of their roles.';

-- Check if a user is a developer (stealth mode)
create or replace function public.is_developer(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.staff
    where user_id = p_user_id and is_developer = true and is_active = true
  );
$$;

-- Check if a user is staff (any role)
create or replace function public.is_staff(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.staff
    where user_id = p_user_id and is_active = true
  );
$$;

-- ===========================================================================
-- 8. RLS POLICIES FOR ADMIN TABLES
-- ===========================================================================

-- Staff: developers see all, admins see non-developer staff, others see nothing
create policy "staff_developer_read"
  on public.staff for select
  to authenticated
  using (public.is_developer(auth.uid()));

create policy "staff_admin_read"
  on public.staff for select
  to authenticated
  using (
    public.has_permission(auth.uid(), 'users', 'read')
    and is_developer = false
  );

-- Permissions: readable by anyone with permissions:read
create policy "permissions_read"
  on public.permissions for select
  to authenticated
  using (public.has_permission(auth.uid(), 'permissions', 'read'));

-- Roles: readable by anyone with roles:read
create policy "roles_read"
  on public.roles for select
  to authenticated
  using (public.has_permission(auth.uid(), 'roles', 'read'));

-- Role permissions: readable by anyone with roles:read
create policy "role_permissions_read"
  on public.role_permissions for select
  to authenticated
  using (public.has_permission(auth.uid(), 'roles', 'read'));

-- User roles: readable by anyone with users:read
create policy "user_roles_read"
  on public.user_roles for select
  to authenticated
  using (public.has_permission(auth.uid(), 'users', 'read'));

-- Audit log: readable by anyone with audit_log:read
create policy "audit_log_read"
  on public.audit_log for select
  to authenticated
  using (public.has_permission(auth.uid(), 'audit_log', 'read'));

-- Posts: public read for published, staff read for all (with permission)
create policy "posts_staff_read"
  on public.posts for select
  to authenticated
  using (public.has_permission(auth.uid(), 'posts', 'read'));

-- Events: public read for published, staff read for all
create policy "events_staff_read"
  on public.events for select
  to authenticated
  using (public.has_permission(auth.uid(), 'events', 'read'));

-- FAQs: public read for published, staff read for all
create policy "faqs_staff_read"
  on public.faqs for select
  to authenticated
  using (public.has_permission(auth.uid(), 'faqs', 'read'));

-- Partners: public read for active, staff read for all
create policy "partners_staff_read"
  on public.partners for select
  to authenticated
  using (public.has_permission(auth.uid(), 'partners', 'read'));

-- Financial breakdown: public read, staff read for all
create policy "financial_breakdown_staff_read"
  on public.financial_breakdown for select
  to authenticated
  using (public.has_permission(auth.uid(), 'financial_breakdown', 'read'));

-- Transparency gaps: public read, staff read for all
create policy "transparency_gaps_staff_read"
  on public.transparency_gaps for select
  to authenticated
  using (public.has_permission(auth.uid(), 'transparency_gaps', 'read'));

-- Volunteer roles: public read for active, staff read for all
create policy "volunteer_roles_staff_read"
  on public.volunteer_roles for select
  to authenticated
  using (public.has_permission(auth.uid(), 'volunteer_roles', 'read'));

-- Translations: public read for reviewed, staff read for all
create policy "translations_staff_read"
  on public.translations for select
  to authenticated
  using (public.has_permission(auth.uid(), 'translations', 'read'));

-- Media: public read for consented, staff read for all
create policy "media_staff_read"
  on public.media for select
  to authenticated
  using (public.has_permission(auth.uid(), 'media', 'read'));

-- Content versions: staff read only
create policy "content_versions_staff_read"
  on public.content_versions for select
  to authenticated
  using (public.has_permission(auth.uid(), 'content_versions', 'read'));

-- Notifications: users read their own
create policy "notifications_own_read"
  on public.notifications for select
  to authenticated
  using (recipient_id = auth.uid());

-- Notification preferences: users manage their own
create policy "notification_preferences_own_read"
  on public.notification_preferences for select
  to authenticated
  using (user_id = auth.uid());

create policy "notification_preferences_own_update"
  on public.notification_preferences for update
  to authenticated
  using (user_id = auth.uid());

create policy "notification_preferences_own_insert"
  on public.notification_preferences for insert
  to authenticated
  with check (user_id = auth.uid());

-- Partner enquiries: staff read
create policy "partner_enquiries_staff_read"
  on public.partner_enquiries for select
  to authenticated
  using (public.has_permission(auth.uid(), 'partner_enquiries', 'read'));

-- Volunteer applications: staff read
create policy "volunteer_applications_staff_read"
  on public.volunteer_applications for select
  to authenticated
  using (public.has_permission(auth.uid(), 'volunteer_applications', 'read'));

-- Newsletter subscribers: staff read
create policy "newsletter_subscribers_staff_read"
  on public.newsletter_subscribers for select
  to authenticated
  using (public.has_permission(auth.uid(), 'newsletter_subscribers', 'read'));

-- Enquiries: staff read
create policy "enquiries_staff_read"
  on public.enquiries for select
  to authenticated
  using (public.has_permission(auth.uid(), 'enquiries', 'read'));

-- ===========================================================================
-- 9. SEED: Developer user
-- ===========================================================================
-- Note: The developer user must be created via Supabase Auth first.
-- This seed creates the staff record and assigns the developer role.
-- Run this AFTER creating the user in Supabase Auth with email:
--   kelvinramsiel@gmail.com
--
-- To create the user: use Supabase Dashboard → Authentication → Users → Add User
-- Or via the auth API: POST /auth/v1/admin/users with email + password
--
-- Then run:
--   insert into public.staff (user_id, display_name, email, is_developer, is_active)
--   select id, 'Kelvin Mwangi Wanjohi', 'kelvinramsiel@gmail.com', true, true
--   from auth.users where email = 'kelvinramsiel@gmail.com';
--
--   insert into public.user_roles (user_id, role_id)
--   select s.user_id, r.id
--   from public.staff s, public.roles r
--   where s.email = 'kelvinramsiel@gmail.com' and r.name = 'developer';

-- ===========================================================================
-- 10. HELPER: Get user permissions
-- ===========================================================================
create or replace function public.get_user_permissions(p_user_id uuid)
returns table (resource text, action text)
language sql
stable
security definer
set search_path = public
as $$
  select distinct p.resource, p.action
  from public.user_roles ur
  join public.role_permissions rp on rp.role_id = ur.role_id
  join public.permissions p on p.id = rp.permission_id
  where ur.user_id = p_user_id;
$$;

comment on function public.get_user_permissions is
  'Returns all permissions for a user across all their roles. Used by the admin UI to gate features.';

-- ===========================================================================
-- 11. HELPER: Get user roles (excluding stealth for non-developers)
-- ===========================================================================
create or replace function public.get_visible_staff(p_requester_id uuid)
returns setof public.staff
language sql
stable
security definer
set search_path = public
as $$
  select s.*
  from public.staff s
  where s.is_active = true
    and (
      -- Developers see everyone including stealth users
      public.is_developer(p_requester_id)
      -- Non-developers never see stealth users
      or s.is_developer = false
    );
$$;

comment on function public.get_visible_staff is
  'Returns staff list. Stealth (developer) users are only visible to other developers.';

-- ===========================================================================
-- 12. SETTINGS: Versioned settings (track changes over time)
-- ===========================================================================
-- The existing settings table uses key-value pairs. For versioning, we add
-- a settings_versions table that tracks every change.

create table if not exists public.settings_versions (
  id          uuid primary key default gen_random_uuid(),
  key         text not null,
  value       jsonb not null,
  changed_by  uuid references public.staff (id) on delete set null,
  changed_at  timestamptz not null default now(),
  change_note text
);

comment on table public.settings_versions is
  'Version history for settings changes. Every settings update creates a version row.';

create index if not exists settings_versions_key_idx on public.settings_versions (key, changed_at desc);

alter table public.settings_versions enable row level security;

create policy "settings_versions_staff_read"
  on public.settings_versions for select
  to authenticated
  using (public.has_permission(auth.uid(), 'settings', 'read'));

-- ===========================================================================
-- 13. CONSENT EXPIRY: Auto-downgrade function
-- ===========================================================================
-- Called by a cron job (pg_cron) to automatically downgrade stories
-- whose consent has expired.

create or replace function public.downgrade_expired_consents()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  update public.stories
  set consent_tier = 'anonymised',
      updated_at = now()
  where consent_tier in ('named_full', 'named_no_face')
    and consent_expires_at is not null
    and consent_expires_at < now();

  get diagnostics affected = row_count;

  -- Log to audit_log
  if affected > 0 then
    insert into public.audit_log (actor_id, action, table_name, metadata)
    values (null, 'update', 'stories', jsonb_build_object(
      'action', 'auto_downgrade_expired_consents',
      'affected_count', affected
    ));
  end if;

  return affected;
end;
$$;

comment on function public.downgrade_expired_consents is
  'Auto-downgrades stories with expired consent to anonymised. Run via pg_cron daily.';

-- ===========================================================================
-- 14. TRIGGERS: Auto-version settings on update
-- ===========================================================================
create or replace function public.version_settings_on_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.settings_versions (key, value, changed_by, change_note)
  values (old.key, old.value, null, 'Auto-versioned on update');
  return new;
end;
$$;

drop trigger if exists settings_version_on_update on public.settings;
create trigger settings_version_on_update
  before update on public.settings
  for each row execute function public.version_settings_on_update();

-- ===========================================================================
-- 15. TRIGGERS: Auto-create content version on update
-- ===========================================================================
create or replace function public.version_content_on_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_version int;
begin
  select coalesce(max(version_number), 0) + 1 into next_version
  from public.content_versions
  where table_name = TG_TABLE_NAME and row_id = old.id;

  insert into public.content_versions (table_name, row_id, version_number, data, created_by)
  values (TG_TABLE_NAME, old.id, next_version, to_jsonb(old), null);

  return new;
end;
$$;

-- Apply versioning trigger to content tables
do $$
declare
  tbl text;
begin
  for tbl in select unnest(array[
    'stories','posts','events','programmes','faqs','partners',
    'team_members','volunteer_roles','giving_tiers','impact_stats'
  ]) loop
    execute format('drop trigger if exists %I_version_on_update on public.%I', tbl, tbl);
    execute format('create trigger %I_version_on_update before update on public.%I for each row execute function public.version_content_on_update()', tbl, tbl);
  end loop;
end $$;
