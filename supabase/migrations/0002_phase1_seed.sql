-- Phase 1 seed data.
-- Figures are taken from the Imarisha Dada organisation profile (2025–26).
-- Giving-tier outcome labels are PLACEHOLDERS pending programme-staff sign-off
-- (doc/roadmap/home.md §4.8) — edit them before publishing.

insert into public.programmes (slug, title, summary, icon, stat, sort_order) values
  ('school-reentry',
   'School Re-entry',
   'Mentorship, school fees and advocacy that walk a young mother back into education.',
   'book',
   '19 returned to school', 1),
  ('economic-empowerment',
   'Economic Empowerment',
   'Financial literacy, business mentorship and start-up capital for young women.',
   'sprout',
   '23 funded', 2),
  ('dada-space',
   'Dada Space',
   'Safe spaces for girls aged 9–16 to learn, connect and grow.',
   'heart',
   'Running since 2024', 3)
on conflict (slug) do update
  set title = excluded.title,
      summary = excluded.summary,
      icon = excluded.icon,
      stat = excluded.stat,
      sort_order = excluded.sort_order;

-- `programme_id` is the FK. `programme_slug` only ever existed as an alias for
-- the VALUES row below: an earlier revision listed `programme_slug` in this
-- column list while the SELECT supplied `p.id`, so the insert referenced a
-- column that does not exist and the entire migration failed on first run.
insert into public.impact_stats (slug, programme_id, value, label, period, sort_order)
select v.slug, p.id, v.value, v.label, v.period, v.sort_order
from (values
  ('young-mothers-back-in-school',  'school-reentry',        19::numeric, 'young mothers returned to school', '2025–26', 1),
  ('young-women-funded',            'economic-empowerment',  23::numeric, 'young women given start-up capital', '2025–26', 2),
  ('dada-space-running-since',      'dada-space',             1::numeric, 'safe space, Dada Space, Kibera',     'since 2024', 3)
) as v(slug, programme_slug, value, label, period, sort_order)
join public.programmes p on p.slug = v.programme_slug
on conflict (slug) do update
  set programme_id = excluded.programme_id,
      value = excluded.value,
      label = excluded.label,
      period = excluded.period,
      sort_order = excluded.sort_order;

-- PLACEHOLDER COSTINGS — verify with programme staff before publishing.
insert into public.giving_tiers (slug, programme_id, tier_type, cadence, amount, outcome_label, sort_order)
select v.slug, p.id, v.tier_type, v.cadence, v.amount, v.outcome_label, v.sort_order
from (values
  ('materials-one-term',   'school-reentry',       'one_time', 'one_time', 500::numeric,   'school materials for one girl for one term', 1),
  ('psychosocial-month',   'school-reentry',       'monthly',  'monthly',  2500::numeric,  'psychosocial support for one young mother',  2),
  ('startup-capital-share','economic-empowerment', 'one_time', 'one_time', 10000::numeric, 'a share of start-up capital for one young woman', 3),
  ('re-entry-package',     'school-reentry',       'one_time', 'one_time', 50000::numeric, 'a full re-entry package for one girl',      4),
  ('dada-space-term',      'dada-space',           'one_time', 'one_time', 250000::numeric,'a full term of Dada Space',                 5)
) as v(slug, programme_slug, tier_type, cadence, amount, outcome_label, sort_order)
left join public.programmes p on p.slug = v.programme_slug
on conflict (slug) do update
  set programme_id = excluded.programme_id,
      amount = excluded.amount,
      outcome_label = excluded.outcome_label,
      sort_order = excluded.sort_order;

insert into public.site_sections (section_key, eyebrow, heading, body, cta_label, cta_href, sort_order) values
  ('home-programmes', 'Our work',
   'Three programmes, one aim: a girl in Kibera decides her own future',
   'School re-entry, economic empowerment, and safe spaces — designed with girls and community leaders, not delivered to them.',
   'All programmes', '/programmes', 1),
  ('home-giving', 'Ways to give',
   'What your gift actually does',
   'Every amount below is tied to a specific outcome. Give monthly and a mentor''s continuity matters as much as a single emergency.',
   null, null, 2)
on conflict (section_key) do update
  set eyebrow = excluded.eyebrow,
      heading = excluded.heading,
      body = excluded.body,
      cta_label = excluded.cta_label,
      cta_href = excluded.cta_href;

-- Editorial copy for the programme cards themselves.
update public.programmes set stat_label = stat where stat_label is null;

-- No imagery yet: every programme has no consented photograph. Cards fall back
-- to a brand-tinted field rather than a stock photo of unrelated children.
update public.programmes set image_path = null where image_path is null;

insert into public.core_values (slug, name, description, sort_order) values
  ('sisterhood',  'Sisterhood',  'Building supportive communities where girls uplift one another.', 1),
  ('integrity',   'Integrity',   'Acting with honesty, transparency, and accountability.', 2),
  ('inclusivity', 'Inclusivity', 'Ensuring every girl has an equal opportunity regardless of her background.', 3),
  ('dignity',     'Dignity',     'Respecting the worth and rights of every individual.', 4),
  ('authenticity','Authenticity','Remaining true to our values and the communities we serve.', 5),
  ('partnership', 'Partnership', 'Collaborating with communities, institutions, and partners to maximise impact.', 6)
on conflict (slug) do update
  set name = excluded.name, description = excluded.description, sort_order = excluded.sort_order;

insert into public.site_sections (section_key, eyebrow, heading, body, sort_order) values
  ('about-hero',     null, 'Imarisha Dada', 'Empower a Sister', 1),
  ('about-story',    'Our story',
   'We started with nineteen of them.',
   'Imarisha Dada began in Kibera with a simple observation: the girls who fell out of school here were not girls who had stopped learning. They were girls who had been pushed out — by pregnancy, by cost, by stigma, and by the assumption that a young mother had already chosen her path.',
   2),
  ('about-vision',   'Vision',
   'A safe, equal, and inclusive community where every girl thrives.', null, 3),
  ('about-mission',  'Mission',
   'To amplify the voices of girls and young women and empower them to lead positive change in their communities.', null, 4),
  ('about-values',   'What guides us',
   'Six commitments we are held to.', null, 5),
  ('about-work',     'What we do',
   'Three programmes, one aim: a girl in Kibera decides her own future.', null, 6),
  ('about-approach', 'How we work',
   'Community-owned, girl-led, evidence-informed.', null, 7)
on conflict (section_key) do update
  set eyebrow = excluded.eyebrow, heading = excluded.heading,
      body = excluded.body, sort_order = excluded.sort_order;

-- team_members deliberately left EMPTY. No team member may be published
-- without a recorded consent on file. See team_members.consent_recorded.

insert into public.site_sections (section_key, eyebrow, heading, body, sort_order) values
  ('about-team', 'Our team', 'The people behind the work', NULL, 8)
on conflict (section_key) do update
  set eyebrow = excluded.eyebrow, heading = excluded.heading, sort_order = excluded.sort_order;
