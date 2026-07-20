import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ReactPod from "./ReactPod";
import type { ReactPodMenuItemId, ReactPodSliderItem } from "./reactPodState";

const SLIDER_ITEMS = [
  {
    id: "coast",
    title: "Coast",
    description: "A quiet railway beside the sea.",
    imageSrc: "/coast.webp",
    imageAlt: "Railway platform beside the sea",
  },
  {
    id: "city",
    title: "City",
    description: "Neon reflected after rain.",
    imageSrc: "/city.webp",
    imageAlt: "Neon city street after rain",
  },
  {
    id: "river",
    title: "River",
    description: "Blue hour over the river.",
    imageSrc: "/river.webp",
    imageAlt: "River and bridge at blue hour",
  },
] satisfies readonly ReactPodSliderItem[];

const CASES = [
  {
    id: "slicer-slider",
    label: "Slicer Slider",
    viewportName: "Slicer Slider navigation",
  },
  {
    id: "expo-slider",
    label: "Expo Slider",
    viewportName: "Expo Slider navigation",
  },
  {
    id: "cards-stack-slider",
    label: "Cards Stack",
    viewportName: "Cards Stack navigation",
  },
] as const satisfies readonly {
  id: ReactPodMenuItemId;
  label: string;
  viewportName: string;
}[];

describe("ReactPod slider screens", () => {
  it.each(CASES)(
    "connects ClickWheel navigation and selection to $label",
    async ({ id, label, viewportName }) => {
      render(
        <ReactPod
          menuItems={[{ id, label }]}
          sliderItems={SLIDER_ITEMS}
          tracks={[]}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: "Select" }));

      const viewport = screen.getByRole("group", { name: viewportName });
      expect(viewport).toHaveFocus();

      fireEvent.click(
        document.querySelector<HTMLElement>(
          '[data-slot="click-wheel-next"]',
        ) as HTMLElement,
      );
      fireEvent.click(
        screen.getByRole("button", { name: "Toggle item details" }),
      );
      expect(
        await screen.findByLabelText("City details", {}, { timeout: 2_000 }),
      ).toHaveTextContent("Neon reflected after rain.");

      fireEvent.click(screen.getByRole("button", { name: "Previous menu" }));
      const menu = screen.getByRole("listbox", { name: "Main menu" });
      expect(within(menu).getByRole("option", { name: label })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    },
  );

  it("routes circular wheel rotation through the active slider controller", async () => {
    render(
      <ReactPod
        menuItems={[{ id: "expo-slider", label: "Expo Slider" }]}
        sliderItems={SLIDER_ITEMS}
      />,
    );

    const wheel = screen.getByLabelText(/Click wheel/);
    fireEvent.click(screen.getByRole("button", { name: "Select" }));
    fireEvent.wheel(wheel, { deltaY: 1 });
    fireEvent.click(
      screen.getByRole("button", { name: "Toggle item details" }),
    );

    expect(
      await screen.findByLabelText("City details", {}, { timeout: 2_000 }),
    ).toBeInTheDocument();
  });

  it.each(CASES)("shows an empty $label state", ({ id, label }) => {
    render(<ReactPod menuItems={[{ id, label }]} sliderItems={[]} />);

    fireEvent.click(screen.getByRole("button", { name: "Select" }));

    expect(screen.getByRole("status")).toHaveTextContent(`No ${label} Items`);
    fireEvent.click(screen.getByRole("button", { name: "Previous menu" }));
    expect(
      screen.getByRole("listbox", { name: "Main menu" }),
    ).toBeInTheDocument();
  });
});
