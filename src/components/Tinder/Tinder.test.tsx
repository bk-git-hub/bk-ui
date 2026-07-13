import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  TinderCard,
  TinderEmptyFallback,
  TinderLikeButton,
  TinderNopeButton,
  TinderRoot,
} from "./index";

const cards = ["first", "second", "third"];

const renderTinder = ({
  onSwipeLeft = vi.fn(),
  onSwipeRight = vi.fn(),
} = {}) => {
  const result = render(
    <TinderRoot
      cards={cards}
      onSwipeLeft={onSwipeLeft}
      onSwipeRight={onSwipeRight}
    >
      <div>
        {cards.map((card, index) => (
          <TinderCard key={card} index={index} data-testid={`card-${card}`}>
            {card}
          </TinderCard>
        ))}
      </div>
      <TinderNopeButton>nope</TinderNopeButton>
      <TinderLikeButton>like</TinderLikeButton>
      <TinderEmptyFallback>empty</TinderEmptyFallback>
    </TinderRoot>,
  );

  return { ...result, onSwipeLeft, onSwipeRight };
};

const dispatchTransformEnd = (element: HTMLElement) => {
  const event = new Event("transitionend", { bubbles: true });
  Object.defineProperty(event, "propertyName", { value: "transform" });
  fireEvent(element, event);
};

describe("Tinder swipe interactions", () => {
  let animationFrames: Map<number, FrameRequestCallback>;
  let requestAnimationFrameMock: ReturnType<typeof vi.fn>;
  let cancelAnimationFrameMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    animationFrames = new Map();
    let nextFrameId = 1;

    requestAnimationFrameMock = vi.fn((callback: FrameRequestCallback) => {
      const frameId = nextFrameId++;
      animationFrames.set(frameId, callback);
      return frameId;
    });
    cancelAnimationFrameMock = vi.fn((frameId: number) => {
      animationFrames.delete(frameId);
    });

    vi.stubGlobal("requestAnimationFrame", requestAnimationFrameMock);
    vi.stubGlobal("cancelAnimationFrame", cancelAnimationFrameMock);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const runAnimationFrame = () => {
    const nextFrame = animationFrames.entries().next().value as
      | [number, FrameRequestCallback]
      | undefined;
    if (!nextFrame) throw new Error("Expected a scheduled animation frame");

    const [frameId, callback] = nextFrame;
    animationFrames.delete(frameId);
    act(() => callback(16));
  };

  it("ignores repeated swipe requests and completes a transition only once", () => {
    const { onSwipeRight } = renderTinder();
    const firstCard = screen.getByTestId("card-first");
    const likeButton = screen.getByRole("button", { name: "like" });

    fireEvent.click(likeButton);
    fireEvent.click(likeButton);

    expect(onSwipeRight).toHaveBeenCalledTimes(1);

    const opacityEnd = new Event("transitionend", { bubbles: true });
    Object.defineProperty(opacityEnd, "propertyName", { value: "opacity" });
    fireEvent(firstCard, opacityEnd);
    expect(screen.getByTestId("card-first")).toBeInTheDocument();

    dispatchTransformEnd(firstCard);
    act(() => vi.runAllTimers());

    expect(screen.queryByTestId("card-first")).not.toBeInTheDocument();
    expect(screen.getByTestId("card-second")).toBeInTheDocument();
    expect(onSwipeRight).toHaveBeenCalledTimes(1);
  });

  it("hides inactive cards from assistive technology by default", () => {
    renderTinder();

    expect(screen.getByTestId("card-first")).toHaveAttribute(
      "aria-hidden",
      "false",
    );
    expect(screen.getByTestId("card-second")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(screen.getByTestId("card-third")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("lets consumers override the default aria-hidden value", () => {
    render(
      <TinderRoot cards={cards}>
        {cards.map((card, index) => (
          <TinderCard
            key={card}
            index={index}
            aria-hidden={index === 0}
            data-testid={`override-${card}`}
          >
            {card}
          </TinderCard>
        ))}
      </TinderRoot>,
    );

    expect(screen.getByTestId("override-first")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(screen.getByTestId("override-second")).toHaveAttribute(
      "aria-hidden",
      "false",
    );
  });

  it("uses a fallback when the browser does not emit transitionend", () => {
    const { onSwipeLeft } = renderTinder();

    fireEvent.click(screen.getByRole("button", { name: "nope" }));
    act(() => vi.advanceTimersByTime(249));
    expect(screen.getByTestId("card-first")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1));

    expect(screen.queryByTestId("card-first")).not.toBeInTheDocument();
    expect(screen.getByTestId("card-second")).toBeInTheDocument();
    expect(onSwipeLeft).toHaveBeenCalledTimes(1);
  });

  it("coalesces pointer moves and flushes the latest position on pointerup", () => {
    const { onSwipeRight } = renderTinder();
    const firstCard = screen.getByTestId("card-first");

    fireEvent.pointerDown(firstCard, { clientX: 100, clientY: 0 });
    fireEvent.pointerMove(window, { clientX: 150, clientY: 0 });
    fireEvent.pointerMove(window, { clientX: 220, clientY: 0 });

    expect(requestAnimationFrameMock).toHaveBeenCalledTimes(1);
    expect(animationFrames.size).toBe(1);

    fireEvent.pointerUp(window, { clientX: 220, clientY: 0 });

    expect(cancelAnimationFrameMock).toHaveBeenCalledTimes(1);
    expect(animationFrames.size).toBe(0);
    expect(onSwipeRight).toHaveBeenCalledTimes(1);

    dispatchTransformEnd(firstCard);
  });

  it("ignores button swipes while a pointer drag is active", () => {
    const { onSwipeRight } = renderTinder();
    const firstCard = screen.getByTestId("card-first");

    fireEvent.pointerDown(firstCard, { clientX: 100, clientY: 0 });
    fireEvent.click(screen.getByRole("button", { name: "like" }));

    expect(onSwipeRight).not.toHaveBeenCalled();

    fireEvent.pointerCancel(window, { clientX: 100, clientY: 0 });
  });

  it("interpolates from the declarative next-card rest state", () => {
    renderTinder();
    const firstCard = screen.getByTestId("card-first");
    const secondCard = screen.getByTestId("card-second");

    expect(secondCard.style.transform).toBe(
      "scale(0.9) translate3d(0, 12px, 0)",
    );

    fireEvent.pointerDown(firstCard, { clientX: 100, clientY: 0 });
    expect(secondCard.style.transition).toBe("none");

    fireEvent.pointerMove(window, { clientX: 150, clientY: 0 });
    runAnimationFrame();

    expect(firstCard.style.transform).toContain("translate3d(50px, 0px, 0)");
    expect(secondCard.style.transform).toBe(
      "scale(0.95) translate3d(0, 6px, 0)",
    );

    fireEvent.pointerCancel(window, { clientX: 150, clientY: 0 });

    expect(firstCard.style.transform).toBe("translate3d(0, 0, 0)");
    expect(secondCard.style.transform).toBe(
      "scale(0.9) translate3d(0, 12px, 0)",
    );

    fireEvent.pointerMove(window, { clientX: 250, clientY: 0 });
    expect(requestAnimationFrameMock).toHaveBeenCalledTimes(1);
  });

  it("cancels pending drag work when the component unmounts", () => {
    const { unmount } = renderTinder();
    const firstCard = screen.getByTestId("card-first");

    fireEvent.pointerDown(firstCard, { clientX: 100, clientY: 0 });
    fireEvent.pointerMove(window, { clientX: 150, clientY: 0 });
    expect(animationFrames.size).toBe(1);

    unmount();

    expect(cancelAnimationFrameMock).toHaveBeenCalledTimes(1);
    expect(animationFrames.size).toBe(0);
  });

  it("clears the transition fallback when the component unmounts", () => {
    const { unmount } = renderTinder();

    fireEvent.click(screen.getByRole("button", { name: "like" }));
    expect(vi.getTimerCount()).toBe(1);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
