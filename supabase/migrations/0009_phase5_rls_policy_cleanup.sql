-- Imarisha Dada — Phase 5 RLS policy cleanup
--
-- Two advisor findings, both from 0007's policy layout:
--
--   * `auth_rls_initplan` — a policy that calls `auth.uid()` directly is
--     re-evaluated for every row. Wrapping it in a scalar subquery makes
--     PostgreSQL evaluate it once per statement.
--   * `multiple_permissive_policies` — where a table had both a public read
--     policy and a staff read policy, both applied to `authenticated`, so
--     every admin read evaluated two policies and OR'd them. Splitting by
--     role (anon gets the public condition, authenticated gets the union)
--     leaves one policy per role per action.
--
-- No behaviour changes: the same rows are visible to the same callers.

-- ===========================================================================
-- 1. Initplan: evaluate auth.uid() once, not per row
-- ===========================================================================

drop policy if exists notifications_own_read on public.notifications;
create policy notifications_own_read on public.notifications
  for select to authenticated
  using (recipient_id = (select auth.uid()));

drop policy if exists notification_preferences_own_read on public.notification_preferences;
create policy notification_preferences_own_read on public.notification_preferences
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists notification_preferences_own_update on public.notification_preferences;
create policy notification_preferences_own_update on public.notification_preferences
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists notification_preferences_own_insert on public.notification_preferences;
create policy notification_preferences_own_insert on public.notification_preferences
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- ===========================================================================
-- 2. One read policy per role
-- ===========================================================================

-- posts ---------------------------------------------------------------------
drop policy if exists posts_public_read on public.posts;
drop policy if exists posts_staff_read on public.posts;
create policy posts_anon_read on public.posts
  for select to anon
  using (published = true and published_at <= now());
create policy posts_authenticated_read on public.posts
  for select to authenticated
  using (
    (published = true and published_at <= now())
    or public.has_permission('posts', 'read')
  );

-- events --------------------------------------------------------------------
drop policy if exists events_public_read on public.events;
drop policy if exists events_staff_read on public.events;
create policy events_anon_read on public.events
  for select to anon
  using (published = true and published_at <= now());
create policy events_authenticated_read on public.events
  for select to authenticated
  using (
    (published = true and published_at <= now())
    or public.has_permission('events', 'read')
  );

-- faqs ----------------------------------------------------------------------
drop policy if exists faqs_public_read on public.faqs;
drop policy if exists faqs_staff_read on public.faqs;
create policy faqs_anon_read on public.faqs
  for select to anon
  using (published = true);
create policy faqs_authenticated_read on public.faqs
  for select to authenticated
  using (published = true or public.has_permission('faqs', 'read'));

-- partners ------------------------------------------------------------------
drop policy if exists partners_public_read on public.partners;
drop policy if exists partners_staff_read on public.partners;
create policy partners_anon_read on public.partners
  for select to anon
  using (active = true);
create policy partners_authenticated_read on public.partners
  for select to authenticated
  using (active = true or public.has_permission('partners', 'read'));

-- volunteer_roles -----------------------------------------------------------
drop policy if exists volunteer_roles_public_read on public.volunteer_roles;
drop policy if exists volunteer_roles_staff_read on public.volunteer_roles;
create policy volunteer_roles_anon_read on public.volunteer_roles
  for select to anon
  using (active = true);
create policy volunteer_roles_authenticated_read on public.volunteer_roles
  for select to authenticated
  using (active = true or public.has_permission('volunteer_roles', 'read'));

-- translations --------------------------------------------------------------
drop policy if exists translations_public_read on public.translations;
drop policy if exists translations_staff_read on public.translations;
create policy translations_anon_read on public.translations
  for select to anon
  using (is_reviewed = true);
create policy translations_authenticated_read on public.translations
  for select to authenticated
  using (is_reviewed = true or public.has_permission('translations', 'read'));

-- media ---------------------------------------------------------------------
drop policy if exists media_public_read on public.media;
drop policy if exists media_staff_read on public.media;
create policy media_anon_read on public.media
  for select to anon
  using (consent_tier in ('named_full', 'named_no_face', 'anonymised'));
create policy media_authenticated_read on public.media
  for select to authenticated
  using (
    consent_tier in ('named_full', 'named_no_face', 'anonymised')
    or public.has_permission('media', 'read')
  );

-- financial_breakdown / transparency_gaps -----------------------------------
-- These are fully public — the transparency page exists to publish them. The
-- staff policy was redundant, so it is removed rather than unioned.
drop policy if exists financial_breakdown_public_read on public.financial_breakdown;
drop policy if exists financial_breakdown_staff_read on public.financial_breakdown;
create policy financial_breakdown_read on public.financial_breakdown
  for select to anon, authenticated
  using (true);

drop policy if exists transparency_gaps_public_read on public.transparency_gaps;
drop policy if exists transparency_gaps_staff_read on public.transparency_gaps;
create policy transparency_gaps_read on public.transparency_gaps
  for select to anon, authenticated
  using (true);

-- staff ---------------------------------------------------------------------
-- Developer sees everyone; anyone else with users:read sees non-stealth staff.
-- One policy, one evaluation.
drop policy if exists staff_developer_read on public.staff;
drop policy if exists staff_admin_read on public.staff;
create policy staff_read on public.staff
  for select to authenticated
  using (
    public.is_developer()
    or (is_developer = false and public.has_permission('users', 'read'))
  );

notify pgrst, 'reload schema';
