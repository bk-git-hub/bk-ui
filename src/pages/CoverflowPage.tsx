import { useEffect, useState } from "react";
import { Coverflow } from "@/components/Coverflow/coverflow";
import { CoverflowItem } from "@/components/Coverflow/coverflow-item";
import { LazyImage } from "@/components/Coverflow/lazy-image";
import { covers } from "@/data/covers";

const getSize = (width: number) => Math.min(Math.max(width / 3.6, 200), 800);

function CoverflowPage() {
  const [size, setSize] = useState(getSize(window.innerWidth));

  useEffect(() => {
    const handleResize = () => setSize(getSize(window.innerWidth));
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="relative h-dvh overflow-hidden bg-black">
      <div className="absolute top-1/2 right-0 left-0 -translate-y-1/2 transform">
        <Coverflow size={size}>
          {covers.map((cover, index) => (
            <CoverflowItem key={index}>
              <LazyImage src={cover.src} alt={cover.title} />
            </CoverflowItem>
          ))}
        </Coverflow>
      </div>
      <div className="bg-opacity-30 fixed top-2.5 right-2.5 rounded-2xl bg-black p-4 text-center font-mono text-white backdrop-blur-2xl">
        credit:{" "}
        <a
          href="https://github.com/lee-donghyun/react-coverflow"
          target="_blank"
          rel="noreferrer"
          className="text-white underline"
        >
          github@lee-donghyun
        </a>
      </div>
    </div>
  );
}

export default CoverflowPage;
