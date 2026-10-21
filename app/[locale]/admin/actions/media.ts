"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createServiceClient } from "@/lib/supabase/client";
import type { AuditSnapshot, Insert } from "@/lib/supabase/row-types";
import { hasPermission } from "@/lib/admin/permissions";
import { recordAudit } from "@/lib/admin/audit";
import {
  isMediaBucket,
  publicMediaUrl,
  PUBLIC_BUCKET,
} from "@/lib/media/public-url";
import type { MediaOption } from "@/lib/media/option";

async function requirePermission(resource: string, action: string) {
  if (!(await hasPermission(resource, action))) throw new Error(`Permission denied: ${resource}:${action}`);
}

export async function getMedia() {
  await requirePermission("media", "read");
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("media").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createMediaRecord(data: Insert<"media">) {
  await requirePermission("media", "create");
  const supabase = createServiceClient();

  // The bucket is recorded, not guessed. Without it the file cannot be
  // resolved to a URL, and an uploaded photograph could not be used in any
  // picture field on the site.
  const bucket = data.bucket ?? PUBLIC_BUCKET;
  if (!isMediaBucket(bucket)) throw new Error(`Unknown bucket: ${bucket}`);

  const { data: media, error } = await supabase
    .from("media")
    .insert({ ...data, bucket })
    .select()
    .single();
  if (error) throw new Error(error.message);
  await recordAudit({ action: "create", tableName: "media", rowId: media.id, after: media as unknown as AuditSnapshot });
  revalidateTag("media", "max");
  revalidatePath("/admin/media");
  return media;
}

export async function updateMedia(id: string, data: Insert<"media">) {
  await requirePermission("media", "update");
  const supabase = createServiceClient();
  const { data: before } = await supabase.from("media").select("*").eq("id", id).maybeSingle();
  const { data: media, error } = await supabase.from("media").update(data).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  await recordAudit({ action: "update", tableName: "media", rowId: id, before: before as unknown as AuditSnapshot, after: media as unknown as AuditSnapshot });
  revalidateTag("media", "max");
  revalidatePath("/admin/media");
  return media;
}

export async function deleteMedia(id: string) {
  await requirePermission("media", "delete");
  const supabase = createServiceClient();

  // Read the row first: the file is deleted from the bucket it is in, not
  // from all three. The old version removed the path from every bucket,
  // which could delete a different file that happened to share the name.
  const { data: before } = await supabase.from("media").select("*").eq("id", id).maybeSingle();
  if (!before) throw new Error("That file is no longer in the library.");

  const bucket = isMediaBucket(before.bucket) ? before.bucket : PUBLIC_BUCKET;
  await supabase.storage.from(bucket).remove([before.file_path]);

  const { error } = await supabase.from("media").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await recordAudit({ action: "delete", tableName: "media", rowId: id, before: before as unknown as AuditSnapshot });
  revalidateTag("media", "max");
  revalidatePath("/admin/media");
}

export async function getSignedUrl(bucket: string, path: string) {
  await requirePermission("media", "read");
  if (!isMediaBucket(bucket)) throw new Error(`Unknown bucket: ${bucket}`);
  const supabase = createServiceClient();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  if (error) throw new Error(error.message);
  return data?.signedUrl ?? null;
}

/**
 * The uploaded files that can be used in a published image.
 *
 * Only the public bucket: a file in a private one is reached through a signed
 * URL that expires, and a page that points at it breaks next month. The paths
 * handed back are public URLs, not storage paths, because the image component
 * cannot load a storage path.
 *
 * A caller without the media permission gets an empty list rather than an
 * error, so a page editor who may not read the library still sees the 48
 * shipped photographs.
 */
export async function getPublishableMedia(): Promise<MediaOption[]> {
  if (!(await hasPermission("media", "read"))) return [];

  const supabase = createServiceClient();
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const { data, error } = await supabase
    .from("media")
    .select("id, file_path, file_name, alt_text, width, height, consent_tier, bucket")
    .eq("bucket", PUBLIC_BUCKET)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const options: MediaOption[] = [];
  for (const row of data ?? []) {
    const path = publicMediaUrl(row.file_path, row.bucket, projectUrl);
    if (!path) continue;
    options.push({
      path,
      label: row.file_name,
      group: "uploaded",
      width: row.width ?? 0,
      height: row.height ?? 0,
      alt: row.alt_text ?? undefined,
      consentTier: row.consent_tier ?? undefined,
      source: "uploaded",
    });
  }
  return options;
}
