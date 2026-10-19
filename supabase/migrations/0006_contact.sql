-- Contact page — enquiries and contact configuration
--
-- Contact details live in `settings`, not in components. The contact spec marks
-- every one of them admin-editable, and the donate spec states the same hard
-- rule for payment details: a hardcoded phone number is the most common way a
-- charity site ships stale contact information. Changing the WhatsApp number
-- must not require a deploy.
--
-- `enquiries` holds message PII, so it is denied to anon entirely — the same
-- default-deny posture as `donations`.

-- ---------------------------------------------------------------------------
-- enquiries
-- ---------------------------------------------------------------------------
create table if not exists public.enquiries (
  id            uuid primary key default gen_random_uuid(),
  reference     text not null unique,

  -- sender
  name          text,
  email         text not null,
  phone         text,
  enquiry_type  text not null default 'general'
                  check (enquiry_type in ('general','partnership','volunteer','press','other')),
  message       text not null check (length(btrim(message)) >= 20),

  -- Which request digest this came from. Backs the rate limit; a hash, not a
  -- raw IP, so the row is not itself a store of visitor identifiers.
  request_hash  text not null,

  -- moderation
  status        text not null default 'new'
                  check (status in ('new','read','replied','archived','spam')),
  notes         text,

  created_at    timestamptz not null default now(),
  read_at       timestamptz,
  replied_at    timestamptz,

  -- Trimmed server-side. A 10k-character "message" is a paste accident, not a
  -- real enquiry.
  constraint enquiries_message_length check (length(message) <= 5000)
);

comment on table public.enquiries is
  'Contact form submissions. Holds sender PII — default-deny under RLS, written only via the Server Action.';

create index if not exists enquiries_status_created_idx
  on public.enquiries (status, created_at desc);

-- Backs the rate-limit lookup: "how many from this hash in the last hour".
create index if not exists enquiries_request_hash_idx
  on public.enquiries (request_hash, created_at desc);

alter table public.enquiries enable row level security;

-- Deliberately NO select policy. The anon key cannot read enquiries, so a
-- misconfigured client cannot dump the inbox. Writes go through the Server
-- Action using the service role.

-- ---------------------------------------------------------------------------
-- Rate limiting
--
-- The spec is blunt: "A public unthrottled form will be spam-flooded within
-- days." This is a fixed window in the database rather than an in-memory map,
-- because a serverless function's memory is not shared between instances and an
-- in-memory limiter is no limiter at all under load.
-- ---------------------------------------------------------------------------
create table if not exists public.rate_limits (
  id            uuid primary key default gen_random_uuid(),
  bucket        text not null,
  identifier    text not null,
  created_at    timestamptz not null default now()
);

create index if not exists rate_limits_lookup_idx
  on public.rate_limits (bucket, identifier, created_at desc);

alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon, authenticated;

-- Bounds the table. Rate-limit rows are pure bookkeeping and have no value
-- after their window closes.
create or replace function public.prune_rate_limits()
returns integer
language plpgsql
as $$
declare
  removed integer;
begin
  delete from public.rate_limits
   where created_at < now() - interval '24 hours';
  get diagnostics removed = row_count;
  return removed;
end;
$$;

-- ---------------------------------------------------------------------------
-- Contact configuration
--
-- Seeded with the WhatsApp number we actually hold. Email is left NULL on
-- purpose: `hello@imarishadada.org` only works once the domain resolves, and
-- publishing an address that bounces is worse than publishing none. The page
-- renders a labelled placeholder until it is filled in.
-- ---------------------------------------------------------------------------
insert into public.settings (key, value, description) values
  ('contact_details',
   '{
     "email": null,
     "phone": "+254 708 694 088",
     "whatsapp": "254708694088",
     "whatsappPrefill": "Hello Imarisha Dada, I would like to find out more about your work.",
     "address": "Kibera, Nairobi, Kenya",
     "responseTime": "We reply within three working days.",
     "officeHours": "Monday to Friday, 9am to 5pm EAT"
   }'::jsonb,
   'Contact channels. Null fields render a labelled placeholder rather than an empty or bouncing value.'),
  ('enquiry_types',
   '[
     {"value":"general","label":"General enquiry"},
     {"value":"partnership","label":"Partnership"},
     {"value":"volunteer","label":"Volunteering"},
     {"value":"press","label":"Press"},
     {"value":"other","label":"Something else"}
   ]'::jsonb,
   'Enquiry type options, in order. The id must match the enquiry_type check constraint.')
on conflict (key) do update set description = excluded.description;

-- contact_details is deliberately NOT in the public RLS read policy (see
-- migration 0003). It reaches the browser through a Server Action instead.
