import {
  lazy,
  Suspense,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import type { ComponentInstallDescriptor } from "./component-install-guide";

const loadSyntaxHighlighter = () => import("./tsx-syntax-highlighter");
const SyntaxHighlighter = lazy(loadSyntaxHighlighter);
const ComponentInstallGuide = lazy(() => import("./component-install-guide"));

const syntaxHighlighterStyle = {
  margin: 0,
  boxSizing: "border-box",
  width: "max-content",
  minWidth: "100%",
  backgroundColor: "transparent",
  minHeight: "100%",
  overflow: "visible",
  padding: "1.5rem",
  fontFamily:
    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  fontSize: "15px",
  lineHeight: "1.7",
  tabSize: 2,
} as const;

export interface ComponentViewerCodeTab {
  code: string;
  language?: string;
  description?: ReactNode;
}

export interface ComponentViewerProps {
  title: string;
  description: string;
  usageCode: string;
  component: ReactNode;
  referenceCode?: string;
  referenceCodeLanguage?: string;
  reactExport?: ComponentViewerCodeTab;
  nextJsExport?: ComponentViewerCodeTab;
  installDescriptor?: ComponentInstallDescriptor;
  showPreviewAlongsideCode?: boolean;
  // The base ESLint rule treats type-only callback parameters as runtime values.
  // eslint-disable-next-line no-unused-vars
  onUsageCodeChange?: (nextCode: string) => void;
  codeLanguage?: string;
  codeError?: string | null;
  onResetCode?: () => void;
}

type ComponentViewerTabId =
  | "preview"
  | "code"
  | "usage"
  | "react-export"
  | "nextjs-export";

interface ComponentViewerTabDefinition {
  id: ComponentViewerTabId;
  label: string;
  content?: ComponentViewerCodeTab;
}

export default function ComponentViewer({
  title,
  description,
  usageCode,
  component,
  referenceCode,
  referenceCodeLanguage = "TSX",
  reactExport,
  nextJsExport,
  installDescriptor,
  showPreviewAlongsideCode = false,
  onUsageCodeChange,
  codeLanguage = "TSX",
  codeError = null,
  onResetCode,
}: ComponentViewerProps) {
  const [activeTab, setActiveTab] = useState<ComponentViewerTabId>("preview");
  const [copiedTab, setCopiedTab] = useState<ComponentViewerTabId | null>(null);
  const tabRefs = useRef<
    Partial<Record<ComponentViewerTabId, HTMLButtonElement | null>>
  >({});
  const isEditable = onUsageCodeChange !== undefined;
  const hasUsageTab = referenceCode !== undefined;
  const hasReactExportTab = reactExport !== undefined;
  const hasNextJsExportTab = nextJsExport !== undefined;
  const tabs: ComponentViewerTabDefinition[] = [
    { id: "preview", label: "Preview" },
    {
      id: "code",
      label: "Code",
      content: { code: usageCode, language: codeLanguage },
    },
  ];

  if (referenceCode !== undefined) {
    tabs.push({
      id: "usage",
      label: "Usage",
      content: { code: referenceCode, language: referenceCodeLanguage },
    });
  }

  if (reactExport !== undefined) {
    tabs.push({
      id: "react-export",
      label: "React Export",
      content: reactExport,
    });
  }

  if (nextJsExport !== undefined) {
    tabs.push({
      id: "nextjs-export",
      label: "Next.js Export",
      content: nextJsExport,
    });
  }

  const tabGroupId = useId();
  const codeEditorId = `${tabGroupId}-code-editor`;
  const codeErrorId = `${tabGroupId}-code-error`;
  const getTabId = (tabId: ComponentViewerTabId) =>
    `${tabGroupId}-${tabId}-tab`;
  const getPanelId = (tabId: ComponentViewerTabId) =>
    `${tabGroupId}-${tabId}-panel`;

  useEffect(() => {
    const activeTabIsAvailable =
      activeTab === "preview" ||
      activeTab === "code" ||
      (activeTab === "usage" && hasUsageTab) ||
      (activeTab === "react-export" && hasReactExportTab) ||
      (activeTab === "nextjs-export" && hasNextJsExportTab);

    if (!activeTabIsAvailable) {
      setActiveTab("preview");
      setCopiedTab(null);
    }
  }, [activeTab, hasNextJsExportTab, hasReactExportTab, hasUsageTab]);

  const activateTab = (tabId: ComponentViewerTabId, moveFocus = false) => {
    setActiveTab(tabId);
    setCopiedTab(null);
    if (moveFocus) tabRefs.current[tabId]?.focus();
  };

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    tabIndex: number,
  ) => {
    let nextTabIndex: number | null = null;

    if (event.key === "ArrowRight") {
      nextTabIndex = (tabIndex + 1) % tabs.length;
    } else if (event.key === "ArrowLeft") {
      nextTabIndex = (tabIndex - 1 + tabs.length) % tabs.length;
    } else if (event.key === "Home") {
      nextTabIndex = 0;
    } else if (event.key === "End") {
      nextTabIndex = tabs.length - 1;
    }

    if (nextTabIndex === null) return;

    event.preventDefault();
    const nextTab = tabs[nextTabIndex];
    if (nextTab) activateTab(nextTab.id, true);
  };

  const handleCopy = (tabId: ComponentViewerTabId, sourceCode: string) => {
    void navigator.clipboard.writeText(sourceCode.trim());
    setCopiedTab(tabId);
    window.setTimeout(() => {
      setCopiedTab((currentTab) => (currentTab === tabId ? null : currentTab));
    }, 2000);
  };

  return (
    <div className="flex h-full min-h-0 w-full max-w-4xl flex-1 flex-col gap-6">
      <section className="flex-none">
        <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-lg text-slate-400">{description}</p>
      </section>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-700 shadow-sm">
        <div
          role="tablist"
          aria-label={`${title} view`}
          aria-orientation="horizontal"
          className="flex shrink-0 overflow-x-auto border-b border-slate-700 bg-slate-950"
        >
          {tabs.map((tab, tabIndex) => {
            const isActive = activeTab === tab.id;
            const shouldLoadHighlighter =
              tab.content !== undefined && !(tab.id === "code" && isEditable);

            return (
              <button
                key={tab.id}
                ref={(node) => {
                  tabRefs.current[tab.id] = node;
                }}
                type="button"
                id={getTabId(tab.id)}
                role="tab"
                aria-selected={isActive}
                aria-controls={getPanelId(tab.id)}
                tabIndex={isActive ? 0 : -1}
                onClick={() => activateTab(tab.id)}
                onKeyDown={(event) => handleTabKeyDown(event, tabIndex)}
                onPointerEnter={() => {
                  if (shouldLoadHighlighter) void loadSyntaxHighlighter();
                }}
                onFocus={() => {
                  activateTab(tab.id);
                  if (shouldLoadHighlighter) void loadSyntaxHighlighter();
                }}
                className={`shrink-0 px-6 py-3 text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-inset ${
                  isActive
                    ? "border-b-2 border-sky-400 bg-slate-800 text-sky-300"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const tabId = getTabId(tab.id);
          const panelId = getPanelId(tab.id);

          if (tab.id === "preview") {
            return (
              <div
                key={tab.id}
                id={panelId}
                role="tabpanel"
                aria-labelledby={tabId}
                hidden={!isActive}
                tabIndex={0}
                className={
                  isActive ? "min-h-0 flex-1 overflow-auto p-2" : "hidden"
                }
              >
                {isActive ? component : null}
              </div>
            );
          }

          const source = tab.content;
          if (!source) return null;

          const language = source.language ?? "TSX";
          const isEditableSource = tab.id === "code" && isEditable;
          const installFramework =
            tab.id === "react-export"
              ? "react"
              : tab.id === "nextjs-export"
                ? "nextjs"
                : undefined;
          const highlightedSource = (
            <Suspense
              fallback={
                <pre className="text-slate-100" style={syntaxHighlighterStyle}>
                  <code>{source.code.trim()}</code>
                </pre>
              }
            >
              <SyntaxHighlighter code={source.code.trim()} />
            </Suspense>
          );

          return (
            <div
              key={tab.id}
              id={panelId}
              role="tabpanel"
              aria-labelledby={tabId}
              hidden={!isActive}
              tabIndex={0}
              className={
                isActive
                  ? "flex min-h-0 flex-1 flex-col bg-slate-950"
                  : "hidden"
              }
            >
              {isActive && (
                <>
                  <div className="flex h-12 shrink-0 items-center justify-between border-b border-slate-700 bg-slate-900 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold tracking-widest text-slate-400">
                        {language}
                      </span>
                      {isEditableSource && (
                        <span className="rounded-full border border-emerald-500/50 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-emerald-300">
                          LIVE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isEditableSource && onResetCode && (
                        <button
                          type="button"
                          onClick={onResetCode}
                          className="rounded-md px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-800 hover:text-white focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none"
                        >
                          Reset
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleCopy(tab.id, source.code)}
                        className="rounded-md border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-100 transition-colors hover:border-slate-500 hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none"
                      >
                        {copiedTab === tab.id ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>

                  {source.description && (
                    <div
                      role="note"
                      className="max-h-32 shrink-0 overflow-y-auto border-b border-slate-700 bg-slate-900/70 px-4 py-3 text-sm leading-6 text-slate-300"
                    >
                      {source.description}
                    </div>
                  )}

                  {isEditableSource ? (
                    <div className="flex min-h-0 flex-1">
                      <textarea
                        id={codeEditorId}
                        aria-label={`${language} source code editor`}
                        aria-describedby={codeError ? codeErrorId : undefined}
                        aria-invalid={codeError ? "true" : undefined}
                        value={usageCode}
                        onChange={(event) =>
                          onUsageCodeChange(event.currentTarget.value)
                        }
                        autoCapitalize="off"
                        autoCorrect="off"
                        spellCheck={false}
                        className="min-h-0 min-w-0 flex-1 resize-none overflow-auto bg-transparent p-6 font-mono text-[15px] leading-[1.7] text-slate-100 caret-sky-400 outline-none [scrollbar-gutter:stable] [tab-size:2] focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-inset"
                      />
                      {showPreviewAlongsideCode && (
                        <div
                          role="region"
                          aria-label={`${title} live preview`}
                          className="hidden min-h-0 min-w-0 flex-1 overflow-auto border-l border-slate-700 bg-white p-2 lg:block"
                        >
                          {component}
                        </div>
                      )}
                    </div>
                  ) : installDescriptor && installFramework ? (
                    <div className="min-h-0 flex-1 overflow-auto overscroll-contain [scrollbar-gutter:stable]">
                      <div className="p-4 sm:p-6">
                        <Suspense
                          fallback={
                            <p
                              role="status"
                              className="rounded-xl border border-slate-700 bg-slate-900 p-5 text-sm text-slate-300"
                            >
                              Loading installation details…
                            </p>
                          }
                        >
                          <ComponentInstallGuide
                            descriptor={installDescriptor}
                            framework={installFramework}
                          />
                        </Suspense>
                      </div>
                      <div
                        role="region"
                        aria-label={`${language} source code`}
                        className="min-h-[24rem] overflow-auto border-t border-slate-700"
                      >
                        {highlightedSource}
                      </div>
                    </div>
                  ) : (
                    <div
                      role="region"
                      aria-label={`${language} source code`}
                      className="min-h-0 flex-1 overflow-auto overscroll-contain [scrollbar-gutter:stable]"
                    >
                      {highlightedSource}
                    </div>
                  )}

                  {isEditableSource && (
                    <p
                      id={codeErrorId}
                      aria-live="polite"
                      aria-atomic="true"
                      className={
                        codeError
                          ? "shrink-0 border-t border-red-500/30 bg-red-950/60 px-4 py-2 text-sm text-red-200"
                          : "sr-only"
                      }
                    >
                      {codeError ?? ""}
                    </p>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
