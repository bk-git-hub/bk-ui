import React, { useMemo, useState, Children } from "react";
import { Util as CoverUtil } from "./coverflow.util.ts";

const RENDER_RANGE = 5;

interface CoverflowProps {
  children: React.ReactNode;
  size: number;
}

export const Coverflow = ({ children, size }: CoverflowProps) => {
  const [current, setCurrent] = useState(0);
  const coverUtil = useMemo(() => new CoverUtil(size), [size]);
  const childrenArray = Children.toArray(children);

  return (
    <div
      className="relative touch-none"
      style={{
        height: size,
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
          left: `calc(50% - ${size / 2}px)`,
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
  );
};
