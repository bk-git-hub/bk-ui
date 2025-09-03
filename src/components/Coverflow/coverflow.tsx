import React, { useMemo, useState, Children, useEffect, useRef } from "react";
import { Util as CoverUtil } from "./coverflow.util.ts";

import { useWheelEvent } from "./use-wheel-event";
import { useKeyNavigation } from "./use-key-navigation.ts";
import { useDrag } from "./use-drag";

const RENDER_RANGE = 8;

const getSize = (width: number) => Math.min(Math.max(width / 3.6, 200), 800);

export const Coverflow = ({ children }: CoverflowProps) => {
  const [size, setSize] = useState(200);

  // target과 position을 따로 안 쓰고, animatedPosition = target
  const [target, setTarget] = useState(0);
  const [animatedPosition, setAnimatedPosition] = useState(0);

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
    onDrag: setTarget,
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

  // target 값이 바뀌면 transition 애니메이션으로 position 이동
  useEffect(() => {
    setAnimatedPosition(target);
  }, [target]);

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
            transition: isDragging
              ? "none" // 드래그 중에는 transition 제거
              : "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)", // 부드러운 spring-like easing
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
