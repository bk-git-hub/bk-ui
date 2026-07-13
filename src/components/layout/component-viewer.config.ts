const BK_UI_GITHUB_REPOSITORY = "https://github.com/bk-git-hub/bk-ui";

const componentSourceDirectories = {
  "Baccarat Squeeze": "src/components/Baccarat",
  "Cards Stack Slider": "src/components/CardsStackSlider",
  "Click Wheel": "src/components/ClickWheel",
  Coverflow: "src/components/Coverflow",
  "Expo Slider": "src/components/ExpoSlider",
  "Lotto Draw": "src/components/Lotto",
  ReactPod: "src/components/ReactPod",
  "Shader Slider": "src/components/ShaderSlider",
  "Shutter Slider": "src/components/ShutterSlider",
  "Slicer Slider": "src/components/SlicerSlider",
  "Slot Machine": "src/components/SlotMachine",
  "Story Slider": "src/components/StorySlider",
  "Tinder Swiper": "src/components/Tinder",
} as const;

export const COMPONENT_EXPORT_TABS_ENABLED =
  import.meta.env.MODE === "test" ||
  import.meta.env.VITE_ENABLE_COMPONENT_EXPORT_TABS === "true";

export function getComponentGitHubUrl(title: string) {
  const sourceDirectory =
    componentSourceDirectories[
      title as keyof typeof componentSourceDirectories
    ];

  if (!sourceDirectory) return undefined;

  return `${BK_UI_GITHUB_REPOSITORY}/tree/main/${sourceDirectory}`;
}
