// src/coverflow/index.tsx
import React, { useMemo, useState } from "react";
import { Cover } from "./Cover";
import { Util as CoverUtil } from "./util";

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
        const score = index - current;

        // The type `React.CSSProperties` is added here for better type safety
        const style: React.CSSProperties = {
          ...coverUtil.getTransform(score),
          zIndex: coverData.length - Math.abs(score),
          transition: "transform 0.5s ease-out",
          // **The Fix:** We tell TypeScript this is a constant, specific value.
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
