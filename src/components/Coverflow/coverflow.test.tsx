import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Coverflow } from "./coverflow";
import { CoverflowItem } from "./coverflow-item";

let requestAnimationFrameMock: ReturnType<typeof vi.fn>;
let cancelAnimationFrameMock: ReturnType<typeof vi.fn>;

// 테스트 시간을 조작하기 위해 가짜 타이머 사용
beforeEach(() => {
  vi.useFakeTimers({
    toFake: [
      "Date",
      "performance",
      "setTimeout",
      "clearTimeout",
      "setInterval",
      "clearInterval",
    ],
  });
  vi.setSystemTime(0);
  requestAnimationFrameMock = vi.fn((callback: FrameRequestCallback) =>
    window.setTimeout(() => callback(Date.now()), 16),
  );
  cancelAnimationFrameMock = vi.fn((id: number) => window.clearTimeout(id));
  vi.stubGlobal("requestAnimationFrame", requestAnimationFrameMock);
  vi.stubGlobal("cancelAnimationFrame", cancelAnimationFrameMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("Coverflow 통합 테스트", () => {
  const renderCoverflow = () =>
    render(
      <Coverflow>
        <CoverflowItem>Card 1</CoverflowItem>
        <CoverflowItem>Card 2</CoverflowItem>
        <CoverflowItem>Card 3</CoverflowItem>
      </Coverflow>,
    );

  const renderFlippableCoverflow = () =>
    render(
      <Coverflow>
        <CoverflowItem backContent={<span>Back 1</span>}>Card 1</CoverflowItem>
        <CoverflowItem backContent={<span>Back 2</span>}>Card 2</CoverflowItem>
        <CoverflowItem backContent={<span>Back 3</span>}>Card 3</CoverflowItem>
      </Coverflow>,
    );

  const createItems = (count: number) =>
    Array.from({ length: count }, (_, itemIndex) => (
      <CoverflowItem key={itemIndex}>Item {itemIndex}</CoverflowItem>
    ));

  // 카드의 안정적인 공개 data-slot을 기준으로 wrapper를 찾습니다.
  const getCardWrapper = (cardText: string) => {
    const textElement = screen.getByText(cardText);
    return textElement.closest('[data-slot="coverflow-card"]') as HTMLElement;
  };

  const getCoverflowCard = (cardText: string) => {
    const card = screen
      .getByText(cardText)
      .closest<HTMLElement>('[data-slot="coverflow-card"]');

    if (!card) throw new Error(`Coverflow card not found for ${cardText}`);
    return card;
  };

  const getCoverflowItem = (cardText: string) => {
    const item = screen
      .getByText(cardText)
      .closest<HTMLElement>('[data-slot="coverflow-item"]');

    if (!item) throw new Error(`Coverflow item not found for ${cardText}`);
    return item;
  };

  const getFlipTrigger = (cardText: string) => {
    const trigger = getCoverflowItem(cardText).querySelector<HTMLButtonElement>(
      '[data-slot="coverflow-flip-trigger"]',
    );

    if (!trigger)
      throw new Error(`Coverflow flip trigger not found for ${cardText}`);
    return trigger;
  };

  const getCloseTrigger = (cardText: string) => {
    const trigger = getCoverflowItem(cardText).querySelector<HTMLButtonElement>(
      '[data-slot="coverflow-close-trigger"]',
    );

    if (!trigger)
      throw new Error(`Coverflow close trigger not found for ${cardText}`);
    return trigger;
  };
  const getCardFace = (card: HTMLElement, face: "front" | "back") => {
    const element = card.querySelector<HTMLElement>(
      `[data-slot="coverflow-${face}"]`,
    );

    if (!element) throw new Error(`Coverflow ${face} face not found`);
    return element;
  };

  const getMountedCards = (container: HTMLElement) =>
    Array.from(
      container.querySelectorAll<HTMLElement>('[data-slot="coverflow-card"]'),
    );

  it("1. [컨테이너] 부모 크기를 채우고 가장 큰 정사각형 카드를 중앙에 배치해야 한다", () => {
    const { container } = renderCoverflow();
    const coverflowContainer = container.firstChild as HTMLElement;
    const viewport = coverflowContainer.querySelector<HTMLElement>(
      '[data-slot="coverflow-viewport"]',
    )!;
    const firstCard = getCardWrapper("Card 1");
    const resize = (width: number, height: number) => {
      act(() => {
        (coverflowContainer as any).__resizeCallback?.([
          { contentRect: { width, height } },
        ]);
      });
    };

    expect(coverflowContainer).toHaveClass(
      "aspect-[3.6/1]",
      "h-full",
      "w-full",
      "overflow-hidden",
      "[&_[data-slot=coverflow-flip-trigger]]:focus-visible:ring-inset",
    );
    expect(viewport).toHaveClass(
      "h-full",
      "w-full",
      "focus-visible:ring-inset",
    );
    expect(firstCard).toHaveClass("top-1/2", "left-1/2");

    resize(1000, 240);
    expect(firstCard.style.width).toBe("240px");
    expect(firstCard.style.height).toBe("240px");
    expect(firstCard.style.marginTop).toBe("-120px");
    expect(firstCard.style.marginLeft).toBe("-120px");

    resize(240, 600);
    expect(firstCard.style.width).toBe("240px");

    resize(1000, 0);
    expect(Number.parseFloat(firstCard.style.width)).toBeCloseTo(1000 / 3.6, 5);

    resize(150, 100);
    expect(firstCard.style.width).toBe("100px");

    resize(268, 182);
    expect(firstCard.style.width).toBe("182px");
  });

  it("2. [스크롤] 마우스 휠을 굴리면 다음 카드로 넘어가야 한다", () => {
    const { container } = renderCoverflow();
    const touchArea = container.querySelector(".touch-none")!;

    // 초기 상태 확인
    expect(getCardWrapper("Card 1").style.zIndex).toBe("3"); // 중앙
    expect(getCardWrapper("Card 2").style.zIndex).not.toBe("3"); // 옆

    // 휠을 아래로 굴림 (deltaY > 0 -> 인덱스 증가 -> 다음 카드)
    fireEvent.wheel(touchArea, { deltaY: 100 });

    // 스크롤 및 스냅 애니메이션 대기
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // 결과: Card 2가 중앙(zIndex: 3)으로 와야 함
    expect(getCardWrapper("Card 2").style.zIndex).toBe("3");
    expect(getCardWrapper("Card 1").style.zIndex).not.toBe("3");
  });

  it("3. [드래그] 시간차가 있는 드래그의 관성으로 다음 카드로 이동해야 한다", () => {
    const { container } = renderCoverflow();
    const touchArea = container.querySelector(".touch-none")!;

    fireEvent.mouseDown(touchArea, { clientX: 500 });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    fireEvent.mouseMove(window, { clientX: 450 });
    fireEvent.mouseUp(window);

    act(() => {
      vi.runAllTimers();
    });

    expect(getCardWrapper("Card 2").style.zIndex).toBe("3");
  });

  it("4. [클릭] 사이드 카드를 클릭하면 해당 카드가 중앙으로 와야 한다", () => {
    renderCoverflow();

    const card3Wrapper = getCardWrapper("Card 3");

    // 초기에는 zIndex가 낮음
    expect(card3Wrapper.style.zIndex).not.toBe("3");

    // 실제 브라우저 클릭 순서
    fireEvent.mouseDown(card3Wrapper, { clientX: 500 });
    fireEvent.mouseUp(window, { clientX: 500 });
    fireEvent.click(card3Wrapper);

    act(() => {
      vi.runAllTimers();
    });

    // 클릭 후 최상위로 올라옴
    expect(card3Wrapper.style.zIndex).toBe("3");
  });

  it("4-1. 실제 마우스 클릭 순서 뒤에도 사이드 카드가 이전 인덱스로 되돌아가지 않아야 한다", () => {
    const onActiveIndexChange = vi.fn();
    render(
      <Coverflow onActiveIndexChange={onActiveIndexChange}>
        <CoverflowItem backContent={<span>Back 1</span>}>
          Card 1
        </CoverflowItem>
        <CoverflowItem backContent={<span>Back 2</span>}>
          Card 2
        </CoverflowItem>
        <CoverflowItem backContent={<span>Back 3</span>}>
          Card 3
        </CoverflowItem>
      </Coverflow>,
    );

    const firstCard = getCoverflowCard("Card 1");
    const secondItem = getCoverflowItem("Card 2");
    const secondCard = getCoverflowCard("Card 2");

    fireEvent.mouseDown(secondItem, { clientX: 500 });
    fireEvent.mouseUp(window, { clientX: 500 });
    fireEvent.click(secondItem);

    act(() => {
      vi.runAllTimers();
    });

    expect(firstCard).toHaveAttribute("data-active", "false");
    expect(secondCard).toHaveAttribute("data-active", "true");
    expect(secondCard).toHaveAttribute("data-flipped", "false");
    expect(secondCard.style.zIndex).toBe("3");
    expect(secondCard.style.transform).toBe(
      "translateX(0px) scale(1) rotateY(0deg)",
    );
    expect(
      onActiveIndexChange.mock.calls.map(([nextIndex]) => nextIndex),
    ).toEqual([1]);
  });

  it("5. [키보드] 방향키로 이동이 가능해야 한다", () => {
    const { container } = renderCoverflow();
    const viewport = container.querySelector(
      '[data-slot="coverflow-viewport"]',
    )!;

    // 오른쪽 화살표 키
    fireEvent.keyDown(viewport, { key: "ArrowRight" });

    act(() => {
      vi.runAllTimers();
    });

    // Card 2 활성화
    expect(getCardWrapper("Card 2").style.zIndex).toBe("3");
  });

  it("6. 최대 17개만 마운트하고 현재 위치에서 8칸 이내만 표시해야 한다", () => {
    const { container } = render(<Coverflow>{createItems(30)}</Coverflow>);

    const mountedCards = () => getMountedCards(container);
    const displayedCards = () =>
      mountedCards().filter((card) => card.style.display !== "none");

    expect(mountedCards()).toHaveLength(17);
    expect(displayedCards()).toHaveLength(9);
    expect(screen.getByText("Item 0")).toBeInTheDocument();
    expect(screen.getByText("Item 16")).toBeInTheDocument();
    expect(screen.queryByText("Item 17")).not.toBeInTheDocument();

    fireEvent.click(getCardWrapper("Item 8"));
    fireEvent.click(getCardWrapper("Item 16"));

    expect(mountedCards()).toHaveLength(17);
    expect(displayedCards()).toHaveLength(17);
    expect(screen.queryByText("Item 7")).not.toBeInTheDocument();
    expect(screen.getByText("Item 8")).toBeInTheDocument();
    expect(screen.getByText("Item 24")).toBeInTheDocument();
    expect(screen.queryByText("Item 25")).not.toBeInTheDocument();
  });

  it("7. 같은 프레임의 연속 휠 입력을 하나의 animation frame으로 합쳐야 한다", () => {
    const { container } = render(<Coverflow>{createItems(30)}</Coverflow>);
    const touchArea = container.querySelector(".touch-none")!;

    for (let eventIndex = 0; eventIndex < 13; eventIndex += 1) {
      fireEvent.wheel(touchArea, { deltaY: 100 });
    }

    expect(requestAnimationFrameMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Item 0")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(16);
    });

    expect(getMountedCards(container)).toHaveLength(17);
    expect(screen.queryByText("Item 0")).not.toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
    expect(screen.getByText("Item 18")).toBeInTheDocument();
  });

  it("8. 드래그 뒤 발생하는 compatibility click만 소비해야 한다", () => {
    const { container } = renderCoverflow();
    const touchArea = container.querySelector(".touch-none")!;
    const card3Wrapper = getCardWrapper("Card 3");

    fireEvent.mouseDown(touchArea, { clientX: 500 });

    act(() => {
      vi.advanceTimersByTime(50);
    });

    fireEvent.mouseMove(window, { clientX: 496 });
    fireEvent.mouseUp(window);
    fireEvent.click(card3Wrapper);

    expect(getCardWrapper("Card 1").style.zIndex).toBe("3");
    expect(card3Wrapper.style.zIndex).not.toBe("3");

    fireEvent.click(card3Wrapper);

    expect(card3Wrapper.style.zIndex).toBe("3");
  });

  it("9. keyed children을 재정렬하면 DOM을 보존하고 새 인덱스의 transform을 적용해야 한다", () => {
    const renderKeyedItems = (keys: string[]) => (
      <Coverflow>
        {keys.map((key) => (
          <CoverflowItem key={key}>Keyed {key}</CoverflowItem>
        ))}
      </Coverflow>
    );
    const { rerender } = render(renderKeyedItems(["alpha", "beta", "gamma"]));
    const alphaWrapper = getCardWrapper("Keyed alpha");
    const betaWrapper = getCardWrapper("Keyed beta");
    const gammaWrapper = getCardWrapper("Keyed gamma");
    const centeredTransform = alphaWrapper.style.transform;
    const adjacentTransform = betaWrapper.style.transform;

    rerender(renderKeyedItems(["gamma", "alpha", "beta"]));

    const reorderedGammaWrapper = getCardWrapper("Keyed gamma");
    expect(reorderedGammaWrapper).toBe(gammaWrapper);
    expect(reorderedGammaWrapper.style.zIndex).toBe("3");
    expect(reorderedGammaWrapper.style.transform).toBe(centeredTransform);
    expect(getCardWrapper("Keyed alpha").style.zIndex).toBe("2");
    expect(getCardWrapper("Keyed alpha").style.transform).toBe(
      adjacentTransform,
    );
  });

  it("10. children이 줄면 현재 위치를 새 마지막 인덱스로 보정해야 한다", () => {
    const renderItems = (count: number) => (
      <Coverflow>{createItems(count)}</Coverflow>
    );
    const { container, rerender } = render(renderItems(20));

    fireEvent.click(getCardWrapper("Item 8"));
    fireEvent.click(getCardWrapper("Item 16"));
    rerender(renderItems(4));

    expect(getMountedCards(container)).toHaveLength(4);
    expect(screen.getByText("Item 0")).toBeInTheDocument();
    expect(screen.getByText("Item 3")).toBeInTheDocument();
    expect(screen.queryByText("Item 4")).not.toBeInTheDocument();
    expect(getCardWrapper("Item 3").style.zIndex).toBe("4");
    expect(getCardWrapper("Item 3").style.transform).toBe(
      "translateX(0px) scale(1) rotateY(0deg)",
    );
  });
  it("11. toggles the active card between its front and back faces", () => {
    renderFlippableCoverflow();

    const card = getCoverflowCard("Card 1");
    const item = getCoverflowItem("Card 1");
    const trigger = getFlipTrigger("Card 1");
    const front = getCardFace(item, "front");
    const centeredTransform = card.style.transform;

    expect(item).not.toHaveAttribute("role", "button");
    expect(trigger).toHaveAttribute("type", "button");
    expect(card).toHaveAttribute("data-active", "true");
    expect(card).toHaveAttribute("data-flipped", "false");
    expect(trigger).toHaveAttribute("aria-pressed", "false");
    expect(front).toHaveAttribute("aria-hidden", "false");
    expect(
      item.querySelector('[data-slot="coverflow-back"]'),
    ).not.toBeInTheDocument();

    fireEvent.click(item);
    const back = getCardFace(item, "back");

    expect(card).toHaveAttribute("data-flipped", "true");
    expect(trigger).toHaveAttribute("aria-pressed", "true");
    expect(front).toHaveAttribute("aria-hidden", "true");
    expect(back).toHaveAttribute("aria-hidden", "false");
    expect(card.style.transform).toBe(centeredTransform);

    fireEvent.click(item);

    expect(card).toHaveAttribute("data-flipped", "false");
    expect(trigger).toHaveAttribute("aria-pressed", "false");
    expect(front).toHaveAttribute("aria-hidden", "false");
    expect(back).toHaveAttribute("aria-hidden", "true");
  });

  it("12. centers a side card first, then flips it and resets the previous card", () => {
    renderFlippableCoverflow();

    const firstCard = getCoverflowCard("Card 1");
    const firstItem = getCoverflowItem("Card 1");
    const secondCard = getCoverflowCard("Card 2");
    const secondItem = getCoverflowItem("Card 2");
    const firstTrigger = getFlipTrigger("Card 1");
    const secondTrigger = getFlipTrigger("Card 2");

    fireEvent.click(firstItem);
    expect(firstCard).toHaveAttribute("data-flipped", "true");

    fireEvent.click(secondItem);

    expect(firstCard).toHaveAttribute("data-active", "false");
    expect(firstCard).toHaveAttribute("data-flipped", "false");
    expect(firstTrigger).toHaveAttribute("aria-pressed", "false");
    expect(secondCard).toHaveAttribute("data-active", "true");
    expect(secondCard).toHaveAttribute("data-flipped", "false");
    expect(secondTrigger).toHaveAttribute("aria-pressed", "false");
    expect(secondCard.style.zIndex).toBe("3");
    expect(secondCard.style.transform).toBe(
      "translateX(0px) scale(1) rotateY(0deg)",
    );

    fireEvent.click(secondItem);

    expect(secondCard).toHaveAttribute("data-flipped", "true");
    expect(secondTrigger).toHaveAttribute("aria-pressed", "true");
  });

  it("13. flips the focused active card with Enter and Space", () => {
    renderFlippableCoverflow();

    const card = getCoverflowCard("Card 1");
    const trigger = getFlipTrigger("Card 1");
    trigger.focus();

    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("tabindex", "0");

    fireEvent.keyDown(trigger, { key: "Enter" });
    expect(card).toHaveAttribute("data-flipped", "true");
    expect(trigger).toHaveAttribute("aria-pressed", "true");

    const didNotPreventSpace = fireEvent.keyDown(trigger, { key: " " });
    expect(didNotPreventSpace).toBe(false);
    expect(card).toHaveAttribute("data-flipped", "false");
    expect(trigger).toHaveAttribute("aria-pressed", "false");
  });

  it("14. suppresses the compatibility click after drag but accepts the next click", () => {
    const { container } = renderFlippableCoverflow();
    const touchArea = container.querySelector(".touch-none")!;
    const card = getCoverflowCard("Card 1");
    const item = getCoverflowItem("Card 1");

    fireEvent.mouseDown(touchArea, { clientX: 500 });

    act(() => {
      vi.advanceTimersByTime(50);
    });

    fireEvent.mouseMove(window, { clientX: 496 });
    fireEvent.mouseUp(window);
    fireEvent.click(item);

    expect(card).toHaveAttribute("data-active", "true");
    expect(card).toHaveAttribute("data-flipped", "false");

    fireEvent.click(item);

    expect(card).toHaveAttribute("data-flipped", "true");
  });

  it("15. keeps a legacy item without backContent unflipped", () => {
    renderCoverflow();

    const card = getCoverflowCard("Card 1");
    const item = getCoverflowItem("Card 1");

    expect(card).toHaveAttribute("data-active", "true");
    expect(card).toHaveAttribute("data-flipped", "false");
    expect(item).not.toHaveAttribute("role", "button");
    expect(item).not.toHaveAttribute("aria-pressed");

    fireEvent.click(item);

    expect(card).toHaveAttribute("data-flipped", "false");
  });

  it("16. lets a prevented item click cancel side-card navigation", () => {
    render(
      <Coverflow>
        <CoverflowItem backContent={<span>Back 1</span>}>Card 1</CoverflowItem>
        <CoverflowItem
          backContent={<span>Back 2</span>}
          onClick={(event) => event.preventDefault()}
        >
          Card 2
        </CoverflowItem>
      </Coverflow>,
    );

    const firstCard = getCoverflowCard("Card 1");
    const secondCard = getCoverflowCard("Card 2");
    fireEvent.click(getCoverflowItem("Card 2"));

    expect(firstCard).toHaveAttribute("data-active", "true");
    expect(secondCard).toHaveAttribute("data-active", "false");
  });

  it("17. consumes a drag click that lands on nested interactive content", () => {
    const { container } = render(
      <Coverflow>
        <CoverflowItem backContent={<span>Back 1</span>}>
          <span>Card 1</span>
          <button type="button">Front action</button>
        </CoverflowItem>
      </Coverflow>,
    );
    const touchArea = container.querySelector(".touch-none")!;
    const card = getCoverflowCard("Card 1");
    const item = getCoverflowItem("Card 1");

    fireEvent.mouseDown(touchArea, { clientX: 500 });
    act(() => vi.advanceTimersByTime(50));
    fireEvent.mouseMove(window, { clientX: 496 });
    fireEvent.mouseUp(window);
    fireEvent.click(screen.getByRole("button", { name: "Front action" }));

    expect(card).toHaveAttribute("data-flipped", "false");
    fireEvent.click(item);
    expect(card).toHaveAttribute("data-flipped", "true");
  });

  it("18. clears a flipped key when the active child is removed", () => {
    const renderKeyedFlippableItems = (keys: string[]) => (
      <Coverflow>
        {keys.map((key) => (
          <CoverflowItem key={key} backContent={<span>Back {key}</span>}>
            Key {key}
          </CoverflowItem>
        ))}
      </Coverflow>
    );
    const { rerender } = render(renderKeyedFlippableItems(["alpha", "beta"]));

    fireEvent.click(getCoverflowItem("Key alpha"));
    expect(getCoverflowCard("Key alpha")).toHaveAttribute(
      "data-flipped",
      "true",
    );

    rerender(renderKeyedFlippableItems(["beta"]));
    rerender(renderKeyedFlippableItems(["alpha", "beta"]));

    expect(getCoverflowCard("Key alpha")).toHaveAttribute(
      "data-flipped",
      "false",
    );
  });

  it("19. scopes arrow navigation to the carousel and moves trigger focus", () => {
    renderFlippableCoverflow();
    const firstTrigger = getFlipTrigger("Card 1");
    const secondTrigger = getFlipTrigger("Card 2");
    firstTrigger.focus();

    fireEvent.keyDown(firstTrigger, { key: "ArrowRight" });
    act(() => vi.runAllTimers());

    expect(getCoverflowCard("Card 2")).toHaveAttribute("data-active", "true");
    expect(secondTrigger).toHaveFocus();
  });

  it("20. synchronizes the active index before flipping during wheel settling", () => {
    const { container } = renderFlippableCoverflow();
    const viewport = container.querySelector(
      '[data-slot="coverflow-viewport"]',
    )!;
    const secondCard = getCoverflowCard("Card 2");

    fireEvent.wheel(viewport, { deltaY: 100 });
    act(() => vi.advanceTimersByTime(16));
    expect(secondCard).toHaveAttribute("data-active", "false");

    fireEvent.click(getCoverflowItem("Card 2"));

    expect(secondCard).toHaveAttribute("data-active", "true");
    expect(secondCard).toHaveAttribute("data-flipped", "true");
    expect(secondCard.style.transform).toBe(
      "translateX(0px) scale(1) rotateY(0deg)",
    );
  });
  it("21. returns focus to the trigger when the back face closes", () => {
    render(
      <Coverflow>
        <CoverflowItem
          backContent={
            <div>
              <span>Back details</span>
              <button type="button">Back action</button>
            </div>
          }
        >
          Card 1
        </CoverflowItem>
      </Coverflow>,
    );

    const item = getCoverflowItem("Card 1");
    const trigger = getFlipTrigger("Card 1");
    fireEvent.click(item);

    const backAction = screen.getByRole("button", { name: "Back action" });
    backAction.focus();
    expect(backAction).toHaveFocus();

    fireEvent.click(item);

    expect(trigger).toHaveFocus();
    expect(getCardFace(item, "back")).toHaveAttribute("inert");
  });
  it("22. shows arbitrary front content without a LazyImage readiness signal", () => {
    render(
      <Coverflow>
        <CoverflowItem backContent={<span>Custom back</span>}>
          <section>Custom front</section>
        </CoverflowItem>
      </Coverflow>,
    );

    const item = getCoverflowItem("Custom front");
    const surfaceContainer = item.querySelector(
      '[data-slot="coverflow-flip-surface"]',
    )?.parentElement;

    expect(surfaceContainer).toHaveStyle({ visibility: "visible" });
    expect(item.querySelector(".animate-pulse")).not.toBeInTheDocument();

    fireEvent.click(item);

    expect(getCardFace(item, "back")).toHaveAttribute("aria-hidden", "false");
  });

  it("23. removes controls on inactive faces from keyboard navigation", () => {
    render(
      <Coverflow>
        <CoverflowItem backContent={<span>Back 1</span>}>
          <span>Card 1</span>
          <button type="button">First action</button>
        </CoverflowItem>
        <CoverflowItem backContent={<span>Back 2</span>}>
          <span>Card 2</span>
          <button type="button">Second action</button>
        </CoverflowItem>
        <CoverflowItem>
          <span>Legacy 3</span>
          <button type="button">Legacy action</button>
        </CoverflowItem>
      </Coverflow>,
    );

    const firstItem = getCoverflowItem("Card 1");
    const secondItem = getCoverflowItem("Card 2");
    const legacyItem = getCoverflowItem("Legacy 3");
    const firstFront = getCardFace(firstItem, "front");
    const secondFront = getCardFace(secondItem, "front");
    const legacyFront = getCardFace(legacyItem, "front");

    expect(firstFront).not.toHaveAttribute("inert");
    expect(secondFront).toHaveAttribute("inert");
    expect(legacyFront).toHaveAttribute("inert");

    fireEvent.click(secondItem);

    expect(firstFront).toHaveAttribute("inert");
    expect(secondFront).not.toHaveAttribute("inert");

    fireEvent.click(legacyItem);

    expect(secondFront).toHaveAttribute("inert");
    expect(legacyFront).not.toHaveAttribute("inert");
  });
  it("24. closes a flipped item only when the click is outside its square surface", () => {
    render(
      <Coverflow>
        <CoverflowItem backContent={<button type="button">Back action</button>}>
          Card 1
        </CoverflowItem>
      </Coverflow>,
    );

    const card = getCoverflowCard("Card 1");
    const item = getCoverflowItem("Card 1");
    fireEvent.click(item);

    expect(card).toHaveAttribute("data-flipped", "true");

    fireEvent.click(item);
    expect(card).toHaveAttribute("data-flipped", "false");

    fireEvent.click(item);
    expect(card).toHaveAttribute("data-flipped", "true");

    fireEvent.click(screen.getByRole("button", { name: "Back action" }));
    expect(card).toHaveAttribute("data-flipped", "true");

    fireEvent.click(document.body);

    expect(card).toHaveAttribute("data-flipped", "false");
    expect(getCardFace(item, "back")).toHaveAttribute("aria-hidden", "true");
    expect(getCardFace(item, "back")).toHaveAttribute("inert");
  });

  it("25. renders an accessible top-right close button without starting a drag", () => {
    const onItemClick = vi.fn();
    render(
      <Coverflow>
        <CoverflowItem
          closeLabel="Close Card 1 details"
          backContent={<span>Back 1</span>}
          onClick={onItemClick}
        >
          Card 1
        </CoverflowItem>
        <CoverflowItem backContent={<span>Back 2</span>}>Card 2</CoverflowItem>
      </Coverflow>,
    );

    const firstCard = getCoverflowCard("Card 1");
    const secondCard = getCoverflowCard("Card 2");
    const firstItem = getCoverflowItem("Card 1");
    const flipTrigger = getFlipTrigger("Card 1");
    fireEvent.click(firstItem);
    onItemClick.mockClear();

    const closeTrigger = getCloseTrigger("Card 1");
    expect(closeTrigger).toHaveAttribute("type", "button");
    expect(closeTrigger).toHaveAccessibleName("Close Card 1 details");
    expect(closeTrigger).toHaveClass("top-2", "right-2");

    closeTrigger.focus();
    fireEvent.mouseDown(closeTrigger, { clientX: 500 });
    fireEvent.mouseMove(window, { clientX: 430 });
    fireEvent.mouseUp(window);
    fireEvent.click(closeTrigger);

    expect(firstCard).toHaveAttribute("data-flipped", "false");
    expect(secondCard).toHaveAttribute("data-active", "false");
    expect(onItemClick).not.toHaveBeenCalled();
    expect(flipTrigger).toHaveFocus();
  });

  it("26. keeps carousel arrow navigation out of the close button", () => {
    renderFlippableCoverflow();

    const firstCard = getCoverflowCard("Card 1");
    const secondCard = getCoverflowCard("Card 2");
    fireEvent.click(getCoverflowItem("Card 1"));

    const closeTrigger = getCloseTrigger("Card 1");
    closeTrigger.focus();
    fireEvent.keyDown(closeTrigger, { key: "ArrowRight" });
    act(() => vi.runAllTimers());

    expect(firstCard).toHaveAttribute("data-active", "true");
    expect(firstCard).toHaveAttribute("data-flipped", "true");
    expect(secondCard).toHaveAttribute("data-active", "false");
    expect(closeTrigger).toHaveFocus();
  });
});
