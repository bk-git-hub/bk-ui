import PrismLight from "react-syntax-highlighter/dist/esm/prism-light";
import tsx from "react-syntax-highlighter/dist/esm/languages/prism/tsx";
import vscDarkPlus from "react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus";

PrismLight.registerLanguage("tsx", tsx);

interface Props {
  code: string;
}

export default function TsxSyntaxHighlighter({ code }: Props) {
  return (
    <PrismLight
      language="tsx"
      style={vscDarkPlus}
      customStyle={{
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
      }}
    >
      {code}
    </PrismLight>
  );
}
