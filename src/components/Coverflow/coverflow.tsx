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

  // Effect to handle the wheel event
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // **This is the key fix:**
      // We prevent the default browser action (page scrolling)
      e.preventDefault();

      if (isScrolling.current) return;

      isScrolling.current = true;
      setTimeout(() => {
        isScrolling.current = false;
      }, 100);

      if (e.deltaY > 0) {
        setCurrent((prev) => Math.min(prev + 1, childrenArray.length - 1));
      } else {
        setCurrent((prev) => Math.max(prev - 1, 0));
      }
    };

    // Add the event listener with the passive option set to false
    container.addEventListener("wheel", handleWheel, { passive: false });

    // Cleanup function to remove the listener
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [childrenArray.length]); // Re-run effect if the number of children changes

  return (
    // We remove the onWheel prop from here and use the ref instead
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
