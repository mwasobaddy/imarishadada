import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FeaturedStory } from "@/components/sections/featured-story";
import { TrustStrip } from "@/components/site/trust-strip";
import { GivingWays } from "@/components/sections/giving-ways";

describe("FeaturedStory consent behaviour", () => {
  it("renders nothing when there is no eligible story", () => {
    const { container } = render(<FeaturedStory story={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("withholds the name for an anonymised story", () => {
    render(
      <FeaturedStory
        story={{
          slug: "an-inspiring-slug",
          quote: "I am in school again.",
          attribution: "Amina, 19",
          consentTier: "anonymised",
          imagePath: null,
        }}
      />,
    );

    expect(screen.getByText(/I am in school again/)).toBeInTheDocument();
    expect(screen.queryByText(/Amina/)).not.toBeInTheDocument();
    expect(screen.getByText(/Name withheld to protect privacy/)).toBeInTheDocument();
  });

  it("shows the consent notice for a named story", () => {
    render(
      <FeaturedStory
        story={{
          slug: "aminas-story",
          quote: "I am in school again.",
          attribution: "Amina, 19",
          consentTier: "named_full",
          imagePath: null,
        }}
      />,
    );

    expect(screen.getByText(/Amina, 19/)).toBeInTheDocument();
    expect(screen.getByText(/approved these words/)).toBeInTheDocument();
  });

  it("requests no image element for a tier that cannot display one", () => {
    const { container } = render(
      <FeaturedStory
        story={{
          slug: "aminas-story",
          quote: "I am in school again.",
          attribution: "Amina, 19",
          consentTier: "named_no_face",
          imagePath: "/images/amina.jpg",
        }}
      />,
    );

    expect(container.querySelector("img")).toBeNull();
  });
});

describe("TrustStrip", () => {
  it("renders nothing when no verified data exists", () => {
    const { container } = render(
      <TrustStrip registrationNumber={null} fiscalSponsor={null} />,
    );
    // An empty "Our Partners" bar is a negative trust signal.
    expect(container).toBeEmptyDOMElement();
  });

  it("never renders a placeholder value", () => {
    render(<TrustStrip registrationNumber="NGO-12345" fiscalSponsor={null} />);
    expect(screen.queryByText(/TBC|coming soon|to be published|N\/A/i)).toBeNull();
  });

  it("shows the registration number when present", () => {
    render(<TrustStrip registrationNumber="NGO-12345" fiscalSponsor={null} />);
    expect(screen.getByText("NGO-12345")).toBeInTheDocument();
  });
});

describe("GivingWays", () => {
  it("renders nothing when there are no tiers", () => {
    const { container } = render(<GivingWays tiers={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders every tier amount and outcome from props", () => {
    render(
      <GivingWays
        tiers={[
          {
            slug: "re-entry-package",
            amount: 50000,
            currency: "KES",
            cadence: "one_time",
            outcomeLabel: "a full re-entry package for one girl",
            programmeSlug: "school-reentry",
            sortOrder: 1,
          },
        ]}
      />,
    );

    expect(screen.getByText("KSh 50,000")).toBeInTheDocument();
    expect(
      screen.getByText(/a full re-entry package for one girl/),
    ).toBeInTheDocument();
  });

  it("flags tiers available monthly", () => {
    render(
      <GivingWays
        tiers={[
          {
            slug: "psychosocial-month",
            amount: 2500,
            currency: "KES",
            cadence: "monthly",
            outcomeLabel: "psychosocial support for one young mother",
            programmeSlug: "school-reentry",
            sortOrder: 1,
          },
        ]}
      />,
    );

    expect(screen.getByText("Available monthly")).toBeInTheDocument();
  });
});