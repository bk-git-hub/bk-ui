import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Coverflow } from "./coverflow";
import { CoverflowItem } from "./coverflow-item";

const getCard = () =>
  screen
    .getByText("Album")
    .closest<HTMLElement>('[data-slot="coverflow-card"]')!;

const resize = (coverflow: HTMLElement, width: number, height: number) => {
  act(() => {
    (
      coverflow as HTMLElement & {
        __resizeCallback?: ResizeObserverCallback;
      }
    ).__resizeCallback?.(
      [{ contentRect: { width, height } } as ResizeObserverEntry],
      {} as ResizeObserver,
    );
  });
};

describe("Coverflow itemSize", () => {
  it("uses the preferred size while shrinking to stay inside its container", () => {
    const { container, rerender } = render(
      <Coverflow itemSize={160}>
        <CoverflowItem>Album</CoverflowItem>
      </Coverflow>,
    );
    const coverflow = container.firstElementChild as HTMLElement;

    expect(coverflow).not.toHaveAttribute("itemSize");
    expect(getCard()).toHaveStyle({ width: "160px", height: "160px" });

    resize(coverflow, 600, 400);
    expect(getCard()).toHaveStyle({ width: "160px", height: "160px" });

    resize(coverflow, 120, 300);
    expect(getCard()).toHaveStyle({ width: "120px", height: "120px" });

    rerender(
      <Coverflow itemSize={240}>
        <CoverflowItem>Album</CoverflowItem>
      </Coverflow>,
    );
    expect(getCard()).toHaveStyle({ width: "120px", height: "120px" });

    resize(coverflow, 600, 400);
    expect(getCard()).toHaveStyle({ width: "240px", height: "240px" });

    rerender(
      <Coverflow itemSize={180}>
        <CoverflowItem>Album</CoverflowItem>
      </Coverflow>,
    );
    expect(getCard()).toHaveStyle({ width: "180px", height: "180px" });
  });

  it("keeps the 800px cap and falls back to auto-fit for invalid values", () => {
    const { container, rerender } = render(
      <Coverflow itemSize={1_200}>
        <CoverflowItem>Album</CoverflowItem>
      </Coverflow>,
    );
    const coverflow = container.firstElementChild as HTMLElement;

    resize(coverflow, 1_000, 1_000);
    expect(getCard()).toHaveStyle({ width: "800px", height: "800px" });

    rerender(
      <Coverflow itemSize={0}>
        <CoverflowItem>Album</CoverflowItem>
      </Coverflow>,
    );
    expect(getCard()).toHaveStyle({ width: "800px", height: "800px" });

    resize(coverflow, 500, 260);
    expect(getCard()).toHaveStyle({ width: "260px", height: "260px" });
  });
});
