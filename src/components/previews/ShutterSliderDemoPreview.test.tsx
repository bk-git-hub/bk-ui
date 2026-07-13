import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ShutterSliderDemoPreview from "./ShutterSliderDemoPreview";
import { DEFAULT_SHUTTER_SLIDER_DEMO_CONFIG } from "./shutter-slider-demo.util";

const getSlider = () =>
  screen.getByRole("region", { name: "한국의 네 가지 여행 장면" });

describe("ShutterSliderDemoPreview", () => {
  it("renders a supplied live configuration", () => {
    render(
      <ShutterSliderDemoPreview
        config={{
          ...DEFAULT_SHUTTER_SLIDER_DEMO_CONFIG,
          orientation: "horizontal",
          stripCount: 9,
        }}
      />,
    );

    expect(getSlider()).toHaveAttribute("data-orientation", "horizontal");
    expect(getSlider()).toHaveAttribute("data-strip-count", "9");
  });

  it("keeps its visual controls interactive in uncontrolled mode", () => {
    render(<ShutterSliderDemoPreview />);

    fireEvent.click(screen.getByRole("radio", { name: "가로" }));
    fireEvent.click(screen.getByRole("radio", { name: "7 CUTS" }));

    expect(getSlider()).toHaveAttribute("data-orientation", "horizontal");
    expect(getSlider()).toHaveAttribute("data-strip-count", "7");
  });

  it("reports visual control changes to a controlled owner", () => {
    const onConfigChange = vi.fn();
    render(
      <ShutterSliderDemoPreview
        config={DEFAULT_SHUTTER_SLIDER_DEMO_CONFIG}
        onConfigChange={onConfigChange}
      />,
    );

    fireEvent.click(screen.getByRole("radio", { name: "가로" }));

    expect(onConfigChange).toHaveBeenCalledWith({
      ...DEFAULT_SHUTTER_SLIDER_DEMO_CONFIG,
      orientation: "horizontal",
    });
  });
});
