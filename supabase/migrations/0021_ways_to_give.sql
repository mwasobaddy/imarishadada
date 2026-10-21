-- Imarisha Dada — Phase 5: Ways to give page copy
--
-- Stage 6 of doc/page-editor.md, one page at a time.
--
-- ## What this page is for
--
-- The roadmap's framing: it "captures giving modes the online form cannot" —
-- bank transfer for large gifts, corporate and foundation giving, in-kind,
-- fundraising on a donor's behalf. Without those it is a second copy of the
-- donate page's rails, which is what it had become.
--
-- So this seeds the copy for the parts that can be told truthfully today, and
-- the ones that cannot are listed at the foot rather than filled with
-- placeholder prose.

insert into public.site_sections (
  section_key, page_key, eyebrow, heading, body,
  cta_label, cta_href, sort_order
) values
  (
    'ways-hero', 'ways-to-give',
    'Ways to give',
    'Choose what your gift does.',
    'Give monthly and a mentor''s continuity matters as much as a single emergency. Give once and a girl gets materials for a term. Both are the same girl, and both are needed.',
    null, null, 1
  ),
  (
    -- Shared component with the homepage, which passes `home-giving` instead.
    -- Its own key so the two can diverge: a visitor on /ways-to-give has
    -- already decided to give and is choosing how, and the homepage is still
    -- making the case.
    'ways-ladder', 'ways-to-give',
    'Ways to give',
    'What your gift actually does',
    'Every amount below is tied to a specific outcome, and every outcome is one we report against.',
    null, null, 2
  ),
  (
    'ways-rails', 'ways-to-give',
    null,
    'How you can pay',
    'Each of these goes to the same place. Choose whichever is cheapest and easiest for you — for most donors in Kenya that is M-Pesa, and for a large gift it is usually a bank transfer.',
    'Give now', '/donate', 3
  ),
  (
    'ways-transparency', 'ways-to-give',
    null,
    'What happens after you press give',
    null,
    null, null, 4
  ),
  (
    'ways-organisation', 'ways-to-give',
    null,
    'Give as an organisation',
    'If you are giving on behalf of a company, a foundation or a trust, the gift usually needs an invoice, a named contact and a report against the outcome you funded. All of that is easier to arrange directly.',
    'Partner with us', '/partner', 5
  ),
  (
    'ways-other', 'ways-to-give',
    null,
    'Other ways to help',
    'Not every useful thing costs money. These are the ones that cost you nothing and are worth more than they look.',
    null, null, 6
  )
on conflict (section_key) do update
  set page_key   = excluded.page_key,
      eyebrow    = excluded.eyebrow,
      heading    = excluded.heading,
      body       = excluded.body,
      cta_label  = excluded.cta_label,
      cta_href   = excluded.cta_href,
      sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- The four promises, as `steps`
-- ---------------------------------------------------------------------------
-- Same `[{title, description}]` shape as the programmes pathway and the impact
-- methodology, so an editor meets the same widget a third time rather than
-- learning a new one for the same idea.

update public.site_sections
   set steps = '[
     {
       "title": "You see the full total before you pay",
       "description": "The amount, the currency and any processing fee are on screen before you press give. Never a surprise at confirmation, and never a charge you did not agree to."
     },
     {
       "title": "A receipt goes out by email",
       "description": "Once the payment provider confirms the gift, not when you press the button. If your payment is still clearing, we say so rather than thanking you early."
     },
     {
       "title": "You can stop a monthly gift whenever you like",
       "description": "Email or WhatsApp us and we cancel it the same day. You do not need to give a reason, and you will not have to ask twice."
     },
     {
       "title": "A restricted gift is reported against its outcome",
       "description": "If you fund a re-entry package, that is what we report against — not a general total that quietly absorbs it into something else."
     }
   ]'::jsonb
 where section_key = 'ways-transparency';

-- ---------------------------------------------------------------------------
-- The non-financial asks, as `steps`
-- ---------------------------------------------------------------------------
-- Every one of these has a real destination that exists today. Nothing here
-- promises a mechanism we have not built — the roadmap is explicit that a
-- fundraiser tracker must not be offered until `?ref=` attribution exists in
-- the ledger, so there is no "start fundraising" item.

update public.site_sections
   set steps = '[
     {
       "title": "Read a story and send it to one person",
       "description": "Not a share button into the void — pick someone who would care, and send it to them."
     },
     {
       "title": "Volunteer a few hours",
       "description": "Mentoring, tutoring, or professional skills. We publish what we actually need, rather than a general offer to help."
     },
     {
       "title": "Introduce us to a foundation",
       "description": "Most of our institutional funding will come through someone who already knows us. An introduction is worth more than a cold application."
     },
     {
       "title": "Come and visit Dada Space",
       "description": "In Kibera. We would rather you saw the work than read about it. Arrange it with us first."
     }
   ]'::jsonb
 where section_key = 'ways-other';

-- ===========================================================================
-- What is deliberately NOT seeded here
-- ===========================================================================
-- The roadmap lists six more sections. None of them can be written truthfully
-- today, and placeholder prose on a page about giving is worse than an absent
-- section:
--
--   * **M-Pesa paybill and account name.** `settings` has no paybill key and
--     there is no approved shortcode. The roadmap's own rule is that a stale
--     paybill number is "a serious operational failure".
--   * **Legacy giving.** Needs a named contact and a legal disclaimer. The
--     disclaimer must be legally reviewed, not written here.
--   * **Gift Aid / UK and US tax.** The roadmap is explicit: claiming Gift Aid
--     without HMRC registration is a criminal offence. Correctly omitted.
--   * **Fundraise for us.** Needs `?ref=` attribution in the ledger first, so
--     that a fundraiser's total is real. The roadmap says do not promise a
--     tracker before it exists.
--   * **Give in kind.** Needs a decision about what is actually accepted and
--     where it is stored.
--
-- Each becomes a section when the fact behind it exists, not before.

notify pgrst, 'reload schema';
