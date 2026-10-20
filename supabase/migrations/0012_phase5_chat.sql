-- Imarisha Dada — Phase 5: Realtime in-app chat for auth users
create table if not exists public.chat_messages (
  id          uuid primary key default gen_random_uuid(),
  sender_id   uuid not null references auth.users (id) on delete cascade,
  sender_name text not null,
  channel     text not null default 'general',
  body        text not null check (length(btrim(body)) > 0 and length(body) <= 2000),
  created_at  timestamptz not null default now()
);

comment on table public.chat_messages is
  'Realtime in-app chat for authenticated admin users. Delivered via Supabase Realtime.';

create index if not exists chat_messages_channel_created_idx
  on public.chat_messages (channel, created_at desc);

alter table public.chat_messages enable row level security;

-- Authenticated staff can read messages in channels they have access to.
-- For simplicity, all staff can read all channels for now.
create policy "chat_messages_staff_read"
  on public.chat_messages for select
  to authenticated
  using (public.is_staff());

-- Authenticated staff can insert their own messages.
create policy "chat_messages_staff_insert"
  on public.chat_messages for insert
  to authenticated
  with check (sender_id = (select auth.uid()) and public.is_staff());

-- No update or delete — messages are immutable (audit trail).
notify pgrst, 'reload schema';
