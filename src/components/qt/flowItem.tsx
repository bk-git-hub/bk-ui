import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
// Make sure this path is correct for your project structure
import { useCoverflowContext } from ".";

interface CoverflowItemProps {
  index: number;
  children: React.ReactNode;
  className?: string;
}

export const CoverflowItem = ({
  index,
  children,
  className,
}: CoverflowItemProps) => {
  // 1. Get the new unified handler from the context.
  const { flippedIndex, handleCardClick, getCardStyle } = useCoverflowContext();

  // 2. Determine if this card should be flipped.
  const isThisCardFlipped = flippedIndex === index;

  return (
    <div className={twMerge("group [perspective:1000px]", className)}>
      {/* 3. The onClick now makes a simple, direct call. */}
      <div
        onClick={() => handleCardClick(index)}
        className={clsx(
          "absolute top-1/2 left-1/2 w-full max-w-[400px] cursor-pointer transition-transform duration-700 ease-in-out",
          "aspect-square text-black [transform-style:preserve-3d]",
          { "[transform:rotateY(180deg)]": isThisCardFlipped },
        )}
        style={getCardStyle(index)}
      >
        {children}
      </div>
    </div>
  );
};

// These components do not need any changes.
export const Cover = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={twMerge(
        "absolute inset-0 h-full w-full overflow-hidden rounded-xl shadow-lg",
        "[backface-visibility:hidden]",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const Detail = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={twMerge(
        "absolute inset-0 h-full w-full overflow-hidden rounded-xl shadow-lg",
        "[transform:rotateY(180deg)]",
        "[backface-visibility:hidden]",
        className,
      )}
    >
      {children}
    </div>
  );
};
