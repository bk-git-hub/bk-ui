import React, { useMemo, useState, Children, useEffect, useRef } from "react";
import { Util as CoverUtil } from "./coverflow.util.ts";
import { useInertia } from "./use-inertia";
import { useWheelEvent } from "./use-wheel-event";
import { useKeyNavigation } from "./use-key-navigation.ts";

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

  // --- 크기 조절 로직 ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      setSize(getSize(entries[0].contentRect.width));
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // --- 스크롤 이벤트 로직 (훅으로 분리됨) ---
  useWheelEvent({
    containerRef,
    setTarget,
    size,
    maxIndex: childrenArray.length - 1,
  });

  // --- 키보드 이벤트 로직 (이제 단 한 줄로 호출) ---
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
      >
        {childrenArray.map((child, index) => {
          const isVisible = Math.abs(animatedPosition - index) <= RENDER_RANGE;
          if (!isVisible) return null;
          const score = index - animatedPosition;
          const style: React.CSSProperties = {
            ...coverUtil.getTransform(score),
            zIndex:
              childrenArray.length -
              Math.abs(Math.round(animatedPosition) - index),
            position: "absolute",
            top: 0,
            left: 0,
            width: size,
            height: size,
          };
          return (
            <div
              key={index}
              style={style}
              onClick={() => setTarget(index)}
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
