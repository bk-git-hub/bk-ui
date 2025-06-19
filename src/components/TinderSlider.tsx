// src/components/TinderSliderNoLib.tsx

import React, { useState, useRef, useEffect, useCallback } from "react";

interface CardData {
  id: string;
  name: string;
  age: number;
  image: string;
}

interface TinderSliderProps {
  cards: CardData[];
}

const SWIPE_THRESHOLD = 100;

const TinderSliderNoLib = ({ cards: initialCards }: TinderSliderProps) => {
  const [cards] = useState(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);

  const topCardRef = useRef<HTMLDivElement>(null);
  const nextCardRef = useRef<HTMLDivElement>(null);

  const likeIndicatorRef = useRef<HTMLDivElement>(null);
  const nopeIndicatorRef = useRef<HTMLDivElement>(null);

  const isDraggingRef = useRef(false);
  const startPosRef = useRef(0);
  const currentTranslateRef = useRef(0);

  const animateSwipe = useCallback((direction: "left" | "right") => {
    if (!topCardRef.current) return;

    if (nextCardRef.current) {
      // 1. 다음 카드의 transition을 다시 활성화합니다.
      nextCardRef.current.style.transition = "transform 0.3s ease-out";
      // 2. 다음 카드의 transform을 최종 상태(scale 1, translateY 0)로 설정하여
      //    애니메이션을 명령합니다.
      nextCardRef.current.style.transform = `none`;
    }

    const flyOutX =
      (direction === "right" ? 1 : -1) * (window.innerWidth + 200);
    topCardRef.current.style.transition =
      "transform 0.5s ease-out, opacity 0.5s ease-out";
    topCardRef.current.style.transform = `translateX(${flyOutX}px) rotate(${
      flyOutX / 15
    }deg)`;
    topCardRef.current.style.opacity = "0";

    const handleTransitionEnd = () => {
      if (topCardRef.current) {
        topCardRef.current.style.transition = "";
        topCardRef.current.style.display = "none";
        topCardRef.current.removeEventListener(
          "transitionend",
          handleTransitionEnd,
        );
        setCurrentIndex((prev) => prev + 1);
      }
    };
    topCardRef.current.addEventListener("transitionend", handleTransitionEnd);
  }, []);

  const snapBack = useCallback(() => {
    if (!topCardRef.current) return;
    topCardRef.current.style.transition = "transform 0.3s ease-out";
    topCardRef.current.style.transform = "translateX(0px) rotate(0deg)";

    if (likeIndicatorRef.current) likeIndicatorRef.current.style.opacity = "0";
    if (nopeIndicatorRef.current) nopeIndicatorRef.current.style.opacity = "0";

    if (nextCardRef.current) {
      nextCardRef.current.style.transition = "transform 0.3s ease-out";
      nextCardRef.current.style.transform = "scale(0.8) translateY(10px)";
    }

    const handleTransitionEnd = () => {
      if (topCardRef.current) {
        topCardRef.current.style.transition = "";
      }
      if (nextCardRef.current) {
        nextCardRef.current.style.transition = "";
      }
      // ... (기존 removeEventListener 로직) ...
    };
    topCardRef.current.addEventListener("transitionend", handleTransitionEnd);
  }, []);

  const handleWindowPointerMove = useCallback((e: PointerEvent) => {
    if (!isDraggingRef.current || !topCardRef.current) return;

    const deltaX = e.clientX - startPosRef.current;
    currentTranslateRef.current = deltaX;
    const rotation = deltaX / 15;
    topCardRef.current.style.transform = `translateX(${deltaX}px) rotate(${rotation}deg)`;

    const likeOpacity = Math.max(0, Math.min(1, deltaX / SWIPE_THRESHOLD));
    const nopeOpacity = Math.max(0, Math.min(1, -deltaX / SWIPE_THRESHOLD));
    if (likeIndicatorRef.current)
      likeIndicatorRef.current.style.opacity = `${likeOpacity}`;
    if (nopeIndicatorRef.current)
      nopeIndicatorRef.current.style.opacity = `${nopeOpacity}`;

    if (nextCardRef.current) {
      const progress = Math.min(Math.abs(deltaX) / SWIPE_THRESHOLD, 1);
      const newScale = 0.8 + (1 - 0.81) * progress;
      const newTranslateY = 10 - 10 * progress;
      nextCardRef.current.style.transform = `scale(${newScale}) translateY(${newTranslateY}px)`;
      // 드래그 중에는 다음 카드의 transition을 제거하여 즉각 반응하도록 함
      nextCardRef.current.style.transition = "none";
    }
  }, []);

  const handleWindowPointerUp = useCallback(() => {
    window.removeEventListener("pointermove", handleWindowPointerMove);
    window.removeEventListener("pointerup", handleWindowPointerUp);

    isDraggingRef.current = false;

    if (Math.abs(currentTranslateRef.current) > SWIPE_THRESHOLD) {
      animateSwipe(currentTranslateRef.current > 0 ? "right" : "left");
    } else {
      snapBack();
    }

    currentTranslateRef.current = 0;
  }, [animateSwipe, snapBack, handleWindowPointerMove]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      isDraggingRef.current = true;
      startPosRef.current = e.clientX;
      if (topCardRef.current) {
        topCardRef.current.style.transition = "";
      }
      window.addEventListener("pointermove", handleWindowPointerMove);
      window.addEventListener("pointerup", handleWindowPointerUp);
    },
    [handleWindowPointerMove, handleWindowPointerUp],
  );

  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);
    };
  }, [handleWindowPointerMove, handleWindowPointerUp]);

  if (currentIndex >= cards.length) {
    // 모든 카드를 다 넘겼을 때의 조건 수정
    return (
      <div className="relative flex h-[450px] w-80 items-center justify-center">
        <div className="p-4 text-center">
          <h2 className="text-xl font-bold">더 이상 카드가 없습니다.</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-[450px] w-80 items-center justify-center select-none">
      {/* --- ⬇️ 렌더링 로직 통합 (핵심 수정 부분) ⬇️ --- */}
      {cards.map((card, index) => {
        // 이미 지나간 카드는 렌더링하지 않음
        if (index < currentIndex) return null;
        // 너무 많은 카드를 렌더링하지 않도록 제한 (성능 최적화)
        if (index > currentIndex + 2) return null;

        const isTopCard = index === currentIndex;
        const isNextCard = index === currentIndex + 1;

        return (
          <div
            // key 속성 덕분에 React가 DOM 요소를 재사용하여 깜빡임이 발생하지 않음
            key={card.id}
            // 여기에 transition 관련 클래스들을 추가하여 팝업 애니메이션을 구현합니다.
            className="absolute h-full w-full cursor-grab [touch-action:none] overflow-hidden rounded-xl bg-white shadow-lg transition-transform duration-300 ease-out"
            // 현재 카드일 때만 ref와 이벤트 핸들러를 적용
            ref={isTopCard ? topCardRef : isNextCard ? nextCardRef : null}
            onPointerDown={isTopCard ? handlePointerDown : undefined}
            style={{
              zIndex: cards.length - index,
              // 현재 카드가 아닐 때만 스택 효과(scale, translate)를 적용
              transform: isTopCard
                ? "none"
                : `scale(${1 - (index - currentIndex) * 0.2}) translateY(${(index - currentIndex) * 10}px)`,
            }}
          >
            <img
              src={card.image}
              alt={card.name}
              className="pointer-events-none h-full w-full object-cover"
            />
            {/* 현재 카드일 때만 이름, 나이, 인디케이터를 표시 */}
            {isTopCard && (
              <>
                <div className="pointer-events-none absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
                  <h3 className="text-2xl font-bold">
                    {card.name}, {card.age}
                  </h3>
                </div>
                <div
                  ref={likeIndicatorRef}
                  className="pointer-events-none absolute top-10 left-10 -rotate-12 transform rounded-xl border-4 border-green-500 p-2 text-4xl font-bold text-green-500 opacity-0"
                >
                  LIKE
                </div>
                <div
                  ref={nopeIndicatorRef}
                  className="pointer-events-none absolute top-10 right-10 rotate-12 transform rounded-xl border-4 border-red-500 p-2 text-4xl font-bold text-red-500 opacity-0"
                >
                  NOPE
                </div>
              </>
            )}
          </div>
        );
      })}
      {/* --- ⬆️ 렌더링 로직 통합 (핵심 수정 부분) ⬆️ --- */}

      {/* 컨트롤 버튼은 그대로 유지 */}
      <div className="absolute -bottom-20 flex space-x-8">
        <button
          onClick={() => animateSwipe("left")}
          className="rounded-full bg-white p-4 shadow-xl transition-transform active:scale-95"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <button
          onClick={() => animateSwipe("right")}
          className="rounded-full bg-white p-4 shadow-xl transition-transform active:scale-95"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-green-500"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TinderSliderNoLib;
