import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  cardsStackSliderNextJsExport,
  cardsStackSliderReactExport,
} from "@/snippets/cardsStackSliderExportCode";
import CardsStackSliderDemoPage from "./CardsStackSliderDemoPage";

vi.mock("@/components/layout/tsx-syntax-highlighter", () => ({
  default: ({ code }: { code: string }) => (
    <pre data-testid="syntax-highlighter">
      <code>{code}</code>
    </pre>
  ),
}));

const openCodeEditor = () => {
  fireEvent.click(screen.getByRole("tab", { name: "Code" }));
  return screen.getByRole("textbox", {
    name: "LIVE JSON source code editor",
  }) as HTMLTextAreaElement;
};

describe("CardsStackSliderDemoPage", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("renders the complete five-tab viewer in the shared order", () => {
    render(<CardsStackSliderDemoPage />);

    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "Preview",
      "Code",
      "Usage",
      "React Export",
      "Next.js Export",
    ]);
  });

  it("updates the live slider from valid JSON and preserves it for errors", () => {
    render(<CardsStackSliderDemoPage />);
    const editor = openCodeEditor();
    const source = JSON.parse(editor.value);
    source.orientation = "vertical";
    source.loop = false;
    source.sideOffset = 72;
    source.visibleCount = 5;
    source.transitionDuration = 700;

    fireEvent.change(editor, {
      target: { value: JSON.stringify(source, null, 2) },
    });

    const livePreview = screen.getByRole("region", {
      name: "Cards Stack Slider live preview",
    });
    expect(
      within(livePreview).getByRole("region", { name: "여행 결제 카드" }),
    ).toHaveAttribute("data-orientation", "vertical");

    fireEvent.change(editor, { target: { value: "{" } });

    expect(editor).toHaveAttribute("aria-invalid", "true");
    expect(
      screen.getByText("Enter valid JSON to update the preview."),
    ).toBeInTheDocument();
    expect(
      within(livePreview).getByRole("region", { name: "여행 결제 카드" }),
    ).toHaveAttribute("data-orientation", "vertical");

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(editor).not.toHaveAttribute("aria-invalid");
    expect(editor.value).toContain('"orientation": "horizontal"');
  });

  it("keeps the Preview orientation control synchronized with Code", () => {
    render(<CardsStackSliderDemoPage />);

    fireEvent.click(screen.getByRole("radio", { name: "세로" }));
    const editor = openCodeEditor();

    expect(editor.value).toContain('"orientation": "vertical"');
  });

  it("shows copyable Usage and framework-specific export paths", async () => {
    render(<CardsStackSliderDemoPage />);

    fireEvent.click(screen.getByRole("tab", { name: "Usage" }));
    const usage = await screen.findByRole("region", {
      name: "React TSX source code",
    });
    expect(usage).toHaveTextContent('from "@/components/CardsStackSlider"');
    expect(usage).toHaveTextContent("CardsStackViewport");

    fireEvent.click(screen.getByRole("tab", { name: "React Export" }));
    const reactExport = await screen.findByRole("region", {
      name: "React / Vite TSX source code",
    });
    expect(reactExport).toHaveTextContent(
      'from "@/components/CardsStackSlider"',
    );
    expect(reactExport).not.toHaveTextContent("CardsStackSlider/client");
    const reactNote = screen.getByRole("note");
    expect(reactNote).toHaveTextContent("CardsStackSlider.tsx");
    expect(reactNote).toHaveTextContent("useCardsStackSlider.ts");
    expect(reactNote).toHaveTextContent("@source");
    expect(reactNote).toHaveTextContent("tailwind-merge");
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith(
      cardsStackSliderReactExport.code.trim(),
    );

    fireEvent.click(screen.getByRole("tab", { name: "Next.js Export" }));
    const nextExport = await screen.findByRole("region", {
      name: "Next.js App Router TSX source code",
    });
    expect(nextExport).toHaveTextContent('"use client"');
    expect(nextExport).toHaveTextContent(
      'from "@/components/CardsStackSlider/client"',
    );
    expect(nextExport).toHaveTextContent('export * from "./index"');
    expect(nextExport).not.toHaveTextContent('from "next/');
    expect(screen.getByRole("note")).toHaveTextContent("stable for hydration");
    expect(screen.getByRole("note")).toHaveTextContent("@source");
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith(
      cardsStackSliderNextJsExport.code.trim(),
    );
  });
});
