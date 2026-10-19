-- Programme detail pages — outcomes and body copy
--
-- Adds `programmes.outcomes`, the six-step structure the programme pages render
-- (doc/roadmap/programme-school-reentry.md §4.3). Kept as jsonb so an editor
-- can reorder or reword steps from the admin panel without a deploy.
--
-- ## Statistics deliberately omitted
--
-- The page spec carries two figures marked "verify before publishing":
--
--   * "In Kenya, 1 in 3 girls who falls pregnant before 18 leaves school"
--   * "100% of participants still enrolled at follow-up"
--
-- Neither is seeded here. The first is unattributed, and the spec is explicit
-- that an unsourced number in an education section is a liability in a
-- due-diligence review — "if you cannot source it, cut it". The second is a
-- retention claim only programme staff can confirm, and "100%" is the kind of
-- figure that ends a grant conversation.
--
-- Add them to `impact_stats` — with a `period` — once they can be sourced and
-- signed off. The page renders whatever is in the table, so no code change is
-- needed when they arrive.

-- ---------------------------------------------------------------------------
-- outcomes
-- ---------------------------------------------------------------------------
alter table public.programmes
  add column if not exists outcomes jsonb;

comment on column public.programmes.outcomes is
  'Ordered programme steps: [{ "title": text, "description": text }]. Renders in array order.';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'programmes_outcomes_is_array'
  ) then
    alter table public.programmes
      add constraint programmes_outcomes_is_array
      check (outcomes is null or jsonb_typeof(outcomes) = 'array');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Body copy — the "why it matters" section, per programme
-- ---------------------------------------------------------------------------
update public.programmes set body = $body$
A girl does not stop learning when she becomes a mother. She gets pushed out.

The barriers are specific and they compound. Childcare falls on her. Stigma follows
her to school. Re-enrolment costs land on a household that has less of it. And the
assumption everyone makes — that a young mother has already chosen her path — is
the one that does the most damage, because it is the one nobody argues with.

When she leaves, the consequences are not hers alone. Less education means less
income, which means more vulnerability, which means the next generation starts
further behind. The girl who was pushed out is the reason another girl gets pushed
out.

We work on the barriers, not on her motivation. Motivation is rarely the problem.
$body$ where slug = 'school-reentry';

update public.programmes set body = $body$
Income is not a single decision. It is a stack of them: what can be sold, who can
be lent to, whether a phone is worth buying, whether the market opens before the
savings do.

Most financial literacy programmes teach budgeting to women who already have
something to budget. Ours starts earlier. Financial literacy, then business
mentorship from someone who has actually run something, then start-up capital
without a collateral requirement that would rule out the people most likely to
benefit from it.

The measure is not how many businesses were funded. It is how many are still
trading a year later.
$body$ where slug = 'economic-empowerment';

update public.programmes set body = $body$
Dada Space is a room, and the room is the point.

For girls aged 9 to 16 in Kibera, a safe space is somewhere they can be without
explaining themselves, without a parent deciding, without an audience. Somewhere
the questions get asked and nobody treats them as trouble.

It runs after school. It is free. It is staffed by women who are not afraid of a
teenager's silence. And it is open to any girl who walks in — no referral, no
means test, no waiting list.

Because the girls who never attend anything structured are the ones who most need
somewhere structured to attend.
$body$ where slug = 'dada-space';

-- ---------------------------------------------------------------------------
-- Outcomes — the six-step structure
-- ---------------------------------------------------------------------------
update public.programmes set outcomes = '[
  {"title":"Mentorship","description":"A matched mentor who has been through it herself, so the advice comes from experience rather than a manual."},
  {"title":"Fees and materials","description":"Removed as a barrier and paid directly to the school, so the money reaches the fees it was meant for."},
  {"title":"Psychosocial support","description":"Counselling for the mother, not only for the child. Re-entry fails when we treat it as a placement problem."},
  {"title":"School advocacy","description":"We negotiate with the school so she is not turned away at the gate on the day she decides to come back."},
  {"title":"Family engagement","description":"Home visits, so the household supports the decision instead of quietly undermining it."},
  {"title":"Follow-through","description":"Tracked through to completion, not just enrolment. Enrolment is where programmes usually stop counting."}
]'::jsonb where slug = 'school-reentry';

update public.programmes set outcomes = '[
  {"title":"Financial literacy","description":"Savings, credit and mobile money, taught by women running businesses in the same estate."},
  {"title":"Business mentorship","description":"A matched mentor with a trading business, for the practical questions a syllabus cannot answer."},
  {"title":"Start-up capital","description":"Granted without collateral, which is what excludes the people most likely to need it."},
  {"title":"Market linkage","description":"Introduction to buyers and cooperatives, because a product with no route to a customer is not income."},
  {"title":"Peer network","description":"A cohort that keeps trading together, so the first year is not solved alone."},
  {"title":"Business survival","description":"We measure how many are still trading at twelve months. Not how many were funded."}
]'::jsonb where slug = 'economic-empowerment';

update public.programmes set outcomes = '[
  {"title":"After-school hours","description":"A structured afternoon so there is somewhere to be between the end of school and dinner."},
  {"title":"Trained facilitators","description":"Women who are not afraid of a teenager''s silence, because that silence is the usual reason girls stop attending."},
  {"title":"Free and open to all","description":"No referral, no means test, no waiting list. Any girl who walks in is welcome."},
  {"title":"Safeguarding","description":"A named safeguarding officer, and staff trained to recognise disclosure."},
  {"title":"Mentorship pairs","description":"An older girl paired with a younger one, so someone in the room is speaking her language."},
  {"title":"Childcare support","description":"For the girls who are already mothers, so attendance does not mean abandoning a baby."}
]'::jsonb where slug = 'dada-space';

-- ---------------------------------------------------------------------------
-- Homepage cards use a short teaser; the detail page uses `body`.
-- The spec wants the card stat to lead with the number, not the label.
-- ---------------------------------------------------------------------------
update public.programmes set stat_label = stat where stat_label is null;
