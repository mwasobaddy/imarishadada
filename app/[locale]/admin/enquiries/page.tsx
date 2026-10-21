import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { EnquiriesInbox } from "@/components/admin/enquiries-inbox";

/**
 * The three inboxes, in one place.
 *
 * ## Why `?tab=` exists
 *
 * The sidebar has three entries — Enquiries, Partner enquiries, Volunteer apps —
 * each gated on its own permission, because a volunteer coordinator has
 * `volunteer_applications:read` without `enquiries:read`. They are three views of
 * this one page, so the two narrower entries deep-link into a tab rather than
 * pointing at routes that were never built.
 *
 * They used to point at `/admin/partner-enquiries` and
 * `/admin/volunteer-applications`, which do not exist. The consequence was worse
 * than three dead links: a volunteer coordinator holds
 * `volunteer_applications:read`, `partner_enquiries:read` and `volunteer_roles:*`
 * but **not** `enquiries:read`, so every link they could see 404'd and the one
 * link that worked was hidden from them. The role had no working path to any of
 * its own resources.
 */
export default async function EnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;

  const supabase = await createAuthServerClient();
  const [{ data: enquiries }, { data: partnerEnquiries }, { data: volunteerApps }] = await Promise.all([
    supabase.from("enquiries").select("*").order("created_at", { ascending: false }),
    supabase.from("partner_enquiries").select("*").order("created_at", { ascending: false }),
    supabase.from("volunteer_applications").select("*, volunteer_roles(title)").order("created_at", { ascending: false }),
  ]);

  // Only the three known tabs. An unknown value falls back rather than
  // rendering an empty inbox.
  const initialTab =
    tab === "partner" || tab === "volunteer" ? tab : "contact";

  return (
    <EnquiriesInbox
      initialTab={initialTab}
      enquiries={enquiries ?? []}
      partnerEnquiries={partnerEnquiries ?? []}
      volunteerApplications={volunteerApps ?? []}
    />
  );
}
