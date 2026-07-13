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
        padding: "1.5rem",
        paddingTop: "3.5rem",
        backgroundColor: "transparent",
        minHeight: "100%",
        fontSize: "14px",
        lineHeight: "1.5",
      }}
    >
      {code}
    </PrismLight>
  );
}
