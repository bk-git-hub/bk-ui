export const lottoUsageCode = `import { useState } from "react";
import { LottoDraw } from "@/components/Lotto";

export default function MyLotto() {
  const [ballSource, setBallSource] = useState("1, 2, 3, 4, 5, 6, 7");
  const [drawCount, setDrawCount] = useState(6);
  const [result, setResult] = useState<string[]>([]);
  const balls = ballSource.split(",").map((ball) => ball.trim()).filter(Boolean);

  return (
    <>
      <textarea
        aria-label="Ball content"
        value={ballSource}
        onChange={(event) => {
          setBallSource(event.target.value);
          setResult([]);
        }}
      />
      <input
        aria-label="Draw count"
        type="number"
        value={drawCount}
        onChange={(event) => {
          setDrawCount(event.currentTarget.valueAsNumber);
          setResult([]);
        }}
      />
      <LottoDraw
        items={balls}
        drawCount={drawCount}
        value={result}
        onValueChange={setResult}
        getItemKey={(ball, index) => \`\${ball}-\${index}\`}
      />
    </>
  );
}`;
