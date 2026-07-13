import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import StorySliderDemoPage from "./StorySliderDemoPage";

vi.mock("@/components/previews/StorySliderDemoPreview", () => ({
  default: () => <div>Interactive Story Slider preview</div>,
}));

vi.mock("@/components/layout/tsx-syntax-highlighter", () => ({
  default: ({ code }: { code: string }) => (
    <pre data-testid="story-source">
      <code>{code}</code>
    </pre>
  ),
}));

describe("StorySliderDemoPage", () => {
  it("renders the interactive preview and all five viewer tabs in order", () => {
    render(<StorySliderDemoPage />);

    expect(screen.getByText("Interactive Story Slider preview")).toBeVisible();
    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "Preview",
      "Code",
      "Usage",
      "React Export",
      "Next.js Export",
    ]);
    expect(screen.getAllByRole("tabpanel", { hidden: true })).toHaveLength(5);
  });

  it("connects Code and Usage to their Story Slider sources", async () => {
    render(<StorySliderDemoPage />);

    fireEvent.click(screen.getByRole("tab", { name: "Code" }));
    expect(await screen.findByTestId("story-source")).toHaveTextContent(
      "useState<StorySliderValue>",
    );

    fireEvent.click(screen.getByRole("tab", { name: "Usage" }));
    const usage = await screen.findByRole("region", {
      name: "TSX source code",
    });
    expect(usage).toHaveTextContent('from "@/components/StorySlider"');
    expect(usage).toHaveTextContent("groupCounts={creators.map");
  });

  it("renders copy-ready React and Next.js export recipes", async () => {
    render(<StorySliderDemoPage />);

    fireEvent.click(screen.getByRole("tab", { name: "React Export" }));
    const reactExport = await screen.findByRole("region", {
      name: "React TSX source code",
    });
    expect(reactExport).toHaveTextContent("StorySlider.tsx");
    expect(reactExport).toHaveTextContent("useStorySlider.ts");
    expect(reactExport).toHaveTextContent("pnpm add clsx tailwind-merge");
    expect(reactExport).toHaveTextContent('from "@/components/StorySlider"');
    expect(screen.getByRole("note")).toHaveTextContent(
      "framework-neutral core files",
    );

    fireEvent.click(screen.getByRole("tab", { name: "Next.js Export" }));
    const nextExport = await screen.findByRole("region", {
      name: "Next.js TSX source code",
    });
    expect(nextExport).toHaveTextContent('"use client"');
    expect(nextExport).toHaveTextContent("ProductStories");
    expect(nextExport).toHaveTextContent("Server Component");
    expect(nextExport).toHaveTextContent("hydration");
    expect(nextExport).toHaveTextContent("@source");
  });
});
