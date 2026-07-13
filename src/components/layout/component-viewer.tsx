import { lazy, Suspense, useId, useState, type ReactNode } from "react";

const loadSyntaxHighlighter = () => import("./tsx-syntax-highlighter");
const SyntaxHighlighter = lazy(loadSyntaxHighlighter);

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

export interface ComponentViewerProps {
  title: string;
  description: string;
  usageCode: string;
  component: ReactNode;
  referenceCode?: string;
  referenceCodeLanguage?: string;
  showPreviewAlongsideCode?: boolean;
  // The base ESLint rule treats type-only callback parameters as runtime values.
  // eslint-disable-next-line no-unused-vars
  onUsageCodeChange?: (nextCode: string) => void;
  codeLanguage?: string;
  codeError?: string | null;
  onResetCode?: () => void;
}

export default function ComponentViewer({
  title,
  description,
  usageCode,
  component,
  referenceCode,
  referenceCodeLanguage = "TSX",
  showPreviewAlongsideCode = false,
  onUsageCodeChange,
  codeLanguage = "TSX",
  codeError = null,
  onResetCode,
}: ComponentViewerProps) {
  const [activeTab, setActiveTab] = useState<"preview" | "code" | "usage">(
    "preview",
  );
  const [isCopied, setIsCopied] = useState(false);
  const isEditable = onUsageCodeChange !== undefined;
  const isReferenceTab = activeTab === "usage" && referenceCode !== undefined;
  const activeSourceCode = isReferenceTab ? referenceCode : usageCode;
  const activeCodeLanguage = isReferenceTab
    ? referenceCodeLanguage
    : codeLanguage;
  const isActiveSourceEditable = activeTab === "code" && isEditable;
  const tabId = useId();
  const previewTabId = `${tabId}-preview-tab`;
  const codeTabId = `${tabId}-code-tab`;
  const usageTabId = `${tabId}-usage-tab`;
  const previewPanelId = `${tabId}-preview-panel`;
  const codePanelId = `${tabId}-code-panel`;
  const usagePanelId = `${tabId}-usage-panel`;
  const codeEditorId = `${tabId}-code-editor`;
  const codeErrorId = `${tabId}-code-error`;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeSourceCode.trim());
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
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
          className="flex shrink-0 border-b border-slate-700 bg-slate-950"
        >
          <button
            type="button"
            id={previewTabId}
            role="tab"
            aria-selected={activeTab === "preview"}
            aria-controls={previewPanelId}
            onClick={() => setActiveTab("preview")}
            className={`px-6 py-3 text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-inset ${
              activeTab === "preview"
                ? "border-b-2 border-sky-400 bg-slate-800 text-sky-300"
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
            }`}
          >
            Preview
          </button>
          <button
            type="button"
            id={codeTabId}
            role="tab"
            aria-selected={activeTab === "code"}
            aria-controls={codePanelId}
            onClick={() => setActiveTab("code")}
            onPointerEnter={() => {
              if (!isEditable) void loadSyntaxHighlighter();
            }}
            onFocus={() => {
              if (!isEditable) void loadSyntaxHighlighter();
            }}
            className={`px-6 py-3 text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-inset ${
              activeTab === "code"
                ? "border-b-2 border-sky-400 bg-slate-800 text-sky-300"
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
            }`}
          >
            Code
          </button>
          {referenceCode !== undefined && (
            <button
              type="button"
              id={usageTabId}
              role="tab"
              aria-selected={activeTab === "usage"}
              aria-controls={usagePanelId}
              onClick={() => setActiveTab("usage")}
              onPointerEnter={() => void loadSyntaxHighlighter()}
              onFocus={() => void loadSyntaxHighlighter()}
              className={`px-6 py-3 text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-inset ${
                activeTab === "usage"
                  ? "border-b-2 border-sky-400 bg-slate-800 text-sky-300"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
              }`}
            >
              Usage
            </button>
          )}
        </div>

        {activeTab === "preview" ? (
          <div
            id={previewPanelId}
            role="tabpanel"
            aria-labelledby={previewTabId}
            className="min-h-0 flex-1 overflow-auto p-2"
          >
            {component}
          </div>
        ) : (
          <div
            id={isReferenceTab ? usagePanelId : codePanelId}
            role="tabpanel"
            aria-labelledby={isReferenceTab ? usageTabId : codeTabId}
            className="flex min-h-0 flex-1 flex-col bg-slate-950"
          >
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-slate-700 bg-slate-900 px-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold tracking-widest text-slate-400">
                  {activeCodeLanguage}
                </span>
                {isActiveSourceEditable && (
                  <span className="rounded-full border border-emerald-500/50 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-emerald-300">
                    LIVE
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isActiveSourceEditable && onResetCode && (
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
                  onClick={handleCopy}
                  className="rounded-md border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-100 transition-colors hover:border-slate-500 hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none"
                >
                  {isCopied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            {isActiveSourceEditable ? (
              <div className="flex min-h-0 flex-1">
                <textarea
                  id={codeEditorId}
                  aria-label={`${activeCodeLanguage} source code editor`}
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
            ) : (
              <div
                role="region"
                aria-label={`${activeCodeLanguage} source code`}
                className="min-h-0 flex-1 overflow-auto overscroll-contain [scrollbar-gutter:stable]"
              >
                <Suspense
                  fallback={
                    <pre
                      className="text-slate-100"
                      style={syntaxHighlighterStyle}
                    >
                      <code>{activeSourceCode.trim()}</code>
                    </pre>
                  }
                >
                  <SyntaxHighlighter code={activeSourceCode.trim()} />
                </Suspense>
              </div>
            )}

            {isActiveSourceEditable && (
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
          </div>
        )}
      </div>
    </div>
  );
}
