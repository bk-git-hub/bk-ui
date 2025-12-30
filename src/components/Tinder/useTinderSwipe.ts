import { useCallback, useRef, useState, useEffect } from "react";

interface UseTinderSwipeProps {
  itemCount: number;
  swipeThreshold?: number;
  // 🔥 콜백 함수 타입 정의
  onSwipeLeft?: (index: number) => void;
  onSwipeRight?: (index: number) => void;
}

const SWIPE_THRESHOLD_DEFAULT = 100;

export const useTinderSwipe = ({
  itemCount,
  swipeThreshold = SWIPE_THRESHOLD_DEFAULT,
  onSwipeLeft,
  onSwipeRight,
}: UseTinderSwipeProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const topCardRef = useRef<HTMLDivElement>(null);
  const nextCardRef = useRef<HTMLDivElement>(null);
  const likeIndicatorRef = useRef<HTMLDivElement>(null);
  const nopeIndicatorRef = useRef<HTMLDivElement>(null);

  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const currentTranslateRef = useRef(0);
  const dragOriginYRef = useRef<"top" | "bottom">("top");

  const animateSwipe = useCallback(
    (direction: "left" | "right") => {
      if (!topCardRef.current || currentIndex >= itemCount) return;

      if (direction === "left") {
        onSwipeLeft?.(currentIndex);
      } else {
        onSwipeRight?.(currentIndex);
      }

      if (nextCardRef.current) {
        nextCardRef.current.style.transition = "transform 0.3s ease-out";
        nextCardRef.current.style.transform = `none`;
      }

      const flyOutX =
        (direction === "right" ? 1 : -1) * (window.innerWidth + 200);
      topCardRef.current.style.transition =
        "transform 0.2s ease-out, opacity 0.2s ease-out";
      topCardRef.current.style.transform = `translate3d(${flyOutX}px, 0, 0) rotate(${flyOutX / 15}deg)`;
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
    },
    [currentIndex, itemCount, onSwipeLeft, onSwipeRight],
  );

  const snapBack = useCallback(() => {
    if (topCardRef.current) {
      topCardRef.current.style.transition = "transform 0.3s ease-out";
      topCardRef.current.style.transform = "translate3d(0, 0, 0)";
      topCardRef.current.style.transformOrigin = "center center";
    }
    if (nextCardRef.current) {
      nextCardRef.current.style.transition = "transform 0.3s ease-out";
      nextCardRef.current.style.transform =
        "scale(0.8) translate3d(0, 10px, 0)";
    }
    if (likeIndicatorRef.current) likeIndicatorRef.current.style.opacity = "0";
    if (nopeIndicatorRef.current) nopeIndicatorRef.current.style.opacity = "0";
  }, []);

  const rafIdRef = useRef<number | null>(null);

  const handleWindowPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDraggingRef.current || !topCardRef.current) return;
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);

      rafIdRef.current = requestAnimationFrame(() => {
        if (topCardRef.current == null) return;
        const deltaX = e.clientX - startPosRef.current.x;
        const deltaY = e.clientY - startPosRef.current.y;
        currentTranslateRef.current = deltaX;

        const rotationMultiplier = dragOriginYRef.current === "top" ? 1 : -1;
        const rotation = (deltaX / 15) * rotationMultiplier;

        topCardRef.current!.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0) rotate(${rotation}deg)`;

        const likeOpacity = Math.max(0, Math.min(1, deltaX / swipeThreshold));
        const nopeOpacity = Math.max(0, Math.min(1, -deltaX / swipeThreshold));

        if (likeIndicatorRef.current)
          likeIndicatorRef.current.style.opacity = `${likeOpacity}`;
        if (nopeIndicatorRef.current)
          nopeIndicatorRef.current.style.opacity = `${nopeOpacity}`;

        if (nextCardRef.current) {
          nextCardRef.current.style.transition = "none";
          const progress = Math.min(Math.abs(deltaX) / swipeThreshold, 1);
          const newScale = 0.8 + (1 - 0.8) * progress;
          const newTranslateY = 10 - 10 * progress;
          nextCardRef.current.style.transform = `scale(${newScale}) translateY(${newTranslateY}px)`;
        }
      });
    },
    [swipeThreshold],
  );

  const handleWindowPointerUp = useCallback(() => {
    window.removeEventListener("pointermove", handleWindowPointerMove);
    window.removeEventListener("pointerup", handleWindowPointerUp);
    isDraggingRef.current = false;
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    if (Math.abs(currentTranslateRef.current) > swipeThreshold) {
      animateSwipe(currentTranslateRef.current > 0 ? "right" : "left");
    } else {
      snapBack();
    }
    currentTranslateRef.current = 0;
  }, [swipeThreshold, animateSwipe, snapBack, handleWindowPointerMove]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!topCardRef.current) return;

      const cardRect = topCardRef.current.getBoundingClientRect();
      const clickOffsetY = e.clientY - cardRect.top;

      if (clickOffsetY > cardRect.height / 2) {
        dragOriginYRef.current = "bottom";
        topCardRef.current.style.transformOrigin = "top center";
      } else {
        dragOriginYRef.current = "top";
        topCardRef.current.style.transformOrigin = "bottom center";
      }

      isDraggingRef.current = true;
      startPosRef.current = { x: e.clientX, y: e.clientY };
      topCardRef.current.style.transition = "";

      window.addEventListener("pointermove", handleWindowPointerMove);
      window.addEventListener("pointerup", handleWindowPointerUp);
    },
    [handleWindowPointerMove, handleWindowPointerUp],
  );

  const undo = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const reset = useCallback(() => {
    setCurrentIndex(0);
  }, []);

  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [handleWindowPointerMove, handleWindowPointerUp]);

  const isFinished = currentIndex >= itemCount;

  return {
    currentIndex,
    itemCount,
    topCardRef,
    nextCardRef,
    likeIndicatorRef,
    nopeIndicatorRef,
    handlePointerDown,
    animateSwipe,
    isFinished,
    setCurrentIndex,
    undo,
    reset,
  };
};
