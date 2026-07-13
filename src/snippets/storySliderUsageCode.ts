export const storySliderUsageCode = `import {
  StorySliderGroup,
  StorySliderItem,
  StorySliderNext,
  StorySliderPlayback,
  StorySliderPrevious,
  StorySliderProgress,
  StorySliderRoot,
  StorySliderStatus,
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

          </StorySliderGroup>
        ))}

        <StorySliderProgress className="absolute inset-x-0 top-0 z-30 m-4 w-auto" />
        <StorySliderPlayback className="absolute top-8 right-4 z-40 rounded-full bg-black/50 px-3 py-2 text-sm text-white">
          {({ paused }) => (paused ? "Play" : "Pause")}
        </StorySliderPlayback>
      </StorySliderViewport>

      <StorySliderNext className="bg-black px-4 text-white">
        Next
      </StorySliderNext>

      <StorySliderStatus className="sr-only" />
    </StorySliderRoot>
  );
}`;
