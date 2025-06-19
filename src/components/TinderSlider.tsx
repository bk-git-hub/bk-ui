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
  const [cards, setCards] = useState(initialCards); //eslint-dsiable-line no-unused-vars
  const [currentIndex, setCurrentIndex] = useState(0);

  const topCardRef = useRef<HTMLDivElement>(null);

  const likeIndicatorRef = useRef<HTMLDivElement>(null);
  const nopeIndicatorRef = useRef<HTMLDivElement>(null);

  const isDraggingRef = useRef(false);
  const startPosRef = useRef(0);
  const currentTranslateRef = useRef(0);

  const currentCard = cards[currentIndex];

  const animateSwipe = useCallback((direction: "left" | "right") => {
    if (!topCardRef.current) return;

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

    const handleTransitionEnd = () => {
      if (topCardRef.current) {
        topCardRef.current.style.transition = "";
        topCardRef.current.removeEventListener(
          "transitionend",
          handleTransitionEnd,
        );
      }
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

  if (!currentCard) {
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
      {/* --- ⬇️ 배경 카드 렌더링 로직 ⬇️ --- */}
      {cards.map((card, index) => {
        // 현재 카드(currentIndex)는 렌더링에서 제외하도록 '<=' 로 수정
        if (index <= currentIndex || index > currentIndex + 2) return null;
        return (
          <div
            key={card.id}
            className="absolute h-full w-full overflow-hidden rounded-xl bg-white shadow-lg"
            style={{
              transform: `scale(${
                1 - (index - currentIndex) * 0.05
              }) translateY(${(index - currentIndex) * 10}px)`,
              zIndex: cards.length - index,
            }}
          >
            <img
              src={card.image}
              alt={card.name}
              className="h-full w-full object-cover"
            />
          </div>
        );
      })}
      {/* --- ⬆️ 배경 카드 렌더링 로직 ⬆️ --- */}

      {/* 맨 위 카드 (상호작용 가능) */}
      <div
        ref={topCardRef}
        key={currentCard.id}
        className="absolute h-full w-full cursor-grab [touch-action:none] overflow-hidden rounded-xl bg-white shadow-lg"
        style={{ zIndex: cards.length }}
        onPointerDown={handlePointerDown}
      >
        <img
          src={currentCard.image}
          alt={currentCard.name}
          className="pointer-events-none h-full w-full object-cover"
        />
        <div className="pointer-events-none absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
          <h3 className="text-2xl font-bold">
            {currentCard.name}, {currentCard.age}
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
      </div>

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
