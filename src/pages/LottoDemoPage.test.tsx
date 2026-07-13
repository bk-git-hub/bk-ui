import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { lottoNextExportCode } from "@/snippets/lottoNextExportCode";
import { lottoReactExportCode } from "@/snippets/lottoReactExportCode";
import LottoDemoPage from "./LottoDemoPage";

describe("LottoDemoPage", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("renders the interactive preview in the five-tab viewer", () => {
    render(<LottoDemoPage />);

    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "Preview",
      "Code",
      "Usage",
      "React Export",
      "Next.js Export",
    ]);
    expect(
      screen.getByRole("region", { name: "사용자 설정 로또 추첨기" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("공 내용")).toBeEnabled();
    expect(screen.getByLabelText("추첨할 공 개수")).toHaveValue(6);
    expect(screen.getByRole("button", { name: "추첨하기" })).toBeEnabled();
  });

  it("separates the machine demo code from the minimal public usage", async () => {
    render(<LottoDemoPage />);

    fireEvent.click(screen.getByRole("tab", { name: "Code" }));
    const demoCode = await screen.findByRole("region", {
      name: "TSX source code",
    });
    expect(demoCode).toHaveTextContent(
      "LottoAction, LottoMachine, useLottoDraw",
    );
    expect(demoCode).toHaveTextContent(
      "export default function LottoMachineDemo",
    );
    expect(demoCode).toHaveTextContent("const MIX_DURATION = 4_800");

    fireEvent.click(screen.getByRole("tab", { name: "Usage" }));
    const usage = await screen.findByRole("region", {
      name: "TSX source code",
    });
    expect(usage).toHaveTextContent('from "@/components/Lotto"');
    expect(usage).toHaveTextContent("export default function MyLotto");
    expect(usage).toHaveTextContent("<LottoDraw");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("renders and independently copies the React and Next.js exports", async () => {
    render(<LottoDemoPage />);

    fireEvent.click(screen.getByRole("tab", { name: "React Export" }));
    const reactExport = await screen.findByRole("region", {
      name: "React TSX source code",
    });
    expect(reactExport).toHaveTextContent(
      "src/components/Lotto/LottoMachine.tsx",
    );
    expect(reactExport).toHaveTextContent('from "./Lotto"');
    expect(reactExport).toHaveTextContent('from "@tailwindcss/vite"');
    expect(screen.getByRole("note")).toHaveTextContent(
      "Tailwind v4 scans local source automatically",
    );

    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith(
      lottoReactExportCode.trim(),
    );

    fireEvent.click(screen.getByRole("tab", { name: "Next.js Export" }));
    const nextExport = await screen.findByRole("region", {
      name: "Next.js TSX source code",
    });
    expect(nextExport).toHaveTextContent('"use client"');
    expect(nextExport).toHaveTextContent('from "@/components/Lotto"');
    expect(nextExport).toHaveTextContent(
      "app/page.tsx remains a Server Component",
    );
    expect(screen.getByRole("note")).toHaveTextContent(
      "disabling SSR is unnecessary",
    );
    expect(screen.getByRole("note")).toHaveTextContent("@source");

    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith(
      lottoNextExportCode.trim(),
    );
  });

  it("shows framework-specific verified resources without advertising blocked installs", async () => {
    render(<LottoDemoPage />);

    fireEvent.click(screen.getByRole("tab", { name: "React Export" }));

    expect(
      await screen.findByRole("heading", { name: "Install Lotto Draw" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Release blocked.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy npm" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Copy pnpm" })).toBeDisabled();
    expect(screen.getByText("React/Vite source ZIP")).toBeInTheDocument();
    expect(
      screen.queryByText("Next.js App Router source ZIP"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("lotto Registry JSON")).toBeInTheDocument();
    expect(screen.getByText("Copy for AI")).toBeInTheDocument();
    expect(screen.getByText("React/Vite source ZIP").closest("a")).toBeNull();

    fireEvent.click(screen.getByRole("tab", { name: "Next.js Export" }));

    expect(
      await screen.findByText("Next.js App Router source ZIP"),
    ).toBeInTheDocument();
    expect(screen.queryByText("React/Vite source ZIP")).not.toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Next.js TSX source code" }),
    ).toHaveTextContent('"use client"');
    expect(screen.queryByText(/npx bk-ui@latest add lotto/)).not.toBeInTheDocument();
  });
});
