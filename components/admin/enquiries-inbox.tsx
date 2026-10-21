"use client";

import { PageHeader } from "@/components/admin/page-header";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  updateEnquiryStatus,
  updatePartnerEnquiryStatus,
  updateVolunteerApplicationStatus,
} from "@/app/[locale]/admin/actions/enquiries";

type Enquiry = {
  id: string;
  reference: string;
  name: string | null;
  email: string;
  phone: string | null;
  enquiry_type: string;
  message: string;
  status: string;
  notes: string | null;
  created_at: string;
};

type PartnerEnquiry = {
  id: string;
  reference: string;
  organisation: string;
  contact_name: string;
  email: string;
  phone: string | null;
  partnership_type: string;
  message: string;
  status: string;
  notes: string | null;
  created_at: string;
};

type VolunteerApp = {
  id: string;
  reference: string;
  name: string;
  email: string;
  phone: string | null;
  motivation: string;
  status: string;
  notes: string | null;
  created_at: string;
  volunteer_roles?: { title: string } | null;
};

const STATUSES = ["new", "read", "replied", "archived"];

export function EnquiriesInbox({
  enquiries,
  partnerEnquiries,
  volunteerApplications,
  initialTab = "contact",
}: {
  enquiries: Enquiry[];
  partnerEnquiries: PartnerEnquiry[];
  volunteerApplications: VolunteerApp[];
  /**
   * Which tab to open. Set from `?tab=` so the sidebar's permission-gated
   * entries can deep-link here — see the note on `/admin/enquiries`.
   */
  initialTab?: "contact" | "partner" | "volunteer";
}) {
  const [tab, setTab] = useState<"contact" | "partner" | "volunteer">(initialTab);
  const [pending, startTransition] = useTransition();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Enquiries"
        description={`{newCount} new across all channels.`}
      />

      <div className="flex gap-2 border-b border-border">
        {[
          { key: "contact" as const, label: "Contact", count: enquiries.filter((e) => e.status === "new").length },
          { key: "partner" as const, label: "Partners", count: partnerEnquiries.filter((e) => e.status === "new").length },
          { key: "volunteer" as const, label: "Volunteers", count: volunteerApplications.filter((e) => e.status === "new").length },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className="ml-2 rounded-full bg-brand-600 px-2 py-0.5 text-xs text-white">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "contact" && (
        <EnquiryTable
          items={enquiries}
          onStatusChange={(id, status) => {
            startTransition(async () => {
              try {
                await updateEnquiryStatus(id, status);
                toast.success("Status updated");
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Update failed");
              }
            });
          }}
          pending={pending}
        />
      )}

      {tab === "partner" && (
        <PartnerTable
          items={partnerEnquiries}
          onStatusChange={(id, status) => {
            startTransition(async () => {
              try {
                await updatePartnerEnquiryStatus(id, status);
                toast.success("Status updated");
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Update failed");
              }
            });
          }}
          pending={pending}
        />
      )}

      {tab === "volunteer" && (
        <VolunteerTable
          items={volunteerApplications}
          onStatusChange={(id, status) => {
            startTransition(async () => {
              try {
                await updateVolunteerApplicationStatus(id, status);
                toast.success("Status updated");
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Update failed");
              }
            });
          }}
          pending={pending}
        />
      )}
    </div>
  );
}

function EnquiryTable({
  items,
  onStatusChange,
  pending,
}: {
  items: Enquiry[];
  onStatusChange: (id: string, status: string) => void;
  pending: boolean;
}) {
  if (items.length === 0) {
    return <EmptyState label="No contact enquiries yet." />;
  }
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-surface">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-ink-muted">From</th>
            <th className="px-4 py-3 text-left font-medium text-ink-muted">Type</th>
            <th className="px-4 py-3 text-left font-medium text-ink-muted">Message</th>
            <th className="px-4 py-3 text-left font-medium text-ink-muted">Status</th>
            <th className="px-4 py-3 text-left font-medium text-ink-muted">Date</th>
            <th className="px-4 py-3 text-left font-medium text-ink-muted">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((e) => (
            <tr key={e.id} className="hover:bg-surface-lilac/50">
              <td className="px-4 py-3">
                <div className="font-medium text-ink">{e.name || "—"}</div>
                <div className="text-xs text-ink-muted">{e.email}</div>
              </td>
              <td className="px-4 py-3 text-ink-muted">{e.enquiry_type}</td>
              <td className="px-4 py-3 text-ink-muted max-w-xs truncate">{e.message}</td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(e.status)}`}>
                  {e.status}
                </span>
              </td>
              <td className="px-4 py-3 text-ink-muted">
                {new Date(e.created_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                <select
                  value={e.status}
                  onChange={(ev) => onStatusChange(e.id, ev.target.value)}
                  disabled={pending}
                  className="rounded-lg border border-border bg-card px-2 py-1 text-xs text-ink"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PartnerTable({
  items,
  onStatusChange,
  pending,
}: {
  items: PartnerEnquiry[];
  onStatusChange: (id: string, status: string) => void;
  pending: boolean;
}) {
  if (items.length === 0) {
    return <EmptyState label="No partner enquiries yet." />;
  }
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-surface">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-ink-muted">Organisation</th>
            <th className="px-4 py-3 text-left font-medium text-ink-muted">Contact</th>
            <th className="px-4 py-3 text-left font-medium text-ink-muted">Type</th>
            <th className="px-4 py-3 text-left font-medium text-ink-muted">Status</th>
            <th className="px-4 py-3 text-left font-medium text-ink-muted">Date</th>
            <th className="px-4 py-3 text-left font-medium text-ink-muted">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((e) => (
            <tr key={e.id} className="hover:bg-surface-lilac/50">
              <td className="px-4 py-3 font-medium text-ink">{e.organisation}</td>
              <td className="px-4 py-3">
                <div className="text-ink">{e.contact_name}</div>
                <div className="text-xs text-ink-muted">{e.email}</div>
              </td>
              <td className="px-4 py-3 text-ink-muted">{e.partnership_type}</td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(e.status)}`}>
                  {e.status}
                </span>
              </td>
              <td className="px-4 py-3 text-ink-muted">
                {new Date(e.created_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                <select
                  value={e.status}
                  onChange={(ev) => onStatusChange(e.id, ev.target.value)}
                  disabled={pending}
                  className="rounded-lg border border-border bg-card px-2 py-1 text-xs text-ink"
                >
                  {["new", "read", "replied", "in_discussion", "partnered", "declined", "archived"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VolunteerTable({
  items,
  onStatusChange,
  pending,
}: {
  items: VolunteerApp[];
  onStatusChange: (id: string, status: string) => void;
  pending: boolean;
}) {
  if (items.length === 0) {
    return <EmptyState label="No volunteer applications yet." />;
  }
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-surface">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-ink-muted">Applicant</th>
            <th className="px-4 py-3 text-left font-medium text-ink-muted">Role</th>
            <th className="px-4 py-3 text-left font-medium text-ink-muted">Motivation</th>
            <th className="px-4 py-3 text-left font-medium text-ink-muted">Status</th>
            <th className="px-4 py-3 text-left font-medium text-ink-muted">Date</th>
            <th className="px-4 py-3 text-left font-medium text-ink-muted">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((a) => (
            <tr key={a.id} className="hover:bg-surface-lilac/50">
              <td className="px-4 py-3">
                <div className="font-medium text-ink">{a.name}</div>
                <div className="text-xs text-ink-muted">{a.email}</div>
              </td>
              <td className="px-4 py-3 text-ink-muted">{a.volunteer_roles?.title ?? "—"}</td>
              <td className="px-4 py-3 text-ink-muted max-w-xs truncate">{a.motivation}</td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(a.status)}`}>
                  {a.status}
                </span>
              </td>
              <td className="px-4 py-3 text-ink-muted">
                {new Date(a.created_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                <select
                  value={a.status}
                  onChange={(ev) => onStatusChange(a.id, ev.target.value)}
                  disabled={pending}
                  className="rounded-lg border border-border bg-card px-2 py-1 text-xs text-ink"
                >
                  {["new", "reviewing", "accepted", "declined", "withdrawn"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-brand-600/30 bg-surface-lilac p-10 text-center">
      <p className="text-sm text-ink-muted">{label}</p>
    </div>
  );
}

function statusColor(status: string): string {
  switch (status) {
    case "new":
      return "bg-blue-100 text-blue-700";
    case "read":
      return "bg-gray-100 text-gray-600";
    case "replied":
      return "bg-green-100 text-green-700";
    case "archived":
      return "bg-gray-100 text-gray-500";
    case "accepted":
      return "bg-green-100 text-green-700";
    case "declined":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}
