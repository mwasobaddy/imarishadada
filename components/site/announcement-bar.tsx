export function AnnouncementBar() {
  // Renders a server-side fallback. Swapping this for a CMS value must not
  // shift layout or flash.
  return (
    <div className="bg-brand-900 px-5 py-2.5 text-center text-xs font-medium tracking-wide text-ink-inverse sm:px-8">
      <p className="mx-auto max-w-6xl">
        {/* Split so the bar stays on one line at 320px. */}
        <span className="sm:hidden">M-Pesa or card · Receipts for every gift</span>
        <span className="hidden sm:inline">
          Give by M-Pesa or card · Receipts for every gift · 100% of gifts fund our
          programmes in Kibera
        </span>
      </p>
    </div>
  );
}