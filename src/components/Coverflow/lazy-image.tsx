import { useCoverflowItem } from "./coverflow-context";

interface LazyImageProps {
  src: string;
  alt: string;
  isPriority?: boolean;
}

export const LazyImage = ({ src, alt, isPriority = false }: LazyImageProps) => {
  const { signalReady } = useCoverflowItem();

  return (
    <img
      src={src}
      alt={alt}
      onLoad={signalReady}
      // The loading strategy is now controlled directly by the prop
      loading={isPriority ? "eager" : "lazy"}
      className="pointer-events-none h-full w-full rounded-md object-cover select-none"
      style={{
        WebkitBoxReflect:
          "below 0 linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.4))",
      }}
    />
  );
};
