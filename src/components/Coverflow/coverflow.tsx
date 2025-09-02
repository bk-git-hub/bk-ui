import React, { useMemo, useState, Children, useEffect, useRef } from "react";
import { Util as CoverUtil } from "./coverflow.util.ts";

const RENDER_RANGE = 5;

const getSize = (width: number) => Math.min(Math.max(width / 3.6, 200), 800);

interface CoverflowProps {
  children: React.ReactNode;
}

export const Coverflow = ({ children }: CoverflowProps) => {
  // State is now encapsulated inside the component
  const [size, setSize] = useState(200); // Start with a default size
  const [current, setCurrent] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const coverUtil = useMemo(() => new CoverUtil(size), [size]);
  const childrenArray = Children.toArray(children);

  // Effect to observe the container's size and update the state
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Use ResizeObserver for better performance than window resize events
    const observer = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      setSize(getSize(width));
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    // We add a ref to the container to measure its width
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
            left: 0, // Position relative to the new centered container
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
