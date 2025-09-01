// src/coverflow/cover.tsx
import React from "react";

export const Cover = ({
  size,
  meta,
  onSelect,
}: {
  meta: { src: string; title: string; tracks: { title: string }[] };
  size: number;
  onSelect: () => void;
}) => {
  return (
    <div
      className="relative cursor-pointer"
      style={{
        width: size,
        height: size,
      }}
      onClick={onSelect}
    >
      <img
        className="pointer-events-none select-none"
        // **The Fix:** Add the loading="lazy" attribute
        loading="lazy"
        style={{
          width: size,
          height: size,
          WebkitBoxReflect:
            "below 0 linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.4))",
        }}
        src={meta.src}
        alt={meta.title}
      />
    </div>
  );
};
