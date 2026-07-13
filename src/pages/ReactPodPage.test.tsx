import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ReactPodPage from "./ReactPodPage";

describe("ReactPodPage", () => {
  it("updates the preview from the editable configuration", () => {
    render(<ReactPodPage />);

    expect(screen.getByRole("tab", { name: "Usage" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Code" }));
    const editor = screen.getByRole("textbox", {
      name: "LIVE JSON source code editor",
    });
    const source = JSON.parse((editor as HTMLTextAreaElement).value);
    source.deviceName = "My Pocket Player";
    source.menuItems[0].label = "Listen Now";
    source.wheelSensitivity = 2;

    fireEvent.change(editor, {
      target: { value: JSON.stringify(source, null, 2) },
    });
    fireEvent.click(screen.getByRole("tab", { name: "Preview" }));

    expect(screen.getByText("My Pocket Player")).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Listen Now" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("slider", { name: "Wheel sensitivity" }),
    ).toHaveValue("2");

    const wheel = screen.getByLabelText(/Click wheel/);
    vi.spyOn(wheel, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 200,
      bottom: 200,
      width: 200,
      height: 200,
      toJSON: () => ({}),
    });
    fireEvent.pointerDown(wheel, {
      pointerId: 40,
      pointerType: "mouse",
      button: 0,
      clientX: 200,
      clientY: 100,
    });
    fireEvent.pointerMove(wheel, {
      pointerId: 40,
      pointerType: "mouse",
      clientX: 197,
      clientY: 124,
    });
    fireEvent.pointerUp(wheel, { pointerId: 40, pointerType: "mouse" });

    expect(screen.getByRole("option", { name: "Photos" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("adjusts sensitivity in Preview and keeps the LIVE JSON in sync", () => {
    render(<ReactPodPage />);

    const slider = screen.getByRole("slider", { name: "Wheel sensitivity" });
    fireEvent.change(slider, { target: { value: "1.7" } });
    expect(slider).toHaveValue("1.7");
    expect(screen.getByText("1.7×")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Code" }));
    const editor = screen.getByRole("textbox", {
      name: "LIVE JSON source code editor",
    });
    expect(JSON.parse((editor as HTMLTextAreaElement).value)).toMatchObject({
      wheelSensitivity: 1.7,
    });
  });

  it("shows an error and keeps the last valid preview for invalid JSON", () => {
    render(<ReactPodPage />);

    fireEvent.click(screen.getByRole("tab", { name: "Code" }));
    fireEvent.change(
      screen.getByRole("textbox", {
        name: "LIVE JSON source code editor",
      }),
      { target: { value: "{" } },
    );

    expect(screen.getByText(/valid JSON/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Preview" }));
    expect(
      screen.getByRole("slider", { name: "Wheel sensitivity" }),
    ).toBeDisabled();
    expect(
      within(screen.getByRole("tabpanel", { name: "Preview" })).getByText(
        "ReactPod",
      ),
    ).toBeInTheDocument();
  });

  it("opens the preview photo album from the click wheel", () => {
    render(<ReactPodPage />);
    const wheel = screen.getByLabelText(/Click wheel/);
    const select = screen.getByRole("button", { name: "Select" });

    fireEvent.keyDown(wheel, { key: "ArrowDown" });
    fireEvent.keyDown(wheel, { key: "ArrowDown" });

    expect(screen.getByRole("option", { name: "Photos" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    fireEvent.click(select);
    expect(
      screen.getByRole("option", { name: /Photo Library/ }),
    ).toBeInTheDocument();

    fireEvent.click(select);
    const photoGrid = screen.getByRole("grid", {
      name: "Photo Library photos",
    });
    expect(within(photoGrid).getAllByRole("gridcell")).toHaveLength(4);
    expect(
      within(photoGrid).getByRole("gridcell", { name: /Han River/ }),
    ).toHaveAttribute("aria-selected", "true");

    fireEvent.click(select);
    expect(
      screen.getByRole("img", {
        name: /Han River and bridge lights reflected on the water/,
      }),
    ).toBeInTheDocument();
  });
});
