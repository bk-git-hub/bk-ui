import { describe, expect, it } from "vitest";
import { storySliderDemoCode } from "./storySliderDemoCode";
import { storySliderNextExportCode } from "./storySliderNextExportCode";
import { storySliderReactExportCode } from "./storySliderReactExportCode";
import { storySliderUsageCode } from "./storySliderUsageCode";

const publicImport = 'from "@/components/StorySlider"';
const coreFiles = ["StorySlider.tsx", "useStorySlider.ts", "index.ts"];
const publicPrimitives = [
  "StorySliderRoot",
  "StorySliderViewport",
  "StorySliderGroup",
  "StorySliderItem",
  "StorySliderProgress",
  "StorySliderPlayback",
  "StorySliderPrevious",
  "StorySliderNext",
  "StorySliderStatus",
];

describe("Story Slider viewer snippets", () => {
  it("keeps Customize and Usage complete and on the public entrypoint", () => {
    expect(storySliderDemoCode).toContain("useState<StorySliderValue>");
    expect(storySliderDemoCode).toContain(publicImport);
    expect(storySliderUsageCode).toContain(publicImport);
    expect(storySliderUsageCode).toContain("groupCounts={creators.map");
    expect(storySliderUsageCode).toContain("StorySliderPlayback");
    expect(storySliderUsageCode).not.toContain("lucide-react");
  });

  it("documents a copy-ready React and Vite export", () => {
    coreFiles.forEach((file) =>
      expect(storySliderReactExportCode).toContain(file),
    );
    publicPrimitives.forEach((primitive) =>
      expect(storySliderReactExportCode).toContain(primitive),
    );

    expect(storySliderReactExportCode).toContain(
      "pnpm add clsx tailwind-merge",
    );
    expect(storySliderReactExportCode).toContain(publicImport);
    expect(storySliderReactExportCode).toContain("vite.config.ts");
    expect(storySliderReactExportCode).toContain('@source "../node_modules');
    expect(storySliderReactExportCode).toContain("content: [");
    expect(storySliderReactExportCode).toContain("groupCounts={groups.map");
  });

  it("documents one core with a client-safe Next.js wrapper", () => {
    coreFiles.forEach((file) =>
      expect(storySliderNextExportCode).toContain(file),
    );
    publicPrimitives.forEach((primitive) =>
      expect(storySliderNextExportCode).toContain(primitive),
    );

    expect(storySliderNextExportCode).toContain('"use client"');
    expect(storySliderNextExportCode).toContain(publicImport);
    expect(storySliderNextExportCode).toContain("ProductStories");
    expect(storySliderNextExportCode).toContain("StoriesPage");
    expect(storySliderNextExportCode).toContain("not serializable");
    expect(storySliderNextExportCode).toContain("window/document");
    expect(storySliderNextExportCode).toContain("dynamic({ ssr: false })");
    expect(storySliderNextExportCode).toContain(
      '@source "../../node_modules/@your-scope/bk-ui/src/components/StorySlider"',
    );
    expect(storySliderNextExportCode).toContain(
      '"paths": { "@/*": ["./src/*"] }',
    );
    expect(storySliderNextExportCode).toContain("content: [");
    expect(storySliderNextExportCode).not.toMatch(/from\s+["']next\//);
  });
});
