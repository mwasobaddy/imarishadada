-- Imarisha Dada — Phase 5: Contact page copy
--
-- Stage 6 of doc/page-editor.md, one page at a time.
--
-- ## The line this page draws
--
-- `/contact` mixes two kinds of text, and only one of them belongs here:
--
--   * **Copy about the organisation** — the headings, the promise, the three
--     answers before you write. Editorial, so it lives in `site_sections`.
--   * **Contact details** — the phone number, the address, office hours, the
--     per-channel response times. Data, so it lives in `settings` and is
--     edited at `/admin/settings`. Nothing here duplicates them.
--
-- A third category stays in code and is deliberately not seeded: the **state
-- messages** ("Our domain email is being set up", "Phone number not yet
-- published"). Those are not claims about the organisation — they describe the
-- absence of a setting, and they must appear and disappear on their own when
-- the setting is filled. An editor should not be able to leave "being set up"
-- on the page after the address goes live.

insert into public.site_sections (
  section_key, page_key, eyebrow, heading, body, body_secondary,
  cta_label, cta_href, cta_secondary_label, cta_secondary_href, sort_order
) values
  (
    'contact-hero', 'contact',
    'Contact',
    'Talk to us.',
    'Ask about the work, partner with us, volunteer, or press us. Every message is read by a person on the team.',
    null,
    -- Giving is not a contact. A donor who lands here looking to give should be
    -- on the donation page, not filling in a form. The label says why, so the
    -- redirect does not read as the site refusing to help.
    'Want to give? The donation page is faster', '/donate',
    'How we protect the girls we work with', '/legal/safeguarding',
    1
  ),
  (
    'contact-methods', 'contact',
    'Get in touch',
    'Start with WhatsApp',
    'It is the fastest way to reach us, and every message is read by a person on the team, not a bot, and not a shared inbox nobody opens.',
    null, null, null, null, null,
    2
  ),
  (
    'contact-methods-other', 'contact',
    null,
    'Other ways to reach us',
    null,
    null, null, null, null, null,
    3
  ),
  (
    'contact-form', 'contact',
    null,
    'Write to us',
    'This reaches our team inbox. If your message is about an existing donation, quote your reference so we can find it quickly.',
    null, null, null, null, null,
    4
  ),
  (
    -- Sits beside the form, not below it. The research is that a visitor arrives
    -- wanting to know whether they need to write at all, and answers read after
    -- the form prevent nothing.
    'contact-faqs', 'contact',
    null,
    'Before you write',
    null,
    null, null, null, null, null,
    5
  ),
  (
    'contact-partner', 'contact',
    null,
    'Partnering or fundraising?',
    'For institutional partnerships and funding proposals, ask for a partner in the dropdown because it routes faster than a general enquiry.',
    null,
    'Read about partnering with us', '/partner', null, null,
    6
  )
on conflict (section_key) do update
  set page_key            = excluded.page_key,
      eyebrow             = excluded.eyebrow,
      heading             = excluded.heading,
      body                = excluded.body,
      body_secondary      = excluded.body_secondary,
      cta_label           = excluded.cta_label,
      cta_href            = excluded.cta_href,
      cta_secondary_label = excluded.cta_secondary_label,
      cta_secondary_href  = excluded.cta_secondary_href,
      sort_order          = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- The three questions, as `steps`
-- ---------------------------------------------------------------------------
-- The same `[{title, description}]` shape as the programmes pathway, the impact
-- methodology and the ways-to-give promises — question and answer are exactly
-- that shape, so an editor meets the widget they already know.
--
-- These are kept on this page rather than pulled from the `faqs` table. The
-- roadmap's reason: they must sit next to the form they are meant to prevent a
-- wasted enquiry about, and this page must not depend on `/faq` having content.
-- The `faqs` table is empty, so a shared source would render nothing here.

update public.site_sections
   set steps = '[
     {
       "title": "Do you offer monthly giving?",
       "description": "Yes, every amount on our giving ladder can be given monthly. Monthly gifts are what keep a mentor in a girl''s life through the whole school year."
     },
     {
       "title": "Can I give from outside Kenya?",
       "description": "Yes, by card. Receipts are issued for every gift, in your currency."
     },
     {
       "title": "Do you accept in-kind donations?",
       "description": "Message us first. We cannot always accept physical goods, and an unasked-for donation is often unusable."
     }
   ]'::jsonb
 where section_key = 'contact-faqs';

notify pgrst, 'reload schema';
