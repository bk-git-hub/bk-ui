import React, {
  useMemo,
  useState,
  Children,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { Util as CoverUtil } from "./coverflow.util.ts";
import { useInertia } from "./hooks/use-inertia.ts";
import { useWheelScroll } from "./hooks/use-wheel-scroll.ts";
import { useKeyboardNavigation } from "./hooks/use-keyboard-navigation.ts";
import { useDrag } from "./hooks/use-drag.ts";

const RENDER_RANGE = 5;
const SNAP_CONFIG = { stiffness: 0.1, damping: 0.5 };
const getSize = (width: number) => Math.min(Math.max(width / 3.6, 200), 800);

export const Coverflow = ({ children }: CoverflowProps) => {
  const [size, setSize] = useState(200);
  const [renderedPosition, setRenderedPosition] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const childrenArray = Children.toArray(children);

  const { startAnimation, setPosition } = useInertia(
    setRenderedPosition,
    SNAP_CONFIG,
  );

  const handleSnap = useCallback(
    (position: number, momentum: number) => {
      const snappedTarget =
        Math.abs(momentum) > 0.01
          ? momentum > 0
            ? Math.ceil(position)
            : Math.floor(position)
          : Math.round(position);
      const finalTarget = Math.max(
        0,
        Math.min(snappedTarget, childrenArray.length - 1),
      );
      startAnimation(finalTarget);
    },
    [startAnimation, childrenArray.length],
  );

  const { isDragging, dragPosition, handleDragStart } = useDrag({
    size,
    onDrag: setPosition,
    onDragEnd: handleSnap,
  });

  const { setScrollPosition } = useWheelScroll({
    containerRef,
    size,
    isEnabled: !isDragging,
    onScroll: setPosition,
    onScrollEnd: handleSnap,
    maxIndex: childrenArray.length - 1,
  });

  useKeyboardNavigation({
    isEnabled: !isDragging,
    target: renderedPosition,
    maxIndex: childrenArray.length - 1,
    onNavigate: startAnimation,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      setSize(getSize(entries[0].contentRect.width));
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const coverUtil = useMemo(() => new CoverUtil(size), [size]);

  return (
    <div ref={containerRef} className="w-full">
      <div
        className="relative mx-auto touch-none"
        style={{ height: size, width: size, perspective: "600px" }}
        onMouseDown={(e) => {
          setScrollPosition(renderedPosition);
          handleDragStart(e, renderedPosition);
        }}
        onTouchStart={(e) => {
          setScrollPosition(renderedPosition);
          handleDragStart(e, renderedPosition);
        }}
      >
        {childrenArray.map((child, index) => {
          const position = isDragging ? dragPosition : renderedPosition;
          const isVisible = Math.abs(position - index) <= RENDER_RANGE;
          if (!isVisible) return null;

          const score = index - position;
          const style: React.CSSProperties = {
            ...coverUtil.getTransform(score),
            zIndex:
              childrenArray.length - Math.abs(Math.round(position) - index),
            position: "absolute",
            top: 0,
            left: 0,
            width: size,
            height: size,
            transition: isDragging ? "none" : undefined,
          };

          return (
            <div
              key={index}
              style={style}
              onClick={() => {
                if (!isDragging) startAnimation(index);
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
