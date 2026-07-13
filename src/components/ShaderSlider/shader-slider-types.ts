export type ShaderSliderDirection = -1 | 1;

export type ShaderSliderEffect = "wave" | "ripple" | "pixel";

export type ShaderSliderFit = "cover" | "contain";

export type ShaderSliderRendererMode = "loading" | "webgl" | "fallback";

export interface ShaderSliderImage {
  src: string;
  alt: string;
  fit?: ShaderSliderFit;
  crossOrigin?: "anonymous" | "use-credentials" | null;
}
