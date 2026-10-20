import { getCurrentStaff } from "@/lib/admin/permissions";
import { PageHeader } from "@/components/admin/page-header";
import { RealtimeChat } from "@/components/admin/realtime-chat";

export default async function ChatPage() {
  const staff = await getCurrentStaff();
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow="Operations"
        title="Team chat"
        description="Real-time messaging for authenticated staff. Messages are immutable — there is no edit, and no delete."
      />
      <RealtimeChat channel="general" userName={staff?.display_name ?? "Unknown"} />
    </div>
  );
}
