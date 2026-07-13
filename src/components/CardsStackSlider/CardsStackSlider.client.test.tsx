import { readFileSync } from "node:fs";
import { join } from "node:path";
import { act } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as clientEntry from "./client";
import * as reactEntry from "./index";

function StaticCardsStack() {
  return (
    <clientEntry.CardsStackRoot count={2} loop={false} aria-label="SSR cards">
      <clientEntry.CardsStackViewport>
        {["Alpha", "Beta"].map((card, index) => (
          <clientEntry.CardsStackItem key={card} index={index}>
            <clientEntry.CardsStackFront>{card}</clientEntry.CardsStackFront>
            <clientEntry.CardsStackBack>
              {card} details
            </clientEntry.CardsStackBack>
          </clientEntry.CardsStackItem>
        ))}
      </clientEntry.CardsStackViewport>
      <clientEntry.CardsStackPrevious>Previous</clientEntry.CardsStackPrevious>
      <clientEntry.CardsStackStatus />
      <clientEntry.CardsStackNext>Next</clientEntry.CardsStackNext>
    </clientEntry.CardsStackRoot>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("CardsStackSlider public entries", () => {
  it("keeps the Next.js client directive as the first statement", () => {
    const source = readFileSync(
      join(process.cwd(), "src/components/CardsStackSlider/client.ts"),
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

  it("renders on the server without browser globals", () => {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("document", undefined);

    const markup = renderToString(<StaticCardsStack />);

    expect(markup).toContain('data-slot="cards-stack-root"');
    expect(markup).toContain("Alpha");
    expect(markup).toContain("1 of 2");
  });

  it("hydrates its server markup without a mismatch", async () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(<StaticCardsStack />);
    document.body.append(container);
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    let root: Root | undefined;

    try {
      await act(async () => {
        root = hydrateRoot(container, <StaticCardsStack />);
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
