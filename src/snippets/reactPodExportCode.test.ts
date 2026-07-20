import { describe, expect, it } from "vitest";
import { reactPodNextJsExport } from "./reactPodNextExportCode";
import { reactPodReactExport } from "./reactPodReactExportCode";
import { reactPodUsageCode } from "./reactPodUsageCode";

describe("ReactPod usage and export snippets", () => {
  it("uses the current React public API in the minimal usage example", () => {
    expect(reactPodUsageCode).toContain('from "@/components/ReactPod"');
    expect(reactPodUsageCode).toContain("type ReactPodMenuItem");
    expect(reactPodUsageCode).toContain("type ReactPodCoverflowAlbum");
    expect(reactPodUsageCode).toContain("type ReactPodSliderItem");
    expect(reactPodUsageCode).toContain("type ReactPodTrack");
    expect(reactPodUsageCode).toContain('id: "coverflow"');
    expect(reactPodUsageCode).toContain('id: "slicer-slider"');
    expect(reactPodUsageCode).toContain('id: "expo-slider"');
    expect(reactPodUsageCode).toContain('id: "cards-stack-slider"');
    expect(reactPodUsageCode).toContain("menuItems={menuItems}");
    expect(reactPodUsageCode).toContain("tracks={tracks}");
    expect(reactPodUsageCode).toContain('src: "/audio/streetlights.mp3"');
    expect(reactPodUsageCode).toContain("coverflowAlbums={coverflowAlbums}");
    expect(reactPodUsageCode).toContain("sliderItems={sliderItems}");
    expect(reactPodUsageCode).toContain("wheelSensitivity={1.25}");
  });

  it("documents a copyable React and Vite export", () => {
    expect(reactPodReactExport.language).toBe("React TSX");
    expect(reactPodReactExport.code).toContain(
      "src/components/ReactPod/ReactPod.tsx",
    );
    expect(reactPodReactExport.code).toContain(
      "src/components/ClickWheel/ClickWheel.tsx",
    );
    expect(reactPodReactExport.code).toContain(
      "src/components/ClickWheel/useClickWheelController.ts",
    );
    expect(reactPodReactExport.code).toContain(
      "src/components/ReactPod/ReactPodCoverflow.tsx",
    );
    expect(reactPodReactExport.code).toContain(
      "src/components/Coverflow/coverflow.tsx",
    );
    expect(reactPodReactExport.code).toContain(
      "src/components/Coverflow/lazy-image.tsx",
    );
    expect(reactPodReactExport.code).toContain(
      "src/components/ReactPod/ReactPodSliderScreens.tsx",
    );
    expect(reactPodReactExport.code).toContain(
      "src/components/ReactPod/ReactPodActiveScreenController.ts",
    );
    for (const file of [
      "src/components/SlicerSlider/index.ts",
      "src/components/SlicerSlider/SlicerSlider.tsx",
      "src/components/SlicerSlider/useSlicerSlider.ts",
      "src/components/ExpoSlider/index.ts",
      "src/components/ExpoSlider/ExpoSlider.tsx",
      "src/components/ExpoSlider/useExpoSlider.ts",
      "src/components/CardsStackSlider/index.ts",
      "src/components/CardsStackSlider/CardsStackSlider.tsx",
      "src/components/CardsStackSlider/useCardsStackSlider.ts",
    ]) {
      expect(reactPodReactExport.code).toContain(file);
    }
    expect(reactPodReactExport.code).toContain('from "@/components/ReactPod"');
    expect(reactPodReactExport.code).toContain("type ReactPodCoverflowAlbum");
    expect(reactPodReactExport.code).toContain("type ReactPodTrack");
    expect(reactPodReactExport.code).toContain("type ReactPodSliderItem");
    expect(reactPodReactExport.code).toContain("tracks={tracks}");
    expect(reactPodReactExport.code).toContain(
      "coverflowAlbums={coverflowAlbums}",
    );
    expect(reactPodReactExport.code).toContain("sliderItems={sliderItems}");
    expect(reactPodReactExport.code).toContain("pnpm add clsx tailwind-merge");
    expect(reactPodReactExport.code).toContain(
      'fileURLToPath(new URL("./src", import.meta.url))',
    );
    expect(reactPodReactExport.code).toContain(
      'import tailwindcss from "@tailwindcss/vite"',
    );
    expect(reactPodReactExport.code).toContain('"@/*": ["src/*"]');
    expect(reactPodReactExport.code).toContain("Tailwind CSS v4");
    expect(reactPodReactExport.code).toContain("Tailwind CSS v3");
    expect(reactPodReactExport.code).toContain(
      '@source "../node_modules/@your-scope/bk-ui/src/components/ReactPod"',
    );
    expect(reactPodReactExport.code).toContain(
      '@source "../node_modules/@your-scope/bk-ui/src/components/ClickWheel"',
    );
    expect(reactPodReactExport.code).toContain(
      '@source "../node_modules/@your-scope/bk-ui/src/components/Coverflow"',
    );
    for (const component of [
      "SlicerSlider",
      "ExpoSlider",
      "CardsStackSlider",
    ]) {
      expect(reactPodReactExport.code).toContain(
        `@source "../node_modules/@your-scope/bk-ui/src/components/${component}"`,
      );
      expect(reactPodReactExport.code).toContain(
        `./node_modules/@your-scope/bk-ui/src/components/${component}/**/*.{js,ts,jsx,tsx}`,
      );
    }
    expect(reactPodReactExport.code).not.toContain(
      'from "@/components/ReactPod/client"',
    );
    expect(reactPodReactExport.code).not.toMatch(/from ["']next\//);
  });

  it("documents the real Next.js client entry and SSR constraints", () => {
    expect(reactPodNextJsExport.language).toBe("Next.js TSX");
    expect(reactPodNextJsExport.code).toContain(
      "src/components/ReactPod/client.ts",
    );
    expect(reactPodNextJsExport.code).toContain(
      "src/components/ClickWheel/client.ts",
    );
    expect(reactPodNextJsExport.code).toContain(
      "src/components/ClickWheel/useClickWheelController.ts",
    );
    expect(reactPodNextJsExport.code).toContain("Optional client entry");
    expect(reactPodNextJsExport.code).toContain(
      "src/components/Coverflow/coverflow.tsx",
    );
    expect(reactPodNextJsExport.code).toContain(
      "src/components/ReactPod/ReactPodSliderScreens.tsx",
    );
    expect(reactPodNextJsExport.code).toContain(
      "src/components/ReactPod/ReactPodActiveScreenController.ts",
    );
    for (const file of [
      "src/components/SlicerSlider/index.ts",
      "src/components/SlicerSlider/SlicerSlider.tsx",
      "src/components/SlicerSlider/useSlicerSlider.ts",
      "src/components/ExpoSlider/index.ts",
      "src/components/ExpoSlider/ExpoSlider.tsx",
      "src/components/ExpoSlider/useExpoSlider.ts",
      "src/components/CardsStackSlider/index.ts",
      "src/components/CardsStackSlider/CardsStackSlider.tsx",
      "src/components/CardsStackSlider/useCardsStackSlider.ts",
    ]) {
      expect(reactPodNextJsExport.code).toContain(file);
    }
    expect(reactPodNextJsExport.code).toContain('"use client";');
    expect(reactPodNextJsExport.code).toContain('export * from "./index";');
    expect(reactPodNextJsExport.code).toContain(
      'from "@/components/ReactPod/client"',
    );
    expect(reactPodNextJsExport.code).toContain("type ReactPodCoverflowAlbum");
    expect(reactPodNextJsExport.code).toContain("type ReactPodTrack");
    expect(reactPodNextJsExport.code).toContain("type ReactPodSliderItem");
    expect(reactPodNextJsExport.code).toContain("tracks={tracks}");
    expect(reactPodNextJsExport.code).toContain(
      'src: "/audio/streetlights.mp3"',
    );
    expect(reactPodNextJsExport.code).toContain(
      "coverflowAlbums={coverflowAlbums}",
    );
    expect(reactPodNextJsExport.code).toContain("sliderItems={sliderItems}");
    expect(reactPodNextJsExport.code).toContain('"@/*": ["./src/*"]');
    expect(reactPodNextJsExport.code).toContain(
      "public/albums/night-drive.webp",
    );
    expect(reactPodNextJsExport.code).toContain("SSR / hydration");
    expect(reactPodNextJsExport.code).toContain("serializable");
    expect(reactPodNextJsExport.code).toContain("data-only");
    expect(reactPodNextJsExport.code).toContain(
      "controllers and\n//   refs are created inside that client boundary",
    );
    expect(reactPodNextJsExport.code).toContain("window or document");
    expect(reactPodNextJsExport.code).toContain("dynamic(..., { ssr: false })");
    expect(reactPodNextJsExport.code).toContain("Tailwind CSS v4");
    expect(reactPodNextJsExport.code).toContain("Tailwind CSS v3");
    expect(reactPodNextJsExport.code).toContain(
      '@source "../node_modules/@your-scope/bk-ui/src/components/Coverflow"',
    );
    for (const component of [
      "SlicerSlider",
      "ExpoSlider",
      "CardsStackSlider",
    ]) {
      expect(reactPodNextJsExport.code).toContain(
        `@source "../node_modules/@your-scope/bk-ui/src/components/${component}"`,
      );
      expect(reactPodNextJsExport.code).toContain(
        `./node_modules/@your-scope/bk-ui/src/components/${component}/**/*.{js,ts,jsx,tsx}`,
      );
    }
    expect(reactPodNextJsExport.code).not.toMatch(/from ["']next\//);
  });
});
