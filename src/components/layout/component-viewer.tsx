import { useState } from "react";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

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
  const [copyText, setCopyText] = useState("Copy");

  const handleCopy = () => {
    navigator.clipboard.writeText(usageCode.trim());
    setCopyText("Copied!");
    setTimeout(() => setCopyText("Copy"), 2000);
  };

  return (
    <div className="w-full max-w-4xl">
      <section className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-lg text-slate-400">{description}</p>
      </section>

      {/* 데모 영역 */}
      <div className="white w-full rounded-xl border border-slate-700">
        {/* 탭 버튼 */}
        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setActiveTab("preview")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === "preview" ? "border-b-2 border-sky-400 text-sky-400" : "text-slate-400 hover:text-sky-200"}`}
          >
            Preview
          </button>
          <button
            onClick={() => setActiveTab("code")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === "code" ? "border-b-2 border-sky-400 text-sky-400" : "text-slate-400 hover:text-sky-200"}`}
          >
            Code
          </button>
        </div>

        <div className="flex min-h-[650px] items-center justify-center p-4 md:p-6">
          {activeTab === "preview" ? (
            component
          ) : (
            <div className="relative w-full">
              <button
                onClick={handleCopy}
                className="absolute top-3 right-3 rounded-md bg-slate-700 px-3 py-1.5 text-xs text-white transition-colors hover:bg-slate-600"
              >
                {copyText}
              </button>
              <SyntaxHighlighter
                language="tsx"
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  padding: "1.5rem",
                  paddingTop: "3.5rem",
                  backgroundColor: "#020617",
                  borderRadius: "0.5rem",
                  width: "100%",
                }}
                codeTagProps={{
                  style: {
                    fontFamily: '"Fira Code", "D2Coding", monospace',
                    fontSize: "14px",
                  },
                }}
              >
                {usageCode.trim()}
              </SyntaxHighlighter>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
