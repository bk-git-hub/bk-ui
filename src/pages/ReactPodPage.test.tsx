import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { reactPodNextJsExport } from "@/snippets/reactPodNextExportCode";
import { reactPodReactExport } from "@/snippets/reactPodReactExportCode";
import ReactPodPage from "./ReactPodPage";

describe("ReactPodPage", () => {
  it("renders the complete viewer tabs in framework order", () => {
    render(<ReactPodPage />);

    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "Preview",
      "Code",
      "Usage",
      "React Export",
      "Next.js Export",
    ]);
  });

  it("shows copyable usage and framework-specific public entries", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<ReactPodPage />);

    fireEvent.click(screen.getByRole("tab", { name: "Usage" }));
    expect(
      await screen.findByRole("region", { name: "TSX source code" }),
    ).toHaveTextContent('from "@/components/ReactPod"');
    expect(screen.getByRole("tabpanel", { name: "Usage" })).toHaveTextContent(
      "wheelSensitivity={1.25}",
    );
    expect(screen.getByRole("tabpanel", { name: "Usage" })).toHaveTextContent(
      "coverflowAlbums={coverflowAlbums}",
    );

    fireEvent.click(screen.getByRole("tab", { name: "React Export" }));
    const reactExportPanel = screen.getByRole("tabpanel", {
      name: "React Export",
    });
    expect(
      await within(reactExportPanel).findByRole("region", {
        name: "React TSX source code",
      }),
    ).toHaveTextContent('from "@/components/ReactPod"');
    expect(reactExportPanel).toHaveTextContent(
      "src/components/ClickWheel/ClickWheel.tsx",
    );
    expect(reactExportPanel).toHaveTextContent(
      "src/components/Coverflow/coverflow.tsx",
    );
    expect(reactExportPanel).toHaveTextContent("Tailwind CSS v4");
    fireEvent.click(
      within(reactExportPanel).getByRole("button", { name: "Copy" }),
    );
    expect(writeText).toHaveBeenLastCalledWith(reactPodReactExport.code.trim());

    fireEvent.click(screen.getByRole("tab", { name: "Next.js Export" }));
    const nextExportPanel = screen.getByRole("tabpanel", {
      name: "Next.js Export",
    });
    expect(
      await within(nextExportPanel).findByRole("region", {
        name: "Next.js TSX source code",
      }),
    ).toHaveTextContent('from "@/components/ReactPod/client"');
    expect(nextExportPanel).toHaveTextContent('"use client"');
    expect(nextExportPanel).toHaveTextContent("SSR / hydration");
    expect(nextExportPanel).toHaveTextContent(
      "coverflowAlbums={coverflowAlbums}",
    );
    expect(nextExportPanel).toHaveTextContent("@source");
    fireEvent.click(
      within(nextExportPanel).getByRole("button", { name: "Copy" }),
    );
    expect(writeText).toHaveBeenLastCalledWith(
      reactPodNextJsExport.code.trim(),
    );
  });

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
    source.menuItems.find(
      (item: { id: string }) => item.id === "coverflow",
    ).label = "Album Browser";
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
      screen.getByRole("option", { name: "Album Browser" }),
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

  it("opens the preview Coverflow with injected album data", () => {
    render(<ReactPodPage />);
    const wheel = screen.getByLabelText(/Click wheel/);

    fireEvent.keyDown(wheel, { key: "ArrowDown" });
    fireEvent.keyDown(wheel, { key: "ArrowDown" });
    fireEvent.keyDown(wheel, { key: "ArrowDown" });

    expect(screen.getByRole("option", { name: "Coverflow" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    fireEvent.keyDown(wheel, { key: "Enter" });

    const coverflow = screen.getByRole("region", {
      name: "ReactPod album coverflow",
    });
    expect(
      within(coverflow).getByRole("button", {
        name: "Show details for Blue Hour",
      }),
    ).toBeInTheDocument();
  });
});
