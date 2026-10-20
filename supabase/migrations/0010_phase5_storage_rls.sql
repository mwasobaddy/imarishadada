-- Imarisha Dada — Phase 5 storage RLS policies
--
-- Three buckets:
--   public-media  — programme images, hero photos, team photos (public read)
--   story-media   — consent-gated story photos (signed URLs only)
--   documents     — annual reports, financial docs (signed URLs, staff only)
--
-- RLS on storage.objects is enabled by default in Supabase. These policies
-- gate access per bucket.

-- ===========================================================================
-- 1. public-media: public read, staff write (with media permission)
-- ===========================================================================

-- Public read for all objects in public-media
create policy "public_media_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'public-media');

-- Staff can upload to public-media
create policy "public_media_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'public-media'
    and public.has_permission('media', 'create')
  );

-- Staff can update metadata in public-media
create policy "public_media_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'public-media'
    and public.has_permission('media', 'update')
  );

-- Staff can delete from public-media
create policy "public_media_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'public-media'
    and public.has_permission('media', 'delete')
  );

-- ===========================================================================
-- 2. story-media: no public read; staff-only via has_permission('media', 'read')
-- ===========================================================================

create policy "story_media_staff_read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'story-media'
    and public.has_permission('media', 'read')
  );

create policy "story_media_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'story-media'
    and public.has_permission('media', 'create')
  );

create policy "story_media_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'story-media'
    and public.has_permission('media', 'update')
  );

create policy "story_media_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'story-media'
    and public.has_permission('media', 'delete')
  );

-- ===========================================================================
-- 3. documents: no public read; staff-only via has_permission('media', 'read')
-- ===========================================================================

create policy "documents_staff_read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'documents'
    and public.has_permission('media', 'read')
  );

create policy "documents_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'documents'
    and public.has_permission('media', 'create')
  );

create policy "documents_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'documents'
    and public.has_permission('media', 'update')
  );

create policy "documents_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'documents'
    and public.has_permission('media', 'delete')
  );

notify pgrst, 'reload schema';
