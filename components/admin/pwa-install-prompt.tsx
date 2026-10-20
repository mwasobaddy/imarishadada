"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

/**
 * Force-install prompt for the admin panel.
 *
 * Shown when an admin visits /admin on a mobile device that supports PWA
 * installation but hasn't installed it yet. The prompt is dismissed after
 * install or after the user clicks "Not now" (stored in localStorage).
 */
export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("pwa-dismissed")) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
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
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-xl border border-brand-600/30 bg-card p-4 shadow-lg">
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
      </div>
    </div>
  );
}
