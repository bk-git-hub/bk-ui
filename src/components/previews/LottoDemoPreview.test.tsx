import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LottoDemoPreview from "./LottoDemoPreview";
import { LOTTO_MIX_DURATION_MS, parseBallItems } from "./lotto-demo.util";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("parseBallItems", () => {
  it("accepts newline and comma separated content", () => {
    expect(parseBallItems("Alpha\nBeta, Gamma\n\n")).toEqual([
      "Alpha",
      "Beta",
      "Gamma",
    ]);
  });
});

describe("LottoDemoPreview", () => {
  it("lets the user control ball content and draw count", () => {
    render(<LottoDemoPreview />);

    fireEvent.change(screen.getByLabelText("공 내용"), {
      target: { value: "Alpha\nBeta\nGamma" },
    });
    fireEvent.change(screen.getByLabelText("추첨할 공 개수"), {
      target: { value: "2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "추첨하기" }));

    expect(screen.getByRole("button", { name: "섞는 중..." })).toBeDisabled();
    expect(
      screen.getByRole("region", { name: "사용자 설정 로또 추첨기" }),
    ).toHaveAttribute("data-state", "spinning");

    act(() => {
      vi.advanceTimersByTime(LOTTO_MIX_DURATION_MS);
    });

    const results = screen.getByRole("list", { name: "당첨 공" });
    expect(within(results).getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText(/줄바꿈이나 쉼표/)).toHaveTextContent(
      "현재 3개입니다.",
    );
  });

  it("explains and blocks an invalid draw count", () => {
    render(<LottoDemoPreview />);

    fireEvent.change(screen.getByLabelText("공 내용"), {
      target: { value: "One\nTwo" },
    });
    fireEvent.change(screen.getByLabelText("추첨할 공 개수"), {
      target: { value: "3" },
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "추첨 개수는 1부터 2 사이여야 합니다.",
    );
    expect(screen.getByRole("button", { name: "추첨하기" })).toBeDisabled();
  });

  it("draws immediately when reduced motion is preferred", () => {
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: true }));
    render(<LottoDemoPreview />);

    fireEvent.click(screen.getByRole("button", { name: "추첨하기" }));

    expect(screen.getByRole("list", { name: "당첨 공" })).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "사용자 설정 로또 추첨기" }),
    ).toHaveAttribute("data-state", "idle");
  });
});
