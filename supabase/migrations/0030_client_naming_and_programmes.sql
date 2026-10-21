-- Imarisha Dada — the client's own wording, and the fourth programme
--
-- ## Why this migration exists
--
-- `doc/edits.md` is the organisation's own account of the work, and
-- `doc/Imarisha_Dada_Organization_Profile.docx` is its formal profile. Two
-- things in them contradicted what the site was saying:
--
--   1. The About page told a different founding story — nineteen girls and an
--      observation in Kibera. The client says the organisation was founded in
--      2024, started as a beauty parlour, and recruited 24 young mothers.
--   2. The homepage promised one thing ("go back to school") where the
--      client's opening line promises three: a safe space, a second chance,
--      and a seat at the table.
--
-- The formal profile is the source for the vision, the mission, the six core
-- values, the three programme names and the impact figures — the site already
-- matched it, so nothing here changes those. `edits.md` is a working draft
-- (it still contains "figure out how we can put it"), so it is the source for
-- the new narrative and for the naming of what is new.
--
-- ## What is in here
--
--   1. The homepage and About copy, in the client's words.
--   2. The fourth programme, Community Hub, and the "three programmes" copy
--      that had to change with it.
--   3. The Dada Space session content: the ten problems the girls name, why
--      we run the sessions, how we run them, and the organisation's quote.
--   4. The economic empowerment passage, in the client's words.
--   5. The Ladies Room, as an editable section on the Stories page.
--   6. Programme pages become editor-managed. Their narrative and session
--      content live in `site_sections` like every other page, so the admin
--      page editor holds them.
--   7. The organisation's channels, and the domain email, in settings.
--
-- ## What was deliberately not done
--
--   - The community HUB is published as the fourth programme because the
--     client asked for that, but their note "(figure out how we can put it)"
--     is still open. The description is theirs; the placement is now visible
--     to them on a page they can change.
--   - No figure was invented for Community Hub. It has no `stat`, no
--     `image_path` and no impact statistics, so the impact page does not
--     list it and its card renders without a number rather than a wrong one.
--   - The Spotify link is the default Spotify entry point, not the podcast's
--     own page. The client did not give the episode URL.

-- ===========================================================================
-- 1. The programme pages become editor-managed
-- ===========================================================================
--
-- A programme page had copy in a component and copy in a row, and neither was
-- editable in the page editor. The narrative and the session content now live
-- in `site_sections`, keyed to a page per programme, so `/admin/pages` holds
-- them and the visual editor applies.

insert into public.site_pages (page_key, label, route, description, sort_order)
values
  ('programme-school-reentry',
   'Programme: School Re-entry',
   '/programmes/school-reentry',
   'The problem, the barriers, and where the young mothers are now.',
   20),
  ('programme-economic-empowerment',
   'Programme: Economic Empowerment',
   '/programmes/economic-empowerment',
   'Why money is what makes choices possible, and what that money made possible.',
   21),
  ('programme-dada-space',
   'Programme: Dada Space',
   '/programmes/dada-space',
   'What the girls are facing, why we run the sessions, and how they run.',
   22),
  ('programme-community-hub',
   'Programme: Community Hub',
   '/programmes/community-hub',
   'Peer learning led by the young mothers who went to technical school.',
   23)
on conflict (page_key) do update
  set label = excluded.label,
      route = excluded.route,
      description = excluded.description,
      sort_order = excluded.sort_order,
      updated_at = now();

-- ===========================================================================
-- 2. The homepage and About copy, in the client's words
-- ===========================================================================

-- The client's opening line. It promises three things where the old headline
-- promised one.
update public.site_sections
   set heading = $$Every girl deserves a safe space, a second chance and a seat at the table.$$,
       updated_at = now()
 where section_key = 'home-hero';

update public.site_sections
   set heading = $$Four programmes, one aim: a girl in Kibera decides her own future$$,
       body = $$School re-entry, economic empowerment, Dada Space and the Community Hub — designed with girls and community leaders, not delivered to them.$$,
       updated_at = now()
 where section_key = 'home-programmes';

-- The founding story, as the client tells it.
update public.site_sections
   set heading = $$It started as a beauty parlour.$$,
       body = $$Imarisha Dada is a young women-led, community-based organisation founded in 2024. It started as a beauty parlour where girls and young women could have their hair and nails done. The parlour created a space where girls could share their stories, heal and cry together.

From those stories we wanted to hear more, so we began reaching out to young mothers who were vulnerable and at risk of dropping out of school, or who had already dropped out.

We later recruited 24 young mothers into the organisation. We introduced a safe space where they could share their stories without being judged, support one another, and find solutions to the challenges they face. Through those conversations we realised that many of them were struggling with unresolved trauma, which led us to introduce psychosocial support.

We later introduced economic empowerment, where each young mother was given start-up capital to begin a small business. Most of them used the support to start businesses and become more economically independent. We also supported those who wanted to return to school. Many of them have since completed their studies, and we continue to recruit and support other young mothers through the organisation.

Today, Imarisha Dada continues to create safe spaces, strengthen the voices of girls and young mothers, and support them to build better and more independent lives.$$,
       updated_at = now()
 where section_key = 'about-story';

update public.site_sections
   set heading = $$Four programmes, one aim: a girl in Kibera decides her own future.$$,
       updated_at = now()
 where section_key = 'about-work';

update public.site_sections
   set heading = $$Four programmes, one aim.$$,
       body = $$A girl in Kibera decides her own future. These are the four programmes that get her there, and the evidence we hold for each.$$,
       updated_at = now()
 where section_key = 'programmes-hero';

-- "not three programmes" described the count. It now describes the shape.
update public.site_sections
   set heading = $$One girl, over years, and not a series of programmes.$$,
       updated_at = now()
 where section_key = 'programmes-pathway';

-- The client's line, which reads as the organisation's position rather than a
-- claim about the work.
insert into public.site_sections (
  section_key, page_key, eyebrow, heading, sort_order
) values (
  'about-quote',
  'about',
  'What we believe',
  $$Don't just include girls and young women, involve them.$$,
  3
)
on conflict (section_key) do update
  set eyebrow = excluded.eyebrow,
      heading = excluded.heading,
      updated_at = now();

-- Give the quote its place in the order, without renumbering the rest.
update public.site_sections set sort_order = 4 where section_key = 'about-vision';
update public.site_sections set sort_order = 5 where section_key = 'about-mission';
update public.site_sections set sort_order = 6 where section_key = 'about-values';
update public.site_sections set sort_order = 7 where section_key = 'about-work';
update public.site_sections set sort_order = 8 where section_key = 'about-approach';
update public.site_sections set sort_order = 9 where section_key = 'about-team';

-- ===========================================================================
-- 3. The Ladies Room
-- ===========================================================================
--
-- The storytelling programme. It sits on the Stories page because that is the
-- page about what young women have said, and because the page already
-- explains the consent model this work has to live inside.

insert into public.site_sections (
  section_key, page_key, eyebrow, heading, body, sort_order
) values (
  'stories-ladies-room',
  'stories',
  'Storytelling',
  $$The Ladies Room$$,
  $$Our podcast is a safe space where young mothers share their stories without the fear of being judged. Through it we shift the narratives people hold about young mothers and girls, we advocate and challenge the policies that affect their lives, and we challenge the social norms that keep them small.$$,
  6
)
on conflict (section_key) do update
  set eyebrow = excluded.eyebrow,
      heading = excluded.heading,
      body = excluded.body,
      updated_at = now();

-- ===========================================================================
-- 4. The programme pages
-- ===========================================================================

-- --- School re-entry ------------------------------------------------------

insert into public.site_sections (
  section_key, page_key, eyebrow, heading, body, sort_order
) values (
  'reentry-lead',
  'programme-school-reentry',
  'The problem',
  $$She did not choose to leave.$$,
  $$Every barrier below is structural. None of them are about how much a young mother wants to learn.$$,
  1
)
on conflict (section_key) do update
  set eyebrow = excluded.eyebrow,
      heading = excluded.heading,
      body = excluded.body,
      updated_at = now();

insert into public.site_sections (
  section_key, page_key, eyebrow, heading, body, sort_order
) values (
  'reentry-story',
  'programme-school-reentry',
  'Where they are now',
  $$Many of them have finished their studies.$$,
  $$We also supported those who wanted to return to school. Many of them have since completed their studies, and we continue to recruit and support other young mothers through the organisation.$$,
  2
)
on conflict (section_key) do update
  set eyebrow = excluded.eyebrow,
      heading = excluded.heading,
      body = excluded.body,
      updated_at = now();

-- --- Economic empowerment ------------------------------------------------

insert into public.site_sections (
  section_key, page_key, eyebrow, heading, body, sort_order
) values (
  'econ-lead',
  'programme-economic-empowerment',
  'The point',
  $$When a young mother has her own money, she has choices.$$,
  $$Their business gave them control over their own money.$$,
  1
)
on conflict (section_key) do update
  set eyebrow = excluded.eyebrow,
      heading = excluded.heading,
      body = excluded.body,
      updated_at = now();

insert into public.site_sections (
  section_key, page_key, eyebrow, heading, body, sort_order
) values (
  'econ-story',
  'programme-economic-empowerment',
  'Her experience',
  $$What her own money made possible$$,
  $$Some young mothers we work with in Kibera stayed in abusive relationships for one simple reason: he was the one providing. When you have a baby to feed and no income of your own, leaving can feel impossible.

That's why we give young mothers start-up capital to begin their own businesses. It's about the money, but it's also about what the money makes possible. A young mother with her own income decides how it's spent.

We've seen what that looks like. Some of the girls can now buy diapers for their babies without asking anyone. Some are raising their children the way they always pictured, those "mommy and child goals" they once only dreamed of. And some have been able to walk away from abusive relationships, because they no longer needed the person hurting them to survive.

Money alone doesn't heal everything. But it gives a young mother something she may never have had before: the power to decide for herself.$$,
  2
)
on conflict (section_key) do update
  set eyebrow = excluded.eyebrow,
      heading = excluded.heading,
      body = excluded.body,
      updated_at = now();

-- --- Dada Space -----------------------------------------------------------

insert into public.site_sections (
  section_key, page_key, eyebrow, heading, body, sort_order
) values (
  'dada-lead',
  'programme-dada-space',
  'The pressure',
  $$It is never one thing.$$,
  $$A girl is carrying more than one problem at a time, and the sessions are built around what she is actually living with.$$,
  1
)
on conflict (section_key) do update
  set eyebrow = excluded.eyebrow,
      heading = excluded.heading,
      body = excluded.body,
      updated_at = now();

-- The ten problems, in the client's wording.
insert into public.site_sections (
  section_key, page_key, eyebrow, heading, steps, sort_order
) values (
  'dada-problems',
  'programme-dada-space',
  'What we hear',
  $$What the girls are facing$$,
  $$[
    {"title": "Lack of parental guidance", "description": "Many adolescent girls live with parents who are busy trying to provide for their families. As a result, they may not have enough time to talk to or guide their daughters. Without proper guidance, some girls make decisions that can lead to early pregnancy and early marriage."},
    {"title": "Poverty", "description": "Poverty is one of the major challenges affecting girls in the community. Some parents struggle to provide basic needs such as food, sanitary products, clothing, and school requirements. Because of this, some girls depend on older men for financial support, which can expose them to sexual exploitation, early pregnancy, and early marriage."},
    {"title": "Mental and emotional challenges", "description": "Some girls grow up in homes affected by violence, family conflict, or difficult relationships with step-parents. Living in such an environment can affect their emotional and mental well-being. Some girls feel lonely, stressed, or lack someone they can talk to."},
    {"title": "Drug abuse", "description": "Some girls are exposed to drugs through peer pressure and the environment around them. Once they start using drugs, it can affect their education, relationships, and future. Some may eventually drop out of school or engage in other risky behaviours."},
    {"title": "School dropout", "description": "Some girls leave school because of poverty, teenage pregnancy, family problems, or lack of support. After dropping out, some look for jobs such as domestic work to support themselves and their families."},
    {"title": "Gender-based violence", "description": "Some girls experience gender-based violence and sexual abuse. In some cases, the people responsible are people they know or trust. This can leave girls feeling unsafe, traumatised, and afraid to speak out."},
    {"title": "Teenage pregnancy and early marriage", "description": "Some girls enter relationships or early marriages because they believe it will help them escape poverty or provide them with financial support. Unfortunately, some of these relationships do not last, leaving young mothers to raise their children with little or no support from the fathers."},
    {"title": "Peer pressure", "description": "Girls sometimes feel pressured to fit in with their friends or groups. They may copy behaviours they see around them because they want to feel accepted. This can sometimes lead to early sexual relationships, pregnancy, drug abuse, or dropping out of school."},
    {"title": "Drug abuse and community exposure", "description": "Some girls are exposed to drug dealing and drug use within the community. This can make it easier for some girls to start using drugs. Some may even engage in risky activities to get money to support their drug use."},
    {"title": "Discrimination and stigmatisation", "description": "Some girls experience rejection, discrimination, or emotional abuse at home. When they do not feel loved or accepted at home, they may look for love and acceptance elsewhere. Unfortunately, this can sometimes expose them to people who take advantage of their vulnerability."}
  ]$$::jsonb,
  2
)
on conflict (section_key) do update
  set eyebrow = excluded.eyebrow,
      heading = excluded.heading,
      steps = excluded.steps,
      updated_at = now();

insert into public.site_sections (
  section_key, page_key, eyebrow, heading, steps, sort_order
) values (
  'dada-why',
  'programme-dada-space',
  'Why we meet',
  $$Why we conduct the sessions$$,
  $$[
    {"title": "To empower girls", "description": "We create a safe space where girls can speak freely, share their experiences, learn from one another, and gain confidence. We also help them understand that their challenges do not define their future."},
    {"title": "To create awareness", "description": "We give girls information and guidance on issues affecting them. This helps them understand the consequences of certain choices and make better and more informed decisions."},
    {"title": "To provide emotional support", "description": "We give girls a safe place to talk about what they are going through. Where necessary, we involve counsellors and psychologists to provide professional psychosocial support."},
    {"title": "To find solutions together", "description": "We do not only talk about problems. We work with the girls to identify practical solutions. We support those who want to return to school and, where possible, provide learning materials or connect them to available opportunities. We also explore economic empowerment opportunities for girls who need support to become more independent."}
  ]$$::jsonb,
  3
)
on conflict (section_key) do update
  set eyebrow = excluded.eyebrow,
      heading = excluded.heading,
      steps = excluded.steps,
      updated_at = now();

insert into public.site_sections (
  section_key, page_key, eyebrow, heading, steps, sort_order
) values (
  'dada-how',
  'programme-dada-space',
  'How we meet',
  $$How we conduct the sessions$$,
  $$[
    {"title": "Safe spaces", "description": "We create a welcoming and safe environment where girls feel free to speak, ask questions, and share their experiences without fear of being judged."},
    {"title": "Group discussions", "description": "We use group discussions where girls can listen to each other, share their experiences, and come up with solutions together."},
    {"title": "Presentations and activities", "description": "We use simple and interactive activities, including discussions, presentations, storytelling, and group activities. These help girls build confidence, communication skills, self-awareness, and leadership skills."},
    {"title": "Professional support", "description": "When a girl needs more specialised help, we connect her with professionals such as counsellors and psychologists to help them."}
  ]$$::jsonb,
  4
)
on conflict (section_key) do update
  set eyebrow = excluded.eyebrow,
      heading = excluded.heading,
      steps = excluded.steps,
      updated_at = now();

insert into public.site_sections (
  section_key, page_key, eyebrow, heading, sort_order
) values (
  'dada-quote',
  'programme-dada-space',
  'What we believe',
  $$At Imarisha Dada we believe girls have the power to identify the challenges they face and develop solutions to address them. What they need is proper guidance, and a supportive environment to recognise their strength and explore their possibilities.$$,
  5
)
on conflict (section_key) do update
  set eyebrow = excluded.eyebrow,
      heading = excluded.heading,
      updated_at = now();

-- --- Community Hub --------------------------------------------------------

insert into public.site_sections (
  section_key, page_key, eyebrow, heading, body, sort_order
) values (
  'hub-lead',
  'programme-community-hub',
  'The idea',
  $$A community hub where the skills go round.$$,
  $$Beauty and fashion skills, taught by the young mothers who went to technical school.$$,
  1
)
on conflict (section_key) do update
  set eyebrow = excluded.eyebrow,
      heading = excluded.heading,
      body = excluded.body,
      updated_at = now();

insert into public.site_sections (
  section_key, page_key, eyebrow, heading, body, sort_order
) values (
  'hub-what',
  'programme-community-hub',
  'Who teaches',
  $$The young moms who went to technical school$$,
  $$They are the ones teaching now. The skills came into the organisation with them, and they go back out to other young moms in the community.$$,
  2
)
on conflict (section_key) do update
  set eyebrow = excluded.eyebrow,
      heading = excluded.heading,
      body = excluded.body,
      updated_at = now();

-- ===========================================================================
-- 5. Community Hub, the fourth programme
-- ===========================================================================
--
-- No `stat`, no `stat_label`, no `image_path` and no `image_alt`. The card
-- renders without a number, and the impact page leaves it out because there
-- is nothing to report. A placeholder figure would be a claim.

insert into public.programmes (
  slug, title, summary, body, icon, stat, stat_label, image_path, image_alt,
  outcomes, sort_order, active
) values (
  'community-hub',
  'Community Hub',
  $$Peer learning for young mothers: beauty and fashion skills taught by the young mothers who went to technical school.$$,
  $$A community HUB that creates a learning opportunity for other young moms to learn beauty and fashion skills.

It works like a peer learning session. The young moms we took to technical school come to teach other young moms in the community, so the skills travel because the people who hold them are the ones teaching.$$,
  'users',
  null,
  null,
  null,
  null,
  $$[
    {"title": "Peer teaching", "description": "The young mothers who went to technical school come back and teach, so the skills stay in the community that produced them."},
    {"title": "Beauty and fashion skills", "description": "Practical training the young mothers asked for, and that other young mothers in the community can learn."},
    {"title": "A learning hub", "description": "A community space where learning happens between peers, rather than as a service delivered to them."},
    {"title": "Technical school", "description": "Young mothers are supported into technical school, and those who take it further come back to teach the hub."}
  ]$$::jsonb,
  4,
  true
)
on conflict (slug) do update
  set title = excluded.title,
      summary = excluded.summary,
      body = excluded.body,
      icon = excluded.icon,
      outcomes = excluded.outcomes,
      sort_order = excluded.sort_order,
      active = excluded.active,
      updated_at = now();

-- ===========================================================================
-- 6. The channels, and the domain email
-- ===========================================================================

insert into public.settings (key, value, description)
values (
  'social_links',
  $${
    "linkedin": "https://www.linkedin.com/company/imarisha-dada",
    "facebook": "https://www.facebook.com/profile.php?id=61574654775004",
    "spotify": "https://open.spotify.com/"
  }$$::jsonb,
  'Where to find us. An empty value hides that channel. The Spotify link is the default Spotify entry point until the podcast page is known.'
)
on conflict (key) do update
  set value = excluded.value,
      description = excluded.description,
      updated_at = now();

-- The domain is being set up. Until it resolves, a `mailto:` to it bounces,
-- and the contact page said so in its own words. The organisation is using
-- this address, so the site now uses it too.
update public.settings
   set value = jsonb_set(value, '{email}', to_jsonb('hello@imarishadada.org'::text)),
       updated_at = now()
 where key = 'contact_details';

-- ===========================================================================
-- 7. The programmes page description
-- ===========================================================================
--
-- The label in the admin page list says how many programmes there are, and it
-- was wrong the moment the fourth one was added.

update public.site_pages
   set description = $$The four programmes and how they connect.$$,
       updated_at = now()
 where page_key = 'programmes';
