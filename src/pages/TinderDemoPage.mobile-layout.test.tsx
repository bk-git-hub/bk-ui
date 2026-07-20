import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TinderDemoPage from "./TinderDemoPage";

describe("TinderDemoPage mobile layout", () => {
  it("keeps the preview height available to the Tinder card stack", () => {
    render(<TinderDemoPage />);

    const previewTab = screen.getByRole("tab", { name: "Preview" });
    const panelId = previewTab.getAttribute("aria-controls");

    expect(panelId).toBeTruthy();

    const previewPanel = document.getElementById(panelId!);

    expect(previewPanel).toHaveClass("flex", "flex-col");
    expect(previewPanel?.firstElementChild).toHaveClass(
      "h-full",
      "flex-1",
      "flex-col",
    );
  });
});
