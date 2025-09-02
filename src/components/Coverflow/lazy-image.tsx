import { useCoverflowItem } from "./coverflow-context";

interface LazyImageProps {
  src: string;
  alt: string;
  isPriority?: boolean;
}
export const LazyImage = ({ src, alt, isPriority = false }: LazyImageProps) => {
  const { signalReady } = useCoverflowItem();

  return (
    <div className="relative h-full w-full rounded-md">
      {/* 원본 이미지 */}
      <img
        src={src}
        alt={alt}
        onLoad={signalReady}
        loading={isPriority ? "eager" : "lazy"}
        className="pointer-events-none h-full w-full rounded-md object-cover select-none"
      />

      {/* 수동 반사 효과 */}
      <div className="absolute top-full left-0 h-full w-full rounded-md bg-black">
        {/* 이미지를 복사하고 Y축으로 뒤집습니다.
          bg-black을 추가하여 이미지가 로드되기 전이나 투명한 부분이 있을 경우를 대비합니다.
        */}
        <img
          src={src}
          alt=""
          className="h-full w-full scale-y-[-1] transform rounded-md object-cover brightness-60"
          style={{
            // mask-image를 사용해 부드럽게 사라지는 효과를 적용합니다.
            // 이 마스크는 이미지 자체를 투명하게 만드는 것이 아니라, '가려주는' 역할을 합니다.
            // 보이는 부분은 원본 이미지처럼 완전히 불투명하므로, 뒤의 카드가 비치지 않습니다.
            maskImage: "linear-gradient(to top, black, transparent)",
            WebkitMaskImage: "linear-gradient(to top, black, transparent)",
          }}
        />
      </div>
    </div>
  );
};
