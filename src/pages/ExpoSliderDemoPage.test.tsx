import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { expoSliderNextExportCode } from "@/snippets/expoSliderNextExportCode";
import { expoSliderReactExportCode } from "@/snippets/expoSliderReactExportCode";
import ExpoSliderDemoPage from "./ExpoSliderDemoPage";

const openSourceTab = async (name: string) => {
  fireEvent.click(screen.getByRole("tab", { name }));
  return screen.findByRole("region", { name: "TSX source code" });
};

describe("ExpoSliderDemoPage", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("renders the five viewer tabs in order and keeps Preview interactive", () => {
    render(<ExpoSliderDemoPage />);

    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "Preview",
      "Code",
      "Usage",
      "React Export",
      "Next.js Export",
    ]);

    const slider = screen.getByRole("region", { name: "BK field notes" });
    expect(slider).toHaveAttribute("data-orientation", "horizontal");

    fireEvent.click(screen.getByRole("radio", { name: "Vertical" }));
    expect(slider).toHaveAttribute("data-orientation", "vertical");

    fireEvent.click(screen.getByRole("button", { name: "Tilt off" }));
    expect(screen.getByRole("button", { name: "Tilt on" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("keeps the core demo Code separate from the complete Usage example", async () => {
    render(<ExpoSliderDemoPage />);

    const code = await openSourceTab("Code");
    expect(code).toHaveTextContent("export default function ExpoSliderDemo()");
    expect(code).toHaveTextContent("rotation={tilted ? 8 : 0}");

    const usage = await openSourceTab("Usage");
    expect(usage).toHaveTextContent('from "@/components/ExpoSlider"');
    expect(usage).toHaveTextContent("export default function FieldNotes()");
    expect(usage).toHaveTextContent("<ExpoSliderPagination />");
  });

  it("renders and copies the React and Next.js export integrations", async () => {
    render(<ExpoSliderDemoPage />);

    const reactExport = await openSourceTab("React Export");
    expect(screen.getByRole("note")).toHaveTextContent("React or Vite project");
    expect(reactExport).toHaveTextContent("src/components/ExpoSlider/index.ts");
    expect(reactExport).toHaveTextContent('from "@/components/ExpoSlider"');
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith(
      expoSliderReactExportCode.trim(),
    );

    const nextExport = await openSourceTab("Next.js Export");
    expect(screen.getByRole("note")).toHaveTextContent(
      "Client Component boundary",
    );
    expect(nextExport).toHaveTextContent('"use client"');
    expect(nextExport).toHaveTextContent(
      'from "@/components/ExpoSlider/client"',
    );
    expect(nextExport).toHaveTextContent("SSR / hydration");
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith(
      expoSliderNextExportCode.trim(),
    );
  });
});
