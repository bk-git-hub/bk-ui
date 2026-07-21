import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Coverflow } from "./coverflow";
import { CoverflowItem } from "./coverflow-item";

const items = [
  <CoverflowItem key="card-1" backContent={<span>Back 1</span>}>
    Card 1
  </CoverflowItem>,
  <CoverflowItem key="card-2" backContent={<span>Back 2</span>}>
    Card 2
  </CoverflowItem>,
  <CoverflowItem key="card-3" backContent={<span>Back 3</span>}>
    Card 3
  </CoverflowItem>,
];

const cardFor = (label: string) =>
  screen.getByText(label).closest('[data-slot="coverflow-card"]');

const flipTriggerFor = (label: string) =>
  screen
    .getByText(label)
    .closest('[data-slot="coverflow-item"]')
    ?.querySelector<HTMLButtonElement>('[data-slot="coverflow-flip-trigger"]');

describe("Coverflow controlled index", () => {
  it("keeps the click transition when a controlled consumer accepts the next index", () => {
    const ControlledCoverflow = () => {
      const [activeIndex, setActiveIndex] = useState(0);

      return (
        <Coverflow
          activeIndex={activeIndex}
          onActiveIndexChange={setActiveIndex}
        >
          {items}
        </Coverflow>
      );
    };

    render(<ControlledCoverflow />);

    const secondCard = cardFor("Card 2") as HTMLElement;
    fireEvent.click(secondCard);

    expect(secondCard).toHaveAttribute("data-active", "true");
    expect(secondCard.style.transition).toBe("transform 0.3s ease-out");
  });

  it("follows activeIndex and reports internal navigation", () => {
    const onActiveIndexChange = vi.fn();
    const { rerender } = render(
      <Coverflow activeIndex={0} onActiveIndexChange={onActiveIndexChange}>
        {items}
      </Coverflow>,
    );

    expect(cardFor("Card 1")).toHaveAttribute("data-active", "true");

    rerender(
      <Coverflow activeIndex={2} onActiveIndexChange={onActiveIndexChange}>
        {items}
      </Coverflow>,
    );
    expect(cardFor("Card 3")).toHaveAttribute("data-active", "true");

    fireEvent.click(cardFor("Card 2") as HTMLElement);
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(1);
    expect(cardFor("Card 3")).toHaveAttribute("data-active", "true");

    rerender(
      <Coverflow activeIndex={1} onActiveIndexChange={onActiveIndexChange}>
        {items}
      </Coverflow>,
    );
    expect(cardFor("Card 2")).toHaveAttribute("data-active", "true");
  });

  it("supports an uncontrolled default and closes a flipped item on change", () => {
    const onActiveIndexChange = vi.fn();
    render(
      <Coverflow
        defaultActiveIndex={1}
        onActiveIndexChange={onActiveIndexChange}
      >
        {items}
      </Coverflow>,
    );

    const card2Trigger = flipTriggerFor("Card 2");
    expect(card2Trigger).not.toBeNull();
    expect(cardFor("Card 2")).toHaveAttribute("data-active", "true");
    fireEvent.click(card2Trigger as HTMLButtonElement);
    expect(card2Trigger).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(cardFor("Card 3") as HTMLElement);
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(2);
    expect(cardFor("Card 3")).toHaveAttribute("data-active", "true");
    expect(card2Trigger).toHaveAttribute("aria-pressed", "false");
  });
});
