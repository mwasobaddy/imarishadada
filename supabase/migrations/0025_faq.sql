-- Imarisha Dada — Phase 5: FAQ
--
-- ## The bug this fixes
--
-- `faqs` has had a full schema since migration 0007 — question, answer,
-- category, sort_order, published — and a working admin editor at
-- `/admin/content/faqs` with create, update, delete and toggle. The table was
-- empty, and the public page rendered `FAQS` from `lib/data/pages.ts`, a static
-- constant.
--
-- So an editor adding a question in the admin saw nothing change. The fifth time
-- this pattern has appeared: `home-giving`, `transparency_gaps`, the donate
-- settings readers, `getProgrammeStories`, and now this.
--
-- The content below is the constant's content, not new writing. It was already
-- real and already published — it just lived in the wrong place.

-- ===========================================================================
-- 1. A false safeguarding claim, corrected
-- ===========================================================================
-- The constant answered "How do you protect the girls you work with?" with:
--
--     "...a code of conduct, and a named safeguarding officer."
--
-- There is no named safeguarding officer. `/legal/safeguarding` says "A named
-- officer has not yet been recorded", and `/transparency` lists the appointment
-- as outstanding. So the same site told a reader three different things, and the
-- FAQ version was the one that was untrue.
--
-- A worried parent, a donor or a regulator reading the FAQ would have been told
-- the role was filled. That is the single most consequential sentence on this
-- page, and it is corrected below to say what the other two pages say.

-- ===========================================================================
-- 2. A unique key, because `on conflict do nothing` needs one
-- ===========================================================================
-- `faqs` has no unique constraint, so `on conflict do nothing` would catch
-- nothing and a re-applied migration would duplicate every row. That is exactly
-- what happened to `transparency_gaps` in migration 0022 — see 0023.
--
-- Added *before* the insert, and the insert names it, so the guard says what it
-- looks like it says.

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'faqs_question_key'
  ) then
    alter table public.faqs
      add constraint faqs_question_key unique (question);
  end if;
end $$;

comment on constraint faqs_question_key on public.faqs is
  'A question identifies itself. This exists so the seed in migration 0025 is genuinely idempotent rather than appearing to be.';

-- ===========================================================================
-- 3. The questions
-- ===========================================================================
-- Categories are the table's vocabulary (`giving`, `programmes`, `about`,
-- `safeguarding`), not the constant's display labels ("Giving", "Programmes",
-- "About us", "Safeguarding"). The table's CHECK also allows `general`,
-- `volunteering` and `partnerships`, which nothing uses yet — the page renders
-- any category that has entries, so those appear on their own when added.

insert into public.faqs (question, answer, category, sort_order, published) values
  (
    'Do you offer monthly giving?',
    'Yes, every amount on our giving ladder can be given monthly. Monthly gifts are what keep a mentor in a girl''s life through the whole school year, rather than through one term.',
    'giving', 1, true
  ),
  (
    'Can I give from outside Kenya?',
    'Yes, by card. You choose your currency at checkout and we record both the amount you gave and the Kenyan shilling equivalent, so your receipt is accurate either way.',
    'giving', 2, true
  ),
  (
    'Do you accept in-kind donations?',
    'Please message us first. We cannot always accept physical goods, and an unasked-for donation is often unusable.',
    'giving', 3, true
  ),
  (
    'Is my donation tax deductible?',
    'A receipt is issued for every donation. Whether it is deductible depends on your country and on our registration status, and we will tell you the truth about it rather than imply a benefit we cannot deliver.',
    'giving', 4, true
  ),
  (
    'Who do you work with?',
    'Young mothers aged 16 and over returning to school, and girls aged 9 to 16 in safe-space sessions. Both groups are in Kibera, Nairobi.',
    'programmes', 5, true
  ),
  (
    'How long does a participant stay with you?',
    'It depends on what she needs. A re-entry package runs for a school year. Dada Space is open-ended: a girl can attend for as long as she finds it useful.',
    'programmes', 6, true
  ),
  (
    'Can I visit a session?',
    'Ask us first. Sessions involving minors need consent and notice, and some conversations should not have visitors in the room.',
    'programmes', 7, true
  ),
  (
    'Are you a registered organisation?',
    'Our BRS NGO registration number is being issued and will be published as soon as it is. Institutional and diaspora donors should expect to see it here.',
    'about', 8, true
  ),
  (
    'How is money spent?',
    'Unrestricted gifts go where the need is greatest that term. Restricted gifts fund the outcome label you selected, for example a single re-entry package, and we report against that specific figure.',
    'about', 9, true
  ),
  (
    'How do you protect the girls you work with?',
    -- Corrected. See §1.
    'Two-adult sessions, safe recruitment with references and training, and a code of conduct. A named safeguarding officer has not yet been appointed, and we say so on our transparency page rather than implying otherwise. Our full policy is published on this site.',
    'safeguarding', 10, true
  ),
  (
    'Why are some names missing from your stories?',
    'Because consent is theirs to give and theirs to withdraw. Every story carries a consent tier, and the tier decides what we publish, not our judgement on the day.',
    'safeguarding', 11, true
  )
on conflict (question) do nothing;

-- ===========================================================================
-- 4. The page copy
-- ===========================================================================

insert into public.site_sections (
  section_key, page_key, eyebrow, heading, body, cta_label, cta_href, sort_order
) values
  (
    'faq-hero', 'faq',
    'Questions',
    'The things people ask us most',
    'If your question is not here, message us and we will answer it and probably add it.',
    null, null, 1
  ),
  (
    -- Rendered when no question is published. Today it will not appear, but the
    -- page must not render an empty shell if every entry is switched off.
    'faq-empty', 'faq',
    null,
    'No questions published yet',
    'We publish answers here as they come up. In the meantime, message us and we will answer directly — and probably add it here afterwards.',
    null, null, 2
  ),
  (
    'faq-contact', 'faq',
    null,
    'Still have a question?',
    'WhatsApp is the fastest way to reach us in Kenya, and we read every message.',
    'Ask us', '/contact', 3
  )
on conflict (section_key) do update
  set page_key   = excluded.page_key,
      eyebrow    = excluded.eyebrow,
      heading    = excluded.heading,
      body       = excluded.body,
      cta_label  = excluded.cta_label,
      cta_href   = excluded.cta_href,
      sort_order = excluded.sort_order;

-- ===========================================================================
-- 5. A duplication this leaves in place, deliberately
-- ===========================================================================
-- Three of these questions also appear as the contact page's "before you write"
-- answers (`contact-faqs` steps, migration 0024), with SHORTER answers.
--
-- That is an editorial choice, not an oversight: beside a form, three one-line
-- answers prevent a wasted enquiry; on this page the same questions deserve
-- fuller answers. The roadmap also requires that `/contact` not depend on `/faq`
-- having content.
--
-- The risk is real and stated: two editable copies of the same question can
-- drift. If the answers diverge in substance rather than length, this page is
-- the reference and the contact teaser is the summary.

notify pgrst, 'reload schema';
