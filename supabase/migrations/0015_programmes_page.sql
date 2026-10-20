-- Imarisha Dada — Phase 5: Programmes page copy
--
-- Stage 6 of doc/page-editor.md, one page at a time. The Programmes index has
-- four sections, and one of them carries a repeating list — the six-step
-- pathway — which `site_sections` had no field for.

-- ===========================================================================
-- 1. Two fields the section model was missing
-- ===========================================================================

alter table public.site_sections
  -- A repeating list inside one section. Same shape as `programmes.outcomes`
  -- (`[{title, description}]`) so the two are read by the same kind of
  -- component and an editor meets the same editor twice, not two different ones.
  add column if not exists steps jsonb,
  -- A second paragraph, for the sections that run one on the left and one in a
  -- panel on the right.
  add column if not exists body_secondary text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'site_sections_steps_is_array'
  ) then
    alter table public.site_sections
      add constraint site_sections_steps_is_array
      check (steps is null or jsonb_typeof(steps) = 'array');
  end if;
end $$;

comment on column public.site_sections.steps is
  'Ordered steps inside a section: [{ "title": text, "description": text }]. Renders in array order.';
comment on column public.site_sections.body_secondary is
  'Optional second paragraph, for two-column sections.';

-- ===========================================================================
-- 2. Seed the four sections of the programmes index
-- ===========================================================================
-- Values are lifted verbatim from the component, so wiring the page changes
-- nothing visible.

insert into public.site_sections (
  section_key, page_key, eyebrow, heading, body, body_secondary,
  cta_label, cta_href, sort_order
) values
  (
    'programmes-hero', 'programmes',
    'Our work',
    'Three programmes, one aim.',
    'A girl in Kibera decides her own future. These are the three programmes that get her there, and the evidence we hold for each.',
    null, null, null, 1
  ),
  (
    'programmes-pathway', 'programmes',
    'How they fit together',
    'One girl, over years and not three programmes',
    -- The caveat text. The *flag* that shows it stays in code (see below).
    'This pathway describes how we intend the programmes to connect. It has not yet been confirmed against how they operate in practice, so please treat it as provisional.',
    null, null, null, 2
  ),
  (
    'programmes-measure', 'programmes',
    null,
    'How we measure',
    'Every figure we publish is dated, and we say how it was counted.',
    null,
    'Our impact and methodology', '/impact', 3
  ),
  (
    'programmes-unrestricted', 'programmes',
    null,
    'A gift that moves with a girl',
    'Unrestricted giving lets a participant move between programmes as her needs change, which is how the pathway above actually works.',
    'Restricted funds are easier to raise. Unrestricted funds change more lives, because nobody has to guess the right programme in advance.',
    'Give where it''s needed', '/donate', 4
  )
on conflict (section_key) do update
  set page_key        = excluded.page_key,
      eyebrow         = excluded.eyebrow,
      heading         = excluded.heading,
      body            = excluded.body,
      body_secondary  = excluded.body_secondary,
      cta_label       = excluded.cta_label,
      cta_href        = excluded.cta_href,
      sort_order      = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- The six pathway steps
-- ---------------------------------------------------------------------------
update public.site_sections
   set steps = '[
     {"title":"A girl arrives","description":"She joins Dada Space at nine. She learns she is allowed to want things."},
     {"title":"She leaves school","description":"Something happens: pregnancy, cost, or stigma. Without support she stays out."},
     {"title":"She returns","description":"School Re-entry brings her back, and stays with her through the year."},
     {"title":"She stabilises","description":"Savings, psychosocial support, and a mentor who has been through it."},
     {"title":"She starts earning","description":"Economic Empowerment funds her first business."},
     {"title":"She leads","description":"She comes back as a mentor. The cycle restarts, one level up."}
   ]'::jsonb
 where section_key = 'programmes-pathway';

-- ===========================================================================
-- 3. A note on the unverified pathway
-- ===========================================================================
-- The "Draft — not yet verified" caveat is deliberately NOT an editable flag.
--
-- doc/roadmap/programmes.md is explicit that the pathway is a claim rather than
-- a description, and that a donor will ask: "If Dada Space participants do not
-- in practice feed into re-entry and economic programmes, do not imply a
-- pipeline."
--
-- So the editor can reword the caveat (it lives in `body` above) but cannot
-- switch it off. Removing it requires a code change and therefore a
-- conversation. That is the same reasoning as consent tiers: some things are
-- gates, not copy.

notify pgrst, 'reload schema';
