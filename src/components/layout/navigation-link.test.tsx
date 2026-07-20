import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import NavigationLink from "./navigation-link";

describe("NavigationLink", () => {
  it("groups component links before the For Fun links", () => {
    render(
      <MemoryRouter>
        <NavigationLink onLinkClick={vi.fn()} />
      </MemoryRouter>,
    );

    const navigation = screen.getByRole("navigation", {
      name: "Main navigation",
    });
    const components = within(
      screen.getByRole("region", { name: "Components" }),
    );
    const forFun = within(screen.getByRole("region", { name: "For Fun" }));

    expect(
      within(navigation).getByRole("link", { name: "Home" }),
    ).toHaveAttribute("href", "/");
    expect(
      components.getByRole("link", { name: "Tinder Swiper" }),
    ).toHaveAttribute("href", "/components/tinder-swiper");
    expect(components.getByRole("link", { name: "ReactPod" })).toHaveAttribute(
      "href",
      "/components/react-pod",
    );
    expect(components.queryByRole("link", { name: "Lotto Draw" })).toBeNull();
    expect(forFun.getByRole("link", { name: "Lotto Draw" })).toHaveAttribute(
      "href",
      "/components/lotto",
    );
    expect(forFun.getByRole("link", { name: "Slot Machine" })).toHaveAttribute(
      "href",
      "/components/slot-machine",
    );
    expect(
      forFun.getByRole("link", { name: "Baccarat Squeeze" }),
    ).toHaveAttribute("href", "/components/baccarat-squeeze");

    const navigationText = navigation.textContent ?? "";
    expect(navigationText.indexOf("Components")).toBeLessThan(
      navigationText.indexOf("For Fun"),
    );
  });
});
