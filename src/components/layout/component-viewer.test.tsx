import { useState } from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
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

  it("uses a controlled editor when a code change handler is provided", () => {
    const onUsageCodeChange = vi.fn();

    render(
      <ComponentViewer
        title="Editable example"
        description="Editable component"
        usageCode="const answer = 42;"
        component={<div>Preview content</div>}
        onUsageCodeChange={onUsageCodeChange}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Code" }));

    const editor = screen.getByRole("textbox", {
      name: "TSX source code editor",
    });
    expect(editor).toHaveValue("const answer = 42;");
    expect(screen.getByText("LIVE")).toBeInTheDocument();

    fireEvent.change(editor, {
      target: { value: "const answer = 43;" },
    });

    expect(onUsageCodeChange).toHaveBeenCalledOnce();
    expect(onUsageCodeChange).toHaveBeenCalledWith("const answer = 43;");
  });

  it("supports a custom language label, reset action, and live errors", () => {
    const onResetCode = vi.fn();

    render(
      <ComponentViewer
        title="Editable example"
        description="Editable component"
        usageCode="export default 42;"
        component={<div>Preview content</div>}
        codeLanguage="JavaScript"
        codeError="Unexpected token on line 1"
        onUsageCodeChange={vi.fn()}
        onResetCode={onResetCode}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Code" }));

    const editor = screen.getByRole("textbox", {
      name: "JavaScript source code editor",
    });
    const error = screen.getByText("Unexpected token on line 1");

    expect(editor).toHaveAttribute("aria-invalid", "true");
    expect(editor).toHaveAccessibleDescription("Unexpected token on line 1");
    expect(error).toHaveAttribute("aria-live", "polite");

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(onResetCode).toHaveBeenCalledOnce();
  });

  it("keeps editable configuration separate from copyable usage code", async () => {
    render(
      <ComponentViewer
        title="Editable example"
        description="Editable component"
        usageCode={'{\n  "answer": 42\n}'}
        component={<div>Preview content</div>}
        codeLanguage="LIVE JSON"
        onUsageCodeChange={vi.fn()}
        referenceCode={
          "\nexport default function Example() {\n  return <div />;\n}\n"
        }
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Code" }));

    expect(
      screen.getByRole("textbox", { name: "LIVE JSON source code editor" }),
    ).toHaveValue('{\n  "answer": 42\n}');
    expect(screen.getByText("LIVE")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Usage" }));

    const source = await screen.findByRole("region", {
      name: "TSX source code",
    });
    expect(source).toHaveTextContent("export default function Example()");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByText("LIVE")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "export default function Example() {\n  return <div />;\n}",
    );
  });

  it("can render an updating preview beside editable code", () => {
    function LiveExample() {
      const [code, setCode] = useState("Jennifer");

      return (
        <ComponentViewer
          title="Tinder example"
          description="Live component"
          usageCode={code}
          component={<div>{code}</div>}
          codeLanguage="LIVE JSON"
          onUsageCodeChange={setCode}
          showPreviewAlongsideCode
        />
      );
    }

    render(<LiveExample />);
    fireEvent.click(screen.getByRole("tab", { name: "Code" }));

    const livePreview = screen.getByRole("region", {
      name: "Tinder example live preview",
    });
    expect(within(livePreview).getByText("Jennifer")).toBeInTheDocument();

    fireEvent.change(
      screen.getByRole("textbox", { name: "LIVE JSON source code editor" }),
      { target: { value: "Alex" } },
    );

    expect(within(livePreview).getByText("Alex")).toBeInTheDocument();
  });
});
