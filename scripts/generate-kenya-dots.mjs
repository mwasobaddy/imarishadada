#!/usr/bin/env node
/**
 * Precomputes the Kenya dot coordinates for `components/site/kenya-map.tsx`.
 *
 * ## Why this exists
 *
 * `svg-dotted-map`'s `createMap()` is expensive — roughly 25 seconds for the
 * 300x150 canvas at 50k samples. Calling it during render meant every
 * prerender worker paid that cost, and the production build failed outright:
 * `/_global-error` exceeded the 60-second per-page budget and the build was
 * retried then aborted.
 *
 * The map is a fixed, decorative background that never changes. So the points
 * are generated once, here, and committed as data. The component then reads a
 * ~20 KB JSON file with no computation at all, which makes the page
 * deterministic and the build fast.
 *
 * ## Run it when
 *
 * Only if you change the canvas size, the window, or `MAP_SAMPLES` in
 * `kenya-map.tsx`. Keep those constants in sync with CANVAS/WINDOW below —
 * this script deliberately does not import them so the committed JSON stays
 * reproducible from this file alone.
 *
 *   node scripts/generate-kenya-dots.mjs
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { createMap } from "svg-dotted-map";

// Must mirror components/site/kenya-map.tsx.
const CANVAS = { width: 300, height: 150 };
const MAP_SAMPLES = 50000;
const WINDOW = { minX: 132, minY: 80, width: 72, height: 24 };
const DOT_RADIUS = 0.045;
const NAIROBI = { lat: -1.2921, lng: 36.8219 };
const MARKER_SIZE = 0.19;

const started = Date.now();
const { points, addMarkers } = createMap({
  width: CANVAS.width,
  height: CANVAS.height,
  mapSamples: MAP_SAMPLES,
});

// Same bleed the component applies, so a dot on the window edge is not clipped.
const bleed = DOT_RADIUS * 2;

const visible = points
  .filter(
    (p) =>
      p.x >= WINDOW.minX - bleed &&
      p.x <= WINDOW.minX + WINDOW.width + bleed &&
      p.y >= WINDOW.minY - bleed &&
      p.y <= WINDOW.minY + WINDOW.height + bleed,
  )
  // Round to keep the committed file small and diff-stable across platforms.
  .map((p) => [Number(p.x.toFixed(2)), Number(p.y.toFixed(2))]);

const marker = addMarkers([NAIROBI])[0];
const markerInWindow =
  marker.x >= WINDOW.minX &&
  marker.x <= WINDOW.minX + WINDOW.width &&
  marker.y >= WINDOW.minY &&
  marker.y <= WINDOW.minY + WINDOW.height;

if (!markerInWindow) {
  throw new Error(
    `Nairobi projects to (${marker.x}, ${marker.y}), outside the window ` +
      `${WINDOW.minX},${WINDOW.minY} ${WINDOW.width}x${WINDOW.height}. ` +
      `Adjust WINDOW to contain it.`,
  );
}

const payload = {
  // Provenance, so a future reader can regenerate without guessing.
  generatedFrom: {
    library: "svg-dotted-map",
    canvas: CANVAS,
    mapSamples: MAP_SAMPLES,
    window: WINDOW,
    dotRadius: DOT_RADIUS,
    totalPointsSampled: points.length,
  },
  viewBox: `${WINDOW.minX} ${WINDOW.minY} ${WINDOW.width} ${WINDOW.height}`,
  marker: {
    lat: NAIROBI.lat,
    lng: NAIROBI.lng,
    x: Number(marker.x.toFixed(2)),
    y: Number(marker.y.toFixed(2)),
    size: MARKER_SIZE,
  },
  dots: visible,
};

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(repoRoot, "lib", "data", "kenya-dots.json");

writeFileSync(outPath, JSON.stringify(payload));

/**
 * Also emit a standalone SVG asset.
 *
 * The React component could render these 818 circles directly, but then they
 * ship in the HTML on every device — `display: none` on mobile hides them
 * visually while still paying the parse and transfer cost, which defeats the
 * point of dropping the map on small screens. As a single file referenced by
 * CSS it is one request, one DOM node, and genuinely absent below `sm`.
 *
 * Cost: the pulsing marker cannot live in a static file, so the marker is a
 * plain dot. That is an acceptable trade for a decorative background whose job
 * is to orient a reader to East Africa, not to animate.
 */
const svg = [
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${payload.viewBox}" width="${WINDOW.width * 10}" height="${WINDOW.height * 10}">`,
  `<g fill="#004B49">`,
  ...visible.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${DOT_RADIUS}"/>`),
  `</g>`,
  `<circle cx="${marker.x}" cy="${marker.y}" r="${MARKER_SIZE * 3}" fill="none" stroke="#E30B5D" stroke-width="${MARKER_SIZE * 0.28}" opacity="0.45"/>`,
  `<circle cx="${marker.x}" cy="${marker.y}" r="${MARKER_SIZE}" fill="#E30B5D"/>`,
  `</svg>`,
].join("");

const svgPath = join(repoRoot, "public", "brand", "kenya-map.svg");
writeFileSync(svgPath, svg);

const bytes = Buffer.byteLength(JSON.stringify(payload));
console.log(
  `wrote ${visible.length} dots (+1 marker) in ${Date.now() - started}ms`,
);
console.log(`  -> ${outPath} (${(bytes / 1024).toFixed(1)} KB)`);
console.log(
  `  -> ${svgPath} (${(Buffer.byteLength(svg) / 1024).toFixed(1)} KB)`,
);
if (visible.length < 200) {
  console.warn(
    `WARNING: only ${visible.length} dots. At this density the map reads as a ` +
      `constellation rather than a coastline. Raise MAP_SAMPLES or widen WINDOW.`,
  );
}
