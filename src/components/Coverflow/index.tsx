// src/coverflow/index.tsx
import React, { useMemo, useState } from "react";
import { Cover } from "./Cover";
import { Util as CoverUtil } from "./util";

// **Optimization:** We'll only render the current cover + 5 on each side
const RENDER_RANGE = 5;

export const Coverflow = ({
  covers: coverData,
  size,
}: {
  covers: Parameters<typeof Cover>[0]["meta"][];
  size: number;
}) => {
  const [current, setCurrent] = useState(0);
  const coverUtil = useMemo(() => new CoverUtil(size), [size]);

  return (
    <div
      className="relative touch-none"
      style={{
        height: size,
        perspective: "600px",
      }}
    >
      {coverData.map((cover, index) => {
        // **The Fix:** Check if the current cover is within our render range
        const isVisible = Math.abs(current - index) <= RENDER_RANGE;

        // If it's not visible, we render nothing (or a placeholder)
        if (!isVisible) {
          return null;
        }

        const score = index - current;
        const style: React.CSSProperties = {
          ...coverUtil.getTransform(score),
          zIndex: coverData.length - Math.abs(score),
          transition: "transform 0.5s ease-out",
          position: "absolute",
          top: 0,
          left: `calc(50% - ${size / 2}px)`,
        };

        return (
          <div key={index} style={style}>
            <Cover
              meta={cover}
              size={size}
              onSelect={() => setCurrent(index)}
            />
          </div>
        );
      })}
    </div>
  );
};
