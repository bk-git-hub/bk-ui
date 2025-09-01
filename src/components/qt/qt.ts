import { useState, useEffect, useRef, useCallback } from "react";
import { type CoverflowItemType } from "./qtqt";

// Helper function to calculate a base size from the container's width
const getSize = (width: number) => Math.max(width / 3.6, 200);

export const useCoverflow = (
  items: CoverflowItemType[],
  onSelect?: (index: number) => void,
) => {
  // --- STATE MANAGEMENT ---
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flippedIndex, setFlippedIndex] = useState<number | null>(null);

  // --- RESPONSIVENESS ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Measure the container on mount to get an initial size
    setSize(getSize(container.offsetWidth));

    // Observe for any future size changes
    const observer = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      setSize(getSize(width));
      setCurrentIndex(0);
      setFlippedIndex(null); // Reset flip on resize
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [items.length]);

  // --- STYLE CALCULATION ---
  const getCardStyle = useCallback(
    (index: number): React.CSSProperties => {
      const score = index - currentIndex;
      const absScore = Math.abs(score);

      // Gracefully handle the initial render before size is measured
      if (size === 0) {
        return {
          transform: `scale(0.8)`,
          zIndex: items.length - absScore,
          opacity: 1,
          transition: "all 0.4s ease-out",
        };
      }

      // Define animation weights based on container size
      const xWeightRegion1 = size * 0.55;
      const xWeightRegion2 = size * 0.2;
      const scaleWeightRegion1 = -0.2;
      const scaleWeightRegion2 = -0.05;

      // Calculate translateX
      let translateX: number;
      if (score < -1)
        translateX = -xWeightRegion1 + xWeightRegion2 * (score + 1);
      else if (score < 1) translateX = score * xWeightRegion1;
      else translateX = xWeightRegion1 + xWeightRegion2 * (score - 1);

      // Calculate rotateY
      let rotateY: number;
      if (score < -1) rotateY = 40;
      else if (score < 1) rotateY = score * -40;
      else rotateY = -40;

      const translateZ = -absScore * (size * 0.35);

      // Calculate scale
      let scale: number;
      if (absScore < 1) scale = 1 + scaleWeightRegion1 * absScore;
      else if (absScore < 2)
        scale = 1 + scaleWeightRegion1 + scaleWeightRegion2 * (absScore - 1);
      else scale = 1 + scaleWeightRegion1 + scaleWeightRegion2;

      // Combine coverflow and flip transforms
      const centeringTransform = "translate(-50%, -50%)";

      const isFlipped = index === flippedIndex;
      const coverflowTransform = `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`;

      // 최종 transform 문자열에 중앙 정렬 로직을 맨 앞에 추가
      const finalTransform = isFlipped
        ? `${centeringTransform} ${coverflowTransform} rotateY(180deg)`
        : `${centeringTransform} ${coverflowTransform}`;

      return {
        transform: finalTransform,
        zIndex: 10 - absScore,
        opacity: absScore > 4 ? 0 : 1,
        transition: "all 0.7s ease-in-out",
      };
    },
    [currentIndex, items.length, size, flippedIndex],
  );

  // --- EVENT HANDLERS ---
  const handleCardClick = useCallback(
    (index: number) => {
      if (index === currentIndex) {
        // Click on center card -> Flip
        setFlippedIndex((prev) => (prev === null ? currentIndex : null));
      } else {
        // Click on side card -> Navigate
        setCurrentIndex(index);
        setFlippedIndex(null);
        onSelect?.(index);
      }
    },
    [currentIndex, onSelect],
  );

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
    setFlippedIndex(null);
  }, [items.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
    setFlippedIndex(null);
  }, [items.length]);

  // --- API EXPORT ---
  return {
    containerRef,
    currentIndex,
    flippedIndex,
    items,
    getCardStyle,
    handlePrev,
    handleNext,
    handleCardClick,
  };
};
