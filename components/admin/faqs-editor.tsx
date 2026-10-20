"use client";

import { useState, useTransition } from "react";

import { PageHeader } from "@/components/admin/page-header";
import { toast } from "sonner";

import { createFaq, updateFaq, deleteFaq, toggleFaq } from "@/app/[locale]/admin/actions/faqs";

type Faq = {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  published: boolean;
};

const CATEGORIES = ["giving", "programmes", "about", "safeguarding", "general", "volunteering", "partnerships"];

export function FaqsEditor({ faqs: initial }: { faqs: Faq[] }) {
  const [faqs, setFaqs] = useState<Faq[]>(initial);
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<Faq>>({});
  const [pending, startTransition] = useTransition();

  function startCreate() {
    setCreating(true);
    setEditing(null);
    setForm({ question: "", answer: "", category: "general", sort_order: faqs.length + 1, published: true });
  }

  function startEdit(f: Faq) {
    setEditing(f.id);
    setCreating(false);
    setForm({ ...f });
  }

  function cancel() {
    setCreating(false);
    setEditing(null);
    setForm({});
  }

  async function save() {
    if (!form.question || !form.answer) { toast.error("Question and answer are required"); return; }
    startTransition(async () => {
      try {
        const payload = {
          question: form.question ?? "",
          answer: form.answer ?? "",
          category: form.category ?? "general",
          sort_order: form.sort_order ?? 0,
          published: form.published ?? true,
        };
        if (creating) {
          const created = await createFaq(payload);
          setFaqs((prev) => [...prev, created as Faq]);
          toast.success("FAQ created");
        } else if (editing) {
          const updated = await updateFaq(editing, payload);
          setFaqs((prev) => prev.map((f) => (f.id === editing ? (updated as Faq) : f)));
          toast.success("FAQ updated");
        }
        cancel();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this FAQ?")) return;
    startTransition(async () => {
      try {
        await deleteFaq(id);
        setFaqs((prev) => prev.filter((f) => f.id !== id));
        toast.success("FAQ deleted");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Delete failed");
      }
    });
  }

  async function handleToggle(id: string, published: boolean) {
    startTransition(async () => {
      try {
        await toggleFaq(id, published);
        setFaqs((prev) => prev.map((f) => (f.id === id ? { ...f, published } : f)));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Toggle failed");
      }
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Content"
        title="FAQs"
        description="{faqs.length} entries."
        action={(
          <button
            type="button"
            onClick={startCreate}
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-brand-600 px-5 py-2 text-sm font-medium text-brand-50 shadow-sm transition-all hover:bg-brand-700 hover:shadow-md"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
            </svg>
            New FAQ
          </button>
        )}
      />

      {(creating || editing) && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-brand-600">{creating ? "New FAQ" : "Edit FAQ"}</h2>
          <div>
            <label className="block text-sm font-medium text-ink">Category</label>
            <select value={form.category ?? "general"} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600">
              {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Question</label>
            <input value={form.question ?? ""} onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Answer</label>
            <textarea value={form.answer ?? ""} onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))} rows={4} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Sort order</label>
            <input type="number" value={form.sort_order ?? 0} onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} className="mt-1 block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={save} disabled={pending} className="rounded-full bg-brand-600 px-6 py-2 text-sm font-medium text-brand-50 hover:bg-brand-700 disabled:opacity-50">
              {pending ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={cancel} className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-ink-muted hover:border-brand-600 hover:text-brand-600">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-surface">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Question</th>
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Category</th>
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Status</th>
              <th className="px-4 py-3 text-left font-medium text-ink-muted">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {faqs.map((f) => (
              <tr key={f.id} className="hover:bg-surface-lilac/50">
                <td className="px-4 py-3 text-ink max-w-md truncate">{f.question}</td>
                <td className="px-4 py-3 text-ink-muted">{f.category}</td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => handleToggle(f.id, !f.published)} disabled={pending} className={`rounded-full px-2 py-0.5 text-xs font-medium ${f.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {f.published ? "Published" : "Draft"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => startEdit(f)} className="text-sm font-medium text-brand-600 hover:underline">Edit</button>
                    <button type="button" onClick={() => handleDelete(f.id)} disabled={pending} className="text-sm font-medium text-red-600 hover:underline">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
