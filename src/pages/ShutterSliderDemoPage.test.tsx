import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { shutterSliderNextExportCode } from "@/snippets/shutterSliderNextExportCode";
import { shutterSliderReactExportCode } from "@/snippets/shutterSliderReactExportCode";
import ShutterSliderDemoPage from "./ShutterSliderDemoPage";

const openEditor = () => {
  fireEvent.click(screen.getByRole("tab", { name: "Customize" }));
  return screen.getByRole("textbox", {
    name: "LIVE JSON source code editor",
  }) as HTMLTextAreaElement;
};

const getLiveSlider = () =>
  screen.getByRole("region", { name: "한국의 네 가지 여행 장면" });

describe("ShutterSliderDemoPage", () => {
  const writeText = vi.fn<Clipboard["writeText"]>();

  beforeEach(() => {
    writeText.mockReset();
    writeText.mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
  });

  it("provides Preview, Customize, Usage, React, and Next.js export tabs", () => {
    render(<ShutterSliderDemoPage />);

    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "Preview",
      "Customize",
      "Usage",
      "React Export",
      "Next.js Export",
    ]);
  });

  it("updates the live preview from valid editable settings", () => {
    render(<ShutterSliderDemoPage />);
    const editor = openEditor();
    const source = JSON.parse(editor.value);
    source.orientation = "horizontal";
    source.stripCount = 7;
    source.transitionDuration = 1_200;
    source.stagger = 0;
    source.loop = false;

    fireEvent.change(editor, {
      target: { value: JSON.stringify(source, null, 2) },
    });

    const livePreview = screen.getByRole("region", {
      name: "Shutter Slider live preview",
    });
    const slider = within(livePreview).getByRole("region", {
      name: "한국의 네 가지 여행 장면",
    });
    expect(slider).toHaveAttribute("data-orientation", "horizontal");
    expect(slider).toHaveAttribute("data-strip-count", "7");

    fireEvent.click(screen.getByRole("tab", { name: "Preview" }));
    expect(getLiveSlider()).toHaveAttribute("data-orientation", "horizontal");
    expect(getLiveSlider()).toHaveAttribute("data-strip-count", "7");
  });

  it("keeps the last valid preview for errors and restores defaults", () => {
    render(<ShutterSliderDemoPage />);
    const editor = openEditor();
    const source = JSON.parse(editor.value);
    source.stripCount = 7;

    fireEvent.change(editor, {
      target: { value: JSON.stringify(source, null, 2) },
    });
    fireEvent.change(editor, { target: { value: "{" } });

    expect(editor).toHaveAttribute("aria-invalid", "true");
    expect(
      screen.getByText("Enter valid JSON to update the preview."),
    ).toBeInTheDocument();
    expect(getLiveSlider()).toHaveAttribute("data-strip-count", "7");

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));

    expect(editor).not.toHaveAttribute("aria-invalid");
    expect(editor.value).toContain('"stripCount": 5');
    expect(getLiveSlider()).toHaveAttribute("data-orientation", "vertical");
    expect(getLiveSlider()).toHaveAttribute("data-strip-count", "5");
  });

  it("keeps the complete public API example in Usage", async () => {
    render(<ShutterSliderDemoPage />);
    fireEvent.click(screen.getByRole("tab", { name: "Usage" }));

    const usage = await screen.findByRole("region", {
      name: "TSX source code",
    });
    expect(usage).toHaveTextContent('from "@/components/ShutterSlider"');
    expect(usage).toHaveTextContent("ShutterSliderRoot");
    expect(usage).toHaveTextContent(
      "export default function KoreaTravelJournal()",
    );
  });

  it("renders and copies the React and Next.js export sources independently", async () => {
    render(<ShutterSliderDemoPage />);

    fireEvent.click(screen.getByRole("tab", { name: "React Export" }));
    const reactExport = await screen.findByRole("region", {
      name: "React / Vite TSX source code",
    });
    expect(reactExport).toHaveTextContent('from "./ShutterSlider"');
    expect(reactExport).toHaveTextContent(
      'import from "@/components/ShutterSlider"',
    );
    expect(reactExport).toHaveTextContent(
      "src/components/ShutterSlider/useShutterSlider.ts",
    );
    expect(reactExport).toHaveTextContent("@source");

    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    await waitFor(() => {
      expect(writeText).toHaveBeenLastCalledWith(
        shutterSliderReactExportCode.trim(),
      );
    });

    fireEvent.click(screen.getByRole("tab", { name: "Next.js Export" }));
    const nextExport = await screen.findByRole("region", {
      name: "Next.js App Router TSX source code",
    });
    expect(nextExport).toHaveTextContent('"use client"');
    expect(nextExport).toHaveTextContent(
      'from "@/components/ShutterSlider/client"',
    );
    expect(nextExport).toHaveTextContent("SSR / hydration");
    expect(nextExport).toHaveTextContent("@source");

    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    await waitFor(() => {
      expect(writeText).toHaveBeenLastCalledWith(
        shutterSliderNextExportCode.trim(),
      );
    });
  });
});
