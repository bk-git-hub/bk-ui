/* eslint-disable no-unused-vars -- Base ESLint treats TypeScript callback parameter names as runtime bindings. */
import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  ShaderSliderNext,
  ShaderSliderPagination,
  ShaderSliderPrevious,
  ShaderSliderRendererStatus,
  ShaderSliderRoot,
  ShaderSliderSlide,
  ShaderSliderStatus,
  ShaderSliderViewport,
  type ShaderSliderEffect,
} from "@/components/ShaderSlider";
import {
  SHADER_SLIDER_DATA,
  SHADER_SLIDER_IMAGES,
} from "@/mocks/shaderSliderData";
import {
  DEFAULT_SHADER_SLIDER_DEMO_CONFIG,
  type ShaderSliderDemoConfig,
} from "./shader-slider-demo.util";

const EFFECTS: readonly { value: ShaderSliderEffect; label: string }[] = [
  { value: "wave", label: "Wave" },
  { value: "ripple", label: "Ripple" },
  { value: "pixel", label: "Pixel" },
];

export interface ShaderSliderDemoPreviewProps {
  config?: ShaderSliderDemoConfig;
  onConfigChange?: (config: ShaderSliderDemoConfig) => void;
}

export default function ShaderSliderDemoPreview({
  config,
  onConfigChange,
}: ShaderSliderDemoPreviewProps) {
  const [localConfig, setLocalConfig] = useState(
    DEFAULT_SHADER_SLIDER_DEMO_CONFIG,
  );
  const resolvedConfig = config ?? localConfig;
  const updateConfig = onConfigChange ?? setLocalConfig;

  return (
    <div className="h-full min-h-[34rem] w-full overflow-auto rounded-lg bg-[#090a0d] p-2 text-white sm:p-3">
      <ShaderSliderRoot
        slides={SHADER_SLIDER_IMAGES}
        effect={resolvedConfig.effect}
        transitionDuration={resolvedConfig.transitionDuration}
        intensity={resolvedConfig.intensity}
        frequency={resolvedConfig.frequency}
        dprCap={resolvedConfig.dprCap}
        loop={resolvedConfig.loop}
        aria-label="Spectra visual stories"
        className="group mx-auto h-full min-h-[32rem] w-full max-w-6xl overflow-hidden rounded-[1.6rem] border border-white/12 bg-slate-950 shadow-2xl shadow-black/60"
      >
        <ShaderSliderViewport
          aria-label="Use left and right arrow keys or drag to change story"
          className="h-full min-h-[32rem] w-full rounded-[1.55rem]"
        >
          {SHADER_SLIDER_DATA.map((slide, index) => (
            <ShaderSliderSlide
              key={slide.id}
              index={index}
              aria-label={`${slide.title}, ${index + 1} of ${SHADER_SLIDER_DATA.length}`}
              className="flex items-end bg-[linear-gradient(180deg,rgba(2,6,23,0.06)_25%,rgba(2,6,23,0.88)_100%)] p-6 pb-20 sm:p-9 sm:pb-24 lg:p-12 lg:pb-24"
            >
              <div className="max-w-3xl">
                <p
                  className={`text-[0.66rem] font-bold tracking-[0.28em] uppercase ${slide.accentClassName}`}
                >
                  {slide.eyebrow}
                </p>
                <h2 className="mt-3 text-4xl leading-[0.92] font-black tracking-[-0.055em] text-balance sm:text-6xl lg:text-7xl">
                  {slide.title}
                </h2>
                <div className="mt-5 flex max-w-2xl flex-col gap-3 border-l border-white/35 pl-4 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
                  <p className="max-w-md text-sm leading-6 text-white/70 sm:text-base">
                    {slide.description}
                  </p>
                  <p className="shrink-0 font-mono text-[0.58rem] tracking-[0.16em] text-white/48 uppercase">
                    {slide.coordinates}
                  </p>
                </div>
              </div>
            </ShaderSliderSlide>
          ))}
        </ShaderSliderViewport>

        <div className="pointer-events-none absolute top-0 left-0 z-30 flex w-full items-start justify-between gap-4 p-5 sm:p-7">
          <div>
            <p className="text-[0.65rem] font-black tracking-[0.34em] text-white uppercase">
              BK / Spectra
            </p>
            <ShaderSliderRendererStatus className="mt-1.5 block text-[0.56rem] font-semibold tracking-[0.18em] text-white/45 uppercase">
              {({ renderer, prefersReducedMotion }) =>
                prefersReducedMotion
                  ? "Reduced motion · DOM"
                  : renderer === "webgl"
                    ? "GPU renderer · online"
                    : renderer === "loading"
                      ? "Preparing textures"
                      : "DOM fallback · online"
              }
            </ShaderSliderRendererStatus>
          </div>

          <fieldset className="pointer-events-auto rounded-full border border-white/14 bg-black/25 p-1 backdrop-blur-xl">
            <legend className="sr-only">Shader effect</legend>
            <div className="flex items-center">
              {EFFECTS.map((item) => (
                <label
                  key={item.value}
                  className={`cursor-pointer rounded-full px-2.5 py-1.5 text-[0.58rem] font-bold tracking-[0.12em] uppercase transition-colors has-focus-visible:ring-2 has-focus-visible:ring-white/80 has-focus-visible:outline-none sm:px-3 ${
                    resolvedConfig.effect === item.value
                      ? "bg-white text-slate-950"
                      : "text-white/58 hover:text-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="shader-effect"
                    value={item.value}
                    checked={resolvedConfig.effect === item.value}
                    onChange={() =>
                      updateConfig({
                        ...resolvedConfig,
                        effect: item.value,
                      })
                    }
                    className="sr-only"
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <ShaderSliderPrevious className="absolute top-1/2 left-3 z-40 size-11 -translate-y-1/2 border border-white/16 bg-black/20 text-white backdrop-blur-md hover:bg-white hover:text-slate-950 sm:left-5">
          <ArrowLeft aria-hidden="true" className="size-4" strokeWidth={1.8} />
        </ShaderSliderPrevious>
        <ShaderSliderNext className="absolute top-1/2 right-3 z-40 size-11 -translate-y-1/2 border border-white/16 bg-black/20 text-white backdrop-blur-md hover:bg-white hover:text-slate-950 sm:right-5">
          <ArrowRight aria-hidden="true" className="size-4" strokeWidth={1.8} />
        </ShaderSliderNext>

        <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-40 flex items-center justify-between gap-4 p-5 sm:p-7">
          <ShaderSliderPagination className="pointer-events-auto text-white" />
          <ShaderSliderStatus className="font-mono text-[0.62rem] font-bold tracking-[0.2em] text-white/62 uppercase">
            {({ value, count }) =>
              `${String(value + 1).padStart(2, "0")} / ${String(count).padStart(2, "0")}`
            }
          </ShaderSliderStatus>
        </div>
      </ShaderSliderRoot>
    </div>
  );
}
