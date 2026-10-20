"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/client";
import { hasPermission } from "@/lib/admin/permissions";

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

export async function createPost(data: Record<string, unknown>) {
  await requirePermission("posts", "create");
  const supabase = createServiceClient();
  if (!data.slug && data.title) {
    data.slug = (data.title as string).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
  const { data: post, error } = await supabase.from("posts").insert(data as any).select().single();
  if (error) throw new Error(error.message);
  await supabase.from("audit_log").insert({ action: "create", table_name: "posts", row_id: post.id, after: post as any });
  revalidatePath("/admin/content/posts");
  return post;
}

export async function updatePost(id: string, data: Record<string, unknown>) {
  await requirePermission("posts", "update");
  const supabase = createServiceClient();
  const { data: before } = await supabase.from("posts").select("*").eq("id", id).single();
  const { data: post, error } = await supabase.from("posts").update(data as any).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  await supabase.from("audit_log").insert({ action: "update", table_name: "posts", row_id: id, before: before as any, after: post as any });
  revalidatePath("/admin/content/posts");
  return post;
}

export async function deletePost(id: string) {
  await requirePermission("posts", "delete");
  const supabase = createServiceClient();
  const { data: before } = await supabase.from("posts").select("*").eq("id", id).single();
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await supabase.from("audit_log").insert({ action: "delete", table_name: "posts", row_id: id, before: before as any });
  revalidatePath("/admin/content/posts");
}

export async function publishPost(id: string) {
  await requirePermission("posts", "publish");
  const supabase = createServiceClient();
  const { data: post, error } = await supabase.from("posts").update({ published: true, published_at: new Date().toISOString() }).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  await supabase.from("audit_log").insert({ action: "publish", table_name: "posts", row_id: id, after: post as any });
  revalidatePath("/admin/content/posts");
  return post;
}

export async function unpublishPost(id: string) {
  await requirePermission("posts", "publish");
  const supabase = createServiceClient();
  const { data: post, error } = await supabase.from("posts").update({ published: false }).eq("id", id).select().single();
  if (error) throw new Error(error.message);
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
