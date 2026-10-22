-- Imarisha Dada — the photographs become WebP
--
-- ## Why
--
-- The deployed image optimiser cannot decode AVIF. Next's optimiser falls
-- back to serving the *original* file when it cannot process one, so every
-- AVIF photograph was served at full size — 52 KB, 80 KB, 127 KB — no matter
-- what width the page asked for. A phone asking for a 400-pixel card got the
-- same 127 KB file as a desktop asking for 1920.
--
-- Proven on the deployment: a JPEG source came back optimised at 23 KB, a
-- WebP source at 22 KB, and an AVIF source came back byte-for-byte as the
-- original.
--
-- WebP is optimised normally, and every browser that can decode AVIF can
-- decode WebP. So the photographs are WebP now, and the optimiser does its
-- job: the same card is served at about 20 KB.
--
-- ## What this changes
--
-- The files themselves (the AVIF originals are replaced by WebP copies of the
-- same dimensions), the paths in this database, and the paths in the code.
--
-- ## Why a data migration and not a code change
--
-- The paths are stored in the database — a section's gallery, a programme's
-- photograph — and in the generated image manifest. Rewriting them here keeps
-- the database and the repository in step, and leaves a record of what
-- happened and why.

update public.site_sections
   set images = replace(images::text, '.avif', '.webp')::jsonb
 where images is not null
   and images::text like '%avif%';

update public.programmes
   set image_path = replace(image_path, '.avif', '.webp')
 where image_path is not null
   and image_path like '%avif%';

update public.stories
   set image_path = replace(image_path, '.avif', '.webp')
 where image_path is not null
   and image_path like '%avif%';

update public.posts
   set cover_path = replace(cover_path, '.avif', '.webp')
 where cover_path is not null
   and cover_path like '%avif%';

update public.partners
   set logo_path = replace(logo_path, '.avif', '.webp')
 where logo_path is not null
   and logo_path like '%avif%';

update public.partner_schools
   set logo_path = replace(logo_path, '.avif', '.webp')
 where logo_path is not null
   and logo_path like '%avif%';

update public.team_members
   set photo_path = replace(photo_path, '.avif', '.webp')
 where photo_path is not null
   and photo_path like '%avif%';

update public.events
   set image_path = replace(image_path, '.avif', '.webp')
 where image_path is not null
   and image_path like '%avif%';

update public.site_sections
   set image_path = replace(image_path, '.avif', '.webp')
 where image_path is not null
   and image_path like '%avif%';
