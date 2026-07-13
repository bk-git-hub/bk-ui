export const clickWheelUsageCode = `import { useState } from "react";
import { ClickWheel } from "@/components/ClickWheel";

export default function PocketControls() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  return (
    <div className="grid justify-items-center gap-4">
      <p aria-live="polite">Selected item: {index}</p>
      <ClickWheel
        sensitivity={1.25}
        onRotate={(direction) => setIndex((value) => value + direction)}
        onMenu={() => setIndex(0)}
        onMenuLongPress={() => setIndex(0)}
        onPrevious={() => setIndex((value) => value - 1)}
        onSelect={() => console.log("Selected", index)}
        onNext={() => setIndex((value) => value + 1)}
        onPlayPause={() => setPlaying((value) => !value)}
        buttonProps={{
          menu: {
            children: "BACK",
            "aria-label": "Back",
            className: "text-indigo-600",
          },
          previous: {
            children: "−",
            "aria-label": "Decrease",
          },
          select: {
            children: "OK",
            "aria-label": "Confirm selection",
            className: "grid place-items-center font-bold",
          },
          next: {
            children: "+",
            "aria-label": "Increase",
          },
          playPause: {
            children: playing ? "PAUSE" : "PLAY",
            "aria-label": playing ? "Pause" : "Play",
            "aria-pressed": playing,
          },
        }}
      />
    </div>
  );
}`;
