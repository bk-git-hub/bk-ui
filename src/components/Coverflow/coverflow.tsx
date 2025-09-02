import React, { useMemo, useState, Children, useEffect, useRef } from "react";
import { Util as CoverUtil } from "./coverflow.util.ts";

const RENDER_RANGE = 5;

const getSize = (width: number) => Math.min(Math.max(width / 3.6, 200), 800);

interface CoverflowProps {
  children: React.ReactNode;
}

export const Coverflow = ({ children }: CoverflowProps) => {
  const [size, setSize] = useState(200);
  const [current, setCurrent] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);

  const coverUtil = useMemo(() => new CoverUtil(size), [size]);
  const childrenArray = Children.toArray(children);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      setSize(getSize(width));
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      if (isScrolling.current) return;

      isScrolling.current = true;
      setTimeout(() => {
        isScrolling.current = false;
      }, 100);

      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        // **This is the corrected logic:**
        // A swipe from left-to-right (natural scrolling) produces a negative deltaX.
        if (e.deltaX > 0) {
          // Swiped right: move to the next cover
          setCurrent((prev) => Math.min(prev + 1, childrenArray.length - 1));
        } else {
          // Swiped left: move to the previous cover
          setCurrent((prev) => Math.max(prev - 1, 0));
        }
      } else {
        // Vertical scroll
        if (e.deltaY > 0) {
          setCurrent((prev) => Math.min(prev + 1, childrenArray.length - 1));
        } else {
          setCurrent((prev) => Math.max(prev - 1, 0));
        }
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [childrenArray.length]);

  return (
    <div ref={containerRef} className="w-full">
      <div
        className="relative mx-auto touch-none"
        style={{
          height: size,
          width: size,
          perspective: "600px",
        }}
      >
        {childrenArray.map((child, index) => {
          const isVisible = Math.abs(current - index) <= RENDER_RANGE;
          if (!isVisible) return null;

          const score = index - current;
          const style: React.CSSProperties = {
            ...coverUtil.getTransform(score),
            zIndex: childrenArray.length - Math.abs(score),
            transition: "transform 0.5s ease-out",
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
              onClick={() => setCurrent(index)}
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
