export const storySliderUsageCode = `import { Pause, Play } from "lucide-react";
import {
  StorySliderGroup,
  StorySliderItem,
  StorySliderNext,
  StorySliderPlayback,
  StorySliderPrevious,
  StorySliderProgress,
  StorySliderRoot,
  StorySliderViewport,
} from "@/components/StorySlider";

const creators = [
  {
    name: "slow.seoul",
    stories: [
      { id: "river", src: "/stories/river.webp", alt: "Han River at sunset" },
      { id: "night", src: "/stories/night.webp", alt: "A neon-lit alley" },
    ],
  },
  {
    name: "weekend.club",
    stories: [
      { id: "picnic", src: "/stories/picnic.webp", alt: "A seaside picnic" },
      { id: "coast", src: "/stories/coast.webp", alt: "A blue coastal platform" },
    ],
  },
];

export default function Stories() {
  return (
    <StorySliderRoot
      groupCounts={creators.map((creator) => creator.stories.length)}
      duration={5000}
      aria-label="Creator stories"
      className="flex items-center justify-center gap-4"
    >
      <StorySliderPrevious className="bg-black px-4 text-white">
        Previous
      </StorySliderPrevious>

      <StorySliderViewport className="h-[min(80vh,680px)] w-auto rounded-3xl bg-black">
        {creators.map((creator, groupIndex) => (
          <StorySliderGroup
            key={creator.name}
            index={groupIndex}
            aria-label={\`\${creator.name}'s stories\`}
            className="rounded-3xl bg-black"
          >
            {creator.stories.map((story, storyIndex) => (
              <StorySliderItem key={story.id} index={storyIndex}>
                <img
                  src={story.src}
                  alt={story.alt}
                  className="h-full w-full rounded-3xl object-cover"
                />
              </StorySliderItem>
            ))}

            <div className="absolute inset-x-0 top-0 z-30 p-4">
              <StorySliderProgress />
              <p className="mt-3 text-sm font-bold text-white">
                @{creator.name}
              </p>
            </div>

            <StorySliderPlayback className="absolute top-7 right-4 z-40 text-white">
              {({ paused }) =>
                paused ? <Play aria-hidden /> : <Pause aria-hidden />
              }
            </StorySliderPlayback>
          </StorySliderGroup>
        ))}
      </StorySliderViewport>

      <StorySliderNext className="bg-black px-4 text-white">
        Next
      </StorySliderNext>
    </StorySliderRoot>
  );
}`;
