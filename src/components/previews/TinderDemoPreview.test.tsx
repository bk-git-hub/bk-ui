import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TinderDemoPreview from "./TinderDemoPreview";

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
});
