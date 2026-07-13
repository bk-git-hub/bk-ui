import { Coverflow, CoverflowItem, LazyImage } from "@/components/Coverflow";
import ComponentViewer from "@/components/layout/component-viewer";
import { covers } from "@/data/covers";

const usageCode = `<Coverflow>
  {albums.map((album) => (
    <CoverflowItem
      key={album.id}
      backContent={<AlbumDetails album={album} />}
      flipLabel={\`Toggle details for \${album.title}\`}
    >
      <LazyImage src={album.coverUrl} alt={album.title} />
    </CoverflowItem>
  ))}
</Coverflow>`;

function CoverflowPage() {
  const preview = (
    <div className="flex h-full min-h-0 w-full flex-1 items-center justify-center overflow-hidden bg-black py-4 sm:py-6 md:py-10">
      <Coverflow>
        {covers.map((cover, index) => (
          <CoverflowItem
            key={cover.src}
            flipLabel={`Toggle details for ${cover.title}`}
            backContent={
              <div className="flex aspect-square w-full flex-col rounded-md bg-gradient-to-br from-slate-800 via-slate-900 to-black p-4 text-left text-white shadow-2xl">
                <p className="text-[10px] font-semibold tracking-[0.2em] text-sky-300 uppercase">
                  Track list
                </p>
                <h2 className="mt-1 truncate text-lg font-bold">
                  {cover.title}
                </h2>
                <ol className="mt-3 min-h-0 flex-1 space-y-1.5 overflow-hidden">
                  {cover.tracks.slice(0, 5).map((track, trackIndex) => (
                    <li
                      key={`${track.title}-${trackIndex}`}
                      className="flex gap-2 text-xs text-slate-200"
                    >
                      <span className="w-4 shrink-0 text-right text-slate-500">
                        {trackIndex + 1}
                      </span>
                      <span className="truncate">{track.title}</span>
                    </li>
                  ))}
                </ol>
                <p className="mt-2 text-[10px] text-slate-400">
                  Click to show cover
                </p>
              </div>
            }
          >
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
      usageCode={usageCode}
    />
  );
}

export default CoverflowPage;
