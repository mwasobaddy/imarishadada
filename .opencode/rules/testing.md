# Testing — When TDD Applies

## Skills to load

- `tdd-guide` — the red/green/refactor loop
- `testing-anti-patterns` — what not to do
- `condition-based-waiting` — async test flakiness

## Execution policy — write now, run later (decided 2026-10-15)

The team is deferring test execution until the project is feature-complete.

- **Always write the test.** Skipping the test is not allowed.
- **Do not run** `npm run verify`, `npm run test:e2e`, or Lighthouse unless the user asks.
- **Do run** `npm run build` and `npx tsc --noEmit` — those catch type and compile errors, which are not the same as testing behaviour.
- When reporting, state plainly that execution was skipped. Never imply a suite passed
  when it was only written.

When the user asks to run everything:

```sh
npm run verify && npm run test:e2e
```

## TDD is REQUIRED for

| Area | Why |
|---|---|
| Donation / payment / ledger logic | Money. A wrong result is a real loss. |
| Auth, session, permissions, RLS policies | Security boundary. |
| Any PII read/write | Donor and minors' data. |
| Data migrations and RPC functions | Irreversible in prod. |
| Calculators (fees, totals, eligibility) | Wrong numbers are silently wrong. |
| API route handlers with branching | Regression surface. |

## TDD is NOT required for

- Pure visual / CSS / Tailwind changes
- Copy and content edits
- Layout and spacing tweaks
- One-off static pages with no logic
- Metadata / sitemap / robots changes (verify by inspection + build)

For these, just run `npm run build && npm run lint` and eyeball the page. Writing tests for markup is ceremony.

## Hybrid mode (preferred for UI)

For a feature that is mostly UI with a slice of logic:
1. Write the **logic** test first (`lib/`, pure functions, no DOM).
2. Implement the logic until it passes.
3. Build the component against the tested logic.
4. Add a single component test for the critical interaction.
5. Add a Playwright e2e only for the money/auth happy path.

## The loop

```
1. RED     — write one failing test that describes the behaviour.
             Run it. Confirm it fails for the RIGHT reason (not an import error).
2. GREEN   — write the minimum code to pass. Hardcoding is fine here.
3. REFACTOR— clean up with the test green.
4. Repeat  — one test at a time.
```

Never: write the implementation first and add "tests" after. That is characterisation testing, not TDD, and it will encode the bug.

## Test pyramid for this repo

```
tests/
  setup.ts         # jest-dom, matchMedia/ResizeObserver/IntersectionObserver shims
  unit/            # vitest — lib/ functions, utils, validation schemas (zod), components
  integration/     # vitest + test Supabase — RPC functions, RLS policies
  e2e/             # playwright — donation flow, signup, admin login
```

Playwright runs against a **production build** (`npm run build && npm run start`), not the dev server — HMR noise pollutes the console-error assertion and dev-only behaviour can mask prod bugs. Two projects: `chromium` and `mobile-safari` (Pixel 7). Mobile is the primary target for this audience; do not add a mobile test that only exists on desktop.

Commands:
```sh
npm test              # vitest run  (unit + integration)
npm run test:watch    # vitest, watch mode
npm run test:e2e      # playwright, builds + serves production, then tests
npm run verify        # lint + build + test  — run this before reporting done
```

Playwright needs browsers once per machine: `npx playwright install chromium`.
Set `PLAYWRIGHT_BASE_URL` to test against an already-running server.

## Non-negotiables

- **RLS policy tests are mandatory.** Every new policy gets a test that runs as `anon` and as `authenticated`, asserting both the allowed and the denied path.
- **Never** assert on mock behaviour. Mock the network boundary, not the thing under test.
- **No test-only methods** on production classes (`isTest()`, `__debug()`, `resetForTest()`).
- **Never wait on `sleep`/timeouts** — poll for the condition. Flaky tests are worse than no tests.
- One behaviour per test. Test names read as sentences: `"anon cannot read donor PII"`.
- Tests must not hit the network. Supabase integration tests run against a local stack or a dedicated test project ref, never production.

## Regression discipline

Before touching a file, run the existing tests. If one was already failing, say so before changing anything — do not silently "fix" it and claim your change was clean.

Before declaring any task done:

```sh
npm run verify   # lint + build + vitest
```

All three green. Run `npm run test:e2e` when a user-facing flow changed. Report failures honestly rather than narrowing the test scope to make things pass.
