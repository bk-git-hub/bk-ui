import { useState } from "react";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { tinderUsageCode } from "@/snippets/tinderUsageCode";

import TinderDemoPreview from "@/components/previews/TinderDemoPreview";

export default function TinderDemoPage() {
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [copyText, setCopyText] = useState("Copy");

  const handleCopy = () => {
    navigator.clipboard.writeText(tinderUsageCode.trim());
    setCopyText("Copied!");
    setTimeout(() => setCopyText("Copy"), 2000);
  };

  return (
    <div className="w-full max-w-4xl">
      {/* 소개 영역 */}
      <section className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">
          Tinder Swipe Component
        </h1>
        <p className="mt-2 text-lg text-slate-400">
          A composable Tinder-like card swiper for React.
        </p>
      </section>

      {/* 데모 영역 */}
      <div className="white w-full rounded-xl border border-slate-700">
        {/* 탭 버튼 */}
        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setActiveTab("preview")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === "preview" ? "border-b-2 border-sky-400 text-sky-400" : "text-slate-400 hover:text-white"}`}
          >
            Preview
          </button>
          <button
            onClick={() => setActiveTab("code")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === "code" ? "border-b-2 border-sky-400 text-sky-400" : "text-slate-400 hover:text-white"}`}
          >
            Code
          </button>
        </div>

        {/* 미리보기 / 코드 영역 */}
        <div className="flex min-h-[650px] items-center justify-center p-4 md:p-6">
          {activeTab === "preview" ? (
            <TinderDemoPreview />
          ) : (
            <div className="relative w-full">
              <button
                onClick={handleCopy}
                className="absolute top-3 right-3 rounded-md bg-slate-700 px-3 py-1.5 text-xs transition-colors hover:bg-slate-600"
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
                {tinderUsageCode.trim()}
              </SyntaxHighlighter>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
