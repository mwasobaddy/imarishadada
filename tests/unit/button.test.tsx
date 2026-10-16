import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders its children", () => {
    render(<Button>Donate</Button>);
    expect(screen.getByRole("button", { name: "Donate" })).toBeInTheDocument();
  });

  it("renders a real button so Enter and Space activate it for free", () => {
    // A div+onClick would fail this: no implicit role, no keyboard activation.
    render(<Button>Donate</Button>);
    expect(screen.getByRole("button").tagName).toBe("BUTTON");
  });

  it("defaults to type=button so it cannot submit a form by accident", () => {
    render(<Button>Donate</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("honours an explicit type override", () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });

  it("is disabled when told to be disabled", () => {
    render(<Button disabled>Donate</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("applies the default variant classes", () => {
    render(<Button>Donate</Button>);
    expect(screen.getByRole("button").className).toContain("bg-primary");
  });

  it("applies variant and size overrides", () => {
    render(
      <Button variant="outline" size="lg">
        Donate
      </Button>,
    );
    const button = screen.getByRole("button");
    expect(button.className).toContain("border-border");
    expect(button.className).toContain("h-9");
  });

  it("lets a caller className override conflicting utilities", () => {
    render(<Button className="bg-secondary">Donate</Button>);
    expect(screen.getByRole("button").className).toContain("bg-secondary");
  });
});