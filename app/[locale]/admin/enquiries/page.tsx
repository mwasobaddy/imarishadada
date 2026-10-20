import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { EnquiriesInbox } from "@/components/admin/enquiries-inbox";

export default async function EnquiriesPage() {
  const supabase = await createAuthServerClient();
  const [{ data: enquiries }, { data: partnerEnquiries }, { data: volunteerApps }] = await Promise.all([
    supabase.from("enquiries").select("*").order("created_at", { ascending: false }),
    supabase.from("partner_enquiries").select("*").order("created_at", { ascending: false }),
    supabase.from("volunteer_applications").select("*, volunteer_roles(title)").order("created_at", { ascending: false }),
  ]);

  return (
    <EnquiriesInbox
      enquiries={enquiries ?? []}
      partnerEnquiries={partnerEnquiries ?? []}
      volunteerApplications={volunteerApps ?? []}
    />
  );
}
