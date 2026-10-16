// Evaluated once at module load, not per render. Calling `new Date()` inside
// the component body is an unstable value under `cacheComponents` and fails
// prerendering. Update the start year when the org is founded/renamed.
const COPYRIGHT_YEAR = new Date().getFullYear();

export function SiteFooter() {
  const programmes = [
    { label: "School Re-entry", href: "/programmes/school-reentry" },
    { label: "Economic Empowerment", href: "/programmes/economic-empowerment" },
    { label: "Dada Space", href: "/programmes/dada-space" },
  ];

  const organisation = [
    { label: "About us", href: "/about" },
    { label: "Our impact", href: "/impact" },
    { label: "Transparency", href: "/transparency" },
    { label: "Annual report", href: "/annual-report" },
    { label: "News", href: "/news" },
  ];

  const support = [
    { label: "Ways to give", href: "/ways-to-give" },
    { label: "Partner with us", href: "/partner" },
    { label: "Volunteer", href: "/volunteer" },
    { label: "Contact", href: "/contact" },
    { label: "FAQ", href: "/faq" },
  ];

  return (
    <footer className="border-t border-brand/20 bg-surface-warm">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <p className="text-lg font-semibold tracking-tight text-brand-600">
              Imarisha Dada
            </p>
            <p className="mt-1 text-sm text-ink-muted">Empower a Sister</p>
            <p className="measure mt-4 text-sm leading-relaxed text-ink-muted">
              A girl-centred, community-led organisation working with girls and young
              women in Kibera, Nairobi, Kenya.
            </p>
          </div>

          <nav aria-labelledby="footer-programmes">
            <h2
              id="footer-programmes"
              className="text-sm font-semibold tracking-wide text-brand-600 uppercase"
            >
              Programmes
            </h2>
            <ul className="mt-4 space-y-1">
              {programmes.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="inline-flex min-h-11 items-center text-sm text-ink-muted hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-organisation">
            <h2
              id="footer-organisation"
              className="text-sm font-semibold tracking-wide text-brand-600 uppercase"
            >
              Organisation
            </h2>
            <ul className="mt-4 space-y-1">
              {organisation.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="inline-flex min-h-11 items-center text-sm text-ink-muted hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-support">
            <h2
              id="footer-support"
              className="text-sm font-semibold tracking-wide text-brand-600 uppercase"
            >
              Support
            </h2>
            <ul className="mt-4 space-y-1">
              {support.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="inline-flex min-h-11 items-center text-sm text-ink-muted hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 border-t border-brand/20 pt-8">
          {/* Safeguarding is a first-class footer link for an organisation
              working with girls aged 9–16, not a legal footnote. */}
          <ul className="flex flex-wrap gap-x-6 gap-y-1">
            {[
              { label: "Safeguarding policy", href: "/legal/safeguarding" },
              { label: "Privacy", href: "/legal/privacy" },
              { label: "Terms", href: "/legal/terms" },
              { label: "Raise a concern", href: "/transparency#complaints" },
            ].map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="inline-flex min-h-11 items-center text-sm text-ink-muted hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          <p className="mt-6 text-sm text-ink-muted">
            Kibera, Nairobi, Kenya ·{" "}
            <a
              href="https://wa.me/254708694088"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-ink-muted/40 underline-offset-4 hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
            >
              WhatsApp +254 708 694 088
            </a>
          </p>

          <p className="mt-2 text-xs text-ink-muted">
            © {COPYRIGHT_YEAR} Imarisha Dada. Registered NGO registration
            number to be published once issued.
          </p>
        </div>
      </div>
    </footer>
  );
}