import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BaccaratSqueezeDemoPage from "./BaccaratSqueezeDemoPage";

const openEditor = () => {
  fireEvent.click(getTab("Customize"));
  return screen.getByRole("textbox", {
    name: "LIVE JSON source code editor",
  }) as HTMLTextAreaElement;
};

const getTablist = () => {
  const tablist = document.querySelector<HTMLElement>('[role="tablist"]');
  expect(tablist).not.toBeNull();
  return tablist as HTMLElement;
};

const getTab = (name: string) =>
  within(getTablist()).getByRole("tab", { name });

const getLivePreview = () => {
  const livePreview = document.querySelector<HTMLElement>(
    '[role="region"][aria-label="Baccarat Squeeze live preview"]',
  );
  expect(livePreview).not.toBeNull();
  return livePreview as HTMLElement;
};

const getPlayingCard = (container: HTMLElement) => {
  const playingCard = container.querySelector<HTMLElement>(
    '[data-slot="baccarat-playing-card"]',
  );
  expect(playingCard).not.toBeNull();
  return playingCard as HTMLElement;
};

describe("BaccaratSqueezeDemoPage", () => {
  it("renders the five viewer tabs in the expected order", () => {
    render(<BaccaratSqueezeDemoPage />);

    expect(
      within(getTablist())
        .getAllByRole("tab")
        .map((tab) => tab.textContent),
    ).toEqual(["Preview", "Customize", "Usage", "React Export", "Next.js Export"]);
  });

  it("updates the live card from valid JSON configuration", () => {
    render(<BaccaratSqueezeDemoPage />);
    const editor = openEditor();
    const source = JSON.parse(editor.value);
    source.rank = "K";
    source.suit = "spades";
    source.corner = "top-left";

    fireEvent.change(editor, {
      target: { value: JSON.stringify(source, null, 2) },
    });

    const livePreview = getLivePreview();
    expect(within(livePreview).getByRole("slider")).toHaveAttribute(
      "data-corner",
      "top-left",
    );
    expect(getPlayingCard(livePreview)).toHaveAttribute("data-rank", "K");
    expect(getPlayingCard(livePreview)).toHaveAttribute("data-suit", "spades");
    expect(within(livePreview).getByLabelText("Rank")).toHaveValue("K");
    expect(
      within(livePreview).getByRole("button", { name: "스페이드" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps the last valid card for invalid JSON and restores defaults", () => {
    render(<BaccaratSqueezeDemoPage />);
    const editor = openEditor();
    const source = JSON.parse(editor.value);
    source.rank = "K";
    source.suit = "spades";
    source.corner = "top-left";
    fireEvent.change(editor, {
      target: { value: JSON.stringify(source, null, 2) },
    });
    fireEvent.change(editor, { target: { value: "{" } });

    expect(editor).toHaveAttribute("aria-invalid", "true");
    expect(
      screen.getByText("Enter valid JSON to update the preview."),
    ).toBeInTheDocument();
    const livePreview = getLivePreview();
    expect(getPlayingCard(livePreview)).toHaveAttribute("data-rank", "K");
    expect(getPlayingCard(livePreview)).toHaveAttribute("data-suit", "spades");
    expect(within(livePreview).getByRole("slider")).toHaveAttribute(
      "data-corner",
      "top-left",
    );

    const codePanel = editor.closest<HTMLElement>('[role="tabpanel"]');
    expect(codePanel).not.toBeNull();
    fireEvent.click(
      within(codePanel as HTMLElement).getByRole("button", { name: "Reset" }),
    );

    expect(editor).not.toHaveAttribute("aria-invalid");
    expect(JSON.parse(editor.value)).toMatchObject({
      rank: "8",
      suit: "diamonds",
      corner: "bottom-right",
    });
    expect(getPlayingCard(livePreview)).toHaveAttribute("data-rank", "8");
    expect(getPlayingCard(livePreview)).toHaveAttribute(
      "data-suit",
      "diamonds",
    );
    expect(within(livePreview).getByRole("slider")).toHaveAttribute(
      "data-corner",
      "bottom-right",
    );
  });

  it("syncs rank and suit controls from Preview back to live JSON", () => {
    render(<BaccaratSqueezeDemoPage />);

    fireEvent.change(screen.getByLabelText("Rank"), {
      target: { value: "Q" },
    });
    fireEvent.click(screen.getByRole("button", { name: "하트" }));

    const editor = openEditor();
    expect(JSON.parse(editor.value)).toMatchObject({
      rank: "Q",
      suit: "hearts",
      corner: "bottom-right",
    });
    expect(getPlayingCard(getLivePreview())).toHaveAttribute("data-rank", "Q");
    expect(getPlayingCard(getLivePreview())).toHaveAttribute(
      "data-suit",
      "hearts",
    );
  });

  it("shows a minimal complete public API example in Usage", async () => {
    render(<BaccaratSqueezeDemoPage />);
    fireEvent.click(getTab("Usage"));

    const usage = await screen.findByRole("region", {
      name: "TSX source code",
    });
    expect(usage).toHaveTextContent('from "@/components/Baccarat"');
    expect(usage).toHaveTextContent("export default function PlayerCard()");
    [
      "BaccaratSqueezeRoot",
      "BaccaratSqueezeCard",
      "BaccaratSqueezeBack",
      "BaccaratSqueezeFace",
      "BaccaratPlayingCard",
      "BaccaratSqueezeFold",
      "BaccaratSqueezeHandle",
      "BaccaratSqueezeHint",
      "BaccaratSqueezeAction",
    ].forEach((publicExport) => {
      expect(usage).toHaveTextContent(publicExport);
    });
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("provides a copyable React and Vite export with integration details", async () => {
    render(<BaccaratSqueezeDemoPage />);
    fireEvent.click(getTab("React Export"));

    const reactExport = await screen.findByRole("region", {
      name: "React TSX source code",
    });
    expect(reactExport).toHaveTextContent(
      "src/components/Baccarat/BaccaratSqueeze.tsx",
    );
    expect(reactExport).toHaveTextContent(
      "src/components/Baccarat/useCardSqueeze.ts",
    );
    expect(reactExport).toHaveTextContent("src/components/Baccarat/index.ts");
    expect(reactExport).toHaveTextContent(
      "pnpm add clsx lucide-react tailwind-merge",
    );
    expect(reactExport).toHaveTextContent('from "@/components/Baccarat"');
    expect(reactExport).toHaveTextContent("Tailwind CSS v4");
    expect(reactExport).toHaveTextContent("Tailwind CSS v3");
    expect(reactExport).toHaveTextContent(
      '@source "../node_modules/@your-scope/bk-ui/src/components/Baccarat"',
    );
  });

  it("provides an SSR-safe Next.js client export without next imports", async () => {
    render(<BaccaratSqueezeDemoPage />);
    fireEvent.click(getTab("Next.js Export"));

    const nextJsExport = await screen.findByRole("region", {
      name: "Next.js TSX source code",
    });
    expect(nextJsExport).toHaveTextContent("src/components/Baccarat/client.ts");
    expect(nextJsExport).toHaveTextContent('"use client";');
    expect(nextJsExport).toHaveTextContent('export * from "./index";');
    expect(nextJsExport).toHaveTextContent(
      'from "@/components/Baccarat/client"',
    );
    expect(nextJsExport).toHaveTextContent("SSR / hydration");
    expect(nextJsExport).toHaveTextContent("serializable");
    expect(nextJsExport).toHaveTextContent("window or document");
    expect(nextJsExport).toHaveTextContent("Tailwind CSS v4");
    expect(nextJsExport).toHaveTextContent("Tailwind CSS v3");
    expect(nextJsExport).toHaveTextContent(
      '@source "../node_modules/@your-scope/bk-ui/src/components/Baccarat"',
    );
    expect(nextJsExport).not.toHaveTextContent(/from ["']next\//);
  });
});
