import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CoverflowPage from "./CoverflowPage";

const resizeCoverflow = (
  coverflow: HTMLElement,
  width: number,
  height: number,
) => {
  act(() => {
    (
      coverflow as HTMLElement & {
        __resizeCallback?: ResizeObserverCallback;
      }
    ).__resizeCallback?.(
      [{ contentRect: { width, height } } as ResizeObserverEntry],
      {} as ResizeObserver,
    );
  });
};

describe("CoverflowPage item sizing", () => {
  it("fills the preview surface with black in Preview and Customize", () => {
    render(<CoverflowPage />);

    const previewTab = screen.getByRole("tab", { name: "Preview" });
    const previewPanel = document.getElementById(
      previewTab.getAttribute("aria-controls")!,
    );
    expect(previewPanel).toHaveClass("overflow-hidden", "bg-black", "p-0");
    expect(previewPanel).not.toHaveClass("p-2");

    fireEvent.click(screen.getByRole("tab", { name: "Customize" }));
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
    expect(coverflow).toHaveClass("px-5", "sm:px-0");
    expect(slider).toHaveValue("280");

    resizeCoverflow(coverflow!, 238, 500);
    expect(cards[0]).toHaveStyle({ width: "238px", height: "238px" });

    fireEvent.click(cards[1]!);
    expect(cards[1]).toHaveAttribute("data-active", "true");

    fireEvent.change(slider, { target: { value: "200" } });
    expect(screen.getByText("200px")).toBeInTheDocument();
    expect(cards[0]).toHaveStyle({ width: "200px", height: "200px" });

    fireEvent.change(slider, { target: { value: "360" } });
    expect(screen.getByText("360px")).toBeInTheDocument();
    expect(document.querySelector('[data-slot="coverflow"]')).toBe(coverflow);
    expect(cards[1]).toHaveAttribute("data-active", "true");
    expect(cards[0]).toHaveStyle({ width: "238px", height: "238px" });

    fireEvent.click(screen.getByRole("tab", { name: "Customize" }));
    const editor = screen.getByRole("textbox", {
      name: "LIVE JSON source code editor",
    }) as HTMLTextAreaElement;
    expect(editor.value).toContain('"itemSize": 360');
  });
});
