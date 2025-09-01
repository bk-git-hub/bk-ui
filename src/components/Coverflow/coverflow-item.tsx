import React, { useState, useMemo } from "react";
import { CoverflowItemContext } from "./coverflow-context";

const Fallback = () => (
  <div className="h-full w-full animate-pulse rounded-md bg-neutral-800" />
);

interface CoverflowItemProps {
  children: React.ReactNode;
}

export const CoverflowItem = ({ children }: CoverflowItemProps) => {
  const [isReady, setIsReady] = useState(false);

  const contextValue = useMemo(
    () => ({
      signalReady: () => setIsReady(true),
    }),
    [],
  );

  return (
    <CoverflowItemContext.Provider value={contextValue}>
      <div className="relative h-full w-full">
        {!isReady && (
          <div className="absolute inset-0">
            <Fallback />
          </div>
        )}
        <div style={{ visibility: isReady ? "visible" : "hidden" }}>
          {children}
        </div>
      </div>
    </CoverflowItemContext.Provider>
  );
};
