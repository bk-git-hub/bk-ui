import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LottoDraw } from "./LottoDraw";
import { drawRandomItems } from "./useLottoDraw";

describe("drawRandomItems", () => {
  it("draws the requested number without mutating the source", () => {
    const items = ["A", "B", "C", "D"] as const;

    const result = drawRandomItems(items, 3, () => 0.99);

    expect(result).toHaveLength(3);
    expect(new Set(result).size).toBe(3);
    expect(items).toEqual(["A", "B", "C", "D"]);
  });

  it("returns an empty result for an invalid draw count", () => {
    expect(drawRandomItems([1, 2], 0)).toEqual([]);
    expect(drawRandomItems([1, 2], 3)).toEqual([]);
    expect(drawRandomItems([1, 2], 1.5)).toEqual([]);
  });
});

describe("LottoDraw", () => {
  it("renders consumer content and reports a deterministic draw", () => {
    const onValueChange = vi.fn();

    render(
      <LottoDraw
        items={[
          { id: "red", label: "Red team" },
          { id: "blue", label: "Blue team" },
          { id: "green", label: "Green team" },
        ]}
        drawCount={2}
        defaultValue={[]}
        random={() => 0}
        onValueChange={onValueChange}
        getItemKey={(item) => item.id}
        getItemLabel={(item) => item.label}
        renderBall={(item) => <strong>{item.label}</strong>}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Draw balls" }));

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("Red team")).toBeInTheDocument();
    expect(screen.getByText("Blue team")).toBeInTheDocument();
    expect(onValueChange).toHaveBeenCalledWith([
      { id: "red", label: "Red team" },
      { id: "blue", label: "Blue team" },
    ]);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Draw complete: Red team, Blue team",
    );
  });

  it("supports controlled results", () => {
    const onValueChange = vi.fn();
    const props = {
      items: [1, 2, 3] as const,
      drawCount: 2,
      value: [] as readonly number[],
      onValueChange,
      random: () => 0,
    };
    const { rerender } = render(<LottoDraw {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Draw balls" }));

    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(onValueChange).toHaveBeenCalledWith([1, 2]);

    rerender(<LottoDraw {...props} value={[1, 2]} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("disables drawing when the requested count is invalid", () => {
    render(
      <LottoDraw
        items={["only one"]}
        drawCount={2}
        aria-label="Team raffle"
        className="p-2"
        data-testid="raffle"
      />,
    );

    expect(screen.getByRole("button", { name: "Draw balls" })).toBeDisabled();
    expect(screen.getByRole("region", { name: "Team raffle" })).toHaveAttribute(
      "data-state",
      "invalid",
    );
    expect(screen.getByTestId("raffle")).toHaveClass("p-2");
    expect(screen.getByTestId("raffle")).not.toHaveClass("p-6");
  });

  it("resets an uncontrolled result", () => {
    render(<LottoDraw items={[1, 2, 3]} drawCount={1} random={() => 0} />);

    fireEvent.click(screen.getByRole("button", { name: "Draw balls" }));
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));

    expect(screen.getByText("Ready to draw")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
