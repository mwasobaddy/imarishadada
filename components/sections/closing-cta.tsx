export function ClosingCta() {
  return (
    <section aria-labelledby="closing-heading" className="bg-brand-900 py-section text-ink-inverse">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-16">
          <div>
            <h2
              id="closing-heading"
              className="max-w-2xl text-display text-3xl sm:text-4xl lg:text-5xl"
            >
              Every girl here was someone nobody was watching.
            </h2>
            <p className="measure mt-5 text-lg text-ink-inverse/75">
              They came to us, and they changed their own trajectory. Your gift keeps
              the door open for the next one.
            </p>
          </div>

          <div className="flex flex-col items-start gap-4 lg:items-end">
            <a
              href="/donate"
              className="inline-flex min-h-13 w-full items-center justify-center rounded-lg bg-accent px-8 text-base font-semibold text-white transition-colors hover:bg-accent-bright focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink-inverse sm:w-auto"
            >
              Help the next one
            </a>
            <a
              href="/partner"
              className="inline-flex min-h-12 items-center justify-center rounded-lg px-2 text-base font-medium text-ink-inverse underline decoration-ink-inverse/40 underline-offset-4 hover:decoration-ink-inverse focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink-inverse"
            >
              Partner with us
            </a>
            <p className="text-sm text-ink-inverse/60">
              M-Pesa and card. Receipts for every gift.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}