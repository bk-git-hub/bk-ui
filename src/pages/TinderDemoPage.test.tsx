import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TinderDemoPage from "./TinderDemoPage";

const openEditor = () => {
  fireEvent.click(screen.getByRole("tab", { name: "Code" }));
  return screen.getByRole("textbox", {
    name: "LIVE JSON source code editor",
  }) as HTMLTextAreaElement;
};

describe("TinderDemoPage", () => {
  it("updates the Tinder preview from valid live configuration", () => {
    render(<TinderDemoPage />);
    const editor = openEditor();
    const source = JSON.parse(editor.value);
    source.cards[0].name = "Alex";
    source.cards[0].age = 31;
    source.cards[0].imageKey = "david";
    source.likeLabel = "Like Alex";

    fireEvent.change(editor, {
      target: { value: JSON.stringify(source, null, 2) },
    });

    const livePreview = screen.getByRole("region", {
      name: "Tinder Swiper live preview",
    });
    expect(
      within(livePreview).getByRole("heading", { name: "Alex, 31" }),
    ).toBeInTheDocument();
    expect(
      within(livePreview).getByRole("button", { name: "Like Alex" }),
    ).toBeInTheDocument();
    expect(
      within(livePreview).getAllByRole("presentation", { hidden: true })[0],
    ).toHaveAttribute(
      "src",
      expect.stringContaining("photo-1522529599102-193c0d76b5b6"),
    );

    fireEvent.click(screen.getByRole("tab", { name: "Preview" }));
    expect(
      screen.getByRole("heading", { name: "Alex, 31" }),
    ).toBeInTheDocument();
  });

  it("keeps the last valid preview for errors and restores defaults", () => {
    render(<TinderDemoPage />);
    const editor = openEditor();
    const source = JSON.parse(editor.value);
    source.cards[0].name = "Alex";
    fireEvent.change(editor, {
      target: { value: JSON.stringify(source, null, 2) },
    });
    fireEvent.change(editor, { target: { value: "{" } });

    expect(editor).toHaveAttribute("aria-invalid", "true");
    expect(
      screen.getByText("Enter valid JSON to update the preview."),
    ).toBeInTheDocument();
    const livePreview = screen.getByRole("region", {
      name: "Tinder Swiper live preview",
    });
    expect(
      within(livePreview).getByRole("heading", { name: "Alex, 24" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));

    expect(editor).not.toHaveAttribute("aria-invalid");
    expect(editor.value).toContain('"name": "Jennifer"');
    expect(
      within(livePreview).getByRole("heading", { name: "Jennifer, 24" }),
    ).toBeInTheDocument();
  });

  it("keeps the complete copyable TSX in a separate Usage tab", async () => {
    render(<TinderDemoPage />);
    fireEvent.click(screen.getByRole("tab", { name: "Usage" }));

    const usage = await screen.findByRole("region", {
      name: "TSX source code",
    });
    expect(usage).toHaveTextContent(
      'import { SAMPLE_CARDS } from "@/mocks/tinderSwiperData"',
    );
    expect(usage).toHaveTextContent("export default function TinderExample()");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});
