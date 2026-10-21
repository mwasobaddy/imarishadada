"use client";

import { PageHeader } from "@/components/admin/page-header";
import { useEffect, useState, useTransition, useRef } from "react";
import { toast } from "sonner";

import { createMediaRecord, deleteMedia, getSignedUrl } from "@/app/[locale]/admin/actions/media";

type MediaItem = {
  id: string;
  file_path: string;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    async function sign() {
      const entries = await Promise.all(
        media.map(async (item) => {
          const url = await getSignedUrl(bucket, item.file_path);
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
  }, [media, bucket]);

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
    if (!confirm("Delete this media file?")) return;
    startTransition(async () => {
      try {
        await deleteMedia(item.id, item.file_path);
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
          {media.map((item) => (
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
              </div>
            </div>
          ))}
        </div>
      )}
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
