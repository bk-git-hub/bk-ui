// @vitest-environment node

import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { useClickWheelController as useCoreClickWheelController } from "./index";
import {
  ClickWheel,
  useClickWheelController as useClientClickWheelController,
} from "./client";

function ServerControllerWheel() {
  const wheelBindings = useClientClickWheelController({
    navigate: () => undefined,
    select: () => undefined,
  });

  return <ClickWheel aria-label="Server controller wheel" {...wheelBindings} />;
}

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

  it("exports the same SSR-safe controller from core and client entries", () => {
    expect(useClientClickWheelController).toBe(useCoreClickWheelController);
    expect(renderToString(<ServerControllerWheel />)).toContain(
      "Server controller wheel",
    );
  });
});
