import React, { useMemo, useState, Children, useEffect, useRef } from "react";
import { Util as CoverUtil } from "./coverflow.util.ts";
import { useInertia } from "./use-inertia";

const RENDER_RANGE = 5;

const SNAP_CONFIG = { stiffness: 0.1, damping: 0.5 };

const getSize = (width: number) => Math.min(Math.max(width / 3.6, 200), 800);
export const Coverflow = ({ children }: CoverflowProps) => {
  const [size, setSize] = useState(200);
  // **The single source of truth for the visual position**
  const [renderedPosition, setRenderedPosition] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollEndTimer = useRef<number | null>(null);
  const lastScrollDelta = useRef(0);

  const [isDragging, setIsDragging] = useState(false);
  const dragStartPosition = useRef({ x: 0, initialScore: 0 });

  const coverUtil = useMemo(() => new CoverUtil(size), [size]);
  const childrenArray = Children.toArray(children);

  // --- The Animation Engine ---
  const { startAnimation, setPosition } = useInertia(
    setRenderedPosition,
    SNAP_CONFIG,
  );

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
      if (isDragging) return;
      if (scrollEndTimer.current) clearTimeout(scrollEndTimer.current);

      let currentDelta = 0;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        currentDelta = e.deltaX / (size * 1.5);
      } else {
        currentDelta = e.deltaY / size;
      }
      lastScrollDelta.current = currentDelta;

      const newPosition = Math.max(
        0,
        Math.min(renderedPosition + currentDelta, childrenArray.length - 1),
      );
      setPosition(newPosition); // Update position directly

      scrollEndTimer.current = window.setTimeout(() => {
        const momentum = lastScrollDelta.current;
        const snappedTarget =
          Math.abs(momentum) > 0.01
            ? momentum > 0
              ? Math.ceil(newPosition)
              : Math.floor(newPosition)
            : Math.round(newPosition);
        const finalTarget = Math.max(
          0,
          Math.min(snappedTarget, childrenArray.length - 1),
        );
        startAnimation(finalTarget); // Start the final snap animation
      }, 80);
    };
    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [
    size,
    childrenArray.length,
    isDragging,
    renderedPosition,
    startAnimation,
    setPosition,
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isDragging) return;
      let newTarget = Math.round(renderedPosition);
      if (e.key === "ArrowRight") {
        newTarget = Math.min(newTarget + 1, childrenArray.length - 1);
      } else if (e.key === "ArrowLeft") {
        newTarget = Math.max(newTarget - 1, 0);
      }
      startAnimation(newTarget);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [renderedPosition, childrenArray.length, isDragging, startAnimation]);

  const dragRenderPosition = useRef(0);

  // ... (handleDragStart function is the same as the previous turn)
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const startPos = "touches" in e ? e.touches[0].clientX : e.clientX;
    dragStartPosition.current = { x: startPos, initialScore: renderedPosition };
    dragRenderPosition.current = renderedPosition;
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    let animationFrame: number | null = null;
    const targetDragPosition = dragRenderPosition;

    // --- The key change is in this function ---
    const handleDragMove = (e: MouseEvent | TouchEvent) => {
      const currentPos = "touches" in e ? e.touches[0].clientX : e.clientX;
      const deltaX = currentPos - dragStartPosition.current.x;
      const dragAmount = deltaX / (size * 0.5);

      const momentum = Math.abs(dragAmount * 0.1);
      lastScrollDelta.current = -dragAmount * 0.1;

      const newPosition = dragStartPosition.current.initialScore - dragAmount;

      // **The Conditional Logic:**
      // If momentum is low, we update the position directly for a 1:1 feel.
      if (momentum < 0.5) {
        // You can tweak this threshold value
        // Stop any ongoing easing animation to switch to direct control.
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
          animationFrame = null;
        }
        dragRenderPosition.current = newPosition;
        setPosition(newPosition);
      } else {
        // If momentum is high, we update the target for the smooth animation.
        targetDragPosition.current = newPosition;
        // If the animation loop isn't running, start it.
        if (!animationFrame) {
          animateDrag();
        }
      }
    };

    const animateDrag = () => {
      const distance = targetDragPosition.current - dragRenderPosition.current;

      if (Math.abs(distance) < 0.01) {
        animationFrame = requestAnimationFrame(animateDrag);
        return;
      }

      const newRenderPosition = dragRenderPosition.current + distance * 0.2;
      dragRenderPosition.current = newRenderPosition;
      setPosition(newRenderPosition);

      animationFrame = requestAnimationFrame(animateDrag);
    };

    const handleDragEnd = () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      setIsDragging(false);

      const momentum = lastScrollDelta.current;
      // Use the final target position for accuracy.
      const finalPosition = targetDragPosition.current;

      const snappedTarget =
        Math.abs(momentum) > 0.01
          ? momentum > 0
            ? Math.ceil(finalPosition)
            : Math.floor(finalPosition)
          : Math.round(finalPosition);

      const finalTarget = Math.max(
        0,
        Math.min(snappedTarget, childrenArray.length - 1),
      );
      startAnimation(finalTarget);
    };

    // Add listeners when the effect starts
    window.addEventListener("mousemove", handleDragMove);
    window.addEventListener("touchmove", handleDragMove);
    window.addEventListener("mouseup", handleDragEnd);
    window.addEventListener("touchend", handleDragEnd);

    return () => {
      // Cleanup: remove listeners and cancel animation frame
      if (animationFrame) cancelAnimationFrame(animationFrame);
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("touchmove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchend", handleDragEnd);
    };
  }, [isDragging, size, startAnimation, setPosition, childrenArray.length]);

  return (
    <div ref={containerRef} className="w-full">
      <div
        className="relative mx-auto touch-none"
        style={{ height: size, width: size, perspective: "600px" }}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
      >
        {childrenArray.map((child, index) => {
          const position = renderedPosition; // Always use the single source of truth
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
                if (isDragging) return;
                startAnimation(index);
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
