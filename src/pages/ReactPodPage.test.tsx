import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ReactPodPage from "./ReactPodPage";

describe("ReactPodPage", () => {
  it("updates the preview from the editable configuration", () => {
    render(<ReactPodPage />);

    fireEvent.click(screen.getByRole("tab", { name: "Code" }));
    const editor = screen.getByRole("textbox", {
      name: "LIVE JSON source code editor",
    });
    const source = JSON.parse((editor as HTMLTextAreaElement).value);
    source.deviceName = "My Pocket Player";
    source.menuItems[0].label = "Listen Now";

    fireEvent.change(editor, {
      target: { value: JSON.stringify(source, null, 2) },
    });
    fireEvent.click(screen.getByRole("tab", { name: "Preview" }));

    expect(screen.getByText("My Pocket Player")).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Listen Now" }),
    ).toBeInTheDocument();
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
      within(screen.getByRole("tabpanel", { name: "Preview" })).getByText(
        "ReactPod",
      ),
    ).toBeInTheDocument();
  });
});
