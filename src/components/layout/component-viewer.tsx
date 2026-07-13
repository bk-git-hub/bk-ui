import { lazy, Suspense, useId, useState } from "react";
import { Check, Copy } from "lucide-react";

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

interface Props {
  title: string;
  description: string;
  usageCode: string;
  component: React.ReactNode;
}

export default function ComponentViewer({
  title,
  description,
  usageCode,
  component,
}: Props) {
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [isCopied, setIsCopied] = useState(false);
  const tabId = useId();
  const previewTabId = `${tabId}-preview-tab`;
  const codeTabId = `${tabId}-code-tab`;
  const previewPanelId = `${tabId}-preview-panel`;
  const codePanelId = `${tabId}-code-panel`;

  const handleCopy = () => {
    navigator.clipboard.writeText(usageCode.trim());
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
            className={`px-6 py-3 text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-400 ${
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
            onPointerEnter={() => void loadSyntaxHighlighter()}
            onFocus={() => void loadSyntaxHighlighter()}
            className={`px-6 py-3 text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-400 ${
              activeTab === "code"
                ? "border-b-2 border-sky-400 bg-slate-800 text-sky-300"
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
            }`}
          >
            Code
          </button>
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
            id={codePanelId}
            role="tabpanel"
            aria-labelledby={codeTabId}
            className="flex min-h-0 flex-1 flex-col bg-slate-950"
          >
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-slate-700 bg-slate-900 px-4">
              <span className="font-mono text-xs font-semibold tracking-widest text-slate-400">
                TSX
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-md border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-100 transition-colors hover:border-slate-500 hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
              >
                {isCopied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-green-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <div
              role="region"
              aria-label="TSX source code"
              className="min-h-0 flex-1 overflow-auto overscroll-contain [scrollbar-gutter:stable]"
            >
              <Suspense
                fallback={
                  <pre
                    className="text-slate-100"
                    style={syntaxHighlighterStyle}
                  >
                    <code>{usageCode.trim()}</code>
                  </pre>
                }
              >
                <SyntaxHighlighter code={usageCode.trim()} />
              </Suspense>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
