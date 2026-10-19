#!/usr/bin/env node
/**
 * Translation catalogue guard.
 *
 * Runs before every build. Its job is to make the failure mode the roadmap
 * calls "prohibited" actually impossible rather than merely discouraged.
 *
 * ## The rule this enforces
 *
 * doc/roadmap/localisation.md §4.2:
 *
 *   | Safeguarding  | Professional translator with child-protection expertise.
 *   |               | Machine translation is **prohibited**.                   |
 *   | SRHR / health | Professional, medically reviewed.                      |
 *   | Financial     | Professional, legally reviewed per jurisdiction.          |
 *   | Testimonies   | Omit rather than machine translate.                     |
 *   | M-Pesa flow   | **Swahili-first.** `sw` is authored, not derived from `en`.|
 *
 * and §4.3: "Agree a bilingual glossary before translating."
 *
 * A machine draft of a safeguarding page is not a slightly worse page. It is a
 * policy document that misstates what the organisation promises to do to a
 * child, in a language only the organisation's own staff can catch. So the
 * check is structural, not advisory:
 *
 *   * A locale may only be added to `PUBLISHED_LOCALES` once its catalogue
 *     exists, is marked `published`, and has been signed off by a named human.
 *   * A catalogue marked `draft` can never satisfy the published-locale
 *     requirement.
 *   * A published catalogue must carry every key the English catalogue has.
 *     A missing key renders as a raw key string at runtime.
 *   * Non-English catalogues must record who reviewed them and when. That is
 *     what makes "professionally translated" auditable rather than a claim.
 *
 * ## Why this is a build step and not a CI check
 *
 * A CI check can be skipped, and a deploy that skipped it would publish an
 * unreviewed safeguarding policy. This runs before `next build`, so the build
 * itself fails. There is no way to produce a deployable artefact with an
 * unreviewed locale in it.
 *
 * Run standalone:  node i18n/check-translations.mjs
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MESSAGES = join(ROOT, "messages");

/**
 * Read `PUBLISHED_LOCALES` out of `lib/seo.ts`.
 *
 * Parsed rather than imported: this script runs before the TypeScript build
 * exists, and `lib/seo.ts` is plain enough to read the one literal we need.
 * If the shape of that file changes, this must change with it — hence the
 * loud failure below rather than a silent default.
 */
function readPublishedLocales() {
  const source = readFileSync(join(ROOT, "lib", "seo.ts"), "utf8");
  const match = source.match(
    /export const PUBLISHED_LOCALES\s*=\s*\[([^\]]*)\]/,
  );
  if (!match) {
    fail(
      "Could not find PUBLISHED_LOCALES in lib/seo.ts.\n" +
        "  This guard reads that list to decide which catalogues must be\n" +
        "  complete. Update the regex in i18n/check-translations.mjs if the\n" +
        "  declaration has moved.",
    );
  }
  return [...match[1].matchAll(/["'`]([^"'`]+)["'`]/g)].map((m) => m[1]);
}

/** Every leaf key in a catalogue, as dotted paths. */
function keyPaths(node, prefix = "") {
  if (node === null || typeof node !== "object" || Array.isArray(node)) {
    return [prefix];
  }
  return Object.entries(node).flatMap(([key, value]) =>
    keyPaths(value, prefix ? `${prefix}.${key}` : key),
  );
}

const errors = [];
function fail(message) {
  errors.push(message);
}

function loadCatalogue(locale) {
  const file = join(MESSAGES, `${locale}.json`);
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    fail(`messages/${locale}.json is not valid JSON: ${error.message}`);
    return null;
  }
}

function checkLocale(locale, reference) {
  // `reference` is the parsed English catalogue; the reference *locale code* is
  // always "en". Comparing the code against the object was the bug this
  // replaces — it made every catalogue look like a non-English one.
  const catalogue = loadCatalogue(locale);
  if (!catalogue) {
    fail(
      `messages/${locale}.json is missing.\n` +
        `  "${locale}" is listed in PUBLISHED_LOCALES, so the site will try to\n` +
        `  serve it. Either author the catalogue or remove the locale from\n` +
        `  PUBLISHED_LOCALES in lib/seo.ts.`,
    );
    return;
  }

  const meta = catalogue._meta ?? {};

  if (meta.status !== "published") {
    fail(
      `messages/${locale}.json has _meta.status = "${meta.status ?? "(missing)"}".\n` +
        `  Only a catalogue marked "published" may be served. A draft\n` +
        `  catalogue in a published locale is exactly the machine-translated\n` +
        `  safeguarding copy that doc/roadmap/localisation.md §4.2 prohibits.\n` +
        `  Set _meta.status to "published" only once a qualified human has\n` +
        `  signed off the copy.`,
    );
  }

  // English is the source of truth, authored by the organisation, so it
  // does not need a separate reviewer recorded against it.
  if (locale !== "en") {
    if (!meta.reviewedBy) {
      fail(
        `messages/${locale}.json has no _meta.reviewedBy.\n` +
          `  A non-English catalogue must name the person who reviewed it.\n` +
          `  "Professionally translated" has to be auditable, not a claim.`,
      );
    }
    if (!meta.reviewedAt) {
      fail(
        `messages/${locale}.json has no _meta.reviewedAt.\n` +
          `  Record the ISO date the review happened.`,
      );
    }
  }

  // Every key in the reference must exist. A missing key renders as a raw
  // key string at runtime, which is how an unreviewed gap reaches a visitor.
  const referenceKeys = new Set(
    keyPaths(reference).filter((key) => !key.startsWith("_meta.")),
  );
  const localeKeys = new Set(keyPaths(catalogue));

  const missing = [...referenceKeys].filter((key) => !localeKeys.has(key));
  if (missing.length > 0) {
    fail(
      `messages/${locale}.json is missing ${missing.length} key(s) present in\n` +
        `  messages/en.json:\n` +
        missing.map((key) => `    - ${key}`).join("\n") +
        `\n  A missing key renders as the raw key string at runtime.`,
    );
  }
}

// ---------------------------------------------------------------------------

const reference = loadCatalogue("en");
if (!reference) {
  fail(
    "messages/en.json is missing or invalid. The English catalogue is the\n" +
      "  reference every other catalogue is checked against.",
  );
}

const published = readPublishedLocales();

for (const locale of published) {
  if (reference) checkLocale(locale, reference);
}

// Every catalogue on disk that is NOT published is a draft. That is allowed —
// drafts are how the work gets done — but it must be labelled, so nobody
// mistakes a draft for a shipped locale.
for (const locale of ["sw", "fr", "de", "pt"]) {
  if (published.includes(locale)) continue;
  const catalogue = loadCatalogue(locale);
  if (!catalogue) continue;
  if ((catalogue._meta ?? {}).status === "published") {
    fail(
      `messages/${locale}.json is marked "published" but "${locale}" is not in\n` +
        `  PUBLISHED_LOCALES. Either publish the locale in lib/seo.ts or mark\n` +
        `  the catalogue as a draft. A published catalogue that is not served is\n` +
        `  a catalogue that will drift from the one in production.`,
    );
  }
}

if (errors.length > 0) {
  console.error("\nTranslation catalogue check FAILED:\n");
  for (const error of errors) console.error(`  ✗ ${error}\n`);
  process.exit(1);
}

console.log(
  `✓ Translation catalogues OK (${published.length} published: ${published.join(", ")})`,
);
