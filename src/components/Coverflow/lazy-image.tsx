import { useCoverflowItem } from "./coverflow-context";

interface LazyImageProps {
  src: string;
  alt: string;
}

export const LazyImage = ({ src, alt }: LazyImageProps) => {
  const { signalReady } = useCoverflowItem();

  return (
    <img
      src={src}
      alt={alt}
      onLoad={signalReady}
      loading="lazy"
      className="pointer-events-none h-full w-full rounded-md object-cover select-none"
      style={{
        WebkitBoxReflect:
          "below 0 linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.4))",
      }}
    />
  );
};
