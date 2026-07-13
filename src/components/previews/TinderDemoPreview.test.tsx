import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TinderDemoPreview from "./TinderDemoPreview";
import type { TinderDemoConfig } from "./tinder-demo.util";

describe("TinderDemoPreview", () => {
  it("labels the icon-only swipe controls", () => {
    render(<TinderDemoPreview />);

    expect(
      screen.getByRole("button", { name: "Pass card" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Like card" }),
    ).toBeInTheDocument();
  });

  it("renders a validated custom configuration", () => {
    const config: TinderDemoConfig = {
      cards: [
        {
          id: "custom-card",
          name: "Alex",
          age: 31,
          imageKey: "david",
        },
      ],
      emptyMessage: "No more profiles",
      resetLabel: "Start over",
      passLabel: "Skip Alex",
      likeLabel: "Like Alex",
    };

    render(<TinderDemoPreview config={config} />);

    expect(
      screen.getByRole("heading", { name: "Alex, 31" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Skip Alex" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Like Alex" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("presentation", { hidden: true })).toHaveAttribute(
      "src",
      expect.stringContaining("photo-1522529599102-193c0d76b5b6"),
    );
  });
});
