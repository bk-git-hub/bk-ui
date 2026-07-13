import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ComponentViewer from "./component-viewer";

describe("ComponentViewer", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("loads the syntax-highlighted code view on demand", async () => {
    const { container } = render(
      <ComponentViewer
        title="Example"
        description="Example component"
        usageCode="const answer = 42;"
        component={<div>Preview content</div>}
      />,
    );

    expect(screen.getByText("Preview content")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Preview" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    fireEvent.click(screen.getByRole("tab", { name: "Code" }));

    await waitFor(() => {
      expect(container.querySelector("code")).toHaveTextContent(
        "const answer = 42;",
      );
    });

    expect(screen.getByRole("tab", { name: "Code" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      screen.getByRole("region", { name: "TSX source code" }),
    ).toBeInTheDocument();
  });

  it("copies trimmed source code from the fixed toolbar", async () => {
    render(
      <ComponentViewer
        title="Example"
        description="Example component"
        usageCode="  const answer = 42;  "
        component={<div>Preview content</div>}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Code" }));
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "const answer = 42;",
    );
    expect(screen.getByText("Copied!")).toBeInTheDocument();
  });
});
