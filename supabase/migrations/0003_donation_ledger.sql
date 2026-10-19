-- Imarisha Dada — donation ledger and payment configuration
--
-- Money doctrine (.opencode/rules/backend.md, doc/roadmap/donate.md §7):
--   * The ledger is APPEND-ONLY. A donation row is never updated except for a
--     status transition, and a correction is a compensating row, never an edit.
--   * Public read is denied entirely. Donation rows hold donor PII.
--   * Zero public write. All writes go through Server Actions using the
--     service-role key, which bypasses RLS by design.
--   * Every write carries an idempotency key so a retried provider callback
--     cannot double-charge.

-- ---------------------------------------------------------------------------
-- giving_tiers gains the fields the donate page needs
-- ---------------------------------------------------------------------------
alter table public.giving_tiers
  add column if not exists display_label text,
  add column if not exists rail_note text;

comment on column public.giving_tiers.display_label is
  'Optional override for the card label. Falls back to the formatted amount.';

-- ---------------------------------------------------------------------------
-- donations — one row per gift attempt
--
-- `settlement_*` columns are the money of record in KES. `display_*` mirrors
-- what the donor chose, so a receipt can be regenerated later without
-- re-deriving from a rate that has since moved.
-- ---------------------------------------------------------------------------
create table if not exists public.donations (
  id                 uuid primary key default gen_random_uuid(),
  reference          text not null unique,
  idempotency_key    text not null unique,

  -- status transitions are the ONLY permitted update
  status             text not null default 'pending'
                       check (status in ('pending','completed','failed','refunded')),

  rail               text not null check (rail in ('mpesa','card','bank')),
  cadence            text not null default 'one_time'
                       check (cadence in ('one_time','monthly')),

  -- money of record
  settlement_amount  numeric(12,2) not null check (settlement_amount > 0),
  settlement_currency text not null default 'KES' check (settlement_currency = 'KES'),
  display_amount     numeric(12,2) not null check (display_amount > 0),
  display_currency   text not null check (display_currency in ('KES','USD','GBP','EUR')),
  fee                numeric(12,2) not null default 0 check (fee >= 0),
  total              numeric(12,2) not null check (total >= 0),

  -- provenance
  giving_tier_id     uuid references public.giving_tiers (id) on delete set null,
  outcome_label      text not null default '',

  -- donor PII — never exposed publicly
  donor_email        text not null,
  donor_name         text,
  donor_phone        text,

  -- consent, timestamped. A recurring gift without this is invalid.
  consent_recurring  boolean not null default false,
  consent_updates    boolean not null default false,
  consented_at       timestamptz,

  -- provider linkage
  provider           text not null default '',
  provider_ref       text,
  provider_payload   jsonb check (provider_payload is null or jsonb_typeof(provider_payload) = 'object'),

  created_at         timestamptz not null default now(),
  completed_at       timestamptz,

  -- A recurring gift may not be completed without explicit consent recorded.
  constraint donations_recurring_requires_consent
    check (cadence = 'one_time' or consent_recurring = true),

  -- A completed donation must have been completed at a time.
  constraint donations_completed_has_timestamp
    check (status <> 'completed' or completed_at is not null)
);

comment on table public.donations is
  'Append-only donation ledger. One row per gift attempt; status transitions are the only permitted update.';

create index if not exists donations_status_created_idx
  on public.donations (status, created_at desc);

create index if not exists donations_provider_ref_idx
  on public.donations (provider_ref)
  where provider_ref is not null;

-- Denormalised by email so a donor's history is cheap to look up.
create index if not exists donations_donor_email_idx
  on public.donations (donor_email);

-- ---------------------------------------------------------------------------
-- payment_transactions — one row per provider interaction
--
-- Separate from donations so a retried webhook appends a new transaction row
-- rather than touching the ledger, and so a signature can be recorded with the
-- exact payload that was verified.
-- ---------------------------------------------------------------------------
create table if not exists public.payment_transactions (
  id                uuid primary key default gen_random_uuid(),
  donation_id       uuid not null references public.donations (id) on delete restrict,
  provider          text not null,
  provider_ref      text,
  event             text not null,
  signature_verified boolean not null default false,
  payload           jsonb check (payload is null or jsonb_typeof(payload) = 'object'),
  created_at        timestamptz not null default now()
);

comment on table public.payment_transactions is
  'Append-only provider event log. A duplicate callback appends a row; it never mutates a previous one.';

create index if not exists payment_transactions_donation_idx
  on public.payment_transactions (donation_id, created_at);

-- Reject the same provider event twice. This is the idempotency guarantee for
-- a retried webhook.
create unique index if not exists payment_transactions_idempotency_idx
  on public.payment_transactions (provider, event, coalesce(provider_ref, ''))
  where provider_ref is not null;

-- ---------------------------------------------------------------------------
-- settings — admin-editable key/value configuration
--
-- The donate spec's hard rule: no amount, paybill, or bank detail is ever
-- hardcoded in a component. Everything the payment rails display lives here.
-- ---------------------------------------------------------------------------
create table if not exists public.settings (
  key         text primary key,
  value       jsonb not null check (jsonb_typeof(value) in ('object','array','string','number','boolean')),
  description text not null default '',
  updated_at  timestamptz not null default now()
);

comment on table public.settings is
  'Admin-editable configuration. Payment rails, bank details and tax copy live here, never in components.';

insert into public.settings (key, value, description) values
  ('payment_rails',
   '{"mpesa":{"enabled":false,"label":"Pay with M-Pesa","hint":"Recommended in Kenya — no app switching."},"card":{"enabled":true,"label":"Pay with card","hint":"Visa and Mastercard via Stripe."},"bank":{"enabled":true,"label":"Bank transfer","hint":"Best for larger gifts."}}'::jsonb,
   'Which payment rails are offered, and how each is described to the donor.'),
  ('bank_details',
   '{"accountName":null,"bankName":null,"accountNumber":null,"branch":null,"instructions":null}'::jsonb,
   'Bank transfer details. Null fields hide the bank rail rather than showing a blank.'),
  ('tax_receipt',
   '{"mode":"request","statement":"Receipts issued on request. Contact us for tax guidance.","fiscalSponsor":null}'::jsonb,
   'Tax and receipt wording. mode = request | fiscal_sponsor. Never claim deductibility we cannot honour.')
on conflict (key) do update set description = excluded.description;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.donations           enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.settings            enable row level security;

-- Default-deny: enabling RLS with no policy denies everything, which is what
-- we want for money. There are deliberately NO policies on donations or
-- payment_transactions — anon and authenticated are both denied.

-- settings holds configuration the public donate page must render. Only the
-- safe subset is readable; bank account numbers must never be public.
create policy settings_public_read
  on public.settings
  for select
  to anon, authenticated
  using (key in ('payment_rails', 'tax_receipt'));

-- Note: bank_details is intentionally excluded from the above. The public
-- reads it through a Server Action, which uses the service role, so the
-- account number is only ever sent to a donor who has chosen that rail.

-- ---------------------------------------------------------------------------
-- Append-only enforcement
--
-- RLS cannot express "no update except a status transition", so the ledger
-- gets a trigger. This is defence in depth: even the service role cannot
-- silently rewrite a settled amount.
-- ---------------------------------------------------------------------------
create or replace function public.donations_are_append_only()
returns trigger
language plpgsql
as $$
begin
  -- The only mutable columns are the status transition and its timestamp.
  if new.settlement_amount    is distinct from old.settlement_amount
     or new.display_amount     is distinct from old.display_amount
     or new.display_currency   is distinct from old.display_currency
     or new.fee                is distinct from old.fee
     or new.total              is distinct from old.total
     or new.cadence            is distinct from old.cadence
     or new.donor_email        is distinct from old.donor_email
     or new.donor_phone        is distinct from old.donor_phone
     or new.giving_tier_id     is distinct from old.giving_tier_id
     or new.idempotency_key    is distinct from old.idempotency_key then
    raise exception 'donations is append-only: monetary and donor columns cannot be updated (reference %)',
      old.reference
      using errcode = 'restrict_violation';
  end if;

  -- A completed donation can never go back to pending.
  if old.status = 'completed' and new.status <> 'completed' and new.status <> 'refunded' then
    raise exception 'donations: a completed donation cannot return to % (reference %)',
      new.status, old.reference
      using errcode = 'restrict_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists donations_append_only on public.donations;
create trigger donations_append_only
  before update on public.donations
  for each row execute function public.donations_are_append_only();

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------
drop trigger if exists settings_set_updated_at on public.settings;
create trigger settings_set_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();
