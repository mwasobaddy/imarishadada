-- Imarisha Dada — Phase 5: team member social profiles
--
-- `team_members.social_links` is jsonb and already exists, so nothing here is
-- strictly required for it to work. What it adds is a constraint and a
-- documented shape, because unconstrained jsonb is how a `twitter` field ends
-- up next to a `x` field next to a typo, and the renderer silently drops two of
-- them.
--
-- The allowed keys are a fixed set rather than free-form, for the same reason
-- `tone` in InteractiveHoverButton is a fixed set: a `text-${key}` class built
-- from an arbitrary key does not exist in the compiled CSS, so the icon
-- silently loses its colour.

-- ---------------------------------------------------------------------------
-- Constrain the keys
-- ---------------------------------------------------------------------------
-- A CHECK constraint cannot contain a subquery, so the validation lives in an
-- IMMUTABLE function. `jsonb_each` is immutable, so this is safe to use in a
-- constraint.
create or replace function public.social_links_valid(v jsonb)
returns boolean
language sql
immutable
as $$
  select v is null
      or (
        jsonb_typeof(v) = 'object'
        and not exists (
          select 1
          from jsonb_each(v) as kv(key, value)
          where kv.key not in (
                  'website', 'email', 'linkedin', 'x', 'instagram', 'facebook',
                  'github', 'bluesky', 'mastodon', 'threads', 'tiktok', 'youtube'
                )
             or jsonb_typeof(kv.value) <> 'string'
             or length(btrim(kv.value #>> '{}')) = 0
        )
      );
$$;

comment on function public.social_links_valid is
  'True when social_links is null, or an object whose keys are all in the allowed set and whose values are all non-empty strings.';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'team_members_social_links_shape'
  ) then
    alter table public.team_members
      add constraint team_members_social_links_shape
      check (public.social_links_valid(social_links));
  end if;
end $$;

comment on column public.team_members.social_links is
  'Social profiles: {"linkedin": "https://…", "x": "https://…"}. Allowed keys: website, email, linkedin, x, instagram, facebook, github, bluesky, mastodon, threads, tiktok, youtube. Empty strings are rejected rather than stored.';

-- ---------------------------------------------------------------------------
-- The team section is editor-managed, so it needs a seeded section row
-- ---------------------------------------------------------------------------
-- `about-team` already exists from Phase 1. This just gives it the eyebrow and
-- a clearer heading for the public page.

update public.site_sections
   set eyebrow = 'Our team',
       heading = 'The people behind the work.',
       page_key = 'about'
 where section_key = 'about-team'
   and (heading = 'The people behind the work' or heading is null);

notify pgrst, 'reload schema';
