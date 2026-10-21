-- Imarisha Dada — which bucket a media file is in
--
-- ## What was wrong
--
-- `media.file_path` stored the path *inside* a storage bucket, and the bucket
-- itself was never recorded. The upload form had a bucket selector; the row
-- did not keep it.
--
-- That left two things broken:
--
--   1. **No URL could be built.** The picker handed the raw path to the image
--      component, which cannot load it. An uploaded photograph rendered as a
--      broken image in every picture field on the site — the hero, the carousel,
--      a post cover, a partner logo. The 48 shipped photographs in
--      `public/images` worked, and nothing else did.
--   2. **Deletion guessed.** The delete action removed the file from all three
--      buckets, because it did not know which one it was in.
--
-- ## What this adds
--
-- `bucket`, with a check constraint. The existing rows are backfilled to
-- `public-media`: the library's default bucket, and the only one that is
-- publicly readable. A file in a private bucket cannot be used in a published
-- image at all, so anything that was usable was in the public one.

alter table public.media
  add column if not exists bucket text not null default 'public-media';

alter table public.media
  drop constraint if exists media_bucket_check;
alter table public.media
  add constraint media_bucket_check
  check (bucket in ('public-media', 'story-media', 'documents'));

comment on column public.media.bucket is
  'Which storage bucket the file is in. Only public-media is publicly readable, so only it can be used in a published image.';
