"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShieldCheck, UserPlus } from "lucide-react";

import { createTeamMember, updateTeamMember, deleteTeamMember } from "@/app/[locale]/admin/actions/team";
import { MediaPicker } from "@/components/admin/media-picker";

/**
 * The social platforms we render, in the order they appear on the card.
 *
 * A fixed list, not free text. An arbitrary key would produce a `text-${key}`
 * class that Tailwind's scanner cannot see, so the icon would silently lose its
 * colour — the same failure mode documented on InteractiveHoverButton.
 */
const SOCIALS = [
  { key: "website", label: "Website", placeholder: "https://example.org" },
  { key: "email", label: "Email", placeholder: "name@example.org" },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/…" },
  { key: "x", label: "X", placeholder: "https://x.com/…" },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/…" },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/…" },
  { key: "github", label: "GitHub", placeholder: "https://github.com/…" },
  { key: "bluesky", label: "Bluesky", placeholder: "https://bsky.app/profile/…" },
  { key: "mastodon", label: "Mastodon", placeholder: "https://mastodon.social/@…" },
  { key: "threads", label: "Threads", placeholder: "https://threads.net/@…" },
  { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@…" },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@…" },
] as const;

type Member = {
  id: string;
  slug: string;
  name: string;
  role: string;
  title: string | null;
  department: string | null;
  bio: string | null;
  photo_path: string | null;
  safeguarding_officer: boolean;
  consent_recorded: boolean;
  social_links: Record<string, string> | null;
  sort_order: number;
  active: boolean;
};

function blank(): Partial<Member> {
  return {
    slug: "",
    name: "",
    role: "",
    title: "",
    department: "",
    bio: "",
    photo_path: "",
    safeguarding_officer: false,
    consent_recorded: false,
    social_links: {},
    sort_order: 0,
    active: true,
  };
}

export function TeamMembersEditor({
  members: initial,
}: {
  members: Member[];
}) {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>(initial);
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<Member>>(blank());
  const [pending, startTransition] = useTransition();

  function startCreate() {
    setCreating(true);
    setEditing(null);
    setForm({ ...blank(), sort_order: members.length + 1 });
  }

  function startEdit(m: Member) {
    setEditing(m.id);
    setCreating(false);
    setForm({ ...m, social_links: m.social_links ?? {} });
  }

  function cancel() {
    setCreating(false);
    setEditing(null);
    setForm(blank());
  }

  function set<K extends keyof Member>(key: K, value: Member[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setSocial(key: string, value: string) {
    setForm((f) => {
      const next = { ...(f.social_links ?? {}) };
      if (value.trim()) next[key] = value.trim();
      else delete next[key];
      return { ...f, social_links: next };
    });
  }

  async function save() {
    if (!form.name?.trim() || !form.role?.trim()) {
      toast.error("Name and role are required");
      return;
    }
    startTransition(async () => {
      try {
        const payload = {
          slug:
            form.slug?.trim() ||
            form.name!.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
          name: form.name!.trim(),
          role: form.role!.trim(),
          title: form.title || null,
          department: form.department || null,
          bio: form.bio || null,
          photo_path: form.photo_path || null,
          safeguarding_officer: form.safeguarding_officer ?? false,
          consent_recorded: form.consent_recorded ?? false,
          social_links:
            Object.keys(form.social_links ?? {}).length > 0 ? form.social_links : null,
          sort_order: form.sort_order ?? 0,
          active: form.active ?? true,
        };
        if (creating) {
          const created = await createTeamMember(payload);
          setMembers((prev) => [...prev, created as Member]);
          toast.success("Team member added");
        } else if (editing) {
          const updated = await updateTeamMember(editing, payload);
          setMembers((prev) => prev.map((m) => (m.id === editing ? (updated as Member) : m)));
          toast.success("Team member updated");
        }
        cancel();
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this team member?")) return;
    startTransition(async () => {
      try {
        await deleteTeamMember(id);
        setMembers((prev) => prev.filter((m) => m.id !== id));
        toast.success("Team member removed");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Delete failed");
      }
    });
  }

  const open = creating || editing !== null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-brand-600/70">
            Content
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Team members</h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-muted">
            Anyone without recorded consent is never rendered on the public site —
            the query filters on it, so an unconsented name cannot leak by accident.
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full bg-brand-600 px-5 py-2 text-sm font-medium text-brand-50 shadow-sm transition-all hover:bg-brand-700 hover:shadow-md"
        >
          <UserPlus className="h-4 w-4" />
          Add member
        </button>
      </div>

      {/* ── Editor ── */}
      {open && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-ink">
            {creating ? "New team member" : `Editing ${form.name}`}
          </h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field label="Name">
              <input
                value={form.name ?? ""}
                onChange={(e) => set("name", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Role" hint="Shown under the name">
              <input
                value={form.role ?? ""}
                onChange={(e) => set("role", e.target.value)}
                placeholder="e.g. Programme Lead"
                className={inputClass}
              />
            </Field>
            <Field label="Title" hint="Optional, e.g. MSc">
              <input
                value={form.title ?? ""}
                onChange={(e) => set("title", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Department" hint="Optional">
              <input
                value={form.department ?? ""}
                onChange={(e) => set("department", e.target.value)}
                className={inputClass}
              />
            </Field>

            <div className="sm:col-span-2">
              <Field label="Description" hint="Two or three sentences reads best">
                <textarea
                  value={form.bio ?? ""}
                  onChange={(e) => set("bio", e.target.value)}
                  rows={3}
                  className={`${inputClass} resize-y`}
                />
              </Field>
            </div>

            <div className="sm:col-span-2">
              <MediaPicker
                id="team-photo"
                label="Photograph"
                hint="Square crops work best"
                value={form.photo_path ?? ""}
                onChange={(path) => set("photo_path", path)}
              />
            </div>

            <Field label="Slug" hint="Auto-generated from the name">
              <input
                value={form.slug ?? ""}
                onChange={(e) => set("slug", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Sort order">
              <input
                type="number"
                value={form.sort_order ?? 0}
                onChange={(e) => set("sort_order", parseInt(e.target.value) || 0)}
                className={inputClass}
              />
            </Field>
          </div>

          {/* Social profiles */}
          <div className="mt-6 border-t border-border pt-5">
            <p className="text-sm font-medium text-ink">Social profiles</p>
            <p className="mt-1 text-xs text-ink-muted">
              Leave blank to omit. Only the filled ones appear on the card, so an
              empty field is not a broken link.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {SOCIALS.map((s) => (
                <Field key={s.key} label={s.label}>
                  <input
                    value={form.social_links?.[s.key] ?? ""}
                    onChange={(e) => setSocial(s.key, e.target.value)}
                    placeholder={s.placeholder}
                    inputMode={s.key === "email" ? "email" : "url"}
                    className={inputClass}
                  />
                </Field>
              ))}
            </div>
          </div>

          {/* Flags */}
          <div className="mt-6 flex flex-wrap items-center gap-5 border-t border-border pt-5">
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={form.consent_recorded ?? false}
                onChange={(e) => set("consent_recorded", e.target.checked)}
                className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-600"
              />
              Consent recorded
            </label>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={form.safeguarding_officer ?? false}
                onChange={(e) => set("safeguarding_officer", e.target.checked)}
                className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-600"
              />
              Safeguarding officer
            </label>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={form.active ?? true}
                onChange={(e) => set("active", e.target.checked)}
                className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-600"
              />
              Active
            </label>
          </div>

          {!form.consent_recorded && (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
              Without recorded consent this member will not appear on the public
              site. That is the intended behaviour, not a bug.
            </p>
          )}

          <div className="mt-6 flex gap-2 border-t border-border pt-5">
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="inline-flex min-h-10 items-center rounded-full bg-brand-600 px-5 py-2 text-sm font-medium text-brand-50 shadow-sm transition-all hover:bg-brand-700 disabled:opacity-40"
            >
              {pending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={cancel}
              className="inline-flex min-h-10 items-center rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-ink-muted transition-colors hover:border-brand-600 hover:text-brand-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── List ── */}
      {members.length === 0 && !open ? (
        <div className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-surface-lilac">
            <UserPlus className="h-5 w-5 text-ink-muted" />
          </div>
          <p className="mt-4 text-sm font-medium text-ink">No team members yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">
            Add someone and tick “Consent recorded” — until you do, they stay off
            the public site.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {members.map((m) => (
            <li
              key={m.id}
              className={`flex items-center gap-4 rounded-xl border bg-card p-3 transition-colors ${
                m.active ? "border-border" : "border-dashed border-border opacity-70"
              }`}
            >
              <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-lilac">
                {m.photo_path ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={m.photo_path} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-ink-muted">
                    {m.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </span>
                )}
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-medium text-ink">{m.name}</span>
                  {m.safeguarding_officer && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-700">
                      <ShieldCheck className="h-3 w-3" />
                      Safeguarding
                    </span>
                  )}
                  {!m.consent_recorded && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                      No consent
                    </span>
                  )}
                  {!m.active && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                      Hidden
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block truncate text-xs text-ink-muted">
                  {m.role}
                  {m.department ? ` · ${m.department}` : ""}
                  {m.social_links && Object.keys(m.social_links).length > 0
                    ? ` · ${Object.keys(m.social_links).length} social`
                    : ""}
                </span>
              </span>

              <span className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(m)}
                  className="text-sm font-medium text-brand-600 transition-colors hover:text-brand-700 hover:underline"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(m.id)}
                  disabled={pending}
                  className="text-sm font-medium text-red-600 transition-colors hover:text-red-700 hover:underline"
                >
                  Remove
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const inputClass =
  "mt-1.5 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink placeholder:text-ink-muted/50 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-sm font-medium text-ink">{label}</label>
        {hint && <span className="text-[11px] text-ink-muted/70">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
