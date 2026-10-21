import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { getCurrentStaff } from "@/lib/admin/permissions";
import { MediaLibrary } from "@/components/admin/media-library";

export default async function MediaPage() {
  const supabase = await createAuthServerClient();
  const [{ data: media }, staff] = await Promise.all([
    supabase.from("media").select("*").order("created_at", { ascending: false }),
    getCurrentStaff(),
  ]);

  return (
    <MediaLibrary
      media={media ?? []}
      isDeveloper={staff?.is_developer ?? false}
    />
  );
}
