"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

/**
 * The `beforeinstallprompt` event is not in the DOM lib yet. Chrome fires it
 * with `prompt()` and `userChoice`; everything else about it is a standard
 * `Event`.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Force-install prompt for the admin panel.
 *
 * Shown when an admin visits /admin on a mobile device that supports PWA
 * installation but hasn't installed it yet. The prompt is dismissed after
 * install or after the user clicks "Not now" (stored in localStorage).
 */
export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("pwa-dismissed")) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!show || !deferredPrompt) return null;

  async function install() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      toast.success("Installed! Open from your home screen.");
    }
    setDeferredPrompt(null);
    setShow(false);
  }

  function dismiss() {
    localStorage.setItem("pwa-dismissed", "1");
    setShow(false);
  }

  return (
    // Anchored top-right, under the sticky header. Bottom placement covered
    // the chat composer and the last row of every table, which is exactly
    // where a prompt should not be.
    <div className="fixed right-4 top-20 z-50 w-[calc(100%-2rem)] max-w-sm rounded-xl border border-border bg-card p-4 shadow-lg sm:w-96">
      <p className="text-sm font-medium text-ink">Install Imarisha Dada Admin</p>
      <p className="mt-1 text-xs text-ink-muted">
        Add to your home screen for faster access and offline use.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={install}
          className="rounded-full bg-brand-600 px-4 py-2 text-xs font-medium text-brand-50 hover:bg-brand-700"
        >
          Install
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-lg border border-border bg-card px-4 py-2 text-xs font-medium text-ink-muted hover:border-brand-600 hover:text-brand-600"
        >
          Not now
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute right-2 top-2 rounded-lg p-1 text-ink-muted transition-colors hover:bg-surface-lilac hover:text-ink"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
