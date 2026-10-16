import { describe, expect, it } from "vitest";

import {
  getHexSpacing,
  hexCellsAround,
  hexCenter,
} from "@/components/ui/hexagon-pattern";

/**
 * Written per the team's execution policy (2026-10-15): tests are authored
 * alongside the feature but not run until the project is feature-complete.
 * See .opencode/rules/testing.md, "Execution policy".
 */

const R = 40;

describe("getHexSpacing", () => {
  it("tiles flat-top hexagons with 1.5r column step for zero gap", () => {
    const { colStep, rowStep } = getHexSpacing(R, "horizontal", 0);
    expect(colStep).toBeCloseTo(1.5 * R, 5);
    expect(rowStep).toBeCloseTo(Math.sqrt(3) * R, 5);
  });

  it("grows the tile as the gap increases", () => {
    const tight = getHexSpacing(R, "horizontal", 0);
    const loose = getHexSpacing(R, "horizontal", 8);
    expect(loose.colStep).toBeGreaterThan(tight.colStep);
    expect(loose.rowStep).toBeGreaterThan(tight.rowStep);
  });

  it("swaps the steps for vertical orientation", () => {
    const h = getHexSpacing(R, "horizontal", 0);
    const v = getHexSpacing(R, "vertical", 0);
    expect(v.colStep).toBeCloseTo(h.rowStep, 5);
    expect(v.rowStep).toBeCloseTo(h.colStep, 5);
  });
});

describe("hexCenter", () => {
  it("places the first hexagon at half a column and row step", () => {
    const { colStep, rowStep } = getHexSpacing(R, "horizontal", 0);
    const [x, y] = hexCenter(0, 0, R, "horizontal", 0);
    expect(x).toBeCloseTo(colStep / 2, 5);
    expect(y).toBeCloseTo(rowStep / 2, 5);
  });

  it("offsets odd columns by half a row step", () => {
    const { rowStep } = getHexSpacing(R, "horizontal", 0);
    const [, evenY] = hexCenter(0, 1, R, "horizontal", 0);
    const [, oddY] = hexCenter(1, 1, R, "horizontal", 0);
    expect(oddY - evenY).toBeCloseTo(rowStep / 2, 5);
  });

  it("never returns negative coordinates", () => {
    const [x, y] = hexCenter(0, 0, R, "horizontal", 0);
    expect(x).toBeGreaterThan(0);
    expect(y).toBeGreaterThan(0);
  });
});

describe("hexCellsAround", () => {
  const opts = { r: R, direction: "horizontal" as const, radiusPx: 120 };

  it("returns at least the hexagon the point sits on", () => {
    const cells = hexCellsAround(300, 300, opts);
    expect(cells.length).toBeGreaterThan(0);
  });

  it("only returns cells whose centre is inside the radius", () => {
    const cells = hexCellsAround(300, 300, opts);
    for (const [col, row] of cells) {
      const [cx, cy] = hexCenter(col, row, R, "horizontal", 0);
      const d = Math.hypot(cx - 300, cy - 300);
      expect(d).toBeLessThanOrEqual(opts.radiusPx + 0.001);
    }
  });

  it("returns more cells for a larger radius", () => {
    const small = hexCellsAround(300, 300, { ...opts, radiusPx: 60 });
    const large = hexCellsAround(300, 300, { ...opts, radiusPx: 190 });
    expect(large.length).toBeGreaterThan(small.length);
  });

  it("never returns negative column or row indices", () => {
    for (const [col, row] of hexCellsAround(0, 0, opts)) {
      expect(col).toBeGreaterThanOrEqual(0);
      expect(row).toBeGreaterThanOrEqual(0);
    }
  });

  it("returns no duplicates", () => {
    const cells = hexCellsAround(300, 300, opts);
    expect(new Set(cells.map(([c, r]) => `${c}:${r}`)).size).toBe(cells.length);
  });

  it("honours the limit", () => {
    const cells = hexCellsAround(300, 300, { ...opts, limit: 3 });
    expect(cells.length).toBeLessThanOrEqual(3);
  });

  it("handles a point outside the pattern origin without throwing", () => {
    expect(() => hexCellsAround(-500, -500, opts)).not.toThrow();
  });

  it("returns an empty set far from any hexagon", () => {
    // y = -500 is above the grid; every candidate centre is below row 0.
    expect(hexCellsAround(500, -500, opts)).toEqual([]);
  });
});