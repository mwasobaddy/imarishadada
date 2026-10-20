import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { MediaLibrary } from "@/components/admin/media-library";

export default async function MediaPage() {
  const supabase = await createAuthServerClient();
  const { data: media } = await supabase.from("media").select("*").order("created_at", { ascending: false });
  return <MediaLibrary media={media ?? []} />;
}
