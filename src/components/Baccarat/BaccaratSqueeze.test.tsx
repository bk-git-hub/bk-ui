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
      revealAnnouncement="다이아몬드 8 카드가 공개됐습니다."
      {...props}
    >
      <BaccaratSqueezeCard data-testid="squeeze-card">
        <BaccaratSqueezeBack />
        <BaccaratSqueezeFace data-testid="card-face">
          <BaccaratPlayingCard rank="8" suit="diamonds" />
        </BaccaratSqueezeFace>
        <BaccaratSqueezeFold />
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

  it("reveals from the corner drag and announces the result once", () => {
    const onReveal = vi.fn();
    const onValueCommit = vi.fn();
    renderSqueeze({ onReveal, onValueCommit });
    const card = screen.getByTestId("squeeze-card");
    const face = screen.getByTestId("card-face");
    prepareCard(card);

    expect(card).toHaveAttribute("aria-valuenow", "0");
    expect(face).toHaveAttribute("aria-hidden", "true");

    fireEvent.pointerDown(card, {
      pointerId: 7,
      pointerType: "touch",
      clientX: 196,
      clientY: 276,
    });
    fireEvent.pointerMove(card, {
      pointerId: 7,
      pointerType: "touch",
      clientX: 120,
      clientY: 200,
    });
    fireEvent.pointerMove(card, {
      pointerId: 7,
      pointerType: "touch",
      clientX: 32,
      clientY: 112,
    });

    expect(requestAnimationFrameMock).toHaveBeenCalledTimes(1);

    fireEvent.pointerUp(card, {
      pointerId: 7,
      pointerType: "touch",
      clientX: 32,
      clientY: 112,
    });

    expect(cancelAnimationFrameMock).toHaveBeenCalledTimes(1);
    expect(animationFrames).toHaveLength(0);
    expect(card).toHaveAttribute("aria-valuenow", "100");
    expect(face).toHaveAttribute("aria-hidden", "false");
    expect(onReveal).toHaveBeenCalledOnce();
    expect(onValueCommit).toHaveBeenCalledWith(1, {
      corner: "bottom-right",
      input: "pointer",
    });
    expect(screen.getByRole("status")).toHaveTextContent(
      "다이아몬드 8 카드가 공개됐습니다.",
    );
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
      clientX: 190,
      clientY: 270,
    });
    fireEvent.pointerUp(card, {
      pointerId: 2,
      pointerType: "mouse",
      clientX: 176,
      clientY: 256,
    });

    expect(card).toHaveAttribute("aria-valuenow", "0");
    expect(onValueCommit).toHaveBeenLastCalledWith(0, {
      corner: "bottom-right",
      input: "pointer",
    });

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
