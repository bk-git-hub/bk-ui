export const lottoUsageCode = `import { useState } from "react";
import { LottoAction, LottoMachine, useLottoDraw } from "@/components/Lotto";

export default function MyLotto() {
  const [ballSource, setBallSource] = useState("1, 2, 3, 4, 5, 6, 7");
  const [drawCount, setDrawCount] = useState(6);
  const [result, setResult] = useState<string[]>([]);
  const balls = ballSource.split(",").map((ball) => ball.trim()).filter(Boolean);
  const { canDraw, draw, reset } = useLottoDraw({
    items: balls,
    drawCount,
    value: result,
    onValueChange: setResult,
  });

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
      <LottoMachine
        items={balls}
        drawnItems={result}
        resultCount={drawCount}
        getItemKey={(ball, index) => \`\${ball}-\${index}\`}
      />
      <LottoAction disabled={!canDraw} onClick={draw}>
        추첨하기
      </LottoAction>
      <LottoAction disabled={result.length === 0} onClick={reset}>
        초기화
      </LottoAction>
    </>
  );
}`;
