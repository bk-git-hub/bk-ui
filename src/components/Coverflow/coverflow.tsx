import React, { useMemo, useState, Children, useEffect, useRef } from "react";
import { Util as CoverUtil } from "./coverflow.util.ts";
import { useInertia } from "./use-inertia";

const RENDER_RANGE = 5;

const VERTICAL_SCROLL_CONFIG = { stiffness: 0.05, damping: 0.8 };
const HORIZONTAL_SCROLL_CONFIG = { stiffness: 0.15, damping: 0.5 };
const SNAP_CONFIG = { stiffness: 0.1, damping: 0.5 };

const getSize = (width: number) => Math.min(Math.max(width / 3.6, 200), 800);

export const Coverflow = ({ children }: CoverflowProps) => {
  const [size, setSize] = useState(200);
  const [target, setTarget] = useState(0);
  const [physicsConfig, setPhysicsConfig] = useState(SNAP_CONFIG);

  const animatedPosition = useInertia(target, physicsConfig);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollPosition = useRef(0);
  const scrollEndTimer = useRef<number | null>(null);
  // **Ref to store the last scroll direction**
  const lastScrollDelta = useRef(0);

  const coverUtil = useMemo(() => new CoverUtil(size), [size]);
  const childrenArray = Children.toArray(children);

  useEffect(() => {
    scrollPosition.current = target;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      setSize(getSize(entries[0].contentRect.width));
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      if (scrollEndTimer.current) {
        clearTimeout(scrollEndTimer.current);
      }

      let currentDelta = 0;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        setPhysicsConfig(HORIZONTAL_SCROLL_CONFIG);
        const scrollAmount = e.deltaX / (size * 1.5);
        scrollPosition.current += scrollAmount;
        currentDelta = scrollAmount; // Store the normalized delta
      } else {
        setPhysicsConfig(VERTICAL_SCROLL_CONFIG);
        const scrollAmount = e.deltaY / size;
        scrollPosition.current += scrollAmount;
        currentDelta = scrollAmount; // Store the normalized delta
      }

      // **Remember the last scroll direction**
      lastScrollDelta.current = currentDelta;

      scrollPosition.current = Math.max(
        0,
        Math.min(scrollPosition.current, childrenArray.length - 1),
      );
      setTarget(scrollPosition.current);

      scrollEndTimer.current = window.setTimeout(() => {
        // **New, more precise snapping logic**
        const position = scrollPosition.current;
        const momentum = lastScrollDelta.current;

        let snappedTarget;
        // If there was momentum, snap in the direction of the momentum
        if (Math.abs(momentum) > 0.01) {
          snappedTarget =
            momentum > 0 ? Math.ceil(position) : Math.floor(position);
        } else {
          // Otherwise, snap to the nearest
          snappedTarget = Math.round(position);
        }

        // Clamp the final target to the bounds
        const finalTarget = Math.max(
          0,
          Math.min(snappedTarget, childrenArray.length - 1),
        );

        scrollPosition.current = finalTarget;
        setPhysicsConfig(SNAP_CONFIG);
        setTarget(finalTarget);
      }, 50);
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [size, childrenArray.length]);

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
              onClick={() => {
                scrollPosition.current = index;
                setPhysicsConfig(SNAP_CONFIG);
                setTarget(index);
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
