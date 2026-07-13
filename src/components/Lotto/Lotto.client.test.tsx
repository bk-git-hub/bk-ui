import { readFileSync } from "node:fs";
import { join } from "node:path";
import { act } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as clientEntry from "./client";
import * as reactEntry from "./index";

const balls = Array.from({ length: 12 }, (_, index) => index + 1);

function StaticLottoMachine() {
  return (
    <clientEntry.LottoMachine
      items={balls}
      resultCount={6}
      getItemKey={(ball) => ball}
      aria-label="SSR lotto machine"
    />
  );
}

beforeEach(() => {
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn(() => 1),
  );
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Lotto public entries", () => {
  it("keeps the Next.js client directive as the first statement", () => {
    const source = readFileSync(
      join(process.cwd(), "src/components/Lotto/client.ts"),
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

    const markup = renderToString(<StaticLottoMachine />);

    expect(markup).toContain('data-slot="lotto-machine"');
    expect(markup).toContain("12 balls ready");
    expect(markup).toContain("Waiting for the draw");
  });

  it("hydrates its server markup without a mismatch", async () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(<StaticLottoMachine />);
    document.body.append(container);
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    let root: Root | undefined;

    try {
      await act(async () => {
        root = hydrateRoot(container, <StaticLottoMachine />);
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
