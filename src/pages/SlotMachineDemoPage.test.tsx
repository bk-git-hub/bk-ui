import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  slotMachineNextJsExportCode,
  slotMachineReactExportCode,
} from "@/snippets/slotMachineExportCode";
import {
  slotMachineDemoCode,
  slotMachineUsageCode,
} from "@/snippets/slotMachineUsageCode";
import SlotMachineDemoPage from "./SlotMachineDemoPage";

vi.mock("@/components/layout/tsx-syntax-highlighter", () => ({
  default: ({ code }: { code: string }) => (
    <pre data-testid="syntax-highlighter">
      <code>{code}</code>
    </pre>
  ),
}));

const writeText = vi.fn<Clipboard["writeText"]>();
let clipboardDescriptor: PropertyDescriptor | undefined;

const openSourceTab = async (
  tabName: string,
  regionName: string,
  expectedSource: string,
) => {
  fireEvent.click(screen.getByRole("tab", { name: tabName }));
  const sourceRegion = await screen.findByRole("region", {
    name: regionName,
  });

  expect(sourceRegion.textContent).toBe(expectedSource.trim());
  return sourceRegion;
};

describe("SlotMachineDemoPage", () => {
  beforeEach(() => {
    clipboardDescriptor = Object.getOwnPropertyDescriptor(
      navigator,
      "clipboard",
    );
    writeText.mockReset();
    writeText.mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
  });

  afterEach(() => {
    if (clipboardDescriptor) {
      Object.defineProperty(navigator, "clipboard", clipboardDescriptor);
    } else {
      Reflect.deleteProperty(navigator, "clipboard");
    }
  });

  it("renders the complete five-tab viewer in the shared order", () => {
    render(<SlotMachineDemoPage />);

    const tabList = screen.getByRole("tablist", {
      name: "Slot Machine view",
    });
    expect(
      within(tabList)
        .getAllByRole("tab")
        .map((tab) => tab.textContent),
    ).toEqual(["Preview", "Code", "Usage", "React Export", "Next.js Export"]);
  });

  it("keeps the interactive slot controls in Preview", () => {
    render(<SlotMachineDemoPage />);

    const itemEditor = screen.getByRole("textbox", { name: "슬롯 내용" });
    const reelCount = screen.getByRole("slider", { name: "릴 개수" });
    expect(screen.getByRole("button", { name: "돌리기" })).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "레버를 당겨 돌리기" }),
    ).toBeEnabled();

    fireEvent.change(itemEditor, {
      target: { value: "🍎 사과\n🍉 수박" },
    });
    expect(itemEditor).toHaveValue("🍎 사과\n🍉 수박");
    expect(screen.getByText(/현재 2개입니다/)).toBeInTheDocument();

    fireEvent.change(reelCount, { target: { value: "5" } });
    expect(reelCount).toHaveValue("5");
    expect(screen.getByText("5 reels · 2 items")).toBeInTheDocument();
  });

  it("renders and copies the configured Code and public Usage sources", async () => {
    render(<SlotMachineDemoPage />);

    const demo = await openSourceTab(
      "Code",
      "TSX source code",
      slotMachineDemoCode,
    );
    expect(demo).toHaveTextContent('from "@/components/SlotMachine"');
    expect(demo).toHaveTextContent("export function SlotMachineDemo()");
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(writeText).toHaveBeenLastCalledWith(slotMachineDemoCode.trim());

    const usage = await openSourceTab(
      "Usage",
      "TSX source code",
      slotMachineUsageCode,
    );
    expect(usage).toHaveTextContent('from "@/components/SlotMachine"');
    expect(usage).toHaveTextContent("export function PrizeSlot()");
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(writeText).toHaveBeenLastCalledWith(slotMachineUsageCode.trim());
  });

  it("renders and copies the React and Next.js export sources", async () => {
    render(<SlotMachineDemoPage />);

    const reactExport = await openSourceTab(
      "React Export",
      "React TSX + CSS source code",
      slotMachineReactExportCode,
    );
    expect(reactExport).toHaveTextContent('from "@/components/SlotMachine"');
    expect(reactExport).toHaveTextContent(
      "src/components/SlotMachine/styles.css",
    );
    expect(reactExport).toHaveTextContent("@source");
    expect(reactExport).not.toHaveTextContent("/SlotMachine/client");
    expect(reactExport).not.toHaveTextContent('from "next/');
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(writeText).toHaveBeenLastCalledWith(
      slotMachineReactExportCode.trim(),
    );

    const nextJsExport = await openSourceTab(
      "Next.js Export",
      "Next.js TSX + CSS source code",
      slotMachineNextJsExportCode,
    );
    expect(nextJsExport).toHaveTextContent('"use client"');
    expect(nextJsExport).toHaveTextContent(
      'from "@/components/SlotMachine/client"',
    );
    expect(nextJsExport).toHaveTextContent('export * from "./index"');
    expect(nextJsExport).toHaveTextContent("@source");
    expect(nextJsExport).toHaveTextContent(/SSR/i);
    expect(nextJsExport).toHaveTextContent(/hydration/i);
    expect(nextJsExport).not.toHaveTextContent('from "next/');
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(writeText).toHaveBeenLastCalledWith(
      slotMachineNextJsExportCode.trim(),
    );
  });
});
