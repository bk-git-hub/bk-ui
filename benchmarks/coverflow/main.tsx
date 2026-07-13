import ReactDOM from "react-dom/client";
import { Coverflow } from "../../src/components/Coverflow/coverflow";
import { CoverflowItem } from "../../src/components/Coverflow/coverflow-item";
import { LazyImage } from "../../src/components/Coverflow/lazy-image";
import { covers } from "../../src/data/covers";
import "./style.css";

const params = new URLSearchParams(window.location.search);
const requestedItems = Number(params.get("items") ?? 30);
const itemCount = Number.isFinite(requestedItems)
  ? Math.min(Math.max(Math.trunc(requestedItems), 1), 500)
  : 30;

const benchmarkItems = Array.from({ length: itemCount }, (_, index) => {
  const cover = covers[index % covers.length];

  return {
    ...cover,
    benchmarkId: `${cover.title}-${index}`,
    src: `${cover.src}?benchmark-item=${index}`,
  };
});

export function CoverflowBenchmark() {
  return (
    <main className="benchmark-shell" data-coverflow-benchmark>
      <Coverflow>
        {benchmarkItems.map((cover, index) => (
          <CoverflowItem key={cover.benchmarkId}>
            <LazyImage
              src={cover.src}
              alt={cover.title}
              isPriority={index < 3}
            />
            <span className="benchmark-index" aria-hidden="true">
              {index}
            </span>
          </CoverflowItem>
        ))}
      </Coverflow>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <CoverflowBenchmark />,
);
