import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Coverflow } from "./coverflow";
import { CoverflowItem } from "./coverflow-item";

// 테스트 시간을 조작하기 위해 가짜 타이머 사용
beforeEach(() => {
  vi.useFakeTimers();
  // requestAnimationFrame 모킹
  let lastTime = 0;
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const currTime = Date.now();
    const timeToCall = Math.max(0, 16 - (currTime - lastTime));
    const id = setTimeout(() => callback(currTime + timeToCall), timeToCall);
    lastTime = currTime + timeToCall;
    return id as unknown as number;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id));
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

  // 헬퍼 함수: 카드의 래퍼 요소(zIndex가 있는 div)를 안전하게 찾음
  const getCardWrapper = (cardText: string) => {
    const textElement = screen.getByText(cardText);
    // .absolute 클래스를 가진 가장 가까운 조상 div를 찾습니다.
    // (Coverflow 컴포넌트에서 부여한 className="absolute top-0 left-0 ..." 요소)
    return textElement.closest(".absolute.top-0") as HTMLElement;
  };

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

  it("3. [드래그] 마우스로 잡고 끌면 위치가 이동해야 한다", () => {
    const { container } = renderCoverflow();
    const touchArea = container.querySelector(".touch-none")!;

    // 1. 드래그 시작 (500px 지점)
    fireEvent.mouseDown(touchArea, { clientX: 500 });

    // 2. 드래그 이동 (왼쪽으로 약 70px 이동 -> 인덱스 1만큼 증가 유도)
    // 기존 300px(-200px 이동)은 너무 멀리 가서 Card 3까지 넘어가버림
    act(() => {
      fireEvent.mouseMove(window, { clientX: 430 });
      vi.advanceTimersByTime(100);
    });

    // 3. 드래그 종료
    fireEvent.mouseUp(window);

    // 관성 애니메이션 대기
    act(() => {
      vi.runAllTimers();
    });

    // 결과: Card 2가 활성화되어야 함 (zIndex 3)
    // Card 3까지 넘어가지 않았는지 확인
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
});
