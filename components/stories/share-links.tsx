"use client";

import { useState } from "react";

import type { SiteSection } from "@/lib/data/types";

/**
 * Share, without telling anyone else that you read this.
 *
 * ## No third-party widgets
 *
 * The roadmap rules them out and the reason is worth keeping: a share button
 * loaded from someone else's domain sends them the visitor's IP, the page URL,
 * and often a cookie, on a page about a named young woman in Kibera. It also
 * costs a third-party script on a metered connection.
 *
 * Plain links cost nothing and leak nothing. The only client-side code here is
 * the clipboard write, and it degrades to a visible URL if that fails.
 *
 * ## WhatsApp first, for this audience
 *
 * It is the default messaging app in Kenya, so it is the one that will actually
 * be used. Email second. No Facebook or X — the audience is not there, and the
 * buttons would be decoration.
 */
export function ShareLinks({
  url,
  title,
  section,
}: {
  url: string;
  title: string;
  section: SiteSection;
}) {
  const [copied, setCopied] = useState(false);

  const text = encodeURIComponent(`${title} — ${url}`);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      // Back to the resting label. Long enough to read, short enough that the
      // button is not stuck saying "Copied" for the rest of the visit.
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard access is denied in some in-app browsers, which is most of
      // this audience. The URL is rendered below, so nothing is lost.
      setCopied(false);
    }
  }

  return (
    <section aria-labelledby="story-share-heading" className="mt-12 border-t border-border pt-8">
      <h2 id="story-share-heading" className="text-sm font-semibold text-brand-600">
        {section.heading}
      </h2>
      {section.body ? (
        <p className="measure mt-2 text-sm leading-relaxed text-ink-muted">
          {section.body}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={copy}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium text-ink-muted transition-colors hover:border-brand-600 hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          {copied ? "Link copied" : "Copy link"}
        </button>

        <a
          href={`https://wa.me/?text=${text}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium text-ink-muted transition-colors hover:border-brand-600 hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
        >
          WhatsApp
        </a>

        <a
          href={`mailto:?subject=${encodeURIComponent(title)}&body=${text}`}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium text-ink-muted transition-colors hover:border-brand-600 hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
        >
          Email
        </a>
      </div>

      {/* The URL in the clear, so the page still works when the clipboard does
          not — which is common in the in-app browsers this audience uses. */}
      <p className="mt-3 font-mono text-xs break-all text-ink-muted/80">{url}</p>
    </section>
  );
}
