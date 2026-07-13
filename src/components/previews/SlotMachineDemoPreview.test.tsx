import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SlotMachineDemoPreview from "./SlotMachineDemoPreview";

describe("SlotMachineDemoPreview", () => {
  afterEach(() => vi.useRealTimers());

  it("lets the user control slot content and reel count", () => {
    render(<SlotMachineDemoPreview />);

    fireEvent.change(screen.getByLabelText("슬롯 내용"), {
      target: { value: "Cherry\nLemon, Seven" },
    });
    fireEvent.change(screen.getByLabelText("릴 개수"), {
      target: { value: "2" },
    });

    expect(screen.getByLabelText("슬롯 내용")).toHaveAttribute(
      "id",
      "slot-item-source",
    );
    expect(screen.getByLabelText("릴 개수")).toHaveAttribute(
      "id",
      "slot-reel-count",
    );
    expect(screen.getByLabelText("릴 개수")).toHaveValue("2");
    expect(screen.getByText(/현재 3개/)).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "돌리기" })).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "레버를 당겨 돌리기" }),
    ).toBeEnabled();
  });

  it("explains and blocks empty slot content", () => {
    render(<SlotMachineDemoPreview />);

    fireEvent.change(screen.getByLabelText("슬롯 내용"), {
      target: { value: "\n,  ," },
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "슬롯 내용을 한 개 이상 입력해 주세요.",
    );
    expect(screen.getByRole("button", { name: "돌리기" })).toBeDisabled();
  });

  it("returns to the idle state when the configuration changes", () => {
    vi.useFakeTimers();
    render(<SlotMachineDemoPreview />);

    fireEvent.click(screen.getByRole("button", { name: "돌리기" }));
    act(() => vi.advanceTimersByTime(1800));

    expect(screen.getByRole("button", { name: "한 번 더" })).toBeEnabled();

    fireEvent.change(screen.getByLabelText("슬롯 내용"), {
      target: { value: "Clover\nMoon\nDiamond" },
    });

    expect(screen.getByRole("button", { name: "돌리기" })).toBeEnabled();
    expect(
      screen.queryByRole("button", { name: "처음으로" }),
    ).not.toBeInTheDocument();
  });
});
