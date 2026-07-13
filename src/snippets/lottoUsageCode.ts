export const lottoUsageCode = `import { LottoDraw } from "@/components/Lotto";

const balls = Array.from({ length: 45 }, (_, index) => index + 1);

export default function MyLotto() {
  return (
    <LottoDraw
      items={balls}
      drawCount={6}
      getItemKey={(ball) => ball}
      aria-label="Weekly lotto draw"
    />
  );
}`;
