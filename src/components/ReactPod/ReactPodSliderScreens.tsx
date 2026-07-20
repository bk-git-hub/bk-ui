"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from "react";
import {
  CardsStackBack,
  CardsStackFront,
  CardsStackItem,
  CardsStackNext,
  CardsStackPrevious,
  CardsStackRoot,
  CardsStackStatus,
  CardsStackViewport,
} from "@/components/CardsStackSlider";
import {
  ExpoSliderContent,
  ExpoSliderFrame,
  ExpoSliderImage,
  ExpoSliderNext,
  ExpoSliderPrevious,
  ExpoSliderRoot,
  ExpoSliderSlide,
  ExpoSliderStatus,
  ExpoSliderViewport,
} from "@/components/ExpoSlider";
import {
  SlicerSliderNext,
  SlicerSliderPrevious,
  SlicerSliderRoot,
  SlicerSliderSlide,
  SlicerSliderStatus,
  SlicerSliderViewport,
} from "@/components/SlicerSlider";
import type { ClickWheelDirection } from "@/components/ClickWheel";
import { useReactPodScreenController } from "./ReactPodActiveScreenController";
import { useReactPod } from "./ReactPodContext";
import type { ReactPodScreen, ReactPodSliderItem } from "./reactPodState";

type ReactPodSliderScreen = Extract<
  ReactPodScreen,
  "slicer-slider" | "expo-slider" | "cards-stack-slider"
>;

function focusClickWheel(screen: HTMLElement) {
  screen
    .closest<HTMLElement>('[data-slot="react-pod"]')
    ?.querySelector<HTMLElement>('[data-slot="click-wheel"]')
    ?.focus();
}

function EmptySlider({ name }: { name: string }) {
  return (
    <div
      role="status"
      className="flex h-full flex-col items-center justify-center bg-slate-950 px-6 text-center text-slate-300"
    >
      <p className="text-xs font-bold">No {name} Items</p>
      <p className="mt-1 text-[9px] font-normal text-slate-500">
        Add slides with the sliderItems prop.
      </p>
    </div>
  );
}

function SliderDetails({
  isOpen,
  item,
}: {
  isOpen: boolean;
  item: ReactPodSliderItem | undefined;
}) {
  if (!isOpen || !item) return null;

  return (
    <aside
      aria-label={`${item.title} details`}
      data-slot="react-pod-slider-details"
      className="pointer-events-none absolute inset-x-2 bottom-2 z-50 rounded-md border border-white/20 bg-black/85 px-2 py-1.5 text-white shadow-lg backdrop-blur-sm"
    >
      <p className="truncate text-[10px] font-bold">{item.title}</p>
      <p className="line-clamp-2 text-[8px] leading-3 text-white/70">
        {item.description ?? item.imageAlt}
      </p>
    </aside>
  );
}

function useSliderScreenController(
  screen: ReactPodSliderScreen,
  itemCount: number,
  previousRef: RefObject<HTMLButtonElement | null>,
  nextRef: RefObject<HTMLButtonElement | null>,
) {
  const { back, goToMainMenu } = useReactPod();
  const viewportRef = useRef<HTMLDivElement>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const navigate = useCallback(
    (direction: ClickWheelDirection) => {
      setIsDetailsOpen(false);
      const button = direction === -1 ? previousRef.current : nextRef.current;
      if (button && !button.disabled) button.click();
    },
    [nextRef, previousRef],
  );
  const select = useCallback(() => {
    if (itemCount > 0) setIsDetailsOpen((isOpen) => !isOpen);
  }, [itemCount]);
  const controller = useMemo(
    () => ({ navigate, select, disabled: itemCount === 0 }),
    [itemCount, navigate, select],
  );

  useReactPodScreenController(screen, controller);

  useEffect(() => {
    viewportRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.defaultPrevented) return;

      if (event.key === "Escape") {
        event.preventDefault();
        back();
        focusClickWheel(event.currentTarget);
      } else if (event.key === "Home") {
        event.preventDefault();
        goToMainMenu();
        focusClickWheel(event.currentTarget);
      }
    },
    [back, goToMainMenu],
  );

  return { handleKeyDown, isDetailsOpen, viewportRef };
}

export function ReactPodSlicerSlider() {
  const { setSliderIndex, sliderItems, state } = useReactPod();
  const previousRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const { handleKeyDown, isDetailsOpen, viewportRef } =
    useSliderScreenController(
      "slicer-slider",
      sliderItems.length,
      previousRef,
      nextRef,
    );
  const slides = useMemo(
    () =>
      sliderItems.map((item) => ({
        src: item.imageSrc,
        alt: item.imageAlt,
        objectPosition: item.imageObjectPosition,
      })),
    [sliderItems],
  );
  const activeItem = sliderItems[state.slicerSliderIndex];

  if (sliderItems.length === 0) return <EmptySlider name="Slicer Slider" />;

  return (
    <section className="relative h-full overflow-hidden bg-black">
      <SlicerSliderRoot
        slides={slides}
        defaultValue={state.slicerSliderIndex}
        onValueChange={(value) => setSliderIndex("slicer-slider", value)}
        sliceCount={5}
        sliceDuration={320}
        staggerDelay={24}
        aria-label="ReactPod Slicer Slider"
        className="h-full"
      >
        <SlicerSliderViewport
          ref={viewportRef}
          role="group"
          aria-label="Slicer Slider navigation"
          onKeyDown={handleKeyDown}
          className="h-full w-full bg-black text-white"
        >
          {sliderItems.map((item, index) => (
            <SlicerSliderSlide key={item.id} index={index}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/10" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-2 text-white">
                <p className="min-w-0 truncate text-[11px] font-bold">
                  {item.title}
                </p>
                <span className="shrink-0 text-[8px] font-semibold text-white/65 tabular-nums">
                  {index + 1}/{sliderItems.length}
                </span>
              </div>
            </SlicerSliderSlide>
          ))}
        </SlicerSliderViewport>
        <SlicerSliderPrevious
          ref={previousRef}
          aria-hidden="true"
          tabIndex={-1}
          className="sr-only"
        >
          Previous
        </SlicerSliderPrevious>
        <SlicerSliderNext
          ref={nextRef}
          aria-hidden="true"
          tabIndex={-1}
          className="sr-only"
        >
          Next
        </SlicerSliderNext>
        <SlicerSliderStatus className="sr-only" />
      </SlicerSliderRoot>
      <SliderDetails isOpen={isDetailsOpen} item={activeItem} />
    </section>
  );
}

export function ReactPodExpoSlider() {
  const { setSliderIndex, sliderItems, state } = useReactPod();
  const previousRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const { handleKeyDown, isDetailsOpen, viewportRef } =
    useSliderScreenController(
      "expo-slider",
      sliderItems.length,
      previousRef,
      nextRef,
    );
  const activeItem = sliderItems[state.expoSliderIndex];

  if (sliderItems.length === 0) return <EmptySlider name="Expo Slider" />;

  return (
    <section className="relative h-full overflow-hidden bg-[#111113]">
      <ExpoSliderRoot
        count={sliderItems.length}
        defaultValue={state.expoSliderIndex}
        onValueChange={(value) => setSliderIndex("expo-slider", value)}
        slidesPerView={1.25}
        gap={7}
        scaleFactor={1.08}
        mediaScaleFactor={1.04}
        parallax={28}
        grayscale={false}
        transitionDuration={240}
        aria-label="ReactPod Expo Slider"
        className="h-full justify-center gap-0"
      >
        <ExpoSliderViewport
          ref={viewportRef}
          aria-label="Expo Slider navigation"
          onKeyDown={handleKeyDown}
          className="aspect-auto h-full w-full focus-visible:ring-lime-200 focus-visible:ring-inset"
        >
          {sliderItems.map((item, index) => (
            <ExpoSliderSlide
              key={item.id}
              index={index}
              aria-label={item.title}
            >
              <ExpoSliderFrame className="border border-white/15 shadow-xl shadow-black/50">
                <ExpoSliderImage
                  src={item.imageSrc}
                  alt={item.imageAlt}
                  style={{ objectPosition: item.imageObjectPosition }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/5 to-black/10" />
                <ExpoSliderContent className="flex items-end justify-between gap-2 p-2 text-white">
                  <p className="min-w-0 truncate text-[10px] font-bold">
                    {item.title}
                  </p>
                  <span className="shrink-0 text-[8px] font-semibold text-lime-200 tabular-nums">
                    {index + 1}/{sliderItems.length}
                  </span>
                </ExpoSliderContent>
              </ExpoSliderFrame>
            </ExpoSliderSlide>
          ))}
        </ExpoSliderViewport>
        <ExpoSliderPrevious
          ref={previousRef}
          aria-hidden="true"
          tabIndex={-1}
          className="sr-only"
        >
          Previous
        </ExpoSliderPrevious>
        <ExpoSliderNext
          ref={nextRef}
          aria-hidden="true"
          tabIndex={-1}
          className="sr-only"
        >
          Next
        </ExpoSliderNext>
        <ExpoSliderStatus className="sr-only" />
      </ExpoSliderRoot>
      <SliderDetails isOpen={isDetailsOpen} item={activeItem} />
    </section>
  );
}

export function ReactPodCardsStackSlider() {
  const { setSliderIndex, sliderItems, state } = useReactPod();
  const previousRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const { handleKeyDown, isDetailsOpen, viewportRef } =
    useSliderScreenController(
      "cards-stack-slider",
      sliderItems.length,
      previousRef,
      nextRef,
    );
  const activeItem = sliderItems[state.cardsStackSliderIndex];

  if (sliderItems.length === 0) return <EmptySlider name="Cards Stack" />;

  return (
    <section className="relative h-full overflow-hidden bg-gradient-to-br from-stone-100 to-slate-300">
      <CardsStackRoot
        count={sliderItems.length}
        defaultValue={state.cardsStackSliderIndex}
        onValueChange={(value) => setSliderIndex("cards-stack-slider", value)}
        sideOffset={45}
        visibleCount={2}
        transitionDuration={220}
        aria-label="ReactPod Cards Stack Slider"
        className="h-full justify-center gap-0"
      >
        <CardsStackViewport
          ref={viewportRef}
          aria-label="Cards Stack navigation"
          onKeyDown={handleKeyDown}
          className="aspect-[16/10] w-[132px] max-w-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"
        >
          {sliderItems.map((item, index) => (
            <CardsStackItem key={item.id} index={index} aria-label={item.title}>
              <CardsStackFront className="rounded-xl border border-white/35 bg-slate-950 text-white shadow-xl">
                <img
                  src={item.imageSrc}
                  alt={item.imageAlt}
                  draggable={false}
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ objectPosition: item.imageObjectPosition }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/5 to-white/10" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-2">
                  <p className="min-w-0 truncate text-[10px] font-bold">
                    {item.title}
                  </p>
                  <span className="shrink-0 text-[8px] font-semibold text-white/65 tabular-nums">
                    {index + 1}/{sliderItems.length}
                  </span>
                </div>
              </CardsStackFront>
              <CardsStackBack className="rounded-xl border border-white/20 bg-gradient-to-br from-violet-950 via-slate-950 to-black p-3 text-white shadow-xl">
                <p className="text-[8px] font-bold tracking-[0.18em] text-violet-200 uppercase">
                  ReactPod
                </p>
                <p className="mt-2 text-xs font-bold">{item.title}</p>
                <p className="mt-1 line-clamp-3 text-[8px] leading-3 text-white/65">
                  {item.description ?? item.imageAlt}
                </p>
              </CardsStackBack>
            </CardsStackItem>
          ))}
        </CardsStackViewport>
        <CardsStackPrevious
          ref={previousRef}
          aria-hidden="true"
          tabIndex={-1}
          className="sr-only"
        >
          Previous
        </CardsStackPrevious>
        <CardsStackNext
          ref={nextRef}
          aria-hidden="true"
          tabIndex={-1}
          className="sr-only"
        >
          Next
        </CardsStackNext>
        <CardsStackStatus className="sr-only" />
      </CardsStackRoot>
      <SliderDetails isOpen={isDetailsOpen} item={activeItem} />
    </section>
  );
}
