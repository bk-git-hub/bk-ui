import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CoverflowPage from "./CoverflowPage";

const openEditor = () => {
  fireEvent.click(screen.getByRole("tab", { name: "Customize" }));
  return screen.getByRole("textbox", {
    name: "LIVE JSON source code editor",
  }) as HTMLTextAreaElement;
};

describe("CoverflowPage", () => {
  it("updates and exercises the Coverflow preview from valid live JSON", () => {
    render(<CoverflowPage />);
    const editor = openEditor();
    const source = JSON.parse(editor.value);
    source.ariaLabel = "Edited album covers";
    source.showIndexes = false;
    source.albums = [
      {
        ...source.albums[0],
        title: "Edited Album",
        tracks: ["First Track", "Second Track"],
      },
    ];

    fireEvent.change(editor, {
      target: { value: JSON.stringify(source, null, 2) },
    });

    const livePreview = screen.getByRole("region", {
      name: "Coverflow live preview",
    });
    const carousel = within(livePreview).getByRole("region", {
      name: "Edited album covers",
    });
    const image = carousel.querySelector<HTMLImageElement>(
      'img[alt="Edited Album"]',
    );
    expect(image).not.toBeNull();
    fireEvent.load(image!);
    expect(image).toBeVisible();

    const item = carousel.querySelector<HTMLElement>(
      '[data-slot="coverflow-item"]',
    );
    expect(item).not.toBeNull();
    fireEvent.click(item!);

    expect(
      within(carousel).getByRole("heading", { name: "Edited Album" }),
    ).toBeInTheDocument();
    expect(within(carousel).getByText("First Track")).toBeInTheDocument();
  });

  it("keeps the last valid preview for errors and restores defaults", () => {
    render(<CoverflowPage />);
    const editor = openEditor();
    const source = JSON.parse(editor.value);
    source.albums[0].title = "Edited Album";
    fireEvent.change(editor, {
      target: { value: JSON.stringify(source, null, 2) },
    });
    fireEvent.change(editor, { target: { value: "{" } });

    expect(editor).toHaveAttribute("aria-invalid", "true");
    expect(
      screen.getByText("Enter valid JSON to update the preview."),
    ).toBeInTheDocument();
    const livePreview = screen.getByRole("region", {
      name: "Coverflow live preview",
    });
    expect(
      livePreview.querySelector('img[alt="Edited Album"]'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));

    expect(editor).not.toHaveAttribute("aria-invalid");
    expect(editor.value).toContain('"title": "Hollow Nomad"');
    expect(
      livePreview.querySelector('img[alt="Hollow Nomad"]'),
    ).toBeInTheDocument();
  });

  it("resets interaction state when the JSON is already at its default", () => {
    render(<CoverflowPage />);
    openEditor();
    const livePreview = screen.getByRole("region", {
      name: "Coverflow live preview",
    });
    const carousel = within(livePreview).getByRole("region", {
      name: "Album covers",
    });
    const image = carousel.querySelector<HTMLImageElement>(
      'img[alt="Hollow Nomad"]',
    );
    const item = carousel.querySelector<HTMLElement>(
      '[data-slot="coverflow-item"]',
    );

    expect(image).not.toBeNull();
    expect(item).not.toBeNull();
    fireEvent.load(image!);
    fireEvent.click(item!);
    expect(item).toHaveAttribute("data-flipped", "true");

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));

    const resetPreview = screen.getByRole("region", {
      name: "Coverflow live preview",
    });
    const resetCarousel = within(resetPreview).getByRole("region", {
      name: "Album covers",
    });
    expect(
      resetCarousel.querySelector('[data-slot="coverflow-item"]'),
    ).toHaveAttribute("data-flipped", "false");
    expect(
      resetCarousel.querySelector('[data-slot="coverflow-close-trigger"]'),
    ).not.toBeInTheDocument();
  });

  it("keeps complete copyable TSX in a separate Usage tab", async () => {
    render(<CoverflowPage />);
    fireEvent.click(screen.getByRole("tab", { name: "Usage" }));

    const usage = await screen.findByRole("region", {
      name: "TSX source code",
    });
    expect(usage).toHaveTextContent(
      'import { Coverflow, CoverflowItem, LazyImage } from "@/components/Coverflow"',
    );
    expect(usage).toHaveTextContent("export default function AlbumCoverflow()");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});
