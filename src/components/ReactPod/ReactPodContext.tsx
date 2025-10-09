import React, {
  createContext,
  useState,
  useContext,
  type ReactNode,
} from "react";

interface ReactPodContextType {
  index: number;
  setIndex: React.Dispatch<React.SetStateAction<number>>;
}

const ReactPodContext = createContext<ReactPodContextType | null>(null);

interface ReactPodProviderProps {
  children: ReactNode;
}

export function ReactPodProvider({ children }: ReactPodProviderProps) {
  const [index, setIndex] = useState<number>(0);

  const value = { index, setIndex };

  return (
    <ReactPodContext.Provider value={value}>
      {children}
    </ReactPodContext.Provider>
  );
}

// 5. Context를 편하게 사용하기 위한 커스텀 훅
export function useReactPod() {
  const context = useContext(ReactPodContext);
  if (!context) {
    throw new Error("useReactPod must be used within a ReactPodProvider");
  }
  return context;
}
