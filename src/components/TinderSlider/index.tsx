// src/components/Tinder/index.tsx

import React, { createContext, useContext } from "react";
import { useTinderSwipe } from "./useTinderSwipe";

// useTinderSwipe 훅의 반환 값 타입을 정의
type TinderSwipeContextType = ReturnType<typeof useTinderSwipe> | null;

// 1. Context 생성: 훅의 반환 값을 하위 컴포넌트에 전달하기 위한 파이프라인
const TinderSwipeContext = createContext<TinderSwipeContextType>(null);

// 2. Context를 쉽게 사용하기 위한 커스텀 훅
const useTinderContext = () => {
  const context = useContext(TinderSwipeContext);
  if (!context) {
    throw new Error(
      "Tinder.* components must be rendered within a Tinder.Root component.",
    );
  }
  return context;
};

// 3. Root 컴포넌트: 로직(useTinderSwipe)과 UI를 연결하고, Context를 제공하는 지휘자 역할
interface TinderRootProps {
  cards: any[]; // 어떤 데이터든 받을 수 있도록 any[]로 설정
  children: React.ReactNode;
}

const TinderRoot = ({ cards, children }: TinderRootProps) => {
  const swipeApi = useTinderSwipe({ itemCount: cards.length });

  return (
    <TinderSwipeContext.Provider value={swipeApi}>
      {children}
    </TinderSwipeContext.Provider>
  );
};

// 4. Card 컴포넌트: 개별 카드를 렌더링
interface TinderCardProps extends React.HTMLAttributes<HTMLDivElement> {
  index: number;
  children: React.ReactNode;
}

const TinderCard = ({ index, children, ...props }: TinderCardProps) => {
  const { currentIndex, topCardRef, nextCardRef, handlePointerDown } =
    useTinderContext();

  // 이미 지나간 카드는 렌더링하지 않음
  if (index < currentIndex) return null;
  // 너무 많은 카드를 렌더링하지 않도록 제한
  if (index > currentIndex + 2) return null;

  const isTopCard = index === currentIndex;
  const isNextCard = index === currentIndex + 1;

  return (
    <div
      ref={isTopCard ? topCardRef : isNextCard ? nextCardRef : null}
      onPointerDown={isTopCard ? handlePointerDown : undefined}
      className="absolute h-full w-full cursor-grab [touch-action:none] overflow-hidden rounded-xl bg-white shadow-lg transition-transform duration-300 ease-out select-none"
      style={{
        zIndex: -index, // 쌓이는 순서를 위해 zIndex를 음수 인덱스로 설정
        transform: isTopCard
          ? "none"
          : `scale(${1 - (index - currentIndex) * 0.2}) translateY(${(index - currentIndex) * 10}px)`,
        ...props.style,
      }}
      {...props}
    >
      {children}
      {isTopCard && (
        <>
          <div className="pointer-events-none absolute top-10 left-10 -rotate-12 transform rounded-xl border-4 border-green-500 p-2 text-4xl font-bold text-green-500 opacity-0">
            LIKE
          </div>
          <div className="pointer-events-none absolute top-10 right-10 rotate-12 transform rounded-xl border-4 border-red-500 p-2 text-4xl font-bold text-red-500 opacity-0">
            NOPE
          </div>
        </>
      )}
    </div>
  );
};

// 5. 버튼 컴포넌트들
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

// 생성한 컴포넌트들을 하나의 객체로 묶어서 내보내기
export const Tinder = {
  Root: TinderRoot,
  Card: TinderCard,
  NopeButton: TinderNopeButton,
  LikeButton: TinderLikeButton,
};
