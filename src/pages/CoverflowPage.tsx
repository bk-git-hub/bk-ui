import { Coverflow } from "@/components/Coverflow/coverflow";
import { CoverflowItem } from "@/components/Coverflow/coverflow-item";
import { LazyImage } from "@/components/Coverflow/lazy-image";
import { covers } from "@/data/covers";

function CoverflowPage() {
  return (
    <div className="relative flex h-dvh items-center overflow-hidden bg-black">
      <Coverflow>
        {covers.map((cover, index) => (
          <CoverflowItem key={index}>
            <LazyImage
              src={cover.src}
              alt={cover.title}
              isPriority={index < 3}
            />
            <h1 className="absolute text-[100px] text-white select-none">
              {index}
            </h1>
          </CoverflowItem>
        ))}
      </Coverflow>
    </div>
  );
}

export default CoverflowPage;
