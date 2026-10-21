"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createServiceClient } from "@/lib/supabase/client";
import type { AuditSnapshot, Insert, Update, WithOptionalSlug } from "@/lib/supabase/row-types";
import { hasPermission } from "@/lib/admin/permissions";
import { coverAltBlocker, publishBlocker } from "@/lib/news/rules";

async function requirePermission(resource: string, action: string) {
  if (!(await hasPermission(resource, action))) throw new Error(`Permission denied: ${resource}:${action}`);
}

export async function getPosts() {
  await requirePermission("posts", "read");
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("posts").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createPost(data: WithOptionalSlug<"posts">) {
  await requirePermission("posts", "create");
  const supabase = createServiceClient();
  // The slug is NOT NULL in the database, but the editor may leave it blank
  // and expect one to be derived from the title.
  const slug =
    data.slug ||
    (data.title
      ? data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
      : "");

  const blocker = coverAltBlocker(data);
  if (blocker) throw new Error(blocker);

  const payload: Insert<"posts"> = { ...data, slug };
  const { data: post, error } = await supabase.from("posts").insert(payload).select().single();
  if (error) throw new Error(error.message);
  await supabase.from("audit_log").insert({ action: "create", table_name: "posts", row_id: post.id, after: post as unknown as AuditSnapshot });
  revalidateTag("posts", "max");
  revalidatePath("/admin/content/posts");
  return post;
}

export async function updatePost(id: string, data: Update<"posts">) {
  await requirePermission("posts", "update");
  const blocker = coverAltBlocker(data);
  if (blocker) throw new Error(blocker);
  const supabase = createServiceClient();
  const { data: before } = await supabase.from("posts").select("*").eq("id", id).single();
  const { data: post, error } = await supabase.from("posts").update(data).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  await supabase.from("audit_log").insert({ action: "update", table_name: "posts", row_id: id, before: before as unknown as AuditSnapshot, after: post as unknown as AuditSnapshot });
  revalidateTag("posts", "max");
  revalidatePath("/admin/content/posts");
  return post;
}

export async function deletePost(id: string) {
  await requirePermission("posts", "delete");
  const supabase = createServiceClient();
  const { data: before } = await supabase.from("posts").select("*").eq("id", id).single();
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await supabase.from("audit_log").insert({ action: "delete", table_name: "posts", row_id: id, before: before as unknown as AuditSnapshot });
  revalidateTag("posts", "max");
  revalidatePath("/admin/content/posts");
}

export async function publishPost(id: string) {
  await requirePermission("posts", "publish");
  const supabase = createServiceClient();

  // Checked against the saved row, not the form, so a publish cannot skip a
  // check by sending a different payload.
  const { data: current, error: readError } = await supabase
    .from("posts")
    .select("title, excerpt, body, cover_path, cover_alt")
    .eq("id", id)
    .single();
  if (readError) throw new Error(readError.message);
  const publishGate = publishBlocker(current);
  if (publishGate) throw new Error(publishGate);

  const { data: post, error } = await supabase.from("posts").update({ published: true, published_at: new Date().toISOString() }).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  await supabase.from("audit_log").insert({ action: "publish", table_name: "posts", row_id: id, after: post as unknown as AuditSnapshot });
  revalidateTag("posts", "max");
  revalidatePath("/admin/content/posts");
  return post;
}

export async function unpublishPost(id: string) {
  await requirePermission("posts", "publish");
  const supabase = createServiceClient();
  const { data: post, error } = await supabase.from("posts").update({ published: false }).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  revalidateTag("posts", "max");
  revalidatePath("/admin/content/posts");
  return post;
}

export async function getPost(id: string) {
  await requirePermission("posts", "read");
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("posts").select("*").eq("id", id).single();
  if (error) throw new Error(error.message);
  return data;
}
