import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
} from "react";
import { twMerge } from "tailwind-merge";

export type ComponentInstallStatus =
  | "release-blocked"
  | "local-verified"
  | "published";

export type ComponentInstallFramework = "react" | "nextjs";

export type ComponentInstallPackageManager = "npm" | "pnpm";

export type ComponentInstallResourceKind =
  | "source"
  | "registry"
  | "zip"
  | "copy-for-ai";

export interface ComponentInstallConstraints {
  ssr: readonly string[];
  accessibility: readonly string[];
}

export interface ComponentInstallResource {
  kind: ComponentInstallResourceKind;
  label: string;
  repositoryPath: string;
  sha256: string;
  framework?: ComponentInstallFramework;
  /** An exact, canonical HTTPS URL. Placeholder or relative URLs are ignored. */
  url?: string;
}

export interface ComponentInstallVariant {
  id: string;
  label: string;
  tailwindMajor: 3 | 4;
  range: string;
  tested: string;
  dependencies: readonly string[];
  notes: readonly string[];
  resources: readonly ComponentInstallResource[];
  /** Present only on a published descriptor after its remote smoke test passes. */
  commands?: Partial<Record<ComponentInstallPackageManager, string>>;
}

export interface ComponentInstallDescriptor {
  schemaVersion: 1;
  name: string;
  title: string;
  componentVersion: string;
  sourceCommit: string;
  status: ComponentInstallStatus;
  statusMessage: string;
  defaultVariantId: string;
  constraints: ComponentInstallConstraints;
  variants: readonly ComponentInstallVariant[];
}

export interface ComponentInstallGuideProps
  extends Omit<ComponentPropsWithoutRef<"section">, "children"> {
  descriptor: ComponentInstallDescriptor;
  framework: ComponentInstallFramework;
}

type CopyStatus = "idle" | "copying" | "copied" | "error";

const packageManagers = ["npm", "pnpm"] as const;

const statusLabels: Record<ComponentInstallStatus, string> = {
  "release-blocked": "Release blocked",
  "local-verified": "Locally verified",
  published: "Published",
};

const statusClasses: Record<ComponentInstallStatus, string> = {
  "release-blocked": "border-amber-400/40 bg-amber-400/10 text-amber-200",
  "local-verified": "border-sky-400/40 bg-sky-400/10 text-sky-200",
  published: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
};

function defaultVariantId(descriptor: ComponentInstallDescriptor) {
  return descriptor.variants.some(
    (variant) => variant.id === descriptor.defaultVariantId,
  )
    ? descriptor.defaultVariantId
    : (descriptor.variants[0]?.id ?? "");
}

function hasPlaceholder(value: string) {
  return ["<", ">", "{", "}", "[", "]"].some((token) => value.includes(token));
}

function exactHttpsUrl(value: string | undefined) {
  if (value === undefined || value.trim() !== value || hasPlaceholder(value)) {
    return undefined;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.href === value ? value : undefined;
  } catch {
    return undefined;
  }
}

function exactPublishedCommand(
  descriptor: ComponentInstallDescriptor,
  variant: ComponentInstallVariant | undefined,
  manager: ComponentInstallPackageManager,
) {
  if (descriptor.status !== "published") return undefined;

  const command = variant?.commands?.[manager];
  if (
    command === undefined ||
    command.length === 0 ||
    command.trim() !== command ||
    hasPlaceholder(command)
  ) {
    return undefined;
  }

  return command;
}

function frameworkLabel(framework: ComponentInstallFramework) {
  return framework === "nextjs" ? "Next.js App Router" : "React/Vite";
}

export default function ComponentInstallGuide({
  descriptor,
  framework,
  className,
  ...sectionProps
}: ComponentInstallGuideProps) {
  const headingId = useId();
  const variantSelectId = useId();
  const [selectedVariantId, setSelectedVariantId] = useState(() =>
    defaultVariantId(descriptor),
  );
  const [copyStatuses, setCopyStatuses] = useState<
    Record<ComponentInstallPackageManager, CopyStatus>
  >({ npm: "idle", pnpm: "idle" });
  const feedbackTimeouts = useRef<
    Partial<
      Record<ComponentInstallPackageManager, ReturnType<typeof setTimeout>>
    >
  >({});
  const copyRequests = useRef<Record<ComponentInstallPackageManager, number>>({
    npm: 0,
    pnpm: 0,
  });

  const descriptorSelectionKey = `${descriptor.name}:${descriptor.componentVersion}:${descriptor.sourceCommit}:${descriptor.status}:${descriptor.defaultVariantId}:${descriptor.variants
    .map((variant) => variant.id)
    .join(",")}`;
  const resolvedDefaultVariantId = defaultVariantId(descriptor);
  const selectedVariant =
    descriptor.variants.find((variant) => variant.id === selectedVariantId) ??
    descriptor.variants.find(
      (variant) => variant.id === resolvedDefaultVariantId,
    );
  const visibleResources = useMemo(
    () =>
      selectedVariant?.resources.filter(
        (resource) =>
          resource.framework === undefined || resource.framework === framework,
      ) ?? [],
    [framework, selectedVariant],
  );

  const resetCopyFeedback = useCallback(() => {
    for (const manager of packageManagers) {
      const timeout = feedbackTimeouts.current[manager];
      if (timeout !== undefined) clearTimeout(timeout);
      delete feedbackTimeouts.current[manager];
      copyRequests.current[manager] += 1;
    }
    setCopyStatuses({ npm: "idle", pnpm: "idle" });
  }, []);

  useEffect(() => {
    setSelectedVariantId(resolvedDefaultVariantId);
    resetCopyFeedback();
    // The serialized descriptor identity deliberately resets local selections.
  }, [descriptorSelectionKey, resetCopyFeedback, resolvedDefaultVariantId]);

  useEffect(
    () => () => {
      for (const manager of packageManagers) {
        const timeout = feedbackTimeouts.current[manager];
        if (timeout !== undefined) clearTimeout(timeout);
        copyRequests.current[manager] += 1;
      }
    },
    [],
  );

  const selectVariant = (variantId: string) => {
    setSelectedVariantId(variantId);
    resetCopyFeedback();
  };

  const scheduleFeedbackReset = (
    manager: ComponentInstallPackageManager,
    request: number,
  ) => {
    feedbackTimeouts.current[manager] = setTimeout(() => {
      if (copyRequests.current[manager] !== request) return;
      setCopyStatuses((current) => ({ ...current, [manager]: "idle" }));
      delete feedbackTimeouts.current[manager];
    }, 2_000);
  };

  const copyCommand = async (
    manager: ComponentInstallPackageManager,
    command: string,
  ) => {
    const timeout = feedbackTimeouts.current[manager];
    if (timeout !== undefined) clearTimeout(timeout);
    delete feedbackTimeouts.current[manager];

    const request = copyRequests.current[manager] + 1;
    copyRequests.current[manager] = request;
    setCopyStatuses((current) => ({ ...current, [manager]: "copying" }));

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }
      await navigator.clipboard.writeText(command);
      if (copyRequests.current[manager] !== request) return;

      setCopyStatuses((current) => ({ ...current, [manager]: "copied" }));
      scheduleFeedbackReset(manager, request);
    } catch {
      if (copyRequests.current[manager] !== request) return;
      setCopyStatuses((current) => ({ ...current, [manager]: "error" }));
      scheduleFeedbackReset(manager, request);
    }
  };

  return (
    <section
      {...sectionProps}
      aria-labelledby={headingId}
      className={twMerge(
        "rounded-xl border border-slate-700 bg-slate-950 text-slate-100",
        className,
      )}
    >
      <div className="border-b border-slate-700 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-widest text-sky-300 uppercase">
              {frameworkLabel(framework)} installation
            </p>
            <h2 id={headingId} className="mt-1 text-xl font-bold text-white">
              Install {descriptor.title}
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Version {descriptor.componentVersion} · source commit{" "}
              <code className="break-all text-slate-300">
                {descriptor.sourceCommit}
              </code>
            </p>
          </div>

          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className={`max-w-xl rounded-lg border px-3 py-2 text-sm ${statusClasses[descriptor.status]}`}
          >
            <span className="font-semibold">
              {statusLabels[descriptor.status]}.
            </span>{" "}
            {descriptor.statusMessage}
          </div>
        </div>

        <label
          htmlFor={variantSelectId}
          className="mt-5 block text-sm font-semibold text-slate-200"
        >
          Tailwind variant
        </label>
        <select
          id={variantSelectId}
          value={selectedVariant?.id ?? ""}
          disabled={descriptor.variants.length === 0}
          onChange={(event) => selectVariant(event.currentTarget.value)}
          className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-sky-400 sm:max-w-sm"
        >
          {descriptor.variants.map((variant) => (
            <option key={variant.id} value={variant.id}>
              {variant.label}
            </option>
          ))}
        </select>
      </div>

      {selectedVariant ? (
        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-2">
          <div className="space-y-6">
            <section aria-labelledby={`${variantSelectId}-requirements`}>
              <h3
                id={`${variantSelectId}-requirements`}
                className="text-base font-bold text-white"
              >
                Tailwind {selectedVariant.tailwindMajor} requirements
              </h3>
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <div className="rounded-lg bg-slate-900 p-3">
                  <dt className="text-slate-400">Supported range</dt>
                  <dd className="mt-1 font-mono text-slate-100">
                    {selectedVariant.range}
                  </dd>
                </div>
                <div className="rounded-lg bg-slate-900 p-3">
                  <dt className="text-slate-400">Fixture tested</dt>
                  <dd className="mt-1 font-mono text-slate-100">
                    {selectedVariant.tested}
                  </dd>
                </div>
              </dl>

              <h4 className="mt-4 text-sm font-semibold text-slate-200">
                Dependencies
              </h4>
              {selectedVariant.dependencies.length > 0 ? (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {selectedVariant.dependencies.map((dependency) => (
                    <li
                      key={dependency}
                      className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-xs text-slate-200"
                    >
                      {dependency}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-400">
                  No additional runtime dependencies.
                </p>
              )}

              <h4 className="mt-4 text-sm font-semibold text-slate-200">
                Integration notes
              </h4>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-300">
                {selectedVariant.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </section>

            <section aria-labelledby={`${variantSelectId}-constraints`}>
              <h3
                id={`${variantSelectId}-constraints`}
                className="text-base font-bold text-white"
              >
                Consumer constraints
              </h3>
              <h4 className="mt-3 text-sm font-semibold text-slate-200">
                SSR and hydration
              </h4>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-300">
                {descriptor.constraints.ssr.map((constraint) => (
                  <li key={constraint}>{constraint}</li>
                ))}
              </ul>
              <h4 className="mt-4 text-sm font-semibold text-slate-200">
                Accessibility
              </h4>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-300">
                {descriptor.constraints.accessibility.map((constraint) => (
                  <li key={constraint}>{constraint}</li>
                ))}
              </ul>
            </section>
          </div>

          <div className="space-y-6">
            <section aria-labelledby={`${variantSelectId}-commands`}>
              <h3
                id={`${variantSelectId}-commands`}
                className="text-base font-bold text-white"
              >
                Install commands
              </h3>
              <div className="mt-3 space-y-3">
                {packageManagers.map((manager) => {
                  const command = exactPublishedCommand(
                    descriptor,
                    selectedVariant,
                    manager,
                  );
                  const copyStatus = copyStatuses[manager];
                  const statusId = `${variantSelectId}-${manager}-copy-status`;
                  const availabilityId = `${variantSelectId}-${manager}-availability`;
                  const managerName = manager === "npm" ? "npm" : "pnpm";

                  return (
                    <div
                      key={manager}
                      className="rounded-lg border border-slate-700 bg-slate-900 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                            {managerName}
                          </p>
                          {command ? (
                            <code className="mt-1 block text-sm break-all text-slate-100">
                              {command}
                            </code>
                          ) : (
                            <p
                              id={availabilityId}
                              className="mt-1 text-sm text-slate-400"
                            >
                              Exact command unavailable until publication.
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          disabled={!command || copyStatus === "copying"}
                          aria-describedby={command ? statusId : availabilityId}
                          onClick={() => {
                            if (command) void copyCommand(manager, command);
                          }}
                          className="shrink-0 rounded-md border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:border-slate-500 hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {copyStatus === "copying"
                            ? "Copying…"
                            : `Copy ${managerName}`}
                        </button>
                      </div>
                      <p
                        id={statusId}
                        role="status"
                        aria-live="polite"
                        aria-atomic="true"
                        className={
                          copyStatus === "error"
                            ? "mt-2 text-xs text-red-300"
                            : copyStatus === "copied"
                              ? "mt-2 text-xs text-emerald-300"
                              : "sr-only"
                        }
                      >
                        {copyStatus === "copied"
                          ? `${managerName} command copied.`
                          : copyStatus === "error"
                            ? `Could not copy ${managerName} command.`
                            : ""}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            <section aria-labelledby={`${variantSelectId}-resources`}>
              <h3
                id={`${variantSelectId}-resources`}
                className="text-base font-bold text-white"
              >
                {frameworkLabel(framework)} resources
              </h3>
              <ul className="mt-3 space-y-3">
                {visibleResources.map((resource) => {
                  const url = exactHttpsUrl(resource.url);
                  return (
                    <li
                      key={`${resource.kind}:${resource.framework ?? "common"}:${resource.repositoryPath}`}
                      className="rounded-lg border border-slate-700 bg-slate-900 p-3"
                    >
                      <p className="font-semibold text-slate-100">
                        {url ? (
                          <a
                            href={url}
                            className="text-sky-300 underline decoration-sky-500/60 underline-offset-4 hover:text-sky-200 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none"
                          >
                            {resource.label}
                          </a>
                        ) : (
                          resource.label
                        )}
                      </p>
                      <dl className="mt-2 space-y-2 text-xs">
                        <div>
                          <dt className="text-slate-500">Repository path</dt>
                          <dd>
                            <code className="break-all text-slate-300">
                              {resource.repositoryPath}
                            </code>
                          </dd>
                        </div>
                        <div>
                          <dt className="text-slate-500">SHA-256</dt>
                          <dd>
                            <code className="break-all text-slate-300">
                              {resource.sha256}
                            </code>
                          </dd>
                        </div>
                      </dl>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        </div>
      ) : (
        <p className="p-5 text-sm text-amber-200 sm:p-6">
          No verified Tailwind variant is available.
        </p>
      )}
    </section>
  );
}
