import { useCallback, useRef, useState, useEffect } from "react";

interface UseTinderSwipeProps {
  itemCount: number;
  swipeThreshold?: number;
  // 🔥 콜백 함수 타입 정의
  onSwipeLeft?: (index: number) => void;
  onSwipeRight?: (index: number) => void;
}

const SWIPE_THRESHOLD_DEFAULT = 100;
const SWIPE_TRANSITION_DURATION_MS = 200;
const SWIPE_TRANSITION_FALLBACK_MS = SWIPE_TRANSITION_DURATION_MS + 50;
const NEXT_CARD_REST_SCALE = 0.9;
const NEXT_CARD_REST_TRANSLATE_Y = 12;

export const useTinderSwipe = ({
  itemCount,
  swipeThreshold = SWIPE_THRESHOLD_DEFAULT,
  onSwipeLeft,
  onSwipeRight,
}: UseTinderSwipeProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentIndexRef = useRef(currentIndex);
  const itemCountRef = useRef(itemCount);
  const swipeThresholdRef = useRef(swipeThreshold);
  const onSwipeLeftRef = useRef(onSwipeLeft);
  const onSwipeRightRef = useRef(onSwipeRight);

  currentIndexRef.current = currentIndex;
  itemCountRef.current = itemCount;
  swipeThresholdRef.current = swipeThreshold;
  onSwipeLeftRef.current = onSwipeLeft;
  onSwipeRightRef.current = onSwipeRight;

  const topCardRef = useRef<HTMLDivElement>(null);
  const nextCardRef = useRef<HTMLDivElement>(null);
  const likeIndicatorRef = useRef<HTMLDivElement>(null);
  const nopeIndicatorRef = useRef<HTMLDivElement>(null);

  const isDraggingRef = useRef(false);
  const isAnimatingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const latestPointerPosRef = useRef({ x: 0, y: 0 });
  const currentTranslateRef = useRef(0);
  const dragOriginYRef = useRef<"top" | "bottom">("top");
  const rafIdRef = useRef<number | null>(null);
  const animationCleanupRef = useRef<(() => void) | null>(null);

  const animateSwipe = useCallback((direction: "left" | "right") => {
    const topCard = topCardRef.current;
    const swipedIndex = currentIndexRef.current;
    if (
      !topCard ||
      swipedIndex >= itemCountRef.current ||
      isAnimatingRef.current ||
      isDraggingRef.current
    ) {
      return;
    }

    isAnimatingRef.current = true;

    try {
      if (direction === "left") {
        onSwipeLeftRef.current?.(swipedIndex);
      } else {
        onSwipeRightRef.current?.(swipedIndex);
      }
    } catch (error) {
      isAnimatingRef.current = false;
      throw error;
    }

    if (nextCardRef.current) {
      nextCardRef.current.style.transition = "transform 0.3s ease-out";
      nextCardRef.current.style.transform = `none`;
    }

    const flyOutX =
      (direction === "right" ? 1 : -1) * (window.innerWidth + 200);
    topCard.style.transition = "transform 0.2s ease-out, opacity 0.2s ease-out";
    topCard.style.transform = `translate3d(${flyOutX}px, 0, 0) rotate(${flyOutX / 15}deg)`;
    topCard.style.opacity = "0";

    let isComplete = false;

    const cleanupAnimation = () => {
      topCard.removeEventListener("transitionend", handleTransitionEnd);
      window.clearTimeout(fallbackTimerId);
      if (animationCleanupRef.current === cleanupAnimation) {
        animationCleanupRef.current = null;
      }
    };

    const completeAnimation = () => {
      if (isComplete) return;
      isComplete = true;
      cleanupAnimation();
      isAnimatingRef.current = false;
      topCard.style.transition = "";
      topCard.style.display = "none";
      setCurrentIndex((prev) => Math.min(prev + 1, itemCountRef.current));
    };

    function handleTransitionEnd(event: TransitionEvent) {
      if (event.target === topCard && event.propertyName === "transform") {
        completeAnimation();
      }
    }

    topCard.addEventListener("transitionend", handleTransitionEnd);
    const fallbackTimerId = window.setTimeout(
      completeAnimation,
      SWIPE_TRANSITION_FALLBACK_MS,
    );
    animationCleanupRef.current = cleanupAnimation;
  }, []);

  const snapBack = useCallback(() => {
    if (topCardRef.current) {
      topCardRef.current.style.transition = "transform 0.3s ease-out";
      topCardRef.current.style.transform = "translate3d(0, 0, 0)";
      topCardRef.current.style.transformOrigin = "center center";
    }
    if (nextCardRef.current) {
      nextCardRef.current.style.transition = "transform 0.3s ease-out";
      nextCardRef.current.style.transform = `scale(${NEXT_CARD_REST_SCALE}) translate3d(0, ${NEXT_CARD_REST_TRANSLATE_Y}px, 0)`;
    }
    if (likeIndicatorRef.current) likeIndicatorRef.current.style.opacity = "0";
    if (nopeIndicatorRef.current) nopeIndicatorRef.current.style.opacity = "0";
  }, []);

  const renderLatestDragPosition = useCallback(() => {
    if (!isDraggingRef.current || !topCardRef.current) return;

    const deltaX = latestPointerPosRef.current.x - startPosRef.current.x;
    const deltaY = latestPointerPosRef.current.y - startPosRef.current.y;
    currentTranslateRef.current = deltaX;

    const rotationMultiplier = dragOriginYRef.current === "top" ? 1 : -1;
    const rotation = (deltaX / 15) * rotationMultiplier;

    topCardRef.current.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0) rotate(${rotation}deg)`;

    const likeOpacity = Math.max(
      0,
      Math.min(1, deltaX / swipeThresholdRef.current),
    );
    const nopeOpacity = Math.max(
      0,
      Math.min(1, -deltaX / swipeThresholdRef.current),
    );

    if (likeIndicatorRef.current) {
      likeIndicatorRef.current.style.opacity = `${likeOpacity}`;
    }
    if (nopeIndicatorRef.current) {
      nopeIndicatorRef.current.style.opacity = `${nopeOpacity}`;
    }

    if (nextCardRef.current) {
      const progress = Math.min(
        Math.abs(deltaX) / swipeThresholdRef.current,
        1,
      );
      const newScale =
        NEXT_CARD_REST_SCALE + (1 - NEXT_CARD_REST_SCALE) * progress;
      const newTranslateY = NEXT_CARD_REST_TRANSLATE_Y * (1 - progress);
      nextCardRef.current.style.transform = `scale(${newScale}) translate3d(0, ${newTranslateY}px, 0)`;
    }
  }, []);

  const cancelScheduledDragFrame = useCallback(() => {
    if (rafIdRef.current === null) return;
    cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = null;
  }, []);

  const flushLatestDragPosition = useCallback(() => {
    cancelScheduledDragFrame();
    renderLatestDragPosition();
  }, [cancelScheduledDragFrame, renderLatestDragPosition]);

  const handleWindowPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDraggingRef.current || !topCardRef.current) return;
      latestPointerPosRef.current = { x: e.clientX, y: e.clientY };
      if (rafIdRef.current !== null) return;

      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        renderLatestDragPosition();
      });
    },
    [renderLatestDragPosition],
  );

  const handleWindowPointerEnd = useCallback(
    (event: PointerEvent) => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerEnd);
      window.removeEventListener("pointercancel", handleWindowPointerEnd);

      if (event.type === "pointercancel") {
        cancelScheduledDragFrame();
        isDraggingRef.current = false;
        snapBack();
        currentTranslateRef.current = 0;
        return;
      }

      latestPointerPosRef.current = { x: event.clientX, y: event.clientY };
      flushLatestDragPosition();
      isDraggingRef.current = false;

      if (Math.abs(currentTranslateRef.current) > swipeThresholdRef.current) {
        animateSwipe(currentTranslateRef.current > 0 ? "right" : "left");
      } else {
        snapBack();
      }
      currentTranslateRef.current = 0;
    },
    [
      animateSwipe,
      cancelScheduledDragFrame,
      flushLatestDragPosition,
      handleWindowPointerMove,
      snapBack,
    ],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (
        !topCardRef.current ||
        isDraggingRef.current ||
        isAnimatingRef.current
      ) {
        return;
      }

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
      latestPointerPosRef.current = { x: e.clientX, y: e.clientY };
      currentTranslateRef.current = 0;
      topCardRef.current.style.transition = "";
      if (nextCardRef.current) {
        nextCardRef.current.style.transition = "none";
      }

      window.addEventListener("pointermove", handleWindowPointerMove);
      window.addEventListener("pointerup", handleWindowPointerEnd);
      window.addEventListener("pointercancel", handleWindowPointerEnd);
    },
    [handleWindowPointerEnd, handleWindowPointerMove],
  );

  const undo = useCallback(() => {
    if (isAnimatingRef.current) return;
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const reset = useCallback(() => {
    if (isAnimatingRef.current) return;
    setCurrentIndex(0);
  }, []);

  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerEnd);
      window.removeEventListener("pointercancel", handleWindowPointerEnd);
      cancelScheduledDragFrame();
      animationCleanupRef.current?.();
      isDraggingRef.current = false;
      isAnimatingRef.current = false;
    };
  }, [
    cancelScheduledDragFrame,
    handleWindowPointerEnd,
    handleWindowPointerMove,
  ]);

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
