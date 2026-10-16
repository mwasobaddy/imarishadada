import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

describe("cn", () => {
  it("joins class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("drops falsy values", () => {
    expect(cn("a", false && "b", null, undefined, "", "c")).toBe("a c");
  });

  it("lets later tailwind utilities win conflicts", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("keeps non-conflicting utilities from both arguments", () => {
    expect(cn("text-sm", "font-bold")).toBe("text-sm font-bold");
  });

  it("supports conditional object syntax", () => {
    expect(cn("base", { active: true, hidden: false })).toBe("base active");
  });
});