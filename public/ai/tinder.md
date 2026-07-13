# Copy for AI: Tinder Swiper

Status: `release-blocked` — use only the exact embedded source below for local verification. Do not claim that an npm package, GitHub permalink, ZIP release, or Registry command is publicly available.

Component version: `1.0.0`
Pinned source commit: `35d17dd9e1c04f4f35d9cf72f2c2574ebfceff0c`
React: `>=19.0.0 <20` (tested `19.2.7`)
Next.js tested: `16.2.10`

## Artifact integrity

- `public/downloads/tinder-next.zip`: `2874e49fc0bcc625b1aad987bb8b4a39107845634610a141a73176ae5b4948ed`
- `public/downloads/tinder-react.zip`: `32b8129f015fe5137ab550347bc3cd21d2e52aabf388d5782746baae52a92ed3`
- `public/r/tinder-tailwind-v3.json`: `3a2cd0617be61729b94b9d7f3e26aca42611ea941633e42fe9948b847ee59c88`
- `public/r/tinder.json`: `0ade02df6aef67943b54e15da6d70d125e7a2462711e5dcfdf32639d875e36ca`

## Tailwind variants

### Tailwind 3

- Range: `>=3.4.0 <4`; tested: `3.4.17`
- Dependencies: `clsx@^2.1.1 tailwind-merge@2.6.0`
- Registry item: `tinder-tailwind-v3`
- Source discovery: Add "./src/components/Tinder/**/*.{js,ts,jsx,tsx}" (or the copied equivalent) to tailwind.config content.

### Tailwind 4

- Range: `>=4.0.0 <5`; tested: `4.3.2`
- Dependencies: `clsx@^2.1.1 tailwind-merge@^3.3.1`
- Registry item: `tinder`
- Source discovery: Keep components/Tinder in the locally scanned source tree; for shared source add a stylesheet-relative @source directive for that directory.

## SSR and hydration constraints

- Browser globals, requestAnimationFrame, and element mutation are used only by effects or interaction handlers; do not invoke those handlers during server render.
- Keep render-prop children and callback props inside the Next.js Client Component boundary, and pass only serializable cards and deckKey from Server Components.
- Render output is deterministic for the same ordered cards and does not require ssr: false.
- Use the same ordered cards and stable deckKey for the server render and first hydration render.

## Accessibility constraints

- Keep the native Like, Nope, Undo, and Reset button semantics, provide meaningful accessible names, and preserve visible focus styles.
- Mark non-current stacked cards aria-hidden so assistive technology reads only the active card.
- Pointer dragging has button-based keyboard equivalents; do not remove those controls.
- Provide visible profile text and appropriate image alternative text; use an empty alt only when an image duplicates that text.
- The current core does not disable its imperative swipe animation for prefers-reduced-motion; adapt the locally copied source when strict reduced-motion support is required.

## Canonical source

### @components/Tinder/client.ts

- Source: `src/components/Tinder/client.ts`
- SHA-256: `2a179d7a0c52410c0c53e9e162e3ae3aeb084e38cb981117f78427294f757b61`

```ts
"use client";

export * from "./index";
```

### @components/Tinder/index.tsx

- Source: `src/components/Tinder/index.tsx`
- SHA-256: `736e6e3cd8a21a2e18e8ebd17b1035d6b8223fe55f4681be7340bc1af2638676`

```tsx
import React, { createContext, useContext, useMemo } from "react";
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

const VISIBLE_CARD_COUNT = 3;

export interface TinderVisibleCard<T> {
  item: T;
  index: number;
}

export interface TinderRootRenderProps<T> {
  currentIndex: number;
  visibleCards: readonly TinderVisibleCard<T>[];
}

export interface TinderRootProps<T> {
  cards: readonly T[];
  children:
    | React.ReactNode
    | ((state: TinderRootRenderProps<T>) => React.ReactNode);
  onSwipeLeft?: (item: T) => void;
  onSwipeRight?: (item: T) => void;
}

export const TinderRoot = <T,>({
  cards,
  children,
  onSwipeLeft,
  onSwipeRight,
}: TinderRootProps<T>) => {
  const swipeApi = useTinderSwipe({
    itemCount: cards.length,
    onSwipeLeft: (index) => {
      if (cards[index]) onSwipeLeft?.(cards[index]);
    },
    onSwipeRight: (index) => {
      if (cards[index]) onSwipeRight?.(cards[index]);
    },
  });

  const visibleCards = useMemo(
    () =>
      cards
        .slice(
          swipeApi.currentIndex,
          swipeApi.currentIndex + VISIBLE_CARD_COUNT,
        )
        .map((item, offset) => ({
          item,
          index: swipeApi.currentIndex + offset,
        })),
    [cards, swipeApi.currentIndex],
  );

  const content =
    typeof children === "function"
      ? children({ currentIndex: swipeApi.currentIndex, visibleCards })
      : children;

  return (
    <TinderSwipeContext.Provider value={swipeApi}>
      {content}
    </TinderSwipeContext.Provider>
  );
};
interface TinderCardProps extends React.HTMLAttributes<HTMLDivElement> {
  index: number;
  children: React.ReactNode;
}

export const TinderCard = ({
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
      className={twMerge(
        clsx(
          "absolute h-full w-full cursor-grab [touch-action:none] overflow-hidden rounded-xl bg-white shadow-lg transition-transform duration-300 ease-out select-none",
          (isTopCard || isNextCard) && "will-change-transform",
          className,
        ),
      )}
      style={{
        zIndex: itemCount - index,
        transform: isTopCard
          ? "none"
          : `scale(${1 - (index - currentIndex) * 0.1}) translate3d(0, ${(index - currentIndex) * 12}px, 0)`,
        ...style,
      }}
      {...props}
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

export const TinderNopeButton = (
  props: React.ButtonHTMLAttributes<HTMLButtonElement>,
) => {
  const { animateSwipe, isFinished } = useTinderContext();
  if (isFinished) return null;
  return <button onClick={() => animateSwipe("left")} {...props} />;
};

export const TinderLikeButton = (
  props: React.ButtonHTMLAttributes<HTMLButtonElement>,
) => {
  const { animateSwipe, isFinished } = useTinderContext();
  if (isFinished) return null;
  return <button onClick={() => animateSwipe("right")} {...props} />;
};

export const TinderEmptyFallback = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const { isFinished } = useTinderContext();

  return isFinished ? <div className={className}>{children}</div> : null;
};

export const TinderUndoButton = ({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const { undo, currentIndex } = useTinderContext();
  const isDisabled = currentIndex === 0;
  return (
    <button
      onClick={undo}
      disabled={isDisabled}
      className={twMerge("...", className)}
      {...props}
    >
      {children}
    </button>
  );
};

export const TinderResetButton = ({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const { reset, currentIndex } = useTinderContext();
  const isDisabled = currentIndex === 0;
  return (
    <button
      onClick={reset}
      disabled={isDisabled}
      className={twMerge("...", className)}
      {...props}
    >
      {children}
    </button>
  );
};
```

### @components/Tinder/useTinderSwipe.ts

- Source: `src/components/Tinder/useTinderSwipe.ts`
- SHA-256: `accf1da12dd897db49efe4e2455e9f2a4534eef919d0c0ba31775550b19f4cc4`

```ts
import { useCallback, useRef, useState, useEffect } from "react";

interface UseTinderSwipeProps {
  itemCount: number;
  swipeThreshold?: number;
  // 🔥 콜백 함수 타입 정의
  onSwipeLeft?: (index: number) => void;
  onSwipeRight?: (index: number) => void;
}

const SWIPE_THRESHOLD_DEFAULT = 100;
const SWIPE_TRANSITION_DURATION_MS = 200;
const SWIPE_TRANSITION_FALLBACK_MS = SWIPE_TRANSITION_DURATION_MS + 50;
const NEXT_CARD_REST_SCALE = 0.9;
const NEXT_CARD_REST_TRANSLATE_Y = 12;

export const useTinderSwipe = ({
  itemCount,
  swipeThreshold = SWIPE_THRESHOLD_DEFAULT,
  onSwipeLeft,
  onSwipeRight,
}: UseTinderSwipeProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentIndexRef = useRef(currentIndex);
  const itemCountRef = useRef(itemCount);
  const swipeThresholdRef = useRef(swipeThreshold);
  const onSwipeLeftRef = useRef(onSwipeLeft);
  const onSwipeRightRef = useRef(onSwipeRight);

  currentIndexRef.current = currentIndex;
  itemCountRef.current = itemCount;
  swipeThresholdRef.current = swipeThreshold;
  onSwipeLeftRef.current = onSwipeLeft;
  onSwipeRightRef.current = onSwipeRight;

  const topCardRef = useRef<HTMLDivElement>(null);
  const nextCardRef = useRef<HTMLDivElement>(null);
  const likeIndicatorRef = useRef<HTMLDivElement>(null);
  const nopeIndicatorRef = useRef<HTMLDivElement>(null);

  const isDraggingRef = useRef(false);
  const isAnimatingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const latestPointerPosRef = useRef({ x: 0, y: 0 });
  const currentTranslateRef = useRef(0);
  const dragOriginYRef = useRef<"top" | "bottom">("top");
  const rafIdRef = useRef<number | null>(null);
  const animationCleanupRef = useRef<(() => void) | null>(null);

  const animateSwipe = useCallback((direction: "left" | "right") => {
    const topCard = topCardRef.current;
    const swipedIndex = currentIndexRef.current;
    if (
      !topCard ||
      swipedIndex >= itemCountRef.current ||
      isAnimatingRef.current ||
      isDraggingRef.current
    ) {
      return;
    }

    isAnimatingRef.current = true;

    try {
      if (direction === "left") {
        onSwipeLeftRef.current?.(swipedIndex);
      } else {
        onSwipeRightRef.current?.(swipedIndex);
      }
    } catch (error) {
      isAnimatingRef.current = false;
      throw error;
    }

    if (nextCardRef.current) {
      nextCardRef.current.style.transition = "transform 0.3s ease-out";
      nextCardRef.current.style.transform = `none`;
    }

    const flyOutX =
      (direction === "right" ? 1 : -1) * (window.innerWidth + 200);
    topCard.style.transition = "transform 0.2s ease-out, opacity 0.2s ease-out";
    topCard.style.transform = `translate3d(${flyOutX}px, 0, 0) rotate(${flyOutX / 15}deg)`;
    topCard.style.opacity = "0";

    let isComplete = false;

    const cleanupAnimation = () => {
      topCard.removeEventListener("transitionend", handleTransitionEnd);
      window.clearTimeout(fallbackTimerId);
      if (animationCleanupRef.current === cleanupAnimation) {
        animationCleanupRef.current = null;
      }
    };

    const completeAnimation = () => {
      if (isComplete) return;
      isComplete = true;
      cleanupAnimation();
      isAnimatingRef.current = false;
      topCard.style.transition = "";
      topCard.style.display = "none";
      setCurrentIndex((prev) => Math.min(prev + 1, itemCountRef.current));
    };

    function handleTransitionEnd(event: TransitionEvent) {
      if (event.target === topCard && event.propertyName === "transform") {
        completeAnimation();
      }
    }

    topCard.addEventListener("transitionend", handleTransitionEnd);
    const fallbackTimerId = window.setTimeout(
      completeAnimation,
      SWIPE_TRANSITION_FALLBACK_MS,
    );
    animationCleanupRef.current = cleanupAnimation;
  }, []);

  const snapBack = useCallback(() => {
    if (topCardRef.current) {
      topCardRef.current.style.transition = "transform 0.3s ease-out";
      topCardRef.current.style.transform = "translate3d(0, 0, 0)";
      topCardRef.current.style.transformOrigin = "center center";
    }
    if (nextCardRef.current) {
      nextCardRef.current.style.transition = "transform 0.3s ease-out";
      nextCardRef.current.style.transform = `scale(${NEXT_CARD_REST_SCALE}) translate3d(0, ${NEXT_CARD_REST_TRANSLATE_Y}px, 0)`;
    }
    if (likeIndicatorRef.current) likeIndicatorRef.current.style.opacity = "0";
    if (nopeIndicatorRef.current) nopeIndicatorRef.current.style.opacity = "0";
  }, []);

  const renderLatestDragPosition = useCallback(() => {
    if (!isDraggingRef.current || !topCardRef.current) return;

    const deltaX = latestPointerPosRef.current.x - startPosRef.current.x;
    const deltaY = latestPointerPosRef.current.y - startPosRef.current.y;
    currentTranslateRef.current = deltaX;

    const rotationMultiplier = dragOriginYRef.current === "top" ? 1 : -1;
    const rotation = (deltaX / 15) * rotationMultiplier;

    topCardRef.current.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0) rotate(${rotation}deg)`;

    const likeOpacity = Math.max(
      0,
      Math.min(1, deltaX / swipeThresholdRef.current),
    );
    const nopeOpacity = Math.max(
      0,
      Math.min(1, -deltaX / swipeThresholdRef.current),
    );

    if (likeIndicatorRef.current) {
      likeIndicatorRef.current.style.opacity = `${likeOpacity}`;
    }
    if (nopeIndicatorRef.current) {
      nopeIndicatorRef.current.style.opacity = `${nopeOpacity}`;
    }

    if (nextCardRef.current) {
      const progress = Math.min(
        Math.abs(deltaX) / swipeThresholdRef.current,
        1,
      );
      const newScale =
        NEXT_CARD_REST_SCALE + (1 - NEXT_CARD_REST_SCALE) * progress;
      const newTranslateY = NEXT_CARD_REST_TRANSLATE_Y * (1 - progress);
      nextCardRef.current.style.transform = `scale(${newScale}) translate3d(0, ${newTranslateY}px, 0)`;
    }
  }, []);

  const cancelScheduledDragFrame = useCallback(() => {
    if (rafIdRef.current === null) return;
    cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = null;
  }, []);

  const flushLatestDragPosition = useCallback(() => {
    cancelScheduledDragFrame();
    renderLatestDragPosition();
  }, [cancelScheduledDragFrame, renderLatestDragPosition]);

  const handleWindowPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDraggingRef.current || !topCardRef.current) return;
      latestPointerPosRef.current = { x: e.clientX, y: e.clientY };
      if (rafIdRef.current !== null) return;

      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        renderLatestDragPosition();
      });
    },
    [renderLatestDragPosition],
  );

  const handleWindowPointerEnd = useCallback(
    (event: PointerEvent) => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerEnd);
      window.removeEventListener("pointercancel", handleWindowPointerEnd);

      if (event.type === "pointercancel") {
        cancelScheduledDragFrame();
        isDraggingRef.current = false;
        snapBack();
        currentTranslateRef.current = 0;
        return;
      }

      latestPointerPosRef.current = { x: event.clientX, y: event.clientY };
      flushLatestDragPosition();
      isDraggingRef.current = false;

      if (Math.abs(currentTranslateRef.current) > swipeThresholdRef.current) {
        animateSwipe(currentTranslateRef.current > 0 ? "right" : "left");
      } else {
        snapBack();
      }
      currentTranslateRef.current = 0;
    },
    [
      animateSwipe,
      cancelScheduledDragFrame,
      flushLatestDragPosition,
      handleWindowPointerMove,
      snapBack,
    ],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (
        !topCardRef.current ||
        isDraggingRef.current ||
        isAnimatingRef.current
      ) {
        return;
      }

      const cardRect = topCardRef.current.getBoundingClientRect();
      const clickOffsetY = e.clientY - cardRect.top;

      if (clickOffsetY > cardRect.height / 2) {
        dragOriginYRef.current = "bottom";
        topCardRef.current.style.transformOrigin = "top center";
      } else {
        dragOriginYRef.current = "top";
        topCardRef.current.style.transformOrigin = "bottom center";
      }

      isDraggingRef.current = true;
      startPosRef.current = { x: e.clientX, y: e.clientY };
      latestPointerPosRef.current = { x: e.clientX, y: e.clientY };
      currentTranslateRef.current = 0;
      topCardRef.current.style.transition = "";
      if (nextCardRef.current) {
        nextCardRef.current.style.transition = "none";
      }

      window.addEventListener("pointermove", handleWindowPointerMove);
      window.addEventListener("pointerup", handleWindowPointerEnd);
      window.addEventListener("pointercancel", handleWindowPointerEnd);
    },
    [handleWindowPointerEnd, handleWindowPointerMove],
  );

  const undo = useCallback(() => {
    if (isAnimatingRef.current) return;
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const reset = useCallback(() => {
    if (isAnimatingRef.current) return;
    setCurrentIndex(0);
  }, []);

  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerEnd);
      window.removeEventListener("pointercancel", handleWindowPointerEnd);
      cancelScheduledDragFrame();
      animationCleanupRef.current?.();
      isDraggingRef.current = false;
      isAnimatingRef.current = false;
    };
  }, [
    cancelScheduledDragFrame,
    handleWindowPointerEnd,
    handleWindowPointerMove,
  ]);

  const isFinished = currentIndex >= itemCount;

  return {
    currentIndex,
    itemCount,
    topCardRef,
    nextCardRef,
    likeIndicatorRef,
    nopeIndicatorRef,
    handlePointerDown,
    animateSwipe,
    isFinished,
    setCurrentIndex,
    undo,
    reset,
  };
};
```

## React/Vite example

```tsx
import {
  TinderCard,
  TinderEmptyFallback,
  TinderLikeButton,
  TinderNopeButton,
  TinderResetButton,
  TinderRoot,
} from "../components/Tinder";

interface Profile {
  id: string;
  name: string;
  age: number;
}

const profiles: readonly Profile[] = [
  { id: "ada", name: "Ada", age: 29 },
  { id: "grace", name: "Grace", age: 31 },
];

export default function TinderExample() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-6">
      <TinderRoot cards={profiles}>
        {({ currentIndex, visibleCards }) => (
          <section aria-label="Profile deck">
            <div className="relative h-[28rem] w-80">
              {visibleCards.map(({ item, index }) => (
                <TinderCard
                  key={item.id}
                  index={index}
                  role="group"
                  aria-label={`${item.name}, age ${item.age}`}
                  aria-hidden={index !== currentIndex}
                  className="grid place-items-center p-8"
                >
                  <h2 className="text-2xl font-semibold">{item.name}</h2>
                  <p>Age {item.age}</p>
                </TinderCard>
              ))}
              <TinderEmptyFallback className="absolute inset-0 grid place-items-center">
                <div role="status" aria-live="polite" className="text-center">
                  <p>All profiles reviewed.</p>
                  <TinderResetButton type="button">Review again</TinderResetButton>
                </div>
              </TinderEmptyFallback>
            </div>
            <div className="mt-6 flex justify-center gap-4">
              <TinderNopeButton type="button" aria-label="Pass profile" className="rounded-full bg-white px-5 py-3 focus-visible:outline-2">
                Pass
              </TinderNopeButton>
              <TinderLikeButton type="button" aria-label="Like profile" className="rounded-full bg-white px-5 py-3 focus-visible:outline-2">
                Like
              </TinderLikeButton>
            </div>
          </section>
        )}
      </TinderRoot>
    </main>
  );
}
```

## Next.js App Router examples

```tsx
"use client";

import {
  TinderCard,
  TinderEmptyFallback,
  TinderLikeButton,
  TinderNopeButton,
  TinderResetButton,
  TinderRoot,
} from "../components/Tinder/client";

export interface SerializableProfile {
  id: string;
  name: string;
  age: number;
}

export interface TinderDeckProps {
  cards: readonly SerializableProfile[];
  deckKey: string;
}

export function TinderDeck({ cards, deckKey }: TinderDeckProps) {
  return (
    <TinderRoot key={deckKey} cards={cards}>
      {({ currentIndex, visibleCards }) => (
        <section aria-label="Profile deck">
          <div className="relative h-[28rem] w-80">
            {visibleCards.map(({ item, index }) => (
              <TinderCard
                key={item.id}
                index={index}
                role="group"
                aria-label={`${item.name}, age ${item.age}`}
                aria-hidden={index !== currentIndex}
                className="grid place-items-center p-8"
              >
                <h2 className="text-2xl font-semibold">{item.name}</h2>
                <p>Age {item.age}</p>
              </TinderCard>
            ))}
            <TinderEmptyFallback className="absolute inset-0 grid place-items-center">
              <div role="status" aria-live="polite" className="text-center">
                <p>All profiles reviewed.</p>
                <TinderResetButton type="button">Review again</TinderResetButton>
              </div>
            </TinderEmptyFallback>
          </div>
          <div className="mt-6 flex justify-center gap-4">
            <TinderNopeButton type="button" aria-label="Pass profile" className="rounded-full bg-white px-5 py-3 focus-visible:outline-2">
              Pass
            </TinderNopeButton>
            <TinderLikeButton type="button" aria-label="Like profile" className="rounded-full bg-white px-5 py-3 focus-visible:outline-2">
              Like
            </TinderLikeButton>
          </div>
        </section>
      )}
    </TinderRoot>
  );
}
```

```tsx
import { TinderDeck, type SerializableProfile } from "./client-wrapper";

const cards: readonly SerializableProfile[] = [
  { id: "ada", name: "Ada", age: 29 },
  { id: "grace", name: "Grace", age: 31 },
];

export default function Page() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-6">
      <TinderDeck
        cards={cards}
        deckKey={cards.map((card) => card.id).join(":")}
      />
    </main>
  );
}
```

## Required verification

- Typecheck and production-build the consuming project.
- Confirm the selected Tailwind major emits the representative utilities from the manifest.
- For Next.js, render production HTML, hydrate without console errors, and exercise one interaction.
- Recompute every file and artifact SHA-256 before using the result.
