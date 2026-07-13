export const SHADER_SLIDER_EXPORT_DEPENDENCY_COMMAND =
  "pnpm add clsx@^2.1.1 tailwind-merge@^3.3.1";

export const SHADER_SLIDER_EXPORT_CORE_FILES = [
  "src/components/ShaderSlider/ShaderSlider.tsx",
  "src/components/ShaderSlider/shader-slider-renderer.ts",
  "src/components/ShaderSlider/shader-slider-types.ts",
  "src/components/ShaderSlider/useShaderSlider.ts",
  "src/components/ShaderSlider/index.ts",
] as const;

export const SHADER_SLIDER_EXPORT_ASSET_FILES = [
  "public/shader-slider/tidal-glass.webp",
  "public/shader-slider/electric-bloom.webp",
  "public/shader-slider/solar-drift.webp",
  "public/shader-slider/afterlight.webp",
] as const;

export const SHADER_SLIDER_NEXT_CLIENT_FILE =
  "src/components/ShaderSlider/client.ts";

export const SHADER_SLIDER_REACT_TAILWIND_SOURCE =
  '@source "./components/ShaderSlider";';

export const SHADER_SLIDER_NEXT_TAILWIND_SOURCE =
  '@source "../components/ShaderSlider";';

export const SHADER_SLIDER_NEXT_ROOT_APP_TAILWIND_SOURCE =
  '@source "../src/components/ShaderSlider";';
