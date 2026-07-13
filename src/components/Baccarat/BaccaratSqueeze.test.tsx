import { createRef } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BaccaratPlayingCard,
  BaccaratSqueezeAction,
  BaccaratSqueezeBack,
  BaccaratSqueezeCard,
  BaccaratSqueezeFace,
  BaccaratSqueezeFold,
  BaccaratSqueezeHandle,
  BaccaratSqueezeHint,
  BaccaratSqueezeRoot,
  type BaccaratSqueezeRootProps,
} from "./index";

function renderSqueeze(props: Partial<BaccaratSqueezeRootProps> = {}) {
  return render(
    <BaccaratSqueezeRoot
      data-testid="squeeze-root"
      revealAnnouncement="다이아몬드 8 카드가 공개됐습니다."
      {...props}
    >
      <BaccaratSqueezeCard data-testid="squeeze-card">
        <BaccaratSqueezeBack />
        <BaccaratSqueezeFace data-testid="card-face">
          <BaccaratPlayingCard rank="8" suit="diamonds" />
        </BaccaratSqueezeFace>
        <BaccaratSqueezeFold data-testid="card-fold" />
        <BaccaratSqueezeHandle />
      </BaccaratSqueezeCard>
      <BaccaratSqueezeHint />
      <BaccaratSqueezeAction />
    </BaccaratSqueezeRoot>,
  );
}

describe("BaccaratSqueeze", () => {
  let animationFrames: Map<number, FrameRequestCallback>;
  let requestAnimationFrameMock: ReturnType<typeof vi.fn>;
  let cancelAnimationFrameMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
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
    vi.unstubAllGlobals();
  });

  function prepareCard(card: HTMLElement) {
    let capturedPointerId: number | null = null;
    Object.defineProperties(card, {
      setPointerCapture: {
        configurable: true,
        value: vi.fn((pointerId: number) => {
          capturedPointerId = pointerId;
        }),
      },
      hasPointerCapture: {
        configurable: true,
        value: vi.fn((pointerId: number) => capturedPointerId === pointerId),
      },
      releasePointerCapture: {
        configurable: true,
        value: vi.fn((pointerId: number) => {
          if (capturedPointerId === pointerId) capturedPointerId = null;
        }),
      },
    });
    vi.spyOn(card, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 200,
      bottom: 280,
      width: 200,
      height: 280,
      toJSON: () => ({}),
    });
  }

  it.each([
    {
      corner: "top-left",
      start: [4, 4],
      end: [168, 168],
      clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 100% 100%, 0% 100%)",
    },
    {
      corner: "top-right",
      start: [196, 4],
      end: [32, 168],
      clipPath: "polygon(100% 0%, 0% 0%, 0% 100%, 0% 100%, 100% 100%)",
    },
    {
      corner: "bottom-left",
      start: [4, 276],
      end: [168, 112],
      clipPath: "polygon(0% 100%, 100% 100%, 100% 0%, 100% 0%, 0% 0%)",
    },
    {
      corner: "bottom-right",
      start: [196, 276],
      end: [32, 112],
      clipPath: "polygon(100% 100%, 0% 100%, 0% 0%, 0% 0%, 100% 0%)",
    },
  ] as const)(
    "detects and reveals freely from $corner",
    ({ corner, start, end, clipPath }) => {
      const onReveal = vi.fn();
      const onValueCommit = vi.fn();
      renderSqueeze({ onReveal, onValueCommit });
      const root = screen.getByTestId("squeeze-root");
      const card = screen.getByTestId("squeeze-card");
      const face = screen.getByTestId("card-face");
      const fold = screen.getByTestId("card-fold");
      prepareCard(card);

      fireEvent.pointerDown(card, {
        pointerId: 7,
        pointerType: "touch",
        clientX: start[0],
        clientY: start[1],
      });

      expect(root).toHaveAttribute("data-corner", corner);
      expect(root).toHaveAttribute("data-origin", "corner");

      fireEvent.pointerMove(card, {
        pointerId: 7,
        pointerType: "touch",
        clientX: end[0],
        clientY: end[1],
      });
      fireEvent.pointerUp(card, {
        pointerId: 7,
        pointerType: "touch",
        clientX: end[0],
        clientY: end[1],
      });

      const detail = {
        corner,
        input: "pointer",
        origin: "corner",
      } as const;

      expect(card).toHaveAttribute("aria-valuenow", "100");
      expect(face).toHaveStyle({ clipPath });
      expect(fold.style.background).toContain("linear-gradient(");
      expect(fold.style.background).not.toContain("radial-gradient(");
      expect(face).toHaveAttribute("aria-hidden", "false");
      expect(onReveal).toHaveBeenCalledOnce();
      expect(onReveal).toHaveBeenCalledWith(detail);
      expect(onValueCommit).toHaveBeenCalledWith(1, detail);
      expect(cancelAnimationFrameMock).toHaveBeenCalledOnce();
      expect(animationFrames).toHaveLength(0);
      expect(screen.getByRole("status")).toHaveTextContent(
        "다이아몬드 8 카드가 공개됐습니다.",
      );
    },
  );

  it("selects a new corner for every drag on the same card", () => {
    renderSqueeze();
    const root = screen.getByTestId("squeeze-root");
    const card = screen.getByTestId("squeeze-card");
    prepareCard(card);

    (
      [
        ["top-left", 4, 4],
        ["top-right", 196, 4],
        ["bottom-left", 4, 276],
        ["bottom-right", 196, 276],
      ] as const
    ).forEach(([corner, clientX, clientY], index) => {
      const pointerId = index + 30;
      fireEvent.pointerDown(card, {
        pointerId,
        pointerType: "touch",
        clientX,
        clientY,
      });
      expect(root).toHaveAttribute("data-corner", corner);
      expect(root).toHaveAttribute("data-origin", "corner");
      fireEvent.pointerCancel(card, { pointerId, pointerType: "touch" });
    });
  });

  it.each([
    ["top-left", "polygon(0% 0%, 100% 0%, 100% 0%, 0% 100%, 0% 100%)"],
    ["top-right", "polygon(100% 0%, 0% 0%, 0% 0%, 100% 100%, 100% 100%)"],
    ["bottom-left", "polygon(0% 100%, 100% 100%, 100% 100%, 0% 0%, 0% 0%)"],
    ["bottom-right", "polygon(100% 100%, 0% 100%, 0% 100%, 100% 0%, 100% 0%)"],
  ] as const)(
    "uses a straight diagonal boundary from %s",
    (corner, clipPath) => {
      renderSqueeze({ value: 0.5, corner });

      expect(screen.getByTestId("card-face")).toHaveStyle({ clipPath });
    },
  );

  it("keeps the side boundary linear at partial progress", () => {
    renderSqueeze({ value: 0.5 });
    const card = screen.getByTestId("squeeze-card");
    const face = screen.getByTestId("card-face");
    const fold = screen.getByTestId("card-fold");
    prepareCard(card);

    fireEvent.pointerDown(card, {
      pointerId: 21,
      pointerType: "touch",
      clientX: 196,
      clientY: 140,
    });
    expect(face).toHaveStyle({ clipPath: "inset(0 0 0 50%)" });
    expect(fold.style.background).toContain("linear-gradient(to left");
    fireEvent.pointerCancel(card, {
      pointerId: 21,
      pointerType: "touch",
    });

    fireEvent.pointerDown(card, {
      pointerId: 22,
      pointerType: "touch",
      clientX: 4,
      clientY: 140,
    });
    expect(face).toHaveStyle({ clipPath: "inset(0 50% 0 0)" });
    expect(fold.style.background).toContain("linear-gradient(to right");
    fireEvent.pointerCancel(card, {
      pointerId: 22,
      pointerType: "touch",
    });
  });

  it("opens smoothly from either long side", () => {
    const { rerender } = renderSqueeze();
    const root = screen.getByTestId("squeeze-root");
    const card = screen.getByTestId("squeeze-card");
    const face = screen.getByTestId("card-face");
    prepareCard(card);

    fireEvent.pointerDown(card, {
      pointerId: 11,
      pointerType: "touch",
      clientX: 196,
      clientY: 140,
    });
    expect(root).toHaveAttribute("data-origin", "right-edge");

    fireEvent.pointerMove(card, {
      pointerId: 11,
      pointerType: "touch",
      clientX: 24,
      clientY: 140,
    });
    fireEvent.pointerUp(card, {
      pointerId: 11,
      pointerType: "touch",
      clientX: 24,
      clientY: 140,
    });

    expect(face).toHaveStyle({ clipPath: "inset(0 0 0 0%)" });
    fireEvent.click(screen.getByRole("button", { name: "다시 가리기" }));
    expect(face).toHaveStyle({ clipPath: "inset(0 0 0 100%)" });
    expect(root).toHaveAttribute("data-origin", "right-edge");

    rerender(
      <BaccaratSqueezeRoot data-testid="squeeze-root">
        <BaccaratSqueezeCard data-testid="squeeze-card">
          <BaccaratSqueezeFace data-testid="card-face" />
        </BaccaratSqueezeCard>
      </BaccaratSqueezeRoot>,
    );
    const leftCard = screen.getByTestId("squeeze-card");
    prepareCard(leftCard);
    fireEvent.pointerDown(leftCard, {
      pointerId: 12,
      pointerType: "touch",
      clientX: 4,
      clientY: 140,
    });

    expect(screen.getByTestId("squeeze-root")).toHaveAttribute(
      "data-origin",
      "left-edge",
    );
    fireEvent.pointerMove(leftCard, {
      pointerId: 12,
      pointerType: "touch",
      clientX: 176,
      clientY: 140,
    });
    fireEvent.pointerUp(leftCard, {
      pointerId: 12,
      pointerType: "touch",
      clientX: 176,
      clientY: 140,
    });
    expect(screen.getByTestId("card-face")).toHaveStyle({
      clipPath: "inset(0 0% 0 0)",
    });
  });

  it("returns a short or cancelled squeeze to the concealed state", () => {
    const onValueCommit = vi.fn();
    renderSqueeze({ defaultValue: 0.25, onValueCommit });
    const card = screen.getByTestId("squeeze-card");
    prepareCard(card);

    fireEvent.pointerDown(card, {
      pointerId: 2,
      pointerType: "mouse",
      button: 0,
      clientX: 196,
      clientY: 140,
    });
    fireEvent.pointerUp(card, {
      pointerId: 2,
      pointerType: "mouse",
      clientX: 180,
      clientY: 140,
    });

    expect(card).toHaveAttribute("aria-valuenow", "0");
    expect(onValueCommit).toHaveBeenLastCalledWith(0, {
      corner: "bottom-right",
      input: "pointer",
      origin: "right-edge",
    });
    expect(screen.getByTestId("squeeze-root")).toHaveAttribute(
      "data-origin",
      "right-edge",
    );
    expect(
      document.querySelector('[data-edge="right-edge"]'),
    ).not.toHaveAttribute("data-active");

    fireEvent.pointerDown(card, {
      pointerId: 3,
      pointerType: "touch",
      clientX: 190,
      clientY: 270,
    });
    fireEvent.pointerMove(card, {
      pointerId: 3,
      pointerType: "touch",
      clientX: 50,
      clientY: 130,
    });
    fireEvent.pointerCancel(card, { pointerId: 3, pointerType: "touch" });

    expect(card).toHaveAttribute("aria-valuenow", "0");
  });

  it("supports continuous keyboard control and the non-drag action", () => {
    const onReveal = vi.fn();
    renderSqueeze({ onReveal });
    const card = screen.getByRole("slider");

    fireEvent.keyDown(card, { key: "ArrowRight" });
    expect(card).toHaveAttribute("aria-valuenow", "5");

    fireEvent.keyDown(card, { key: "ArrowUp", shiftKey: true });
    expect(card).toHaveAttribute("aria-valuenow", "25");

    fireEvent.keyDown(card, { key: "End" });
    fireEvent.keyDown(card, { key: "End" });
    expect(card).toHaveAttribute("aria-valuenow", "100");
    expect(onReveal).toHaveBeenCalledOnce();

    fireEvent.keyDown(card, { key: "Home" });
    expect(card).toHaveAttribute("aria-valuenow", "0");

    fireEvent.click(screen.getByRole("button", { name: "바로 공개" }));
    expect(card).toHaveAttribute("aria-valuenow", "100");
    expect(onReveal).toHaveBeenCalledTimes(2);
    expect(
      screen.getByRole("button", { name: "다시 가리기" }),
    ).toBeInTheDocument();
  });

  it("does not announce an externally controlled reveal again", () => {
    const onReveal = vi.fn();
    const { rerender } = render(
      <BaccaratSqueezeRoot value={0} onReveal={onReveal}>
        <BaccaratSqueezeCard />
      </BaccaratSqueezeRoot>,
    );

    rerender(
      <BaccaratSqueezeRoot value={1} onReveal={onReveal}>
        <BaccaratSqueezeCard />
      </BaccaratSqueezeRoot>,
    );
    fireEvent.keyDown(screen.getByRole("slider"), { key: "End" });

    expect(onReveal).not.toHaveBeenCalled();
  });

  it("lets consumers extend native props and cancel internal handlers", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <BaccaratSqueezeRoot className="custom-root" data-testid="root">
        <BaccaratSqueezeCard
          ref={ref}
          className="custom-card"
          aria-label="숨겨진 플레이어 카드"
          onKeyDown={(event) => event.preventDefault()}
        />
      </BaccaratSqueezeRoot>,
    );
    const root = screen.getByTestId("root");
    const card = screen.getByRole("slider", { name: "숨겨진 플레이어 카드" });

    expect(root).toHaveClass("custom-root");
    expect(card).toHaveClass("custom-card");
    expect(ref.current).toBe(card);

    fireEvent.keyDown(card, { key: "End" });
    expect(card).toHaveAttribute("aria-valuenow", "0");
  });

  it("cleans up a queued drag frame when unmounted", () => {
    const { unmount } = renderSqueeze();
    const card = screen.getByTestId("squeeze-card");
    prepareCard(card);

    fireEvent.pointerDown(card, {
      pointerId: 9,
      pointerType: "touch",
      clientX: 190,
      clientY: 270,
    });
    fireEvent.pointerMove(card, {
      pointerId: 9,
      pointerType: "touch",
      clientX: 150,
      clientY: 230,
    });
    expect(animationFrames).toHaveLength(1);

    act(() => unmount());

    expect(cancelAnimationFrameMock).toHaveBeenCalledOnce();
    expect(animationFrames).toHaveLength(0);
  });
});
