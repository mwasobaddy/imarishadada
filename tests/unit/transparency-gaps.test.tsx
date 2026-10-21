import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GapTable } from "@/components/transparency/gap-table";
import {
  gapIsClosed,
  gapStatusLabel,
  type GapStatus,
  type TransparencyGap,
} from "@/lib/data/transparency";

/**
 * Written but not executed. Per .opencode/rules/testing.md the team defers suite
 * execution until the project is feature-complete.
 *
 * What this file is defending:
 *
 * 1. The gaps table is a **real `<table>`** with a `<caption>` and `<th scope>`.
 *    The roadmap's accessibility requirement is explicit and a chart, or a
 *    styled list, would fail it while looking identical on screen.
 *
 * 2. A closed gap stays in the table. The roadmap: "Mark items complete as they
 *    land. A gaps list that never shrinks signals performative transparency." A
 *    deleted row shrinks the list *invisibly*, which is the opposite.
 *
 * 3. "In progress" does not read as closed.
 */

const gap = (overrides: Partial<TransparencyGap> = {}): TransparencyGap => ({
  id: "gap-1",
  item: "An independent examination of our accounts",
  kind: "governance",
  status: "outstanding",
  targetLabel: null,
  notes: "We have not produced a set of accounts to examine.",
  sortOrder: 1,
  ...overrides,
});

function renderTable(gaps: TransparencyGap[]) {
  return render(
    <GapTable gaps={gaps} caption="Things not yet in place." itemHeading="Not yet in place" />,
  );
}

describe("gapStatusLabel", () => {
  it("names every status in words a reader understands", () => {
    // Not the database value. "not_yet_measured" was the old status and it read
    // as jargon on a page whose whole job is to be legible to a funder.
    expect(gapStatusLabel("outstanding")).toBe("Not yet in place");
    expect(gapStatusLabel("in_progress")).toBe("In progress");
    expect(gapStatusLabel("done")).toBe("Done");
    expect(gapStatusLabel("published")).toBe("Published");
  });
});

describe("gapIsClosed", () => {
  it("treats done and published as closed", () => {
    expect(gapIsClosed("done")).toBe(true);
    expect(gapIsClosed("published")).toBe(true);
  });

  it("does not treat in progress as closed", () => {
    // The failure that matters: an item someone has started on must not read as
    // finished, because the list's credibility rests on it not overclaiming.
    expect(gapIsClosed("in_progress")).toBe(false);
    expect(gapIsClosed("outstanding")).toBe(false);
  });

  it("is exhaustive over the status union", () => {
    const all: GapStatus[] = ["outstanding", "in_progress", "done", "published"];
    expect(all.filter(gapIsClosed)).toHaveLength(2);
  });
});

describe("GapTable", () => {
  it("renders nothing when there are no gaps", () => {
    const { container } = renderTable([]);
    expect(container).toBeEmptyDOMElement();
  });

  it("is a real table, not a styled list", () => {
    renderTable([gap()]);
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("has a caption, so the table announces what it is", () => {
    renderTable([gap()]);
    const table = screen.getByRole("table");
    expect(within(table).getByText("Things not yet in place.")).toBeInTheDocument();
  });

  it("scopes its row headers", () => {
    renderTable([gap()]);
    const rowHeader = screen.getByRole("rowheader");
    expect(rowHeader).toHaveAttribute("scope", "row");
  });

  it("scopes its column headers", () => {
    renderTable([gap()]);
    for (const th of screen.getAllByRole("columnheader")) {
      expect(th).toHaveAttribute("scope", "col");
    }
  });

  it("keeps a closed gap in the table rather than dropping it", () => {
    renderTable([
      gap({ id: "a", status: "published", item: "An external safeguarding audit" }),
      gap({ id: "b", status: "outstanding" }),
    ]);
    // Both still present. A shrinking list is the point; an emptied one is not.
    expect(screen.getByText("An external safeguarding audit")).toBeInTheDocument();
    expect(
      screen.getByText("An independent examination of our accounts"),
    ).toBeInTheDocument();
    expect(screen.getByText("Published")).toBeInTheDocument();
    expect(screen.getByText("Not yet in place")).toBeInTheDocument();
  });

  it("omits the target column until a target exists", () => {
    renderTable([gap()]);
    expect(
      screen.queryByRole("columnheader", { name: "Target" }),
    ).not.toBeInTheDocument();
  });

  it("shows the target column once one gap has a target", () => {
    renderTable([
      gap({ id: "a", targetLabel: "FY2026/27" }),
      gap({ id: "b" }),
    ]);
    expect(screen.getByRole("columnheader", { name: "Target" })).toBeInTheDocument();
    expect(screen.getByText("FY2026/27")).toBeInTheDocument();
  });

  it("renders the note as context for the gap", () => {
    renderTable([gap()]);
    expect(
      screen.getByText(/We have not produced a set of accounts to examine/),
    ).toBeInTheDocument();
  });
});
