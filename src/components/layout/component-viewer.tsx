import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy } from "lucide-react";

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

  const handleCopy = () => {
    navigator.clipboard.writeText(usageCode.trim());
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    // [중요] 부모가 h-screen이므로, 여기도 h-full을 줘서 꽉 채웁니다.
    // min-h-0이 있어야 flex container 내부에서 자식이 넘칠 때 부모를 뚫지 않고 스크롤이 생깁니다.
    <div className="flex h-full min-h-0 w-full max-w-4xl flex-1 flex-col gap-6">
      {/* 상단 텍스트 영역 (고정 높이) */}
      <section className="flex-none">
        <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-lg text-slate-400">{description}</p>
      </section>

      {/* [핵심 수정 사항] 
        1. flex-1: 남은 공간을 전부 차지함
        2. min-h-0: 내용물이 많아도 이 박스 자체가 커지지 않고, 내부에서 스크롤 처리하게 함 (Flexbox 필수 테크닉)
        3. flex-col: 내부 구성을 상하로 나눔
      */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-700 shadow-sm">
        {/* 탭 헤더 (고정 높이) */}
        <div className="flex shrink-0 border-b border-slate-700 bg-slate-900/50 backdrop-blur">
          <button
            onClick={() => setActiveTab("preview")}
            className={`px-6 py-3 text-sm font-medium transition-all ${
              activeTab === "preview"
                ? "border-b-2 border-sky-400 bg-slate-800/50 text-sky-400"
                : "text-slate-400 hover:bg-slate-800/30 hover:text-sky-200"
            }`}
          >
            Preview
          </button>
          <button
            onClick={() => setActiveTab("code")}
            className={`px-6 py-3 text-sm font-medium transition-all ${
              activeTab === "code"
                ? "border-b-2 border-sky-400 bg-slate-800/50 text-sky-400"
                : "text-slate-400 hover:bg-slate-800/30 hover:text-sky-200"
            }`}
          >
            Code
          </button>
        </div>

        {/* 컨텐츠 영역 (남은 공간 꽉 채움) */}
        <div className="relative flex flex-1 flex-col overflow-hidden p-2">
          {activeTab === "preview" ? (
            // Preview: overflow-auto로 내용이 넘치면 이 안에서만 스크롤

            component
          ) : (
            // Code: absolute inset-0으로 부모 영역에 강제로 딱 맞춤 -> 스크롤은 이 안에서만 발생
            <div className="overflow-scroll bg-slate-900">
              <button
                onClick={handleCopy}
                className="absolute top-4 right-4 z-10 flex items-center gap-1.5 rounded-md border border-slate-600 bg-slate-700/80 px-3 py-1.5 text-xs font-medium text-slate-200 backdrop-blur transition-colors hover:bg-slate-600"
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

              <SyntaxHighlighter
                language="tsx"
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  padding: "1.5rem",
                  paddingTop: "3.5rem",
                  backgroundColor: "transparent",
                  minHeight: "100%",
                  fontSize: "14px",
                  lineHeight: "1.5",
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
