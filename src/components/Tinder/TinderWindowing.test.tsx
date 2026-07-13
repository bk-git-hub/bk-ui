import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TinderCard, TinderLikeButton, TinderRoot } from "./index";

const dispatchTransformEnd = (element: HTMLElement) => {
  const event = new Event("transitionend", { bubbles: true });
  Object.defineProperty(event, "propertyName", { value: "transform" });
  fireEvent(element, event);
};

describe("TinderRoot card windowing", () => {
  it("creates only three TinderCard elements for a 500-card deck", () => {
    const cards = Array.from({ length: 500 }, (_, index) => `card-${index}`);
    const renderCard = vi.fn((item: string, index: number) => (
      <TinderCard key={item} index={index} data-testid={item}>
        {item}
      </TinderCard>
    ));

    render(
      <TinderRoot cards={cards}>
        {({ visibleCards }) => (
          <>
            {visibleCards.map(({ item, index }) => renderCard(item, index))}
            <TinderLikeButton>like</TinderLikeButton>
          </>
        )}
      </TinderRoot>,
    );

    expect(renderCard.mock.calls.map(([, index]) => index)).toEqual([0, 1, 2]);

    const firstCard = screen.getByTestId("card-0");
    fireEvent.click(screen.getByRole("button", { name: "like" }));
    dispatchTransformEnd(firstCard);

    expect(renderCard.mock.calls.slice(-3).map(([, index]) => index)).toEqual([
      1, 2, 3,
    ]);
    expect(screen.queryByTestId("card-0")).not.toBeInTheDocument();
    expect(screen.getByTestId("card-3")).toBeInTheDocument();
  });

  it("keeps the legacy ReactNode children API working", () => {
    const cards = Array.from({ length: 5 }, (_, index) => `legacy-${index}`);
    const { container } = render(
      <TinderRoot cards={cards}>
        {cards.map((item, index) => (
          <TinderCard key={item} index={index} data-testid={item}>
            {item}
          </TinderCard>
        ))}
      </TinderRoot>,
    );

    expect(container.querySelectorAll('[data-testid^="legacy-"]')).toHaveLength(
      3,
    );
  });
});
