import clsx from "clsx";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { twMerge } from "tailwind-merge";
import {
  CoverflowItemContext,
  useCoverflowInteraction,
} from "./coverflow-context";

const Fallback = () => (
  <div className="h-full w-full animate-pulse rounded-md bg-neutral-800 motion-reduce:animate-none" />
);

export interface CoverflowItemProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  children: ReactNode;
  backContent?: ReactNode;
  flipLabel?: string;
  closeLabel?: string;
}

const interactiveSelector =
  "a, button, input, select, textarea, [role='button'], [contenteditable='true']";

export const CoverflowItem = ({
  children,
  backContent,
  flipLabel = "Toggle details",
  closeLabel = "Close details",
  className,
  onClick,
  onKeyDown,
  "aria-label": ariaLabel,
  ...props
}: CoverflowItemProps) => {
  const [isReady, setIsReady] = useState(true);
  const [standaloneFlipped, setStandaloneFlipped] = useState(false);
  const [hasRenderedBack, setHasRenderedBack] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const outsideClickEventRef = useRef<Event | null>(null);
  const interaction = useCoverflowInteraction();
  const hasBackContent = backContent !== undefined && backContent !== null;
  const isActive = interaction?.isActive ?? true;
  const isFlipped = hasBackContent
    ? (interaction?.isFlipped ?? standaloneFlipped)
    : false;

  const isFrontHidden = !isActive || isFlipped;
  const isBackHidden = !isActive || !isFlipped;
  const contextValue = useMemo(
    () => ({
      signalLoading: () => setIsReady(false),
      signalReady: () => setIsReady(true),
    }),
    [],
  );

  useEffect(() => {
    if (isFlipped) {
      setHasRenderedBack(true);
      return;
    }

    const activeElement =
      typeof document === "undefined" ? null : document.activeElement;
    if (activeElement && backRef.current?.contains(activeElement)) {
      triggerRef.current?.focus();
    }
  }, [isFlipped]);

  useEffect(() => {
    if (!isFlipped || typeof document === "undefined") return;

    const handleOutsideClick = (event: globalThis.MouseEvent) => {
      const target = event.target;
      if (target && surfaceRef.current?.contains(target as Node)) return;

      outsideClickEventRef.current = event;
      queueMicrotask(() => {
        if (outsideClickEventRef.current === event) {
          outsideClickEventRef.current = null;
        }
      });

      if (interaction) {
        interaction.deactivate();
        return;
      }
      setStandaloneFlipped(false);
    };

    document.addEventListener("click", handleOutsideClick, true);
    return () =>
      document.removeEventListener("click", handleOutsideClick, true);
  }, [interaction, isFlipped]);

  const activate = () => {
    if (interaction) {
      interaction.activate();
      return;
    }
    setStandaloneFlipped((current) => !current);
  };

  const activateFromClick = () => {
    if (interaction?.consumePendingClick()) return;
    activate();
  };

  const deactivate = () => {
    if (interaction) {
      interaction.deactivate();
      return;
    }
    setStandaloneFlipped(false);
  };

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (outsideClickEventRef.current === event.nativeEvent) {
      outsideClickEventRef.current = null;
      event.stopPropagation();
      return;
    }

    onClick?.(event);
    if (!hasBackContent) return;

    event.stopPropagation();
    if (interaction?.consumePendingClick() || event.defaultPrevented) return;

    const interactiveTarget =
      event.target instanceof Element
        ? event.target.closest(interactiveSelector)
        : null;
    if (interactiveTarget && interactiveTarget !== event.currentTarget) return;

    activate();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const flipTrigger =
      event.target instanceof Element
        ? event.target.closest('[data-slot="coverflow-flip-trigger"]')
        : null;
    onKeyDown?.(event);
    if (
      event.defaultPrevented ||
      !hasBackContent ||
      !flipTrigger ||
      !event.currentTarget.contains(flipTrigger) ||
      (event.key !== "Enter" && event.key !== " ")
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    activate();
  };

  const handleCloseClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (interaction?.consumePendingClick()) return;

    triggerRef.current?.focus();
    deactivate();
  };

  return (
    <CoverflowItemContext.Provider value={contextValue}>
      <div
        {...props}
        data-slot="coverflow-item"
        data-active={isActive}
        data-flipped={isFlipped}
        aria-current={isActive ? "true" : undefined}
        className={twMerge(
          clsx(
            "relative aspect-1/2 w-full bg-black",
            hasBackContent && "cursor-pointer rounded-md",
          ),
          className,
        )}
        aria-label={!hasBackContent ? ariaLabel : undefined}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        <div
          ref={surfaceRef}
          data-slot="coverflow-item-surface"
          className="relative aspect-square w-full"
        >
          {hasBackContent && (
            <button
              ref={triggerRef}
              type="button"
              data-slot="coverflow-flip-trigger"
              className="pointer-events-none absolute inset-x-0 top-0 z-20 aspect-square w-full rounded-md border-0 bg-transparent p-0 outline-none focus-visible:ring-4 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              tabIndex={isActive ? 0 : -1}
              aria-label={ariaLabel ?? flipLabel}
              aria-pressed={isFlipped}
              onClick={activateFromClick}
            />
          )}

          {!isReady && (
            <div className="absolute inset-x-0 top-0 z-10 aspect-square w-full">
              <Fallback />
            </div>
          )}

          {hasBackContent ? (
            <div
              className="aspect-square w-full [perspective:600px]"
              style={{ visibility: isReady ? "visible" : "hidden" }}
            >
              <div
                data-slot="coverflow-flip-surface"
                data-flipped={isFlipped}
                className="relative aspect-square w-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] [transform-style:preserve-3d] data-[flipped=true]:[transform:rotateY(180deg)] motion-reduce:transition-none"
              >
                <div
                  data-slot="coverflow-front"
                  aria-hidden={isFrontHidden}
                  inert={isFrontHidden}
                  className="absolute inset-0 rounded-md [-webkit-backface-visibility:hidden] [backface-visibility:hidden]"
                >
                  {children}
                </div>
                {(hasRenderedBack || isFlipped) && (
                  <div
                    ref={backRef}
                    data-slot="coverflow-back"
                    aria-hidden={isBackHidden}
                    inert={isBackHidden}
                    className="absolute inset-0 [transform:rotateY(180deg)] overflow-hidden rounded-md [-webkit-backface-visibility:hidden] [backface-visibility:hidden]"
                  >
                    {backContent}
                    <button
                      type="button"
                      data-slot="coverflow-close-trigger"
                      className="absolute top-2 right-2 z-10 grid size-10 touch-manipulation place-items-center rounded-full border border-white/25 bg-black/70 text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-black/90 focus-visible:ring-4 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none motion-reduce:transition-none"
                      aria-label={closeLabel}
                      onMouseDown={(event) => event.stopPropagation()}
                      onTouchStart={(event) => event.stopPropagation()}
                      onClick={handleCloseClick}
                    >
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="size-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      >
                        <path d="M6 6l12 12M18 6 6 18" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div
              data-slot="coverflow-front"
              aria-hidden={!isActive}
              inert={!isActive}
              style={{ visibility: isReady ? "visible" : "hidden" }}
            >
              {children}
            </div>
          )}
        </div>
      </div>
    </CoverflowItemContext.Provider>
  );
};
