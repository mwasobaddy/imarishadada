-- Imarisha Dada — Phase 5 security & performance hardening
--
-- Applied after 0007. Addresses the Supabase advisor findings that matter:
--
--   * 8 SECURITY DEFINER functions were executable by `anon`. The worst of
--     them, `downgrade_expired_consents()`, would let an unauthenticated
--     caller rewrite consent tiers on live stories. That is a safeguarding
--     incident, not a lint.
--   * The permission helpers took a `user_id` argument, so a signed-in user
--     could pass someone else's id and read their permissions or reveal the
--     stealth developer account. They now read `auth.uid()` and take nothing.
--   * 3 functions had a mutable `search_path`.
--   * 18 foreign keys had no covering index.
--
-- RLS policies are recreated against the new helper signatures, then the old
-- parameterised helpers are dropped. Order matters: PostgreSQL tracks a
-- dependency from a policy expression to the function it calls, so the drop
-- fails until every policy has been repointed.

-- ===========================================================================
-- 1. auth.uid()-scoped permission helpers
-- ===========================================================================

create or replace function public.has_permission(p_resource text, p_action text)
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
    where ur.user_id = (select auth.uid())
      and p.resource = p_resource
      and p.action = p_action
  );
$$;

comment on function public.has_permission(text, text) is
  'True when the current user holds the permission through any role. Reads auth.uid(); takes no user id, so it cannot be used to probe another account.';

create or replace function public.is_developer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.staff
    where user_id = (select auth.uid())
      and is_developer = true
      and is_active = true
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.staff
    where user_id = (select auth.uid())
      and is_active = true
  );
$$;

create or replace function public.my_permissions()
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
  where ur.user_id = (select auth.uid());
$$;

comment on function public.my_permissions is
  'Every permission held by the current user. Drives the admin navigation and gates.';

create or replace function public.visible_staff()
returns setof public.staff
language sql
stable
security definer
set search_path = public
as $$
  select s.*
  from public.staff s
  where s.is_active = true
    and (public.is_developer() or s.is_developer = false);
$$;

comment on function public.visible_staff is
  'Staff list with stealth accounts hidden from everyone except a developer.';

-- ===========================================================================
-- 2. Recreate every policy that used the parameterised helpers
-- ===========================================================================

drop policy if exists staff_developer_read on public.staff;
create policy staff_developer_read on public.staff
  for select to authenticated
  using (public.is_developer());

drop policy if exists staff_admin_read on public.staff;
create policy staff_admin_read on public.staff
  for select to authenticated
  using (public.has_permission('users', 'read') and is_developer = false);

drop policy if exists permissions_read on public.permissions;
create policy permissions_read on public.permissions
  for select to authenticated
  using (public.has_permission('permissions', 'read'));

drop policy if exists roles_read on public.roles;
create policy roles_read on public.roles
  for select to authenticated
  using (public.has_permission('roles', 'read'));

drop policy if exists role_permissions_read on public.role_permissions;
create policy role_permissions_read on public.role_permissions
  for select to authenticated
  using (public.has_permission('roles', 'read'));

drop policy if exists user_roles_read on public.user_roles;
create policy user_roles_read on public.user_roles
  for select to authenticated
  using (public.has_permission('users', 'read'));

drop policy if exists audit_log_read on public.audit_log;
create policy audit_log_read on public.audit_log
  for select to authenticated
  using (public.has_permission('audit_log', 'read'));

drop policy if exists posts_staff_read on public.posts;
create policy posts_staff_read on public.posts
  for select to authenticated
  using (public.has_permission('posts', 'read'));

drop policy if exists events_staff_read on public.events;
create policy events_staff_read on public.events
  for select to authenticated
  using (public.has_permission('events', 'read'));

drop policy if exists faqs_staff_read on public.faqs;
create policy faqs_staff_read on public.faqs
  for select to authenticated
  using (public.has_permission('faqs', 'read'));

drop policy if exists partners_staff_read on public.partners;
create policy partners_staff_read on public.partners
  for select to authenticated
  using (public.has_permission('partners', 'read'));

drop policy if exists financial_breakdown_staff_read on public.financial_breakdown;
create policy financial_breakdown_staff_read on public.financial_breakdown
  for select to authenticated
  using (public.has_permission('financial_breakdown', 'read'));

drop policy if exists transparency_gaps_staff_read on public.transparency_gaps;
create policy transparency_gaps_staff_read on public.transparency_gaps
  for select to authenticated
  using (public.has_permission('transparency_gaps', 'read'));

drop policy if exists volunteer_roles_staff_read on public.volunteer_roles;
create policy volunteer_roles_staff_read on public.volunteer_roles
  for select to authenticated
  using (public.has_permission('volunteer_roles', 'read'));

drop policy if exists translations_staff_read on public.translations;
create policy translations_staff_read on public.translations
  for select to authenticated
  using (public.has_permission('translations', 'read'));

drop policy if exists media_staff_read on public.media;
create policy media_staff_read on public.media
  for select to authenticated
  using (public.has_permission('media', 'read'));

drop policy if exists content_versions_staff_read on public.content_versions;
create policy content_versions_staff_read on public.content_versions
  for select to authenticated
  using (public.has_permission('content_versions', 'read'));

drop policy if exists partner_enquiries_staff_read on public.partner_enquiries;
create policy partner_enquiries_staff_read on public.partner_enquiries
  for select to authenticated
  using (public.has_permission('partner_enquiries', 'read'));

drop policy if exists volunteer_applications_staff_read on public.volunteer_applications;
create policy volunteer_applications_staff_read on public.volunteer_applications
  for select to authenticated
  using (public.has_permission('volunteer_applications', 'read'));

drop policy if exists newsletter_subscribers_staff_read on public.newsletter_subscribers;
create policy newsletter_subscribers_staff_read on public.newsletter_subscribers
  for select to authenticated
  using (public.has_permission('newsletter_subscribers', 'read'));

drop policy if exists enquiries_staff_read on public.enquiries;
create policy enquiries_staff_read on public.enquiries
  for select to authenticated
  using (public.has_permission('enquiries', 'read'));

drop policy if exists settings_versions_staff_read on public.settings_versions;
create policy settings_versions_staff_read on public.settings_versions
  for select to authenticated
  using (public.has_permission('settings', 'read'));

-- ===========================================================================
-- 3. Drop the superseded parameterised helpers
-- ===========================================================================

drop function if exists public.has_permission(uuid, text, text);
drop function if exists public.is_developer(uuid);
drop function if exists public.is_staff(uuid);
drop function if exists public.get_user_permissions(uuid);
drop function if exists public.get_visible_staff(uuid);

-- ===========================================================================
-- 4. EXECUTE privileges
-- ===========================================================================
-- `anon` gets nothing. `authenticated` keeps EXECUTE only on the two helpers an
-- RLS policy calls — a policy expression is evaluated with the querying role's
-- privileges, so revoking there would break every admin read.

revoke execute on function public.has_permission(text, text) from public, anon;
revoke execute on function public.is_developer()            from public, anon;
revoke execute on function public.is_staff()                from public, anon;
revoke execute on function public.my_permissions()          from public, anon;
revoke execute on function public.visible_staff()           from public, anon;

grant execute on function public.has_permission(text, text) to authenticated, service_role;
grant execute on function public.is_developer()             to authenticated, service_role;
grant execute on function public.is_staff()                 to authenticated, service_role;
grant execute on function public.my_permissions()           to authenticated, service_role;
grant execute on function public.visible_staff()            to authenticated, service_role;

-- Trigger-only functions and the consent downgrade job are not part of any
-- RPC surface. Nobody but the service role may call them.
revoke execute on function public.downgrade_expired_consents()   from public, anon, authenticated;
revoke execute on function public.version_content_on_update()    from public, anon, authenticated;
revoke execute on function public.version_settings_on_update()   from public, anon, authenticated;
grant execute on function public.downgrade_expired_consents()    to service_role;

-- ===========================================================================
-- 5. Mutable search_path
-- ===========================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.donations_are_append_only()
returns trigger
language plpgsql
set search_path = public
as $$
begin
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

  if old.status = 'completed' and new.status <> 'completed' and new.status <> 'refunded' then
    raise exception 'donations: a completed donation cannot return to % (reference %)',
      new.status, old.reference
      using errcode = 'restrict_violation';
  end if;

  return new;
end;
$$;

create or replace function public.prune_rate_limits()
returns integer
language plpgsql
set search_path = public
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

-- ===========================================================================
-- 6. Covering indexes for every foreign key the advisor flagged
-- ===========================================================================

create index if not exists content_versions_created_by_idx     on public.content_versions (created_by);
create index if not exists donations_giving_tier_id_idx        on public.donations (giving_tier_id);
create index if not exists financial_breakdown_programme_id_idx on public.financial_breakdown (programme_id);
create index if not exists giving_tiers_programme_id_idx       on public.giving_tiers (programme_id);
create index if not exists impact_stats_programme_id_idx       on public.impact_stats (programme_id);
create index if not exists media_uploaded_by_idx               on public.media (uploaded_by);
create index if not exists partner_enquiries_assigned_to_idx   on public.partner_enquiries (assigned_to);
create index if not exists partner_schools_programme_id_idx    on public.partner_schools (programme_id);
create index if not exists posts_author_id_idx                 on public.posts (author_id);
create index if not exists role_permissions_permission_id_idx  on public.role_permissions (permission_id);
create index if not exists settings_versions_changed_by_idx    on public.settings_versions (changed_by);
create index if not exists staff_invited_by_idx                on public.staff (invited_by);
create index if not exists stories_programme_id_idx            on public.stories (programme_id);
create index if not exists translations_reviewed_by_idx        on public.translations (reviewed_by);
create index if not exists user_roles_assigned_by_idx          on public.user_roles (assigned_by);
create index if not exists user_roles_role_id_idx              on public.user_roles (role_id);
create index if not exists volunteer_applications_assigned_to_idx on public.volunteer_applications (assigned_to);
create index if not exists volunteer_applications_role_id_idx  on public.volunteer_applications (role_id);

notify pgrst, 'reload schema';
