import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CoverflowPage from "./CoverflowPage";

describe("CoverflowPage item sizing", () => {
  it("fills the preview surface with black in Preview and Code", () => {
    render(<CoverflowPage />);

    const previewTab = screen.getByRole("tab", { name: "Preview" });
    const previewPanel = document.getElementById(
      previewTab.getAttribute("aria-controls")!,
    );
    expect(previewPanel).toHaveClass("overflow-hidden", "bg-black", "p-0");
    expect(previewPanel).not.toHaveClass("p-2");

    fireEvent.click(screen.getByRole("tab", { name: "Code" }));
    const livePreview = screen.getByRole("region", {
      name: "Coverflow live preview",
    });
    expect(livePreview).toHaveClass("overflow-hidden", "bg-black", "p-0");
    expect(livePreview).not.toHaveClass("overflow-auto", "bg-white", "p-2");
  });

  it("keeps the size control and live JSON synchronized", () => {
    render(<CoverflowPage />);

    const slider = screen.getByRole("slider", { name: "Cover item size" });
    const coverflow = document.querySelector<HTMLElement>(
      '[data-slot="coverflow"]',
    );
    const cards = document.querySelectorAll<HTMLElement>(
      '[data-slot="coverflow-card"]',
    );
    expect(slider).toHaveValue("280");

    fireEvent.click(cards[1]!);
    expect(cards[1]).toHaveAttribute("data-active", "true");

    fireEvent.change(slider, { target: { value: "360" } });
    expect(screen.getByText("360px")).toBeInTheDocument();
    expect(document.querySelector('[data-slot="coverflow"]')).toBe(coverflow);
    expect(cards[1]).toHaveAttribute("data-active", "true");
    expect(
      document.querySelector<HTMLElement>('[data-slot="coverflow-card"]'),
    ).toHaveStyle({ width: "360px", height: "360px" });

    fireEvent.click(screen.getByRole("tab", { name: "Code" }));
    const editor = screen.getByRole("textbox", {
      name: "LIVE JSON source code editor",
    }) as HTMLTextAreaElement;
    expect(editor.value).toContain('"itemSize": 360');
  });
});
