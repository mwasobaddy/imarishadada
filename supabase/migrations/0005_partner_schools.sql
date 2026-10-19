-- Partner schools
--
-- A school name cannot be stored without `agreement_on`. Making the date NOT
-- NULL is the enforcement mechanism: a name cannot reach the page unless a
-- written agreement has been recorded. The page renders a labelled placeholder
-- until then, rather than omitting the section or inventing a list.
--
-- Until this table has rows, `PartnerSchools` renders its placeholder state and
-- `getPartnerSchools` returns []. No code change is needed when rows arrive.

create table if not exists public.partner_schools (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  area          text,
  note          text,
  programme_id  uuid references public.programmes (id) on delete set null,

  -- The written agreement date. NOT NULL by design: it is the gate.
  agreement_on  date not null,

  logo_path     text,
  sort_order    int  not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint partner_schools_slug_format check (length(btrim(name)) > 0)
);

comment on table public.partner_schools is
  'Schools Imarisha Dada works with. agreement_on is NOT NULL so a name cannot be published without recorded written permission.';

create index if not exists partner_schools_active_order_idx
  on public.partner_schools (active, sort_order);

alter table public.partner_schools enable row level security;

-- Public read is safe: a school that has agreed to be named is public
-- information. The gate is the NOT NULL agreement_on, not RLS.
create policy partner_schools_public_read
  on public.partner_schools
  for select
  to anon, authenticated
  using (active = true);

-- No public write. Ever.
revoke insert, update, delete on public.partner_schools from anon, authenticated;

drop trigger if exists partner_schools_set_updated_at on public.partner_schools;
create trigger partner_schools_set_updated_at
  before update on public.partner_schools
  for each row execute function public.set_updated_at();
