-- Imarisha Dada — Phase 5: fix a duplicated seed
--
-- ## What went wrong
--
-- Migration 0022 seeded the governance gaps with:
--
--     insert into public.transparency_gaps (...) values (...)
--     on conflict do nothing;
--
-- `on conflict do nothing` is valid SQL and it does catch conflicts — but only
-- conflicts that would violate an **existing** unique index. `transparency_gaps`
-- had none. With no unique key, nothing conflicts, every insert succeeds, and
-- re-applying the seed duplicates every row.
--
-- 0022 was applied twice — once to add the columns, once to add the
-- `financial_breakdown.direction` column — so the seven governance gaps were
-- inserted twice and the page rendered each of them twice.
--
-- The same clause appears in 0018 for the measurement gaps. That migration has
-- only been applied once, so those rows are clean, and the constraint added
-- below now makes the clause in 0018 a real guard for any future re-run.
--
-- ## The gap in the test suite this exposes
--
-- Nothing here would have caught it. A migration that is not idempotent can only
-- be caught by applying it twice and counting rows, which is an integration test
-- — and the team defers those. Worth adding when the suite runs.
--
-- ## Why this is a separate migration
--
-- 0022 has already run against this database, and re-running an amended version
-- would try to add the unique constraint while the duplicate rows it is meant to
-- prevent are still present, which fails. So 0022 carries the constraint for a
-- fresh apply, and this migration repairs the database that already exists.

-- ---------------------------------------------------------------------------
-- 1. Remove the duplicates, keeping the earliest of each
-- ---------------------------------------------------------------------------
-- `created_at` rather than `id`: the first insert is the one whose `sort_order`
-- and wording the page has been rendering, and ids are random.

delete from public.transparency_gaps
 where id not in (
   select distinct on (kind, item) id
     from public.transparency_gaps
    order by kind, item, created_at asc, id asc
 );

-- ---------------------------------------------------------------------------
-- 2. Make the guard real
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'transparency_gaps_kind_item_key'
  ) then
    alter table public.transparency_gaps
      add constraint transparency_gaps_kind_item_key unique (kind, item);
  end if;
end $$;

comment on constraint transparency_gaps_kind_item_key on public.transparency_gaps is
  'A gap is identified by what it says. This exists so `on conflict (kind, item) do nothing` in the seed migrations is a real guard rather than a no-op.';

notify pgrst, 'reload schema';
