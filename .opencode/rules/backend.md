# Backend — Supabase

Applies to any data, auth, storage, or server-side logic.

## Skills to load

- `supabase` — always, for any Supabase work
- `supabase-postgres-best-practices` — for schema, indexes, query tuning

## MCP tools available

Project ref `cxwrvstojafdjqvelbno`. Prefer MCP over writing SQL by hand:
`supabase_list_tables`, `supabase_execute_sql`, `supabase_apply_migration` (DDL), `supabase_get_advisors`, `supabase_query_logs`.

**Workflow: inspect → design → migrate → advise.** Never guess at existing schema — list the tables first. After any DDL, run `supabase_get_advisors` (security + performance) before moving on.

## Client setup

```ts
// lib/supabase/server.ts  — Server Components, Route Handlers, Server Actions
import { createClient } from "@supabase/ssr";
export function createClient() {
  const cookieStore = cookies();               // async in Next 16
  return createClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => list.forEach(({ name, value, options }) =>
        cookieStore.set(name, value, options)),
    },
  });
}

// lib/supabase/client.ts — "use client" components only
import { createBrowserClient } from "@supabase/ssr";
```

Three clients: server, browser, and service-role (service role key is **server-only** — never importable from a client component, never in `NEXT_PUBLIC_*`).

## Row-Level Security — non-negotiable

This app holds donor PII, financial records, and minors' data. RLS is the security boundary; the anon key is public.

- **Every table gets RLS enabled.** `ALTER TABLE x ENABLE ROW LEVEL SECURITY;` with no exceptions.
- Default-deny: create the policy explicitly, never assume a table without policies is safe.
- Public read → `to anon, authenticated using (true)` on the narrowest column set.
- User-owned rows → `auth.uid() = user_id`.
- Staff/admin → `to authenticated using (exists (select 1 from staff where user_id = auth.uid() and role = 'admin'))`. Prefer a `staff` table over hardcoding emails in policies.
- Writes to public tables go through Server Actions or Edge Functions. Never let `anon` insert/update/delete.
- Test the policy as `anon` **and** as `authenticated` before shipping. A policy that only passes as the owner is broken.

## Schema conventions

- `uuid` PKs with `gen_random_uuid()` default. `created_at timestamptz not null default now()`.
- Money: `numeric(12,2)` plus a `currency text` column constrained to `'KES'`. Never floats.
- Soft delete via `deleted_at timestamptz`, never `DROP`.
- Every migration file in `supabase/migrations/NNNN_description.sql`, applied via `supabase_apply_migration` — never hand-edited into the live DB.
- Index every foreign key and every column you filter/sort on. Run `supabase_get_advisors` to confirm.
- JSON-LD payloads and form payloads get `check (jsonb_typeof(col) = 'object')`.

## Postgres performance

- Never `SELECT *` — list columns.
- Always paginate: `.range(from, to)` or `.limit(n)`, ordered deterministically.
- `.single()` throws on 0 or >1 rows; use `.maybeSingle()` for optional relations.
- N+1: use `select(..., related(*))` embedded resources, or batch with `in` filters.
- Add `select=`, `insert=`, `update=`, `delete=` column lists to avoid over-fetching sensitive fields.
- Long-running or uncached reads go through `'use cache'` + `cacheLife` + `cacheTag`.

## Auth

- Supabase Auth only. Sessions via `@supabase/ssr` cookies.
- Anything under `/admin`, `/dashboard`, `/api/private` — enforce in `proxy.ts` **and** in the data layer. Middleware alone is not authorization.
- Verify the user server-side in every Server Action and Route Handler. Never trust a client-supplied `user_id`.
- Rate-limit auth endpoints. Prefer OTP/magic link over passwords where possible.

## Storage

Donor photos, receipts, and programme assets go in Supabase Storage. Bucket policies mirror the table RLS. Serve via signed URLs for private buckets; never expose the service-role key.

## Money and data integrity

- Donation/ledger writes are **append-only**. Corrections are compensating rows, never `UPDATE`/`DELETE`.
- Wrap multi-step writes in a Postgres RPC (`supabase_execute_sql` to create the function) so they are atomic — never chain independent client calls.
- Any write touching money, auth, or PII requires tests. See `testing.md`.
