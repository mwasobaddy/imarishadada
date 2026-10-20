import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { getCurrentStaff } from "@/lib/admin/permissions";
import { RealtimeChat } from "@/components/admin/realtime-chat";

export default async function ChatPage() {
  const staff = await getCurrentStaff();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-600">Team chat</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Real-time messaging for authenticated staff. Messages are immutable.
        </p>
      </div>
      <RealtimeChat channel="general" userName={staff?.display_name ?? "Unknown"} />
    </div>
  );
}
