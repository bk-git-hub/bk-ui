import React, { createContext, useContext } from "react";
import { useCoverflow } from "./qt";
import { type CoverflowItemType } from "./qtqt"; // Assuming types are in a separate file

// 1. Define the Context Type and create the Context
type CoverflowContextType = ReturnType<typeof useCoverflow> | null;
const CoverflowContext = createContext<CoverflowContextType>(null);

// 2. Create a custom hook to consume the context
export const useCoverflowContext = () => {
  const context = useContext(CoverflowContext);
  if (!context) {
    throw new Error(
      "Coverflow.* components must be rendered within a Coverflow.Root component.",
    );
  }
  return context;
};

// --- Context and Consumer Hook (from your index.tsx) ---

// --- NEW: Root Provider Component ---
interface CoverflowRootProps {
  items: any[];
  children: React.ReactNode;
  onSelect?: (index: number) => void;
}

export const CoverflowRoot = ({
  items,
  children,
  onSelect,
}: CoverflowRootProps) => {
  const coverflowApi = useCoverflow(items, onSelect);
  return (
    <CoverflowContext.Provider value={coverflowApi}>
      {/* This outer div is a simple wrapper for layout */}
      <div className="relative flex h-96 w-full flex-col items-center justify-center">
        <span>{}</span>
        {children}
      </div>
    </CoverflowContext.Provider>
  );
};

// --- NEW: Stage Component for 3D Rendering ---
export const CoverflowStage = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const { containerRef } = useCoverflowContext();
  return (
    <div
      ref={containerRef}
      className={`relative flex h-3/4 w-full items-center justify-center bg-transparent ${className}`}
      style={{ perspective: "1200px" }}
    >
      {/* This inner div is now wider to contain the translated items */}
      <div
        className="relative h-full w-full" // Changed from w-[40%] to w-full
        style={{ transformStyle: "preserve-3d" }}
      >
        {children}
      </div>
    </div>
  );
};
