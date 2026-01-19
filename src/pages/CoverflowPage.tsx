import { Coverflow } from "@/components/Coverflow/coverflow";
import { CoverflowItem } from "@/components/Coverflow/coverflow-item";
import { LazyImage } from "@/components/Coverflow/lazy-image";
import ComponentViewer from "@/components/layout/component-viewer";
import { covers } from "@/data/covers";

function CoverflowPage() {
  const preview = (
    <div className="flex h-full w-full flex-1 overflow-hidden bg-black py-10 md:items-center">
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

  return (
    <ComponentViewer
      title="Coverflow"
      description="3D carousel effect for browsing media items smoothly."
      component={preview}
      usageCode="123"
    />
  );
}

export default CoverflowPage;
