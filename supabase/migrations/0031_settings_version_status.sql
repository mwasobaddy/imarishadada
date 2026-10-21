-- Imarisha Dada — a status for staged setting changes
--
-- ## What was wrong
--
-- `settings_versions` had no status column, so nothing recorded that a staged
-- change had been decided:
--
--   * `getPendingSettingChanges` read *every* version, so the "Pending
--     approval" panel listed changes that had been applied weeks ago.
--   * Approving one of them applied the value again and wrote another audit
--     row. It could be pressed as many times as anyone liked.
--   * `changed_by` was always null. The code said "filled by RLS context", but
--     the write uses the service role, which bypasses RLS, so nothing filled
--     it — and with it empty, the dual confirmation could not be enforced: the
--     person who staged a change could approve it themselves.
--
-- ## Two kinds of row live in this table
--
-- 1. **History.** A trigger writes a row on every update to `settings`, with
--    the value *before* the change and the note "Auto-versioned on update".
--    That update has already happened, so the row is history, not a decision
--    waiting to be made.
-- 2. **Staged changes.** The admin action writes a row with the *new* value
--    and the editor's note, and does not touch `settings` until a second
--    person approves it.
--
-- The status column tells them apart, and the backfill below reads the audit
-- trail — which already records which version ids were approved — so the past
-- is read rather than guessed.

-- ===========================================================================
-- 1. The status
-- ===========================================================================

alter table public.settings_versions
  add column if not exists status text not null default 'pending',
  add column if not exists decided_at timestamptz,
  add column if not exists decided_by uuid references public.staff (id) on delete set null;

alter table public.settings_versions
  drop constraint if exists settings_versions_status_check;
alter table public.settings_versions
  add constraint settings_versions_status_check
  check (status in ('pending', 'approved', 'rejected', 'superseded'));

create index if not exists settings_versions_pending_idx
  on public.settings_versions (key, status, changed_at desc);

comment on column public.settings_versions.status is
  'Whether a staged change has been decided. A version can only be approved once.';

comment on column public.settings_versions.decided_by is
  'The staff member who decided it. Null while a change is still waiting.';

-- ===========================================================================
-- 2. The trigger writes history, not a decision
-- ===========================================================================
--
-- The auto-version row records the value before an update that has already
-- happened. It is marked approved, so it never appears in the pending list.

create or replace function public.version_settings_on_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.settings_versions (
    key, value, changed_by, change_note, status, decided_at
  )
  values (
    old.key, old.value, null, 'Auto-versioned on update', 'approved', now()
  );
  return new;
end;
$$;

-- ===========================================================================
-- 3. The backfill
-- ===========================================================================

-- The history rows: the update they record has already happened.
update public.settings_versions
   set status = 'approved',
       decided_at = changed_at
 where change_note = 'Auto-versioned on update'
   and status = 'pending';

-- The staged changes: the audit trail already records which ones were
-- approved, by version id.
update public.settings_versions sv
   set status = 'approved',
       decided_at = coalesce(
         (
           select al.created_at
             from public.audit_log al
            where al.action = 'approve'
              and al.table_name = 'settings'
              and al.after ->> 'approved_version' = sv.id::text
            order by al.created_at asc
            limit 1
         ),
         sv.changed_at
       )
 where sv.status = 'pending'
   and exists (
     select 1
       from public.audit_log al
      where al.action = 'approve'
        and al.table_name = 'settings'
        and al.after ->> 'approved_version' = sv.id::text
   );

-- ===========================================================================
-- 4. Approval, as one function
-- ===========================================================================
--
-- The row lock means two approvals cannot race. The status guard means a
-- version that has already been decided cannot be applied again. The
-- approver is passed in rather than read from `auth.uid()`, because the
-- action calls this with the service role, which carries no session.

create or replace function public.approve_setting_version(
  p_version_id uuid,
  p_decided_by uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v public.settings_versions%rowtype;
  v_value jsonb;
begin
  select * into v
    from public.settings_versions
   where id = p_version_id
     for update;

  if not found then
    raise exception 'That change no longer exists.';
  end if;

  if v.status <> 'pending' then
    raise exception 'That change has already been %.', v.status;
  end if;

  -- Only the newest waiting change for a key can be approved. Two proposals
  -- for the same setting are two different decisions, and approving the older
  -- one would apply a value the organisation has already moved past.
  if exists (
    select 1
      from public.settings_versions
     where key = v.key
       and status = 'pending'
       and changed_at > v.changed_at
  ) then
    raise exception 'A newer change for this setting is waiting.';
  end if;

  update public.settings
     set value = v.value,
         updated_at = now()
   where key = v.key
  returning value into v_value;

  update public.settings_versions
     set status = 'approved',
         decided_at = now(),
         decided_by = p_decided_by
   where id = p_version_id;

  -- A newer staged change for the same key is the one that waits; the older
  -- one is no longer what the approver is deciding.
  update public.settings_versions
     set status = 'superseded'
   where key = v.key
     and id <> p_version_id
     and status = 'pending';

  return jsonb_build_object(
    'key', v.key,
    'value', v_value,
    'version_id', p_version_id
  );
end;
$$;

revoke all on function public.approve_setting_version(uuid, uuid) from public, anon, authenticated;
grant execute on function public.approve_setting_version(uuid, uuid) to service_role;

comment on function public.approve_setting_version(uuid, uuid) is
  'Applies a staged setting change and records the decision in one transaction.';
