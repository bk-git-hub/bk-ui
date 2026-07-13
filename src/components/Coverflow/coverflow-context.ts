import { createContext, useContext } from "react";

// Define the context shape
interface CoverflowItemContextType {
  signalLoading: () => void;
  signalReady: () => void;
}
export const CoverflowItemContext =
  createContext<CoverflowItemContextType | null>(null);

// Custom hook for easy access to the context
export const useCoverflowItem = () => {
  const context = useContext(CoverflowItemContext);
  if (!context) {
    throw new Error("This component must be used within a CoverflowItem");
  }
  return context;
};

interface CoverflowInteractionContextType {
  isActive: boolean;
  isFlipped: boolean;
  activate: () => void;
  consumePendingClick: () => boolean;
}

export const CoverflowInteractionContext =
  createContext<CoverflowInteractionContextType | null>(null);

export const useCoverflowInteraction = () =>
  useContext(CoverflowInteractionContext);
