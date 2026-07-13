// @vitest-environment node

import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ClickWheel } from "./client";

describe("ClickWheel SSR", () => {
  it("renders deterministic markup without browser globals", () => {
    expect(typeof window).toBe("undefined");

    const html = renderToString(
      <ClickWheel
        aria-label="Server-rendered wheel"
        sensitivity={2}
        buttonProps={{ select: { children: "OK" } }}
      />,
    );

    expect(html).toContain("Server-rendered wheel");
    expect(html).toContain('data-slot="click-wheel"');
    expect(html).toContain('data-sensitivity="2"');
    expect(html).not.toContain(' sensitivity="');
    expect(html).toContain(">OK<");
  });
});
