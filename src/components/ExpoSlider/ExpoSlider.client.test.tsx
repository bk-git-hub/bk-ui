import { readFileSync } from "node:fs";
import { join } from "node:path";
import { act } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as clientEntry from "./client";
import * as reactEntry from "./index";

function StaticExpoSlider() {
  return (
    <clientEntry.ExpoSliderRoot
      count={2}
      loop={false}
      transitionDuration={0}
      aria-label="SSR expo gallery"
    >
      <clientEntry.ExpoSliderViewport>
        {[
          { title: "Coast", src: "/coast.webp" },
          { title: "Night", src: "/night.webp" },
        ].map((slide, index) => (
          <clientEntry.ExpoSliderSlide key={slide.title} index={index}>
            <clientEntry.ExpoSliderFrame>
              <clientEntry.ExpoSliderImage
                src={slide.src}
                alt={`${slide.title} scene`}
              />
              <clientEntry.ExpoSliderContent>
                {slide.title}
              </clientEntry.ExpoSliderContent>
            </clientEntry.ExpoSliderFrame>
          </clientEntry.ExpoSliderSlide>
        ))}
      </clientEntry.ExpoSliderViewport>
      <clientEntry.ExpoSliderPrevious>Previous</clientEntry.ExpoSliderPrevious>
      <clientEntry.ExpoSliderStatus />
      <clientEntry.ExpoSliderNext>Next</clientEntry.ExpoSliderNext>
    </clientEntry.ExpoSliderRoot>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("ExpoSlider public entries", () => {
  it("keeps the Next.js client directive as the first statement", () => {
    const source = readFileSync(
      join(process.cwd(), "src/components/ExpoSlider/client.ts"),
      "utf8",
    );

    expect(source).toMatch(/^"use client";/);
  });

  it("exposes the same runtime API from the React and client entries", () => {
    expect(Object.keys(clientEntry).sort()).toEqual(
      Object.keys(reactEntry).sort(),
    );

    for (const exportName of Object.keys(reactEntry)) {
      expect(clientEntry[exportName as keyof typeof clientEntry]).toBe(
        reactEntry[exportName as keyof typeof reactEntry],
      );
    }
  });

  it("renders through the client entry without browser globals", () => {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("document", undefined);

    const markup = renderToString(<StaticExpoSlider />);

    expect(markup).toContain('data-slot="expo-slider-root"');
    expect(markup).toContain("Coast");
    expect(markup).toContain("01 / 02");
  });

  it("hydrates its server markup without a mismatch", async () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(<StaticExpoSlider />);
    document.body.append(container);
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    let root: Root | undefined;

    try {
      await act(async () => {
        root = hydrateRoot(container, <StaticExpoSlider />);
      });

      expect(consoleError).not.toHaveBeenCalled();
    } finally {
      if (root) {
        await act(async () => root?.unmount());
      }
      container.remove();
    }
  });
});
