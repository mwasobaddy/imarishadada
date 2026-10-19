"use client";

import Link from "next/link";

/**
 * Last-resort error boundary — `app/global-error.tsx`.
 *
 * This replaces the root layout, so it must render its own `<html>` and
 * `<body>`. That also means no global CSS class is guaranteed to have applied,
 * so the styling below is inline and self-contained on purpose — a styled
 * error page that depends on a stylesheet which may be what failed is not a
 * safety net.
 *
 * Brand colours are inlined as literals rather than referenced as tokens. This
 * is the one place where a hardcoded hex is correct: the token system is not
 * reachable from here, and a plain readable page beats a token-shaped one.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en-KE">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFFAF7",
          color: "#2A1445",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: "40rem" }}>
          <p
            style={{
              margin: 0,
              fontSize: "0.875rem",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "#5B2A86",
            }}
          >
            Something went wrong
          </p>

          <h1
            style={{
              margin: "0.75rem 0 0",
              fontSize: "clamp(2rem, 6vw, 2.75rem)",
              lineHeight: 1.15,
              fontWeight: 600,
              letterSpacing: "-0.02em",
            }}
          >
            Our site is having trouble.
          </h1>

          <p style={{ margin: "1rem 0 0", fontSize: "1.125rem", lineHeight: 1.6 }}>
            The whole site failed to load, not just this page. This is on us and it
            should not happen.
          </p>

          <p
            style={{ margin: "1rem 0 0", fontSize: "1rem", lineHeight: 1.6, fontWeight: 500 }}
          >
            If you were donating, you have not been charged. A donation only
            completes once our payment provider confirms it.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginTop: "2rem" }}>
            <button
              type="button"
              onClick={reset}
              style={{
                minHeight: "3.25rem",
                display: "inline-flex",
                alignItems: "center",
                padding: "0 2rem",
                borderRadius: "0.5rem",
                border: "none",
                background: "#F5B82E",
                color: "#2A1445",
                fontSize: "1rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <Link
              href="/contact"
              style={{
                minHeight: "3.25rem",
                display: "inline-flex",
                alignItems: "center",
                padding: "0 2rem",
                borderRadius: "0.5rem",
                border: "1px solid #E4D9EE",
                background: "#FFFFFF",
                color: "#2A1445",
                fontSize: "1rem",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Contact us
            </Link>
          </div>

          {error.digest ? (
            <p style={{ margin: "1.5rem 0 0", fontSize: "0.75rem", opacity: 0.7 }}>
              Reference: {error.digest}
            </p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
