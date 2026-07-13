import { memo, useMemo, useState } from "react";
import { Coverflow, CoverflowItem, LazyImage } from "@/components/Coverflow";
import {
  DEFAULT_COVERFLOW_DEMO_CONFIG,
  MAX_COVERFLOW_DEMO_ITEM_SIZE,
  MIN_COVERFLOW_DEMO_ITEM_SIZE,
  resolveCoverflowDemoAlbums,
  type CoverflowDemoConfig,
} from "./coverflow-demo.util";

export interface CoverflowDemoPreviewProps {
  config?: CoverflowDemoConfig;
  // eslint-disable-next-line no-unused-vars
  onConfigChange?: (config: CoverflowDemoConfig) => void;
}

function CoverflowDemoPreview({
  config,
  onConfigChange,
}: CoverflowDemoPreviewProps) {
  const [internalConfig, setInternalConfig] = useState(
    DEFAULT_COVERFLOW_DEMO_CONFIG,
  );
  const activeConfig = config ?? internalConfig;
  const albums = useMemo(
    () => resolveCoverflowDemoAlbums(activeConfig),
    [activeConfig],
  );
  const previewKey = useMemo(
    () => JSON.stringify(activeConfig.albums),
    [activeConfig.albums],
  );

  const updateItemSize = (itemSize: number) => {
    const nextConfig = { ...activeConfig, itemSize };
    if (config === undefined) setInternalConfig(nextConfig);
    onConfigChange?.(nextConfig);
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-black text-white">
      <label className="flex shrink-0 items-center gap-3 border-b border-white/10 bg-black px-4 py-3 text-xs sm:gap-4 sm:px-5">
        <span className="shrink-0 font-semibold text-slate-300">Item size</span>
        <input
          type="range"
          min={MIN_COVERFLOW_DEMO_ITEM_SIZE}
          max={MAX_COVERFLOW_DEMO_ITEM_SIZE}
          step={20}
          value={activeConfig.itemSize}
          onChange={(event) =>
            updateItemSize(Number(event.currentTarget.value))
          }
          aria-label="Cover item size"
          className="min-w-0 flex-1 accent-sky-400"
        />
        <output className="w-14 shrink-0 text-right font-mono font-bold text-sky-300">
          {activeConfig.itemSize}px
        </output>
      </label>

      <div className="min-h-0 flex-1 py-4 sm:py-6 md:py-10">
        <Coverflow
          key={previewKey}
          aria-label={activeConfig.ariaLabel}
          itemSize={activeConfig.itemSize}
        >
          {albums.map((album, index) => (
            <CoverflowItem
              key={album.id}
              flipLabel={"Show details for " + album.title}
              closeLabel={"Close details for " + album.title}
              backContent={
                <section className="flex aspect-square w-full flex-col rounded-md bg-gradient-to-br from-slate-800 via-slate-900 to-black p-4 text-left text-white shadow-2xl">
                  <p className="text-[10px] font-semibold tracking-[0.2em] text-sky-300 uppercase">
                    Track list
                  </p>
                  <h2 className="mt-1 truncate text-lg font-bold">
                    {album.title}
                  </h2>
                  <ol className="mt-3 min-h-0 flex-1 space-y-1.5 overflow-hidden">
                    {album.tracks.map((track, trackIndex) => (
                      <li
                        key={track + "-" + trackIndex}
                        className="flex gap-2 text-xs text-slate-200"
                      >
                        <span className="w-4 shrink-0 text-right text-slate-500">
                          {trackIndex + 1}
                        </span>
                        <span className="truncate">{track}</span>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-2 text-[10px] text-slate-400">
                    Click outside or use the close button to show the cover.
                  </p>
                </section>
              }
            >
              <LazyImage
                src={album.imageUrl}
                alt={album.title}
                isPriority={index < 3}
              />
              {activeConfig.showIndexes && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 flex items-center justify-center text-[clamp(3rem,12vw,6.25rem)] font-black text-white/90 drop-shadow-2xl select-none"
                >
                  {index + 1}
                </span>
              )}
            </CoverflowItem>
          ))}
        </Coverflow>
      </div>
    </div>
  );
}

export default memo(CoverflowDemoPreview);
