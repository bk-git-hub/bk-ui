import React, { createContext, useContext } from "react";
import { useTinderSwipe } from "./useTinderSwipe";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

type TinderSwipeContextType = ReturnType<typeof useTinderSwipe> | null;

const TinderSwipeContext = createContext<TinderSwipeContextType>(null);

const useTinderContext = () => {
  const context = useContext(TinderSwipeContext);
  if (!context) {
    throw new Error(
      "Tinder.* components must be rendered within a Tinder.Root component.",
    );
  }

  return context;
};

interface TinderRootProps {
  cards: any[];
  children: React.ReactNode;
}

const TinderRoot = ({ cards, children }: TinderRootProps) => {
  const swipeApi = useTinderSwipe({ itemCount: cards.length });
  if (swipeApi.currentIndex >= cards.length) {
    return (
      <div className="relative flex h-[450px] w-80 items-center justify-center">
        <div className="p-4 text-center">
          <h2 className="text-xl font-bold">더 이상 카드가 없습니다.</h2>
        </div>
      </div>
    );
  }
  return (
    <TinderSwipeContext.Provider value={swipeApi}>
      {children}
    </TinderSwipeContext.Provider>
  );
};

interface TinderCardProps extends React.HTMLAttributes<HTMLDivElement> {
  index: number;
  children: React.ReactNode;
}

const TinderCard = ({
  index,
  children,
  className,
  style,
  ...props
}: TinderCardProps) => {
  const {
    currentIndex,
    itemCount,
    topCardRef,
    nextCardRef,
    handlePointerDown,
    likeIndicatorRef,
    nopeIndicatorRef,
  } = useTinderContext();

  if (index < currentIndex || index > currentIndex + 2) return null;

  const isTopCard = index === currentIndex;
  const isNextCard = index === currentIndex + 1;

  return (
    <div
      ref={isTopCard ? topCardRef : isNextCard ? nextCardRef : null}
      onPointerDown={isTopCard ? handlePointerDown : undefined}
      // ⬇️ twMerge와 clsx를 사용하여 className을 안전하게 병합합니다.
      className={twMerge(
        clsx(
          "absolute h-full w-full cursor-grab [touch-action:none] overflow-hidden rounded-xl bg-white shadow-lg transition-transform duration-300 ease-out select-none",
          className, // 사용자가 전달한 className
        ),
      )}
      style={{
        zIndex: itemCount - index,
        transform: isTopCard
          ? "none"
          : `scale(${1 - (index - currentIndex) * 0.1}) translateY(-${(index - currentIndex) * 12}px)`,
        ...style,
      }}
      {...props} //
    >
      {children}
      {isTopCard && (
        <>
          <div
            ref={likeIndicatorRef}
            className="pointer-events-none absolute top-10 left-10 -rotate-12 transform rounded-xl border-4 border-green-500 p-2 text-4xl font-bold text-green-500 opacity-0"
          >
            LIKE
          </div>
          <div
            ref={nopeIndicatorRef}
            className="pointer-events-none absolute top-10 right-10 rotate-12 transform rounded-xl border-4 border-red-500 p-2 text-4xl font-bold text-red-500 opacity-0"
          >
            NOPE
          </div>
        </>
      )}
    </div>
  );
};

const TinderNopeButton = (
  props: React.ButtonHTMLAttributes<HTMLButtonElement>,
) => {
  const { swipe } = useTinderContext();
  return <button onClick={() => swipe("left")} {...props} />;
};

const TinderLikeButton = (
  props: React.ButtonHTMLAttributes<HTMLButtonElement>,
) => {
  const { swipe } = useTinderContext();
  return <button onClick={() => swipe("right")} {...props} />;
};

export const Tinder = {
  Root: TinderRoot,
  Card: TinderCard,
  NopeButton: TinderNopeButton,
  LikeButton: TinderLikeButton,
};
