import { createAuthServerClient } from "@/lib/supabase/auth-server";
import type { MediaOption } from "@/components/admin/media-picker";
import { TeamMembersEditor } from "@/components/admin/team-members-editor";

/**
 * Uploaded media, shaped for the picker.
 *
 * The picker merges this with the static manifest, so an empty table is fine —
 * the 48 shipped photographs still appear. `source: "uploaded"` is what lets
 * the picker offer the row's alt text.
 */
async function loadUploadedMedia(): Promise<MediaOption[]> {
  const supabase = await createAuthServerClient();
  const { data } = await supabase
    .from("media")
    .select("file_path, file_name, alt_text, consent_tier, width, height")
    .order("created_at", { ascending: false });

  return (data ?? []).map((m) => ({
    path: m.file_path,
    label: m.file_name,
    group: "uploaded",
    width: m.width ?? 0,
    height: m.height ?? 0,
    alt: m.alt_text,
    consentTier: m.consent_tier,
    source: "uploaded" as const,
  }));
}

export default async function TeamPage() {
  const supabase = await createAuthServerClient();
  const [{ data: members }, media] = await Promise.all([
    supabase.from("team_members").select("*").order("sort_order"),
    loadUploadedMedia(),
  ]);

  return (
    <TeamMembersEditor
      members={(members ?? []).map((m) => ({
        ...m,
        social_links: (m.social_links as Record<string, string> | null) ?? null,
      }))}
      media={media}
    />
  );
}
