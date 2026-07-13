import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Coverflow } from "./coverflow";
import { CoverflowItem } from "./coverflow-item";
import { LazyImage } from "./lazy-image";

describe("Coverflow native drag prevention", () => {
  it("disables image dragging and blocks native dragstart from custom content", () => {
    render(
      <Coverflow>
        <CoverflowItem>
          <LazyImage src="/album.webp" alt="Album artwork" />
        </CoverflowItem>
        <CoverflowItem>
          <img src="/custom.webp" alt="Custom artwork" draggable />
        </CoverflowItem>
      </Coverflow>,
    );

    const lazyImage = screen.getByAltText("Album artwork");
    const customImage = screen.getByAltText("Custom artwork");

    expect(lazyImage).toHaveAttribute("draggable", "false");
    expect(fireEvent.dragStart(lazyImage)).toBe(false);
    expect(fireEvent.dragStart(customImage)).toBe(false);
  });
});
