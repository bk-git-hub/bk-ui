export const storySliderDemoCode = `import { useState } from "react";
import {
  StorySliderGroup,
  StorySliderItem,
  StorySliderPlayback,
  StorySliderProgress,
  StorySliderRoot,
  StorySliderStatus,
  StorySliderViewport,
  type StorySliderValue,
} from "@/components/StorySlider";

const groups = [
  {
    id: "city",
    name: "slow.seoul",
    stories: [
      { id: "river", src: "/stories/river.webp", alt: "Han River at sunset", duration: 4800 },
      { id: "night", src: "/stories/night.webp", alt: "A neon-lit alley", duration: 4200 },
    ],
  },
  {
    id: "coast",
    name: "weekend.club",
    stories: [
      { id: "picnic", src: "/stories/picnic.webp", alt: "A seaside picnic", duration: 5200 },
    ],
  },
];

export function StorySliderDemo() {
  const [value, setValue] = useState<StorySliderValue>({
    groupIndex: 0,
    itemIndex: 0,
  });

  return (
    <StorySliderRoot
      groupCounts={groups.map((group) => group.stories.length)}
      value={value}
      onValueChange={setValue}
      duration={(current) =>
        groups[current.groupIndex]?.stories[current.itemIndex]?.duration ?? 5000
      }
      aria-label="Creator stories"
    >
      <StorySliderViewport className="h-[min(80vh,680px)] w-auto rounded-3xl bg-black">
        {groups.map((group, groupIndex) => (
          <StorySliderGroup
            key={group.id}
            index={groupIndex}
            aria-label={group.name + " stories"}
            className="rounded-3xl bg-black"
          >
            {group.stories.map((story, storyIndex) => (
              <StorySliderItem key={story.id} index={storyIndex}>
                <img
                  src={story.src}
                  alt={story.alt}
                  className="h-full w-full object-cover"
                />
              </StorySliderItem>
            ))}
          </StorySliderGroup>
        ))}

        <StorySliderProgress className="absolute inset-x-0 top-0 z-30 m-4 w-auto" />
        <StorySliderPlayback className="absolute top-8 right-4 z-40 bg-black/50 px-3 py-2 text-white">
          {({ paused }) => (paused ? "Play" : "Pause")}
        </StorySliderPlayback>
      </StorySliderViewport>

      <StorySliderStatus className="sr-only" />
    </StorySliderRoot>
  );
}`;
