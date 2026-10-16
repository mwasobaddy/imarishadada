import { expect, test } from "@playwright/test";

/**
 * Routes the home page links to that are specified but not yet built. Each has
 * its own doc in doc/roadmap/. Next's partial prefetching requests them, which
 * shows up as a 404 in the console.
 *
 * This list must shrink to empty as those pages ship. When it does, delete the
 * exemption — a homepage whose navigation 404s is not shippable.
 */
const PENDING_ROUTES = ["/programmes", "/impact", "/stories", "/about", "/contact", "/donate"];

test.describe("homepage — structure", () => {
  test("renders with no unexpected console errors or failed requests", async ({ page }) => {
    const problems: string[] = [];

    page.on("console", (m) => {
      if (m.type() !== "error") return;
      // "Failed to load resource" arrives here without a URL, so it cannot be
      // correlated to a route. The response listener below already reports
      // every 4xx/5xx precisely — counting it twice would double-report.
      if (/Failed to load resource/i.test(m.text())) return;
      problems.push(`console: ${m.text()}`);
    });
    page.on("response", (r) => {
      if (r.status() < 400) return;
      const url = new URL(r.url());
      const isPendingPrefetch =
        url.searchParams.has("_rsc") && PENDING_ROUTES.some((p) => url.pathname === p);
      if (!isPendingPrefetch) problems.push(`${r.status()} ${url.pathname}`);
    });

    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.waitForLoadState("networkidle");

    expect(problems).toEqual([]);
  });

  test("every link in the primary navigation resolves", async ({ page, request }) => {
    await page.goto("/");
    const hrefs = await page
      .locator('header a[href^="/"]')
      .evaluateAll((nodes) =>
        [...new Set(nodes.map((n) => n.getAttribute("href") ?? ""))].filter(Boolean),
      );

    const pending = new Set(PENDING_ROUTES);
    for (const href of hrefs) {
      if (pending.has(href)) continue;
      const res = await request.get(href);
      expect(res.status(), `${href} should resolve`).toBeLessThan(400);
    }
  });

  test("has exactly one h1", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveCount(1);
  });

  test("does not skip heading levels", async ({ page }) => {
    await page.goto("/");
    const levels = await page
      .locator("h1, h2, h3, h4, h5, h6")
      .evaluateAll((nodes) => nodes.map((n) => Number(n.tagName.slice(1))));

    for (let i = 1; i < levels.length; i++) {
      expect(levels[i]! - levels[i - 1]!).toBeLessThanOrEqual(1);
    }
  });

  test("has no horizontal overflow at mobile width", async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("declares the exact document language", async ({ page }) => {
    await page.goto("/");
    // Never "en" on a localised page.
    await expect(page.locator("html")).toHaveAttribute("lang", "en-KE");
  });

  test("skip link is the first focusable element", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus");
    await expect(focused).toHaveText(/skip to content/i);
  });

  test("every image has an alt attribute", async ({ page }) => {
    await page.goto("/");
    const missing = await page
      .locator("img")
      .evaluateAll((imgs) => imgs.filter((i) => !i.hasAttribute("alt")).length);
    expect(missing).toBe(0);
  });
});

test.describe("homepage — SEO", () => {
  test("serves complete head metadata", async ({ page }) => {
    await page.goto("/");

    const title = await page.title();
    expect(title.length).toBeGreaterThan(20);
    expect(title).toContain("Imarisha Dada");

    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      /.+/,
    );
  });

  test("sets a canonical URL", async ({ page }) => {
    await page.goto("/");
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveCount(1);
    // getAttribute returns the literal attribute, which may or may not carry
    // the trailing slash — accept either, reject a wrong host.
    await expect(canonical).toHaveAttribute(
      "href",
      /^https:\/\/imarishadada\.org\/?$/,
    );
  });

  test("emits a complete hreflang set with no orphans", async ({ page }) => {
    await page.goto("/");
    const alts = await page
      .locator('link[rel="alternate"][hreflang]')
      .evaluateAll((nodes) =>
        nodes.map((n) => ({
          lang: n.getAttribute("hreflang"),
          href: n.getAttribute("href"),
        })),
      );

    const langs = alts.map((a) => a.lang);
    expect(langs).toContain("en");
    expect(langs).toContain("sw");

    // Self-referencing tag is required or Google ignores the cluster.
    const self = alts.find((a) => a.lang === "en");
    expect(self?.href).toMatch(/^https:\/\/imarishadada\.org\/?$/);
  });

  test("sets themeColor in a viewport export, not in metadata", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
      "content",
      /#/,
    );
  });

  test("publishes valid NGO and WebSite JSON-LD", async ({ page }) => {
    await page.goto("/");
    const blocks = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((nodes) => nodes.map((n) => JSON.parse(n.textContent ?? "{}")));

    const all = blocks.flat();
    const types = all.map((b: { "@type"?: string }) => b["@type"]);

    expect(types).toContain("NGO");
    expect(types).toContain("WebSite");

    const org = all.find((b: { "@type"?: string }) => b["@type"] === "NGO") as Record<
      string,
      unknown
    >;
    expect(org.name).toBe("Imarisha Dada");
    // No fabricated identifiers.
    expect(org).not.toHaveProperty("telephone");
    expect(org).not.toHaveProperty("identifier");
  });

  test("serves robots.txt without disallowing /donate", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    expect(body).toContain("Sitemap:");
    expect(body).not.toMatch(/Disallow:\s*\/donate/);
  });

  test("serves a sitemap with hreflang maps", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    expect(body).toContain("<urlset");
    expect(body).toContain('hreflang="sw"');
  });
});

test.describe("homepage — accessibility", () => {
  // The mobile toggle is `lg:hidden`, so on a desktop viewport it is
  // intentionally absent from the accessibility tree. These run on mobile only.
  test("header mobile menu traps focus and closes on Escape", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile toggle is hidden at desktop widths");

    await page.goto("/");

    const toggle = page.getByRole("button", { name: /open menu/i });
    await toggle.click();

    const dialog = page.getByRole("dialog", { name: /menu/i });
    await expect(dialog).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("mobile menu exposes aria-expanded", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile toggle is hidden at desktop widths");

    await page.goto("/");
    const toggle = page.getByRole("button", { name: /open menu/i });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    await expect(
      page.getByRole("button", { name: /close menu/i }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  test("interactive elements have an accessible name", async ({ page }) => {
    await page.goto("/");
    const unnamed = await page
      .locator("a:visible, button:visible")
      .evaluateAll((nodes) =>
        nodes.filter((n) => {
          const label =
            n.getAttribute("aria-label") ??
            n.textContent?.trim() ??
            (n.querySelector(".sr-only")?.textContent ?? "");
          return label.trim() === "";
        }).length,
      );
    expect(unnamed).toBe(0);
  });
});

test.describe("homepage — trust honesty", () => {
  test("never renders a placeholder registration number", async ({ page }) => {
    await page.goto("/");
    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body).not.toContain("tbc");
    expect(body).not.toContain("lorem ipsum");
    expect(body).not.toContain("coming soon");
  });

  test("donation amounts render with KSh", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/KSh\s?500/).first()).toBeVisible();
  });
});