-- Imarisha Dada — Phase 5: Page & Section Editor
--
-- See doc/page-editor.md. This is stage 1 of the rollout: the data model and
-- the permissions. No UI yet, and nothing on the public site changes.
--
-- Why extend `site_sections` rather than start again: the table, the read path
-- (`getSection`) and ten seeded keys already exist from Phase 1. The hero was
-- simply never wired to it.

-- ===========================================================================
-- 1. site_sections gains the fields a page editor needs
-- ===========================================================================

alter table public.site_sections
  add column if not exists page_key            text,
  add column if not exists image_path          text,
  add column if not exists image_alt           text,
  add column if not exists cta_secondary_label text,
  add column if not exists cta_secondary_href  text,
  add column if not exists stat_line           text,
  add column if not exists seo_title           text,
  add column if not exists seo_description     text;

comment on column public.site_sections.page_key is
  'Which page this section belongs to. Groups sections in the editor.';
comment on column public.site_sections.stat_line is
  'Optional single line of figures shown with the section, e.g. the hero impact line.';

create index if not exists site_sections_page_idx
  on public.site_sections (page_key, sort_order);

-- Backfill page_key from the existing key prefix. `home-programmes` → `home`,
-- `about-story` → `about`, and so on.
update public.site_sections
   set page_key = split_part(section_key, '-', 1)
 where page_key is null;

-- ===========================================================================
-- 2. site_pages — the pages the editor can touch
-- ===========================================================================

create table if not exists public.site_pages (
  id            uuid primary key default gen_random_uuid(),
  page_key      text not null unique,
  label         text not null,
  route         text not null,
  description   text,
  sort_order    int  not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint site_pages_key_format check (page_key ~ '^[a-z0-9-]+$'),
  constraint site_pages_route_format check (route ~ '^/')
);

comment on table public.site_pages is
  'Pages whose copy is editor-managed. `active = false` hides a page from the editor without touching the route.';

create index if not exists site_pages_active_idx
  on public.site_pages (active, sort_order);

alter table public.site_pages enable row level security;

create policy "site_pages_staff_read"
  on public.site_pages for select
  to authenticated
  using (public.has_permission('pages', 'read'));

drop trigger if exists site_pages_set_updated_at on public.site_pages;
create trigger site_pages_set_updated_at
  before update on public.site_pages
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- 3. Permissions
-- ===========================================================================
-- `pages:seo` is separate from `pages:update` because metadata is the one field
-- where a careless edit costs rankings.

insert into public.permissions (resource, action, description) values
  ('pages', 'read',    'Read page and section copy'),
  ('pages', 'update',  'Edit page and section copy'),
  ('pages', 'publish', 'Show or hide a section'),
  ('pages', 'seo',     'Edit page metadata (title and description)')
on conflict (resource, action) do nothing;

-- The developer role is a cross join over every permission, but that insert
-- ran in 0007 when this permission did not exist. A role that is supposed to
-- hold *everything* has to be re-granted whenever a permission is added, or it
-- silently stops being the superset it claims to be.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name = 'developer'
  and p.resource = 'pages'
on conflict (role_id, permission_id) do nothing;

-- Grant to admin and editor.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name in ('admin', 'editor')
  and p.resource = 'pages'
on conflict (role_id, permission_id) do nothing;

-- Safeguarding officers may read page copy but not edit it.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name = 'safeguarding_officer'
  and p.resource = 'pages' and p.action = 'read'
on conflict (role_id, permission_id) do nothing;

-- ===========================================================================
-- 4. Seed the pages
-- ===========================================================================

insert into public.site_pages (page_key, label, route, description, sort_order) values
  ('home',         'Home',          '/',                 'The first page anyone sees. Its headline is the promise.', 1),
  ('about',        'About',         '/about',            'Who we are, our story, our values.', 2),
  ('programmes',   'Programmes',    '/programmes',       'The three programmes and how they connect.', 3),
  ('impact',       'Impact',        '/impact',           'The numbers, and how we got them.', 4),
  ('stories',      'Stories',       '/stories',          'Participant stories and the consent model.', 5),
  ('donate',       'Donate',        '/donate',           'The donation page.', 6),
  ('ways-to-give', 'Ways to give',  '/ways-to-give',     'Payment rails and how a gift is used.', 7),
  ('contact',      'Contact',       '/contact',          'How to reach us.', 8),
  ('transparency', 'Transparency',  '/transparency',     'Where the money goes, and what we do not yet measure.', 9),
  ('partner',      'Partner',       '/partner',          'For institutional partners and funders.', 10),
  ('volunteer',    'Volunteer',     '/volunteer',        'Open roles and how to apply.', 11),
  ('faq',          'FAQ',           '/faq',              'The questions people actually ask.', 12),
  ('news',         'News',          '/news',             'Announcements and updates.', 13)
on conflict (page_key) do nothing;

-- ===========================================================================
-- 5. Seed the hero — lifted verbatim from the hardcoded component
-- ===========================================================================
-- This is the section the rollout wires up first. The values below are the
-- current hardcoded ones, so stage 2 changes nothing visible.

insert into public.site_sections (
  section_key, page_key, eyebrow, heading, body,
  cta_label, cta_href, cta_secondary_label, cta_secondary_href, stat_line,
  sort_order
) values (
  'home-hero',
  'home',
  null,
  'Every girl in Kibera deserves to go back to school.',
  'Imarisha Dada is a girl-led organisation in Kibera, Nairobi. We support young mothers returning to education, girls finding safe spaces to grow, and young women building their own income.',
  'Donate',
  '/donate',
  'See our impact',
  '#impact',
  '19 young mothers back in school. 23 young women funded. All in 2025–26.',
  0
)
on conflict (section_key) do update
  set page_key             = excluded.page_key,
      heading              = excluded.heading,
      body                 = excluded.body,
      cta_label            = excluded.cta_label,
      cta_href             = excluded.cta_href,
      cta_secondary_label  = excluded.cta_secondary_label,
      cta_secondary_href   = excluded.cta_secondary_href,
      stat_line            = excluded.stat_line;

-- `home-programmes` and `home-giving` already exist from Phase 1 and were
-- already backfilled with page_key = 'home' above.

notify pgrst, 'reload schema';
