import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ComponentInstallGuide, {
  type ComponentInstallDescriptor,
} from "./component-install-guide";

const sourceHash = "1".repeat(64);
const registryHash = "2".repeat(64);
const reactZipHash = "3".repeat(64);
const nextZipHash = "4".repeat(64);
const aiHash = "5".repeat(64);
const sourceCommit = "a".repeat(40);
const npmCommand = `npx shadcn@latest add owner/repo/demo#${sourceCommit}`;
const pnpmCommand = `pnpm dlx shadcn@latest add owner/repo/demo#${sourceCommit}`;

function descriptor(
  overrides: Partial<ComponentInstallDescriptor> = {},
): ComponentInstallDescriptor {
  return {
    schemaVersion: 1,
    name: "demo",
    title: "Demo Slider",
    componentVersion: "1.2.3",
    sourceCommit,
    status: "release-blocked",
    statusMessage: "License and remote release checks are still pending.",
    defaultVariantId: "tailwind-4",
    constraints: {
      ssr: ["Use deterministic initial props."],
      accessibility: ["Keep keyboard controls and visible focus styles."],
    },
    variants: [
      {
        id: "tailwind-3",
        label: "Tailwind 3",
        tailwindMajor: 3,
        range: ">=3.4 <4",
        tested: "3.4.17",
        dependencies: ["clsx@^2.1.1", "tailwind-merge@2.6.0"],
        notes: ["Scan the copied component source."],
        commands: {
          npm: `npx shadcn@latest add owner/repo/demo-tailwind-v3#${sourceCommit}`,
          pnpm: `pnpm dlx shadcn@latest add owner/repo/demo-tailwind-v3#${sourceCommit}`,
        },
        resources: [
          {
            kind: "source",
            label: "Canonical source",
            repositoryPath: "src/components/Demo/index.tsx",
            sha256: sourceHash,
          },
          {
            kind: "registry",
            label: "Tailwind 3 Registry JSON",
            repositoryPath: "public/r/demo-tailwind-v3.json",
            sha256: registryHash,
            url: "http://example.com/demo-tailwind-v3.json",
          },
          {
            kind: "zip",
            label: "React/Vite source ZIP",
            repositoryPath: "public/downloads/demo-react.zip",
            sha256: reactZipHash,
            framework: "react",
          },
          {
            kind: "zip",
            label: "Next.js App Router source ZIP",
            repositoryPath: "public/downloads/demo-next.zip",
            sha256: nextZipHash,
            framework: "nextjs",
          },
        ],
      },
      {
        id: "tailwind-4",
        label: "Tailwind 4",
        tailwindMajor: 4,
        range: ">=4 <5",
        tested: "4.3.2",
        dependencies: ["clsx@^2.1.1", "tailwind-merge@^3.6.0"],
        notes: ["Add an exact @source rule when copying outside app source."],
        commands: {
          npm: npmCommand,
          pnpm: pnpmCommand,
        },
        resources: [
          {
            kind: "source",
            label: "Canonical source",
            repositoryPath: "src/components/Demo/index.tsx",
            sha256: sourceHash,
          },
          {
            kind: "registry",
            label: "Tailwind 4 Registry JSON",
            repositoryPath: "public/r/demo.json",
            sha256: registryHash,
            url: "https://example.com/public/r/demo.json",
          },
          {
            kind: "zip",
            label: "React/Vite source ZIP",
            repositoryPath: "public/downloads/demo-react.zip",
            sha256: reactZipHash,
            framework: "react",
            url: "https://example.com/public/downloads/demo-react.zip",
          },
          {
            kind: "zip",
            label: "Next.js App Router source ZIP",
            repositoryPath: "public/downloads/demo-next.zip",
            sha256: nextZipHash,
            framework: "nextjs",
            url: "https://example.com/public/downloads/demo-next.zip",
          },
          {
            kind: "copy-for-ai",
            label: "Copy for AI",
            repositoryPath: "public/ai/demo.md",
            sha256: aiHash,
            url: "https://example.com/public/ai/<SHA>/demo.md",
          },
        ],
      },
    ],
    ...overrides,
  };
}

describe("ComponentInstallGuide", () => {
  let originalClipboard: PropertyDescriptor | undefined;
  const writeText = vi.fn<Clipboard["writeText"]>();

  beforeEach(() => {
    originalClipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard");
    writeText.mockReset();
    writeText.mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
  });

  afterEach(() => {
    if (originalClipboard) {
      Object.defineProperty(navigator, "clipboard", originalClipboard);
    } else {
      Reflect.deleteProperty(navigator, "clipboard");
    }
    vi.useRealTimers();
  });

  it("selects variants with a native control and updates exact requirements", () => {
    render(
      <ComponentInstallGuide descriptor={descriptor()} framework="react" />,
    );

    const select = screen.getByRole("combobox", { name: "Tailwind variant" });
    expect(select).toHaveValue("tailwind-4");
    expect(screen.getByText(">=4 <5")).toBeInTheDocument();
    expect(screen.getByText("4.3.2")).toBeInTheDocument();
    expect(screen.getByText("tailwind-merge@^3.6.0")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Add an exact @source rule when copying outside app source.",
      ),
    ).toBeInTheDocument();

    fireEvent.change(select, { target: { value: "tailwind-3" } });

    expect(select).toHaveValue("tailwind-3");
    expect(screen.getByText(">=3.4 <4")).toBeInTheDocument();
    expect(screen.getByText("3.4.17")).toBeInTheDocument();
    expect(screen.getByText("tailwind-merge@2.6.0")).toBeInTheDocument();
    expect(screen.queryByText("tailwind-merge@^3.6.0")).not.toBeInTheDocument();
  });

  it("filters resources by framework and links only exact HTTPS URLs", () => {
    const installDescriptor = descriptor();
    const { rerender } = render(
      <ComponentInstallGuide
        descriptor={installDescriptor}
        framework="react"
      />,
    );

    expect(screen.getByText("React/Vite source ZIP")).toBeInTheDocument();
    expect(
      screen.queryByText("Next.js App Router source ZIP"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Canonical source")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Tailwind 4 Registry JSON" }),
    ).toHaveAttribute("href", "https://example.com/public/r/demo.json");
    expect(
      screen.getByRole("link", { name: "React/Vite source ZIP" }),
    ).not.toHaveAttribute("target");
    expect(screen.getByText("Copy for AI").closest("a")).toBeNull();
    expect(screen.getByText(reactZipHash)).toBeInTheDocument();
    expect(
      screen.getByText("public/downloads/demo-react.zip"),
    ).toBeInTheDocument();

    rerender(
      <ComponentInstallGuide
        descriptor={installDescriptor}
        framework="nextjs"
      />,
    );

    expect(
      screen.getByText("Next.js App Router source ZIP"),
    ).toBeInTheDocument();
    expect(screen.queryByText("React/Vite source ZIP")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Next.js App Router source ZIP" }),
    ).toHaveAttribute(
      "href",
      "https://example.com/public/downloads/demo-next.zip",
    );
  });

  it("keeps install copies disabled and hides unverified commands while blocked", () => {
    render(
      <ComponentInstallGuide descriptor={descriptor()} framework="react" />,
    );

    expect(screen.getByText(/Release blocked\./)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy npm" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Copy pnpm" })).toBeDisabled();
    expect(screen.queryByText(npmCommand)).not.toBeInTheDocument();
    expect(
      screen.getAllByText("Exact command unavailable until publication."),
    ).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: "Copy npm" }),
    ).toHaveAccessibleDescription(
      "Exact command unavailable until publication.",
    );

    fireEvent.click(screen.getByRole("button", { name: "Copy npm" }));
    expect(writeText).not.toHaveBeenCalled();
  });

  it("copies only exact published commands and reports success and failure independently", async () => {
    writeText.mockImplementation((command: string) =>
      command.startsWith("npx")
        ? Promise.resolve(undefined)
        : Promise.reject(new Error("Permission denied")),
    );
    render(
      <ComponentInstallGuide
        descriptor={descriptor({
          status: "published",
          statusMessage: "Full-SHA remote checks passed.",
        })}
        framework="react"
      />,
    );

    expect(screen.getByText(npmCommand)).toBeInTheDocument();
    expect(screen.getByText(pnpmCommand)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Copy npm" }));
    await waitFor(() => {
      expect(screen.getByText("npm command copied.")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Copy pnpm" }));
    await waitFor(() => {
      expect(
        screen.getByText("Could not copy pnpm command."),
      ).toBeInTheDocument();
    });

    expect(screen.getByText("npm command copied.")).toBeInTheDocument();
    expect(writeText).toHaveBeenNthCalledWith(1, npmCommand);
    expect(writeText).toHaveBeenNthCalledWith(2, pnpmCommand);
  });

  it("does not enable a published command that still contains a placeholder", () => {
    const withPlaceholder = descriptor();
    const variants = withPlaceholder.variants.map((variant) =>
      variant.id === "tailwind-4"
        ? {
            ...variant,
            commands: {
              npm: "npx shadcn@latest add owner/repo/demo#<FULL_SHA>",
            },
          }
        : variant,
    );
    render(
      <ComponentInstallGuide
        descriptor={{
          ...withPlaceholder,
          status: "published",
          statusMessage: "Remote checks passed.",
          variants,
        }}
        framework="react"
      />,
    );

    expect(screen.getByRole("button", { name: "Copy npm" })).toBeDisabled();
    expect(
      screen.queryByText("npx shadcn@latest add owner/repo/demo#<FULL_SHA>"),
    ).not.toBeInTheDocument();
  });

  it("clears clipboard feedback after its announcement window", async () => {
    vi.useFakeTimers();
    render(
      <ComponentInstallGuide
        descriptor={descriptor({
          status: "published",
          statusMessage: "Full-SHA remote checks passed.",
        })}
        framework="react"
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy npm" }));
      await Promise.resolve();
    });
    expect(screen.getByText("npm command copied.")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(2_000));
    expect(screen.queryByText("npm command copied.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy npm" })).toBeEnabled();
  });

  it("resets the selected variant when a new descriptor is rendered", async () => {
    const firstDescriptor = descriptor();
    const { rerender } = render(
      <ComponentInstallGuide descriptor={firstDescriptor} framework="react" />,
    );
    const select = screen.getByRole("combobox", { name: "Tailwind variant" });

    fireEvent.change(select, { target: { value: "tailwind-3" } });
    expect(select).toHaveValue("tailwind-3");

    rerender(
      <ComponentInstallGuide
        descriptor={descriptor({
          name: "second-demo",
          title: "Second Demo",
          sourceCommit: "b".repeat(40),
          defaultVariantId: "tailwind-4",
        })}
        framework="react"
      />,
    );

    await waitFor(() => expect(select).toHaveValue("tailwind-4"));
    expect(
      screen.getByRole("heading", { name: "Install Second Demo" }),
    ).toBeInTheDocument();
  });

  it("exposes labelled controls, live regions, constraints, and section props", () => {
    render(
      <ComponentInstallGuide
        descriptor={descriptor()}
        framework="nextjs"
        id="demo-install"
        className="custom-install-class"
        data-purpose="installation"
      />,
    );

    const guide = screen.getByRole("region", {
      name: "Install Demo Slider",
    });
    expect(guide).toHaveAttribute("id", "demo-install");
    expect(guide).toHaveAttribute("data-purpose", "installation");
    expect(guide).toHaveClass("custom-install-class");
    expect(
      within(guide).getByRole("combobox", { name: "Tailwind variant" }),
    ).toHaveAccessibleName("Tailwind variant");
    expect(
      within(guide).getByText("Use deterministic initial props."),
    ).toBeInTheDocument();
    expect(
      within(guide).getByText(
        "Keep keyboard controls and visible focus styles.",
      ),
    ).toBeInTheDocument();
    expect(
      within(guide).getByText(/License and remote release checks/),
    ).toHaveAttribute("aria-live", "polite");
    expect(
      within(guide).getByRole("button", { name: "Copy npm" }),
    ).toHaveAccessibleDescription(
      "Exact command unavailable until publication.",
    );
  });
});
