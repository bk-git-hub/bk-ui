import { useState } from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentInstallDescriptor } from "./component-install-guide";
import ComponentViewer from "./component-viewer";

vi.mock("./tsx-syntax-highlighter", () => ({
  default: ({ code }: { code: string }) => (
    <pre data-testid="syntax-highlighter">
      <code>{code}</code>
    </pre>
  ),
}));

const reactExport = {
  code: "export function ReactExample() { return <div />; }",
  language: "React TSX",
  description: "Copy this into a React application.",
};

const nextJsExport = {
  code: '"use client";\nexport function NextExample() { return <div />; }',
  language: "Next.js TSX",
  description: "Keep this inside a Next.js client boundary.",
};

const componentSourceLinks = [
  ["Tinder Swiper", "src/components/Tinder"],
  ["Coverflow", "src/components/Coverflow"],
  ["ReactPod", "src/components/ReactPod"],
  ["Lotto Draw", "src/components/Lotto"],
  ["Slot Machine", "src/components/SlotMachine"],
  ["Baccarat Squeeze", "src/components/Baccarat"],
  ["Cards Stack Slider", "src/components/CardsStackSlider"],
  ["Shader Slider", "src/components/ShaderSlider"],
  ["Slicer Slider", "src/components/SlicerSlider"],
  ["Shutter Slider", "src/components/ShutterSlider"],
  ["Story Slider", "src/components/StorySlider"],
  ["Expo Slider", "src/components/ExpoSlider"],
] as const;

const installDescriptor: ComponentInstallDescriptor = {
  schemaVersion: 1,
  name: "example",
  title: "Example",
  componentVersion: "1.0.0",
  sourceCommit: "a".repeat(40),
  status: "release-blocked",
  statusMessage: "License and remote validation are pending.",
  defaultVariantId: "tailwind-4",
  constraints: {
    ssr: ["Use deterministic initial props."],
    accessibility: ["Keep keyboard controls."],
  },
  variants: [
    {
      id: "tailwind-4",
      label: "Tailwind 4",
      tailwindMajor: 4,
      range: ">=4 <5",
      tested: "4.3.2",
      dependencies: ["clsx@^2.1.1"],
      notes: ["Keep the copied source in a scanned directory."],
      resources: [
        {
          kind: "zip",
          label: "React/Vite source ZIP",
          repositoryPath: "public/downloads/example-react.zip",
          sha256: "1".repeat(64),
          framework: "react",
        },
        {
          kind: "zip",
          label: "Next.js App Router source ZIP",
          repositoryPath: "public/downloads/example-next.zip",
          sha256: "2".repeat(64),
          framework: "nextjs",
        },
      ],
    },
  ],
};

describe("ComponentViewer", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("loads the syntax-highlighted code view on demand", async () => {
    render(
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

    expect(await screen.findByTestId("syntax-highlighter")).toHaveTextContent(
      "const answer = 42;",
    );

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

  it("applies opt-in surface classes to both preview containers", () => {
    render(
      <ComponentViewer
        title="Dark preview"
        description="Custom preview surface"
        usageCode="{}"
        component={<div>Preview content</div>}
        codeLanguage="LIVE JSON"
        onUsageCodeChange={() => undefined}
        showPreviewAlongsideCode
        previewClassName="overflow-hidden bg-black p-0"
      />,
    );

    const previewTab = screen.getByRole("tab", { name: "Preview" });
    const previewPanel = document.getElementById(
      previewTab.getAttribute("aria-controls")!,
    );
    expect(previewPanel).toHaveClass("overflow-hidden", "bg-black", "p-0");
    expect(previewPanel).not.toHaveClass("overflow-auto", "p-2");

    fireEvent.click(screen.getByRole("tab", { name: "Code" }));
    const livePreview = screen.getByRole("region", {
      name: "Dark preview live preview",
    });
    expect(livePreview).toHaveClass("overflow-hidden", "bg-black", "p-0");
    expect(livePreview).not.toHaveClass("overflow-auto", "bg-white", "p-2");
  });

  it("orders optional tabs and keeps every tab connected to its panel", () => {
    render(
      <ComponentViewer
        title="Complete example"
        description="All tabs"
        usageCode="const code = true;"
        component={<div>Preview content</div>}
        referenceCode="export function Usage() {}"
        reactExport={reactExport}
        nextJsExport={nextJsExport}
      />,
    );

    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      "Preview",
      "Code",
      "Usage",
      "React Export",
      "Next.js Export",
    ]);
    expect(screen.getAllByRole("tabpanel", { hidden: true })).toHaveLength(5);

    tabs.forEach((tab, index) => {
      const panelId = tab.getAttribute("aria-controls");
      const panel = panelId ? document.getElementById(panelId) : null;

      expect(panel).not.toBeNull();
      expect(panel).toHaveAttribute("role", "tabpanel");
      expect(panel).toHaveAttribute("aria-labelledby", tab.id);
      expect(tab).toHaveAttribute(
        "aria-selected",
        index === 0 ? "true" : "false",
      );
      expect(tab).toHaveAttribute("tabindex", index === 0 ? "0" : "-1");
      if (index === 0) {
        expect(panel).not.toHaveAttribute("hidden");
      } else {
        expect(panel).toHaveAttribute("hidden");
      }
    });
  });

  it("hides export tabs behind the release flag and keeps the GitHub source link", () => {
    render(
      <ComponentViewer
        title="Tinder Swiper"
        description="Release-ready tabs"
        usageCode="const code = true;"
        component={<div>Preview content</div>}
        referenceCode="export function Usage() {}"
        reactExport={reactExport}
        nextJsExport={nextJsExport}
        showExportTabs={false}
      />,
    );

    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "Preview",
      "Code",
      "Usage",
    ]);
    expect(
      screen.queryByRole("tab", { name: "React Export" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("tab", { name: "Next.js Export" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Tinder Swiper source on GitHub" }),
    ).toHaveAttribute(
      "href",
      "https://github.com/bk-git-hub/bk-ui/tree/main/src/components/Tinder",
    );
    expect(
      screen.getByText(
        "Explore the interactive preview, inspect the code and usage, or view Tinder Swiper on GitHub.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("Release-ready tabs")).not.toBeInTheDocument();
  });

  it.each(componentSourceLinks)(
    "links %s to its component source directory",
    (title, sourceDirectory) => {
      render(
        <ComponentViewer
          title={title}
          description="Component description"
          usageCode="const code = true;"
          component={<div>Preview content</div>}
          showExportTabs={false}
        />,
      );

      expect(
        screen.getByRole("link", { name: `${title} source on GitHub` }),
      ).toHaveAttribute(
        "href",
        `https://github.com/bk-git-hub/bk-ui/tree/main/${sourceDirectory}`,
      );
    },
  );

  it("moves, wraps, activates, and focuses tabs with the keyboard", () => {
    render(
      <ComponentViewer
        title="Keyboard example"
        description="All tabs"
        usageCode="const code = true;"
        component={<div>Preview content</div>}
        referenceCode="export function Usage() {}"
        reactExport={reactExport}
        nextJsExport={nextJsExport}
      />,
    );

    const previewTab = screen.getByRole("tab", { name: "Preview" });
    const nextJsTab = screen.getByRole("tab", { name: "Next.js Export" });

    previewTab.focus();
    fireEvent.keyDown(previewTab, { key: "ArrowLeft" });
    expect(nextJsTab).toHaveFocus();
    expect(nextJsTab).toHaveAttribute("aria-selected", "true");
    expect(nextJsTab).toHaveAttribute("tabindex", "0");

    fireEvent.keyDown(nextJsTab, { key: "ArrowRight" });
    expect(previewTab).toHaveFocus();
    expect(previewTab).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(previewTab, { key: "End" });
    expect(nextJsTab).toHaveFocus();
    expect(nextJsTab).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(nextJsTab, { key: "Home" });
    expect(previewTab).toHaveFocus();
    expect(previewTab).toHaveAttribute("aria-selected", "true");
  });

  it("shows only optional source tabs that receive content", () => {
    render(
      <ComponentViewer
        title="Minimal example"
        description="Required tabs only"
        usageCode="const code = true;"
        component={<div>Preview content</div>}
        reactExport={reactExport}
      />,
    );

    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "Preview",
      "Code",
      "React Export",
    ]);
    expect(
      screen.queryByRole("tab", { name: "Usage" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("tab", { name: "Next.js Export" }),
    ).not.toBeInTheDocument();
  });

  it("highlights and copies each export independently", async () => {
    render(
      <ComponentViewer
        title="Export example"
        description="Export tabs"
        usageCode="const code = true;"
        component={<div>Preview content</div>}
        reactExport={reactExport}
        nextJsExport={nextJsExport}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "React Export" }));
    expect(await screen.findByTestId("syntax-highlighter")).toHaveTextContent(
      "export function ReactExample()",
    );
    expect(screen.getByRole("note")).toHaveTextContent(
      "Copy this into a React application.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith(
      reactExport.code,
    );
    expect(screen.getByRole("button", { name: "Copied!" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Next.js Export" }));
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
    expect(await screen.findByTestId("syntax-highlighter")).toHaveTextContent(
      '"use client"',
    );
    expect(screen.getByRole("note")).toHaveTextContent(
      "Keep this inside a Next.js client boundary.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith(
      nextJsExport.code,
    );
  });

  it("embeds framework-specific install guidance without adding a tab", async () => {
    render(
      <ComponentViewer
        title="Install example"
        description="Install details"
        usageCode="const code = true;"
        component={<div>Preview content</div>}
        referenceCode="export function Usage() {}"
        reactExport={reactExport}
        nextJsExport={nextJsExport}
        installDescriptor={installDescriptor}
      />,
    );

    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "Preview",
      "Code",
      "Usage",
      "React Export",
      "Next.js Export",
    ]);
    expect(
      screen.queryByRole("tab", { name: /install/i }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Code" }));
    expect(
      screen.queryByRole("heading", { name: "Install Example" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "React Export" }));
    expect(
      await screen.findByRole(
        "heading",
        { name: "Install Example" },
        { timeout: 5_000 },
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("React/Vite installation")).toBeInTheDocument();
    expect(screen.getByText("React/Vite source ZIP")).toBeInTheDocument();
    expect(
      screen.queryByText("Next.js App Router source ZIP"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "React TSX source code" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Next.js Export" }));
    expect(
      await screen.findByText(
        "Next.js App Router installation",
        {},
        { timeout: 5_000 },
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Next.js App Router source ZIP"),
    ).toBeInTheDocument();
    expect(screen.queryByText("React/Vite source ZIP")).not.toBeInTheDocument();
  });

  it("returns to Preview when the active optional tab is removed", async () => {
    const baseProps = {
      title: "Changing example",
      description: "Optional tabs can change",
      usageCode: "const code = true;",
      component: <div>Preview content</div>,
    };
    const { rerender } = render(
      <ComponentViewer {...baseProps} nextJsExport={nextJsExport} />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Next.js Export" }));
    expect(screen.getByRole("tab", { name: "Next.js Export" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    rerender(<ComponentViewer {...baseProps} />);

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "Preview" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });
    expect(screen.getByText("Preview content")).toBeInTheDocument();
  });
});
