-- Imarisha Dada — Phase 5: scheduled publishing for stories
-- Adds scheduled_at to stories (posts and events already had it).
alter table public.stories add column if not exists scheduled_at timestamptz;

comment on column public.stories.scheduled_at is
  'When to publish this story automatically. Null = publish immediately when published=true.';

create index if not exists stories_scheduled_idx
  on public.stories (scheduled_at asc)
  where scheduled_at is not null and published = false;

notify pgrst, 'reload schema';
