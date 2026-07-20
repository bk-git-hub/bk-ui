import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { slicerSliderNextJsExport } from "@/snippets/slicerSliderNextExportCode";
import { slicerSliderReactExport } from "@/snippets/slicerSliderReactExportCode";
import SlicerSliderDemoPage from "./SlicerSliderDemoPage";

describe("SlicerSliderDemoPage", () => {
  const writeText = vi.fn<Clipboard["writeText"]>();

  beforeEach(() => {
    writeText.mockReset();
    writeText.mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
  });

  it("provides the interactive preview and all five viewer tabs in order", () => {
    render(<SlicerSliderDemoPage />);

    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "Preview",
      "Customize",
      "Usage",
      "React Export",
      "Next.js Export",
    ]);
    expect(
      screen.getByRole("region", { name: "Aperture field journal" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Previous field note" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Next field note" }),
    ).toBeInTheDocument();
  });

  it("keeps demo source and the complete public API usage in separate tabs", async () => {
    render(<SlicerSliderDemoPage />);

    fireEvent.click(screen.getByRole("tab", { name: "Customize" }));
    const demoCode = await screen.findByRole("region", {
      name: "TSX source code",
    });
    expect(demoCode).toHaveTextContent("SlicerSliderRoot");
    expect(demoCode).toHaveTextContent("SlicerSliderViewport");

    fireEvent.click(screen.getByRole("tab", { name: "Usage" }));
    const usage = screen.getByRole("region", { name: "TSX source code" });
    expect(usage).toHaveTextContent('from "@/components/SlicerSlider"');
    expect(usage).toHaveTextContent("export default function FieldJournal()");
    expect(usage).toHaveTextContent("SlicerSliderPagination");
  });

  it("renders and copies the framework-neutral React export", async () => {
    render(<SlicerSliderDemoPage />);
    fireEvent.click(screen.getByRole("tab", { name: "React Export" }));

    const reactExport = await screen.findByRole("region", {
      name: "React / Vite TSX source code",
    });
    expect(reactExport).toHaveTextContent(
      "src/components/SlicerSlider/SlicerSlider.tsx",
    );
    expect(reactExport).toHaveTextContent(
      "src/components/SlicerSlider/useSlicerSlider.ts",
    );
    expect(reactExport).toHaveTextContent('from "./components/SlicerSlider"');
    expect(reactExport).toHaveTextContent("@source");
    expect(slicerSliderReactExport.code).not.toMatch(/from ["']next\//);

    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    await waitFor(() => {
      expect(writeText).toHaveBeenLastCalledWith(
        slicerSliderReactExport.code.trim(),
      );
    });
  });

  it("renders and copies the App Router client entry with SSR guidance", async () => {
    render(<SlicerSliderDemoPage />);
    fireEvent.click(screen.getByRole("tab", { name: "Next.js Export" }));

    const nextJsExport = await screen.findByRole("region", {
      name: "Next.js App Router TSX source code",
    });
    expect(nextJsExport).toHaveTextContent(
      "src/components/SlicerSlider/client.ts",
    );
    expect(nextJsExport).toHaveTextContent('"use client"');
    expect(nextJsExport).toHaveTextContent(
      'from "@/components/SlicerSlider/client"',
    );
    expect(nextJsExport).toHaveTextContent("SSR / hydration");
    expect(nextJsExport).toHaveTextContent("@source");
    expect(slicerSliderNextJsExport.code).not.toMatch(/from ["']next\//);

    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    await waitFor(() => {
      expect(writeText).toHaveBeenLastCalledWith(
        slicerSliderNextJsExport.code.trim(),
      );
    });
  });
});
