import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LottoDemoPreview from "./LottoDemoPreview";
import { parseBallItems } from "./lotto-demo.util";

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

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
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
});
