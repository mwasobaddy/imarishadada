import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { StoryForm } from "@/components/admin/story-form";

export default async function NewStoryPage() {
  const supabase = await createAuthServerClient();
  const { data: programmes } = await supabase
    .from("programmes")
    .select("id, title")
    .eq("active", true)
    .order("sort_order");

  return (
    <StoryForm programmes={programmes ?? []} />
  );
}
