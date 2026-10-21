-- Imarisha Dada — replace every reference to a photograph, in one step
--
-- ## What this adds
--
-- `public.replace_media_references(old_path, new_path)`.
--
-- A photograph in the media library can be pointed at by a section, a story,
-- a post, a programme, a partner, a school, a team member or an event. When
-- one of them has to change — the photograph is wrong, the subject has
-- withdrawn consent, the file is being replaced by a better one — every one
-- of those references has to move at once.
--
-- Doing that from the application would mean nine separate updates, and a
-- failure halfway through leaves the site in a state nobody chose: some
-- pages point at the old photograph and some at the new one. So the whole
-- swap is one statement, in one transaction, and it either happened or it
-- did not.
--
-- ## Why it returns the rows it touched
--
-- The audit trail needs to say what changed, not merely that something
-- changed. The function returns the table and the id of every row it moved,
-- so each one can be written to `audit_log` in its own right.
--
-- ## Who may call it
--
-- Only the service role. The function is `security definer` — it writes to
-- tables that have no write policy for anybody — so the execute grant is
-- taken from `public`, `anon` and `authenticated` and given to
-- `service_role` alone. The application calls it through the service client
-- after checking the caller's permission.

create or replace function public.replace_media_references(
  old_path text,
  new_path text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  changed jsonb := '[]'::jsonb;
  r record;
begin
  if old_path is null or new_path is null or old_path = '' or new_path = '' then
    raise exception 'Both the old path and the new path are required.';
  end if;

  if old_path = new_path then
    raise exception 'The new path is the same as the old one.';
  end if;

  -- site_sections.image_path
  for r in
    update public.site_sections
       set image_path = new_path
     where image_path is not null
       and position(old_path in image_path) > 0
     returning id
  loop
    changed := changed || jsonb_build_object('table', 'site_sections', 'id', r.id);
  end loop;

  -- site_sections.images — a JSON array of photographs, each with its own
  -- path. Only the path moves; the description stays with the slot, because
  -- the editor is choosing the picture and will read the description after.
  for r in
    update public.site_sections
       set images = (
         select coalesce(
           jsonb_agg(
             case
               when position(old_path in coalesce(img->>'path', '')) > 0
                 then jsonb_set(img, '{path}', to_jsonb(new_path))
               else img
             end
             order by ord
           ),
           '[]'::jsonb
         )
         from jsonb_array_elements(public.site_sections.images)
              with ordinality as t(img, ord)
       )
     where public.site_sections.images is not null
       and jsonb_typeof(public.site_sections.images) = 'array'
       and exists (
         select 1
           from jsonb_array_elements(public.site_sections.images) i
          where position(old_path in coalesce(i->>'path', '')) > 0
       )
     returning id
  loop
    changed := changed || jsonb_build_object('table', 'site_sections', 'id', r.id);
  end loop;

  -- stories.image_path
  for r in
    update public.stories
       set image_path = new_path
     where image_path is not null
       and position(old_path in image_path) > 0
     returning id
  loop
    changed := changed || jsonb_build_object('table', 'stories', 'id', r.id);
  end loop;

  -- posts.cover_path
  for r in
    update public.posts
       set cover_path = new_path
     where cover_path is not null
       and position(old_path in cover_path) > 0
     returning id
  loop
    changed := changed || jsonb_build_object('table', 'posts', 'id', r.id);
  end loop;

  -- programmes.image_path
  for r in
    update public.programmes
       set image_path = new_path
     where image_path is not null
       and position(old_path in image_path) > 0
     returning id
  loop
    changed := changed || jsonb_build_object('table', 'programmes', 'id', r.id);
  end loop;

  -- partners.logo_path
  for r in
    update public.partners
       set logo_path = new_path
     where logo_path is not null
       and position(old_path in logo_path) > 0
     returning id
  loop
    changed := changed || jsonb_build_object('table', 'partners', 'id', r.id);
  end loop;

  -- partner_schools.logo_path
  for r in
    update public.partner_schools
       set logo_path = new_path
     where logo_path is not null
       and position(old_path in logo_path) > 0
     returning id
  loop
    changed := changed || jsonb_build_object('table', 'partner_schools', 'id', r.id);
  end loop;

  -- team_members.photo_path
  for r in
    update public.team_members
       set photo_path = new_path
     where photo_path is not null
       and position(old_path in photo_path) > 0
     returning id
  loop
    changed := changed || jsonb_build_object('table', 'team_members', 'id', r.id);
  end loop;

  -- events.image_path
  for r in
    update public.events
       set image_path = new_path
     where image_path is not null
       and position(old_path in image_path) > 0
     returning id
  loop
    changed := changed || jsonb_build_object('table', 'events', 'id', r.id);
  end loop;

  return changed;
end;
$$;

comment on function public.replace_media_references(text, text) is
  'Moves every reference to one photograph onto another, in one transaction. Returns the rows it touched so the audit trail can name them.';

revoke all on function public.replace_media_references(text, text) from public, anon, authenticated;
grant execute on function public.replace_media_references(text, text) to service_role;
