import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { TeamMembersEditor } from "@/components/admin/team-members-editor";

export default async function TeamPage() {
  const supabase = await createAuthServerClient();
  const { data: members } = await supabase.from("team_members").select("*").order("sort_order");
  return (
    <TeamMembersEditor
      members={(members ?? []).map((m) => ({
        ...m,
        social_links: (m.social_links as Record<string, string> | null) ?? null,
      }))}
    />
  );
}
