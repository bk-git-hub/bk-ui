import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SlotMachine } from "./SlotMachine";
import { selectSlotResults } from "./useSlotMachine";

describe("selectSlotResults", () => {
  it("selects one item from every reel without mutating the source", () => {
    const reels = [
      ["Cherry", "Lemon"],
      ["Bell", "Diamond"],
      ["Seven", "Bar"],
    ] as const;
    const randomValues = [0, 0.99, 0.5];
    let randomIndex = 0;

    const result = selectSlotResults(
      reels,
      () => randomValues[randomIndex++] ?? 0,
    );

    expect(result).toEqual(["Cherry", "Diamond", "Bar"]);
    expect(reels).toEqual([
      ["Cherry", "Lemon"],
      ["Bell", "Diamond"],
      ["Seven", "Bar"],
    ]);
  });

  it("returns an empty result when any reel has no items", () => {
    const reels: readonly (readonly string[])[] = [["Cherry"], []];

    expect(selectSlotResults(reels, () => 0)).toEqual([]);
  });
});

describe("SlotMachine", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("renders consumer items and reports a deterministic result after spinning", () => {
    const cherry = { id: "cherry", label: "Cherry", emoji: "🍒" };
    const lemon = { id: "lemon", label: "Lemon", emoji: "🍋" };
    const bell = { id: "bell", label: "Bell", emoji: "🔔" };
    const diamond = { id: "diamond", label: "Diamond", emoji: "💎" };
    const seven = { id: "seven", label: "Seven", emoji: "7" };
    const bar = { id: "bar", label: "Bar", emoji: "BAR" };
    const onValueChange = vi.fn();
    const randomValues = [0, 0.99, 0];
    let randomIndex = 0;

    render(
      <SlotMachine
        reels={[
          [cherry, lemon],
          [bell, diamond],
          [seven, bar],
        ]}
        random={() => randomValues[randomIndex++] ?? 0}
        spinDuration={500}
        onValueChange={onValueChange}
        getItemLabel={(item) => item.label}
        renderItem={(item) => (
          <strong data-testid={`symbol-${item.id}`}>{item.emoji}</strong>
        )}
        aria-label="Prize machine"
        className="p-2"
        data-testid="prize-machine"
      />,
    );

    const machine = screen.getByRole("region", { name: "Prize machine" });
    const spinButton = screen.getByRole("button", { name: "Spin" });

    expect(machine).toHaveClass("p-2");
    fireEvent.click(spinButton);

    expect(machine).toHaveAttribute("data-state", "spinning");
    expect(machine).toHaveAttribute("aria-busy", "true");
    expect(spinButton).toBeDisabled();
    expect(onValueChange).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(499));
    expect(onValueChange).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith([cherry, diamond, seven]);
    expect(machine).toHaveAttribute("data-state", "complete");
    expect(machine).not.toHaveAttribute("aria-busy");
    expect(screen.getByTestId("symbol-cherry")).toBeInTheDocument();
    expect(screen.getByTestId("symbol-diamond")).toBeInTheDocument();
    expect(screen.getByTestId("symbol-seven")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Cherry");
    expect(screen.getByRole("status")).toHaveTextContent("Diamond");
    expect(screen.getByRole("status")).toHaveTextContent("Seven");
  });

  it("supports controlled results", () => {
    const onValueChange = vi.fn();
    const props = {
      reels: [
        [1, 2],
        [3, 4],
      ] as const,
      value: [1, 3] as readonly number[],
      random: () => 0.99,
      spinDuration: 100,
      onValueChange,
    };
    const { rerender } = render(<SlotMachine {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Spin" }));
    act(() => vi.advanceTimersByTime(100));

    expect(onValueChange).toHaveBeenCalledWith([2, 4]);
    let slots = screen.getAllByRole("listitem");
    expect(slots).toHaveLength(2);
    expect(within(slots[0]).getByText("1")).toBeInTheDocument();
    expect(within(slots[1]).getByText("3")).toBeInTheDocument();

    rerender(<SlotMachine {...props} value={[2, 4]} />);
    slots = screen.getAllByRole("listitem");
    expect(within(slots[0]).getByText("2")).toBeInTheDocument();
    expect(within(slots[1]).getByText("4")).toBeInTheDocument();
  });

  it("disables spinning when a reel is empty", () => {
    const reels: readonly (readonly string[])[] = [["Cherry"], []];
    const onValueChange = vi.fn();

    render(
      <SlotMachine
        reels={reels}
        onValueChange={onValueChange}
        data-testid="invalid-machine"
      />,
    );

    const machine = screen.getByTestId("invalid-machine");
    const spinButton = screen.getByRole("button", { name: "Spin" });

    expect(machine).toHaveAttribute("data-state", "invalid");
    expect(spinButton).toBeDisabled();
    fireEvent.click(spinButton);
    act(() => vi.runAllTimers());
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("respects the disabled prop", () => {
    render(<SlotMachine reels={[["Cherry"], ["Bell"], ["Seven"]]} disabled />);

    expect(screen.getByRole("button", { name: "Spin" })).toBeDisabled();
  });

  it("resets an uncontrolled result", () => {
    render(
      <SlotMachine
        reels={[
          ["Cherry", "Lemon"],
          ["Bell", "Diamond"],
        ]}
        defaultValue={["Cherry", "Bell"]}
        random={() => 0.99}
        spinDuration={100}
      />,
    );

    const initialSlots = screen.getAllByRole("listitem");
    expect(within(initialSlots[0]).getByText("Cherry")).toBeInTheDocument();
    expect(within(initialSlots[1]).getByText("Bell")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Spin" }));
    act(() => vi.advanceTimersByTime(100));
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));

    expect(
      screen.getByRole("region", { name: "Slot machine" }),
    ).toHaveAttribute("data-state", "idle");
    const resetSlots = screen.getAllByRole("listitem");
    expect(within(resetSlots[0]).getByText("Cherry")).toBeInTheDocument();
    expect(within(resetSlots[1]).getByText("Bell")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    expect(
      screen.queryByRole("button", { name: "Reset" }),
    ).not.toBeInTheDocument();
  });
});
