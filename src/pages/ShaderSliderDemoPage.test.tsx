import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ShaderSliderDemoPage from "./ShaderSliderDemoPage";

const openEditor = () => {
  fireEvent.click(screen.getByRole("tab", { name: "Code" }));
  return screen.getByRole("textbox", {
    name: "LIVE JSON source code editor",
  }) as HTMLTextAreaElement;
};

const getLiveSlider = () => {
  const livePreview = screen.getByRole("region", {
    name: "Shader Slider live preview",
  });
  return livePreview.querySelector(
    '[data-slot="shader-slider-root"]',
  ) as HTMLElement;
};

describe("ShaderSliderDemoPage", () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      () => null,
    );
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders the complete five-tab viewer in order", () => {
    render(<ShaderSliderDemoPage />);

    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "Preview",
      "Code",
      "Usage",
      "React Export",
      "Next.js Export",
    ]);
  });

  it("updates the live preview from valid JSON and effect controls", () => {
    render(<ShaderSliderDemoPage />);
    const editor = openEditor();
    const source = JSON.parse(editor.value);
    source.effect = "pixel";
    source.transitionDuration = 420;

    fireEvent.change(editor, {
      target: { value: JSON.stringify(source, null, 2) },
    });

    expect(getLiveSlider()).toHaveAttribute("data-effect", "pixel");

    const livePreview = screen.getByRole("region", {
      name: "Shader Slider live preview",
    });
    fireEvent.click(within(livePreview).getByRole("radio", { name: "Ripple" }));

    expect(JSON.parse(editor.value).effect).toBe("ripple");
    expect(getLiveSlider()).toHaveAttribute("data-effect", "ripple");
  });

  it("keeps the last valid preview for errors and restores defaults", () => {
    render(<ShaderSliderDemoPage />);
    const editor = openEditor();
    const source = JSON.parse(editor.value);
    source.effect = "pixel";
    fireEvent.change(editor, {
      target: { value: JSON.stringify(source, null, 2) },
    });
    fireEvent.change(editor, { target: { value: "{" } });

    expect(editor).toHaveAttribute("aria-invalid", "true");
    expect(
      screen.getByText("Enter valid JSON to update the preview."),
    ).toBeInTheDocument();
    expect(getLiveSlider()).toHaveAttribute("data-effect", "pixel");

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));

    expect(editor).not.toHaveAttribute("aria-invalid");
    expect(JSON.parse(editor.value).effect).toBe("wave");
    expect(getLiveSlider()).toHaveAttribute("data-effect", "wave");
  });

  it("renders copyable Usage, React, and Next.js sources", async () => {
    render(<ShaderSliderDemoPage />);

    fireEvent.click(screen.getByRole("tab", { name: "Usage" }));
    const usage = await screen.findByRole("region", {
      name: "TSX source code",
    });
    expect(usage).toHaveTextContent('from "@/components/ShaderSlider"');

    fireEvent.click(screen.getByRole("tab", { name: "React Export" }));
    const reactExport = await screen.findByRole("region", {
      name: "React TSX source code",
    });
    expect(reactExport).toHaveTextContent('from "./components/ShaderSlider"');
    expect(
      screen.getByText(/pnpm add clsx tailwind-merge/),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Next.js Export" }));
    const nextExport = await screen.findByRole("region", {
      name: "Next.js TSX source code",
    });
    expect(nextExport).toHaveTextContent("'use client'");
    expect(nextExport).toHaveTextContent("if (!mounted)");
    expect(screen.getByText(/Server Component page/)).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});
