import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Coverflow } from "./coverflow";
import { CoverflowItem } from "./coverflow-item";

let requestAnimationFrameMock: ReturnType<typeof vi.fn>;
let cancelAnimationFrameMock: ReturnType<typeof vi.fn>;

// 테스트 시간을 조작하기 위해 가짜 타이머 사용
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(0);
  requestAnimationFrameMock = vi.fn((callback: FrameRequestCallback) =>
    window.setTimeout(() => callback(Date.now()), 16),
  );
  cancelAnimationFrameMock = vi.fn((id: number) => clearTimeout(id));
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

  const createItems = (count: number) =>
    Array.from({ length: count }, (_, itemIndex) => (
      <CoverflowItem key={itemIndex}>Item {itemIndex}</CoverflowItem>
    ));

  // 헬퍼 함수: 카드의 래퍼 요소(zIndex가 있는 div)를 안전하게 찾음
  const getCardWrapper = (cardText: string) => {
    const textElement = screen.getByText(cardText);
    // .absolute 클래스를 가진 가장 가까운 조상 div를 찾습니다.
    // (Coverflow 컴포넌트에서 부여한 className="absolute top-0 left-0 ..." 요소)
    return textElement.closest(".absolute.top-0") as HTMLElement;
  };

  const getMountedCards = (container: HTMLElement) =>
    Array.from(
      container.querySelectorAll<HTMLElement>(".touch-none > .absolute.top-0"),
    );

  it("1. [화면 조정] 화면 크기가 바뀌면 아이템 크기(size)가 자동 조정되어야 한다", () => {
    const { container } = renderCoverflow();
    // 가장 바깥의 컨테이너 (ref={containerRef})
    const coverflowContainer = container.firstChild as HTMLElement;
    // 실제 아이템들이 들어있는 내부 컨테이너 (width/height가 size로 설정되는 곳)
    const innerWrapper = coverflowContainer.firstChild as HTMLElement;

    act(() => {
      // ResizeObserver 콜백 강제 실행
      if ((coverflowContainer as any).__resizeCallback) {
        (coverflowContainer as any).__resizeCallback([
          { contentRect: { width: 1000 } },
        ]);
      }
    });

    // width/3.6 = 1000/3.6 = 약 277px
    expect(innerWrapper.style.width).toMatch(/277\./);
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

    // 클릭
    fireEvent.click(card3Wrapper);

    act(() => {
      vi.runAllTimers();
    });

    // 클릭 후 최상위로 올라옴
    expect(card3Wrapper.style.zIndex).toBe("3");
  });

  it("5. [키보드] 방향키로 이동이 가능해야 한다", () => {
    renderCoverflow();

    // 오른쪽 화살표 키
    fireEvent.keyDown(window, { key: "ArrowRight" });

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
});
