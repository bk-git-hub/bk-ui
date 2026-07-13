import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ComponentViewer from "./component-viewer";

describe("ComponentViewer", () => {
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

    fireEvent.click(screen.getByRole("button", { name: "Code" }));

    await waitFor(() => {
      expect(container.querySelector("code")).toHaveTextContent(
        "const answer = 42;",
      );
    });
  });
});
