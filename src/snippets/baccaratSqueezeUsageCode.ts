export const baccaratSqueezeUsageCode = `import {
  BaccaratPlayingCard,
  BaccaratSqueezeAction,
  BaccaratSqueezeBack,
  BaccaratSqueezeCard,
  BaccaratSqueezeFace,
  BaccaratSqueezeFold,
  BaccaratSqueezeHandle,
  BaccaratSqueezeHint,
  BaccaratSqueezeRoot,
} from "@/components/Baccarat";

export default function PlayerCard() {
  return (
    <BaccaratSqueezeRoot
      corner="bottom-right"
      revealThreshold={0.68}
      revealAnnouncement="다이아몬드 8 카드가 공개됐습니다."
    >
      <BaccaratSqueezeCard>
        <BaccaratSqueezeBack />
        <BaccaratSqueezeFace>
          <BaccaratPlayingCard rank="8" suit="diamonds" />
        </BaccaratSqueezeFace>
        <BaccaratSqueezeFold />
        <BaccaratSqueezeHandle />
      </BaccaratSqueezeCard>

      <BaccaratSqueezeHint />
      <BaccaratSqueezeAction />
    </BaccaratSqueezeRoot>
  );
}`;
