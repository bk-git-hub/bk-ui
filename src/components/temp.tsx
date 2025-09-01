import React, { useState } from "react";
// Changed from @heroicons/react to lucide-react
import { ChevronLeft, ChevronRight } from "lucide-react";

// Define the type for a single coverflow item
export interface CoverflowItem {
  id: string | number;
  image: string;
  title: string;
}

// Define the props for the Coverflow component
interface CoverflowProps {
  items: CoverflowItem[];
  className?: string;
}

const Coverflow: React.FC<CoverflowProps> = ({ items, className = "" }) => {
  // State is now typed as a number
  const [currentIndex, setCurrentIndex] = useState<number>(
    Math.floor(items.length / 2),
  );

  const handlePrev = (): void => {
    setCurrentIndex((prevIndex) =>
      prevIndex > 0 ? prevIndex - 1 : items.length - 1,
    );
  };

  const handleNext = (): void => {
    setCurrentIndex((prevIndex) =>
      prevIndex < items.length - 1 ? prevIndex + 1 : 0,
    );
  };

  // The function signature is typed for clarity and safety
  const getCardStyle = (index: number): React.CSSProperties => {
    const offset = index - currentIndex;
    const absOffset = Math.abs(offset);

    const style: React.CSSProperties = {
      zIndex: items.length - absOffset,
      opacity: "1",
      transition: "all 0.4s ease-out",
      transform: "",
    };

    const rotateY = offset * -35;
    const translateX = offset * (absOffset > 1 ? 40 : 35);
    const scale = 1 - absOffset * 0.15;
    const opacity = absOffset > 1 ? 0.5 : 1;

    if (offset !== 0) {
      style.transform = `translateX(${translateX}%) rotateY(${rotateY}deg) scale(${scale})`;
      style.opacity = `${opacity}`;
    } else {
      style.transform = `rotateY(0deg) scale(1.1)`;
      style.opacity = "1";
    }

    return style;
  };

  return (
    <div
      className={`relative flex h-96 w-full flex-col items-center justify-center ${className}`}
    >
      {/* 3D Perspective Container */}
      <div
        className="relative flex h-3/4 w-full items-center justify-center"
        style={{ perspective: "1200px" }}
      >
        <div
          className="relative h-full w-[40%] md:w-[30%] lg:w-[25%]"
          style={{ transformStyle: "preserve-3d" }}
        >
          {items.map((item, index) => (
            <div
              key={item.id}
              className="absolute top-0 left-0 h-full w-full cursor-pointer"
              style={getCardStyle(index)}
              onClick={() => setCurrentIndex(index)}
            >
              <div className="flex h-full w-full flex-col overflow-hidden rounded-xl bg-gray-800 shadow-2xl">
                <img
                  src={item.image}
                  alt={item.title}
                  className="pointer-events-none h-full w-full object-cover"
                />
                <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-4">
                  <h3 className="truncate text-lg font-bold text-white">
                    {item.title}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="relative z-50 mt-6 flex w-full items-center justify-center">
        <button
          onClick={handlePrev}
          className="mx-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          aria-label="Previous item"
        >
          {/* Replaced ChevronLeftIcon with ChevronLeft */}
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div className="w-48 truncate text-center text-lg font-semibold text-white">
          {items[currentIndex]?.title}
        </div>
        <button
          onClick={handleNext}
          className="mx-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          aria-label="Next item"
        >
          {/* Replaced ChevronRightIcon with ChevronRight */}
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
};

export default Coverflow;
