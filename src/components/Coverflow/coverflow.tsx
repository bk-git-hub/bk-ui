import React, {
  useMemo,
  useState,
  Children,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { Util as CoverUtil } from "./coverflow.util.ts";

import { useWheelEvent } from "./use-wheel-event";
import { useKeyNavigation } from "./use-key-navigation.ts";
import { useDrag } from "./use-drag";

const RENDER_RANGE = 8;
const getSize = (width: number) => Math.min(Math.max(width / 3.6, 200), 800);

export const Coverflow = ({ children }: CoverflowProps) => {
  const [size, setSize] = useState(200);

  // 🔹 React는 "index" 상태만 관리 → 리렌더 최소화
  const [index, setIndex] = useState(0);

  // 🔹 실시간 위치는 ref로 관리 → DOM 직접 업데이트
  const positionRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<any[]>([]);

  const childrenArray = Children.toArray(children);
  const coverUtil = useMemo(() => new CoverUtil(size), [size]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      setSize(getSize(entries[0].contentRect.width));
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // 🔹 드래그 훅: 드래그 중에는 ref 업데이트, 끝났을 때만 setIndex
  const { dragMoved, handleDragStart } = useDrag({
    size,
    onDrag: (pos) => {
      positionRef.current = pos;
      updateTransforms(true); // ✅ animate 플래그를 false로 유지하여 부드러운 드래그 보장
    },
    // ✅ onDragEnd를 사용하여 드래그가 끝났을 때만 React 상태를 업데이트
    onDragEnd: (finalIndex) => {
      positionRef.current = finalIndex;
      updateTransforms(true);
      setIndex(finalIndex);
    },
    maxIndex: childrenArray.length - 1,
  });

  useWheelEvent({
    containerRef,
    positionRef,
    size,
    maxIndex: childrenArray.length - 1,

    onScroll: (pos) => {
      positionRef.current = pos;
      updateTransforms(); // DOM 업데이트만 수행
    },
    onScrollEnd: (index) => {
      positionRef.current = index;
      updateTransforms(true);
      setIndex(index); // 최종 index만 React state로 반영
    },
  });

  useKeyNavigation({
    setTarget: setIndex,
    target: index,
    maxIndex: childrenArray.length - 1,
  });

  // 🔹 transform 업데이트 함수
  const updateTransforms = useCallback(
    (animate: boolean = false) => {
      const pos = positionRef.current;
      childrenArray.forEach((_, i) => {
        const item = itemRefs.current[i];
        if (!item) return;

        // Define RENDER_RANGE if it's not defined elsewhere in the scope

        const isVisible = Math.abs(pos - i) <= RENDER_RANGE;
        if (!isVisible) {
          item.style.display = "none";
          return;
        }
        item.style.display = "block";

        const score = i - pos;
        // Assuming coverUtil is a stable utility object defined outside the component
        const transform = coverUtil.getTransform(score);

        item.style.transform = transform.transform;
        item.style.zIndex = String(
          childrenArray.length - Math.abs(Math.round(pos) - i),
        );

        // Apply transition based on the animate flag
        if (animate) {
          item.style.transition = "transform 0.3s ease-out";
        } else {
          item.style.transition = "none";
        }
      });
    },
    [childrenArray],
  );

  // 🔹 index가 바뀌면 positionRef를 갱신하고 transform 업데이트
  useEffect(() => {
    positionRef.current = index;
    updateTransforms(true);
  }, [index, size]);

  return (
    <div ref={containerRef} className="w-full">
      <div
        className="relative mx-auto touch-none"
        style={{ height: size, width: size, perspective: "600px" }}
        onMouseDown={(e) => handleDragStart(e, positionRef.current)}
        onTouchStart={(e) => handleDragStart(e, positionRef.current)}
      >
        {childrenArray.map((child, i) => (
          <div
            key={i}
            ref={(el: any) => (itemRefs.current[i] = el)}
            className="absolute top-0 left-0 cursor-pointer"
            style={{
              width: size,
              height: size,
              willChange: "transform",
            }}
            onClick={() => {
              if (!dragMoved) setIndex(i);
            }}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  );
};

interface CoverflowProps {
  children: React.ReactNode;
}
