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

insert into public.impact_stats (slug, programme_slug, value, label, period, sort_order)
select v.slug, p.id, v.value, v.label, v.period, v.sort_order
from (values
  ('young-mothers-back-in-school',  'school-reentry',        19::numeric, 'young mothers returned to school', '2025–26', 1),
  ('young-women-funded',            'economic-empowerment',  23::numeric, 'young women given start-up capital', '2025–26', 2),
  ('dada-space-running-since',      'dada-space',             1::numeric, 'safe space, Dada Space, Kibera',     'since 2024', 3)
) as v(slug, programme_slug, value, label, period, sort_order)
join public.programmes p on p.slug = v.programme_slug
on conflict (slug) do update
  set value = excluded.value,
      label = excluded.label,
      period = excluded.period,
      sort_order = excluded.sort_order;

-- PLACEHOLDER COSTINGS — verify with programme staff before publishing.
insert into public.giving_tiers (slug, programme_slug, tier_type, cadence, amount, outcome_label, sort_order)
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
  set amount = excluded.amount,
      outcome_label = excluded.outcome_label,
      sort_order = excluded.sort_order;