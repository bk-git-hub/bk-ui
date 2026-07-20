import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "./HomePage";

describe("HomePage", () => {
  it("groups component cards separately from the For Fun cards", () => {
    render(<HomePage />);

    const components = within(
      screen.getByRole("region", { name: "Components" }),
    );
    const forFun = within(screen.getByRole("region", { name: "For Fun" }));

    expect(components.getByRole("link", { name: /ReactPod/i })).toHaveAttribute(
      "href",
      "/components/react-pod",
    );
    expect(
      components.getByRole("link", { name: /Tinder Swiper/i }),
    ).toHaveAttribute("href", "/components/tinder-swiper");
    expect(components.queryByRole("link", { name: /Lotto Draw/i })).toBeNull();
    expect(forFun.getByRole("link", { name: /Lotto Draw/i })).toHaveAttribute(
      "href",
      "/components/lotto",
    );
    expect(forFun.getByRole("link", { name: /Slot Machine/i })).toHaveAttribute(
      "href",
      "/components/slot-machine",
    );
    expect(
      forFun.getByRole("link", { name: /Baccarat Squeeze/i }),
    ).toHaveAttribute("href", "/components/baccarat-squeeze");
    expect(document.querySelector('a[href="/components/ipod"]')).toBeNull();

    const pageText = document.body.textContent ?? "";
    expect(pageText.indexOf("Components")).toBeLessThan(
      pageText.indexOf("For Fun"),
    );
  });
});
