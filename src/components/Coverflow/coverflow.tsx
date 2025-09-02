import React, { useMemo, useState, Children, useEffect, useRef } from "react";
import { Util as CoverUtil } from "./coverflow.util.ts";

import { useInertia } from "./use-inertia";
import { useWheelEvent } from "./use-wheel-event";
import { useKeyNavigation } from "./use-key-navigation.ts";
import { useDrag } from "./use-drag"; // 새로 만든 훅을 import

const RENDER_RANGE = 8;

const SNAP_CONFIG = { stiffness: 0.1, damping: 0.5 };
const getSize = (width: number) => Math.min(Math.max(width / 3.6, 200), 800);

export const Coverflow = ({ children }: CoverflowProps) => {
  const [size, setSize] = useState(200);

  const [target, setTarget] = useState(0);
  const [animatedPosition, setAnimatedPosition] = useState(0);

  useInertia(target, setAnimatedPosition, SNAP_CONFIG);

  const containerRef = useRef<HTMLDivElement>(null);
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

  const { isDragging, handleDragStart } = useDrag({
    size,
    onDrag: setTarget, // 드래그 중에는 target을 직접 업데이트하여 물리엔진이 따라오도록 함
    maxIndex: childrenArray.length - 1,
  });

  useWheelEvent({
    containerRef,
    setTarget,
    size,

    maxIndex: childrenArray.length - 1,
  });

  useKeyNavigation({
    setTarget,
    target,
    maxIndex: childrenArray.length - 1,
  });

  return (
    <div ref={containerRef} className="w-full">
      <div
        className="relative mx-auto touch-none"
        style={{ height: size, width: size, perspective: "600px" }}
        onMouseDown={(e) => handleDragStart(e, animatedPosition)}
        onTouchStart={(e) => handleDragStart(e, animatedPosition)}
      >
        {childrenArray.map((child, index) => {
          const position = animatedPosition;
          const isVisible = Math.abs(position - index) <= RENDER_RANGE;
          if (!isVisible) return null;

          const score = index - animatedPosition;

          const style: React.CSSProperties = {
            ...coverUtil.getTransform(score),
            zIndex:
              childrenArray.length - Math.abs(Math.round(position) - index),
            position: "absolute",
            top: 0,
            left: 0,
            width: size,
            height: size,

            // 드래그 중에는 물리 애니메이션이 계속 부드럽게 따라오므로 transition은 필요 없음
          };
          return (
            <div
              key={index}
              style={style}
              onClick={() => {
                if (!isDragging) setTarget(index);
              }}
              className="cursor-pointer"
            >
              {child}
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface CoverflowProps {
  children: React.ReactNode;
}
