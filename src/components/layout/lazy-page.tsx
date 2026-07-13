import { Suspense, type ReactNode } from "react";

interface LazyPageProps {
  children: ReactNode;
}

export default function LazyPage({ children }: LazyPageProps) {
  return (
    <Suspense fallback={<div className="h-full w-full" aria-hidden="true" />}>
      {children}
    </Suspense>
  );
}
