"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createServiceClient } from "@/lib/supabase/client";
import type { AuditSnapshot, Insert } from "@/lib/supabase/row-types";
import { hasPermission, isDeveloper } from "@/lib/admin/permissions";
import { recordAudit } from "@/lib/admin/audit";
import {
  isMediaBucket,
  publicMediaUrl,
  PUBLIC_BUCKET,
} from "@/lib/media/public-url";
import type { MediaOption } from "@/lib/media/option";
import {
  describeReferences,
  findMediaUsage,
  type MediaReference,
} from "@/lib/media/references";

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

/**
 * Delete a file from the library.
 *
 * ## A file in use is not deleted
 *
 * The pages that point at it would keep the path and lose the photograph, and
 * nothing would say so. The check is here rather than in the interface
 * because the interface is not the boundary: the boundary is the action, and
 * it has to hold whether the delete came from the library, a script or a
 * future screen.
 *
 * ## The way past it
 *
 * Two, and both are deliberate.
 *
 * `replaceMediaAndDelete` moves every reference onto another photograph and
 * then deletes the file. That is the fix an editor wants nine times in ten.
 *
 * `force` deletes a file that is still in use and leaves the broken pages
 * behind. It is for a developer, it says so in the audit trail, and it exists
 * because there are moments — a subject withdrawing consent, a photograph
 * that must not be published at all — where the right answer is to pull the
 * file and repair the pages afterwards.
 */
export async function deleteMedia(id: string, options?: { force?: boolean }) {
  await requirePermission("media", "delete");
  const supabase = createServiceClient();

  // Read the row first: the file is deleted from the bucket it is in, not
  // from all three. The old version removed the path from every bucket,
  // which could delete a different file that happened to share the name.
  const { data: before } = await supabase.from("media").select("*").eq("id", id).maybeSingle();
  if (!before) throw new Error("That file is no longer in the library.");

  const usage = await findMediaUsage([before.file_path]);
  const references = usage.get(before.file_path) ?? [];
  if (references.length > 0) {
    if (!options?.force) {
      const places = describeReferences(references);
      throw new Error(
        `This file is used in ${references.length} place${references.length === 1 ? "" : "s"}: ${places}. Change ${references.length === 1 ? "it" : "those"} first, then delete the file.`,
      );
    }

    // A forced delete is a developer acting over the rule, so it says who
    // did it and what it left behind.
    if (!(await isDeveloper())) {
      throw new Error("Only a developer can delete a file that is still in use.");
    }
  }

  const bucket = isMediaBucket(before.bucket) ? before.bucket : PUBLIC_BUCKET;
  await supabase.storage.from(bucket).remove([before.file_path]);

  const { error } = await supabase.from("media").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await recordAudit({
    action: "delete",
    tableName: "media",
    rowId: id,
    before: before as unknown as AuditSnapshot,
    metadata: {
      forced: references.length > 0,
      left_broken: references.map((reference) => ({
        table: reference.table,
        row_id: reference.rowId,
        label: reference.label,
      })),
    } as unknown as AuditSnapshot,
  });
  revalidateTag("media", "max");
  revalidatePath("/admin/media");
}

/**
 * Point every reference at another photograph, then delete this one.
 *
 * The move happens in the database, in one transaction, across all nine
 * columns that can hold a photograph. Nine separate updates would leave the
 * site in a state nobody chose if one of them failed.
 *
 * The description of each photograph stays where it is. The editor is
 * choosing the picture, and the words under it may describe the old one —
 * so the interface says so rather than pretending the swap is complete.
 */
export async function replaceMediaAndDelete(id: string, newPath: string) {
  await requirePermission("media", "delete");
  const supabase = createServiceClient();

  const { data: before } = await supabase.from("media").select("*").eq("id", id).maybeSingle();
  if (!before) throw new Error("That file is no longer in the library.");

  const replacement = newPath.trim();
  if (!replacement) throw new Error("Choose the photograph that takes its place.");
  if (replacement === before.file_path) {
    throw new Error("That is the same photograph.");
  }

  const { data: changed, error } = await supabase.rpc("replace_media_references", {
    old_path: before.file_path,
    new_path: replacement,
  });
  if (error) throw new Error(error.message);

  const rows = (changed ?? []) as { table: string; id: string }[];

  // Every row that moved is written to the audit trail in its own right. A
  // single "replaced a photograph" row would not say which pages changed.
  for (const row of rows) {
    await recordAudit({
      action: "update",
      tableName: row.table,
      rowId: row.id,
      metadata: {
        image: { from: before.file_path, to: replacement },
        reason: "media replaced",
      } as unknown as AuditSnapshot,
    });
  }

  const bucket = isMediaBucket(before.bucket) ? before.bucket : PUBLIC_BUCKET;
  await supabase.storage.from(bucket).remove([before.file_path]);

  const { error: deleteError } = await supabase.from("media").delete().eq("id", id);
  if (deleteError) throw new Error(deleteError.message);

  await recordAudit({
    action: "delete",
    tableName: "media",
    rowId: id,
    before: before as unknown as AuditSnapshot,
    metadata: {
      replaced_with: replacement,
      references_updated: rows.length,
    } as unknown as AuditSnapshot,
  });

  revalidateTag("media", "max");
  revalidatePath("/admin/media");
  return rows.length;
}

/**
 * Where each file in the library is used.
 *
 * The library shows this on the file's own card, so an editor can see that a
 * photograph is the one on the homepage before they try to remove it.
 */
export async function getMediaUsage(): Promise<Record<string, MediaReference[]>> {
  await requirePermission("media", "read");

  const supabase = createServiceClient();
  // Every file, not only the publishable ones: a file in a private bucket
  // can still be pointed at, and the editor deserves to know before deleting
  // it.
  const { data } = await supabase.from("media").select("file_path");

  const paths = (data ?? []).map((row) => row.file_path);
  const usage = await findMediaUsage(paths);

  const result: Record<string, MediaReference[]> = {};
  for (const [path, references] of usage) result[path] = references;
  return result;
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
