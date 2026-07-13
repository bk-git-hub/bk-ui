import { describe, expect, it } from "vitest";
import * as coreEntry from "@/components/ExpoSlider";
import { expoSliderNextExportCode } from "./expoSliderNextExportCode";
import { expoSliderReactExportCode } from "./expoSliderReactExportCode";

const runtimePublicExports = Object.keys(coreEntry);

const PUBLIC_TYPES = [
  "ExpoSliderContentProps",
  "ExpoSliderControlProps",
  "ExpoSliderFrameProps",
  "ExpoSliderImageProps",
  "ExpoSliderPaginationProps",
  "ExpoSliderPaginationRenderArgs",
  "ExpoSliderPaginationRenderer",
  "ExpoSliderRootProps",
  "ExpoSliderSlideProps",
  "ExpoSliderStatusProps",
  "ExpoSliderStatusRenderer",
  "ExpoSliderViewportProps",
  "ExpoSliderChangeSource",
  "ExpoSliderDirection",
  "ExpoSliderOrientation",
  "ExpoSliderValueChangeDetail",
  "ExpoSliderValueChangeHandler",
  "UseExpoSliderOptions",
] as const;

const PUBLIC_COMPONENTS = [
  "ExpoSliderContent",
  "ExpoSliderFrame",
  "ExpoSliderImage",
  "ExpoSliderNext",
  "ExpoSliderPagination",
  "ExpoSliderPrevious",
  "ExpoSliderRoot",
  "ExpoSliderSlide",
  "ExpoSliderStatus",
  "ExpoSliderViewport",
] as const;

describe("Expo Slider export snippets", () => {
  it("documents the complete React and Vite core and public API", () => {
    expect(expoSliderReactExportCode).toContain(
      "src/components/ExpoSlider/ExpoSlider.tsx",
    );
    expect(expoSliderReactExportCode).toContain(
      "src/components/ExpoSlider/useExpoSlider.ts",
    );
    expect(expoSliderReactExportCode).toContain(
      "src/components/ExpoSlider/index.ts",
    );
    expect(expoSliderReactExportCode).toContain(
      'from "@/components/ExpoSlider"',
    );
    expect(expoSliderReactExportCode).toContain("pnpm add clsx tailwind-merge");
    expect(expoSliderReactExportCode).toContain("count={slides.length}");

    runtimePublicExports.forEach((exportName) => {
      expect(expoSliderReactExportCode).toContain(exportName);
    });
    PUBLIC_TYPES.forEach((typeExport) => {
      expect(expoSliderReactExportCode).toContain(typeExport);
    });
    PUBLIC_COMPONENTS.forEach((component) => {
      expect(expoSliderReactExportCode).toContain(`<${component}`);
    });

    expect(expoSliderReactExportCode).toContain("Tailwind CSS v4");
    expect(expoSliderReactExportCode).toContain("Tailwind CSS v3");
    expect(expoSliderReactExportCode).toContain(
      '@source "../node_modules/@your-scope/bk-ui/src/components/ExpoSlider"',
    );
    expect(expoSliderReactExportCode).toContain('"./src/**/*.{js,ts,jsx,tsx}"');
    expect(expoSliderReactExportCode).not.toContain(
      'from "@/components/ExpoSlider/client"',
    );
    expect(expoSliderReactExportCode).not.toMatch(/from ["']next\//);
  });

  it("uses the real client re-export and a serializable App Router boundary", () => {
    expect(expoSliderNextExportCode).toContain(
      "src/components/ExpoSlider/client.ts",
    );
    expect(expoSliderNextExportCode).toContain(
      '"use client";\n\nexport * from "./index";',
    );
    expect(expoSliderNextExportCode).toContain(
      'from "@/components/ExpoSlider/client"',
    );
    expect(expoSliderNextExportCode).toContain(
      "export function ExpoGallery({ slides }: ExpoGalleryProps)",
    );
    expect(expoSliderNextExportCode).toContain(
      "app/gallery/page.tsx remains a Server Component",
    );
    expect(expoSliderNextExportCode).toContain(
      "only strings, so the data crossing into ExpoGallery is serializable",
    );
    expect(expoSliderNextExportCode).toContain("SSR / hydration");
    expect(expoSliderNextExportCode).toContain("window or document");
    expect(expoSliderNextExportCode).toContain("ssr: false is unnecessary");
    expect(expoSliderNextExportCode).toContain("Tailwind CSS v4");
    expect(expoSliderNextExportCode).toContain("Tailwind CSS v3");
    expect(expoSliderNextExportCode).toContain(
      '@source "../node_modules/@your-scope/bk-ui/src/components/ExpoSlider"',
    );
    expect(expoSliderNextExportCode).toContain(
      '"./app/**/*.{js,ts,jsx,tsx,mdx}"',
    );
    expect(expoSliderNextExportCode).not.toMatch(/from ["']next\//);
    expect(expoSliderNextExportCode).not.toContain(
      "export function ExpoSliderRoot",
    );

    PUBLIC_COMPONENTS.forEach((component) => {
      expect(expoSliderNextExportCode).toContain(`<${component}`);
    });
  });
});
