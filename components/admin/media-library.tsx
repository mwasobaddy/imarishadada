"use client";

import { PageHeader } from "@/components/admin/page-header";
import { useEffect, useState, useTransition, useRef } from "react";
import { toast } from "sonner";

import { createMediaRecord, deleteMedia, getMediaUsage, getSignedUrl } from "@/app/[locale]/admin/actions/media";
import type { MediaReference } from "@/lib/media/references";

type MediaItem = {
  id: string;
  file_path: string;
  /** Which storage bucket the file is in. */
  bucket: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  alt_text: string;
  consent_tier: string;
  consent_expires_at: string | null;
  exif_stripped: boolean;
  created_at: string;
};

const CONSENT_TIERS = [
  { value: "none", label: "No consent (internal use only)" },
  { value: "named_full", label: "Named + photographed (written consent)" },
  { value: "named_no_face", label: "Named, no photo" },
  { value: "anonymised", label: "Anonymised" },
];

export function MediaLibrary({ media: initial }: { media: MediaItem[] }) {
  const [media, setMedia] = useState<MediaItem[]>(initial);
  const [uploading, setUploading] = useState(false);
  const [altText, setAltText] = useState("");
  const [consentTier, setConsentTier] = useState("none");
  const [consentExpires, setConsentExpires] = useState("");
  const [bucket, setBucket] = useState("public-media");
  /**
   * The preview URL for each item.
   *
   * The library used to point its thumbnails at `/api/media/...?bucket=…`,
   * a route that does not exist, so every image in the library was broken.
   * The buckets are private, so the browser needs a signed URL — which the
   * admin action already knows how to mint.
   */
  const [signed, setSigned] = useState<Record<string, string>>({});
  /**
   * Where each file is used on the site.
   *
   * A photograph that a page points at cannot be deleted: the page would keep
   * the path and lose the picture. So the library says so on the file's own
   * card, before the editor tries.
   */
  const [usage, setUsage] = useState<Record<string, MediaReference[]>>({});
  /** The file whose delete was refused, and the places that use it. */
  const [blocked, setBlocked] = useState<{
    item: MediaItem;
    references: MediaReference[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    void getMediaUsage()
      .then((map) => {
        if (!cancelled) setUsage(map);
      })
      .catch(() => {
        // The usage list is a warning, not a gate. The delete action checks
        // it again on the server, so a failure here cannot let a file be
        // deleted while it is in use.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function sign() {
      // Each file is signed against the bucket it is in. Signing every file
      // against the upload form's current bucket produced a broken thumbnail
      // for anything not uploaded to that one.
      const entries = await Promise.all(
        media.map(async (item) => {
          const url = await getSignedUrl(item.bucket || "public-media", item.file_path);
          return [item.id, url] as const;
        }),
      );
      if (cancelled) return;
      setSigned(
        Object.fromEntries(
          entries.filter((entry): entry is [string, string] => Boolean(entry[1])),
        ),
      );
    }

    void sign();
    return () => {
      cancelled = true;
    };
  }, [media]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) { toast.error("Select a file"); return; }
    if (!altText.trim()) { toast.error("Alt text is required — describe what the image shows for screen readers"); return; }

    setUploading(true);
    try {
      const supabase = (await import("@/lib/supabase/auth-browser")).createAuthBrowserClient();
      const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

      // Client-side EXIF stripping: read file, strip EXIF via canvas re-encode
      const stripped = await stripExif(file);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, stripped, { contentType: file.type });

      if (uploadError) throw new Error(uploadError.message);

      // Get dimensions
      const dims = await getImageDimensions(stripped);

      const record = await createMediaRecord({
        bucket,
        file_path: uploadData.path,
        file_name: file.name,
        mime_type: file.type,
        size_bytes: stripped.size,
        width: dims.width,
        height: dims.height,
        alt_text: altText.trim(),
        consent_tier: consentTier,
        consent_expires_at: consentExpires || null,
        exif_stripped: true,
      });

      setMedia((prev) => [record as MediaItem, ...prev]);
      toast.success("Added to the media library");
      setAltText("");
      setConsentTier("none");
      setConsentExpires("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(item: MediaItem) {
    // The library knows where the file is used, so it says so before asking
    // for a confirmation the editor cannot honour.
    const references = usage[item.file_path] ?? [];
    if (references.length > 0) {
      setBlocked({ item, references });
      return;
    }

    if (!confirm("Delete this media file?")) return;
    startTransition(async () => {
      try {
        await deleteMedia(item.id);
        setMedia((prev) => prev.filter((m) => m.id !== item.id));
        toast.success("Media deleted");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Delete failed");
      }
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Media library"
        description="Every upload requires alt text. Consent tier gates whether an image can be attached to a published story."
      />

      {/* Upload form */}
      <form onSubmit={handleUpload} className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-brand-600">Upload</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-ink">File</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="mt-1 block w-full text-sm text-ink-muted file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Bucket</label>
            <select
              value={bucket}
              onChange={(e) => setBucket(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
            >
              <option value="public-media">Public media</option>
              <option value="story-media">Story media (private)</option>
              <option value="documents">Documents (private)</option>
            </select>
            <p className="mt-1 text-xs text-ink-muted">
              {bucket === "public-media"
                ? "Publicly readable, so the file can be used in a published image."
                : "Staff-only. The file cannot be used in a page — a published image needs a URL that still works next month."}
            </p>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-ink">
              Alt text (required)
            </label>
            <input
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Describe what the image shows, for screen readers"
              className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
            />
            <p className="mt-1 text-xs text-ink-muted">
              Explain what the image depicts. Decorative images use empty alt
              (alt=&quot;&quot;). This field is enforced — you cannot upload
              without it.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Consent tier</label>
            <select
              value={consentTier}
              onChange={(e) => setConsentTier(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
            >
              {CONSENT_TIERS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Consent expires</label>
            <input
              type="date"
              value={consentExpires}
              onChange={(e) => setConsentExpires(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={uploading}
          className="rounded-full bg-brand-600 px-6 py-2 text-sm font-medium text-brand-50 hover:bg-brand-700 disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "Upload"}
        </button>
      </form>

      {/* Media grid */}
      {media.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-brand-600/30 bg-surface-lilac p-10 text-center">
          <p className="text-sm text-ink-muted">No media uploaded yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {media.map((item) => {
            const references = usage[item.file_path] ?? [];
            return (
            <div key={item.id} className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="aspect-square bg-surface-lilac">
                {signed[item.id] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={signed[item.id]}
                    alt={item.alt_text}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-ink-muted">
                    No preview
                  </div>
                )}
              </div>
              <div className="p-3 space-y-1">
                <p className="text-xs font-medium text-ink truncate">{item.file_name}</p>
                <p className="text-xs text-ink-muted truncate">{item.alt_text}</p>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-surface-lilac px-2 py-0.5 text-xs text-ink-muted">
                    {item.consent_tier}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    disabled={pending}
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
                {/*
                  The bucket decides whether the file can be used in a page.

                  `public-media` is publicly readable, so its files can be
                  pointed at by a published image. The other two are staff-only
                  and are reached through a signed URL that expires, so a page
                  pointing at one breaks later — the picker leaves them out.
                */}
                <p className="text-xs text-ink-muted">
                  <span className="font-medium text-ink">{item.bucket || "public-media"}</span>
                  {item.bucket && item.bucket !== "public-media"
                    ? " — not usable in a page"
                    : " — usable in a page"}
                </p>
                {/*
                  Where the file is used.

                  A file that a page points at cannot be deleted, so the
                  editor is told here rather than after a failed delete.
                */}
                {references.length > 0 ? (
                  <p className="text-xs font-medium text-brand-600">
                    Used in {references.length} place{references.length === 1 ? "" : "s"}
                  </p>
                ) : null}
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/*
        The delete was refused because the file is in use.

        The places are listed with a link to each one, because the fix is to
        go and change them — not to force the delete and leave a broken
        photograph on a live page.
      */}
      {blocked ? (
        <div
          role="alertdialog"
          aria-label="This file is in use"
          className="rounded-xl border border-amber-300 bg-amber-50 p-5"
        >
          <h2 className="text-base font-semibold text-ink">
            “{blocked.item.file_name}” is in use
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            It cannot be deleted while these point at it. Change them first,
            then delete the file.
          </p>
          <ul className="mt-3 space-y-1 text-sm text-ink">
            {blocked.references.map((reference) => (
              <li key={`${reference.table}-${reference.rowId}`}>
                <a
                  href={reference.href}
                  className="font-medium text-brand-600 underline underline-offset-2"
                >
                  {reference.label}
                </a>
                {reference.live ? null : (
                  <span className="ml-2 text-xs text-ink-muted">not published</span>
                )}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setBlocked(null)}
            className="mt-4 rounded-full bg-brand-600 px-4 py-1.5 text-xs font-medium text-brand-50 hover:bg-brand-700"
          >
            Close
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** Strip EXIF by re-encoding through canvas (client-side). */
async function stripExif(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not supported")); return; }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to re-encode image"));
        },
        file.type || "image/jpeg",
        0.92,
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

/** Get image dimensions from a blob. */
async function getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = URL.createObjectURL(blob);
  });
}
