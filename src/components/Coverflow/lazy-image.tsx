import { useCoverflowItem } from "./coverflow-context";

interface LazyImageProps {
  src: string;
  alt: string;
  isPriority?: boolean;
}
export const LazyImage = ({ src, alt, isPriority = false }: LazyImageProps) => {
  const { signalReady } = useCoverflowItem();

  return (
    <div className="aspect- relative w-full rounded-md select-none">
      {/* 원본 이미지 */}
      <img
        src={src}
        alt={alt}
        onLoad={signalReady}
        loading={isPriority ? "eager" : "lazy"}
        className="pointer-events-none h-full w-full rounded-md object-cover select-none"
        style={{
          // WebkitBoxReflect를 사용하여 네이티브 반사 효과를 적용합니다.
          // 이 방법은 별도의 이미지를 렌더링하는 것보다 훨씬 효율적입니다.
          WebkitBoxReflect:
            "below 0px linear-gradient(to bottom, transparent, rgba(0,0,0,0.4))",
        }}
      />
      {/* 수동 반사 효과를 위한 div와 두 번째 img 태그가 제거되었습니다. */}
    </div>
  );
};
