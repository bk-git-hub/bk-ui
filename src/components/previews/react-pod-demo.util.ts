import type {
  ReactPodMenuItem,
  ReactPodMenuItemId,
} from "@/components/ReactPod/reactPodState";

export interface ReactPodDemoConfig {
  deviceName: string;
  menuItems: ReactPodMenuItem[];
}

export const DEFAULT_REACT_POD_DEMO_CONFIG: ReactPodDemoConfig = {
  deviceName: "ReactPod",
  menuItems: [
    { id: "now-playing", label: "Now Playing" },
    { id: "songs", label: "Songs" },
    { id: "photos", label: "Photos" },
    { id: "shuffle", label: "Shuffle Songs" },
    { id: "about", label: "About" },
  ],
};

export const DEFAULT_REACT_POD_DEMO_CODE = JSON.stringify(
  DEFAULT_REACT_POD_DEMO_CONFIG,
  null,
  2,
);

const MENU_ITEM_IDS = new Set<ReactPodMenuItemId>([
  "now-playing",
  "songs",
  "shuffle",
  "photos",
  "about",
]);

type ParseResult =
  | { config: ReactPodDemoConfig; error: null }
  | { config: null; error: string };

export function parseReactPodDemoCode(source: string): ParseResult {
  let value: unknown;

  try {
    value = JSON.parse(source);
  } catch {
    return { config: null, error: "Enter valid JSON to update the preview." };
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { config: null, error: "The configuration must be a JSON object." };
  }

  const config = value as Record<string, unknown>;
  const deviceName =
    typeof config.deviceName === "string" ? config.deviceName.trim() : "";

  if (!deviceName) {
    return { config: null, error: "deviceName must be a non-empty string." };
  }

  if (!Array.isArray(config.menuItems) || config.menuItems.length === 0) {
    return { config: null, error: "menuItems must contain at least one item." };
  }

  const menuItems: ReactPodMenuItem[] = [];
  const seenIds = new Set<ReactPodMenuItemId>();

  for (const item of config.menuItems) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return { config: null, error: "Each menu item must be a JSON object." };
    }

    const candidate = item as Record<string, unknown>;
    const id = candidate.id;
    const label =
      typeof candidate.label === "string" ? candidate.label.trim() : "";

    if (typeof id !== "string" || !MENU_ITEM_IDS.has(id as ReactPodMenuItemId)) {
      return {
        config: null,
        error:
          "Menu ids must be now-playing, songs, shuffle, photos, or about.",
      };
    }

    const menuItemId = id as ReactPodMenuItemId;
    if (seenIds.has(menuItemId)) {
      return { config: null, error: `Menu id "${menuItemId}" is duplicated.` };
    }

    if (!label) {
      return { config: null, error: "Every menu item needs a label." };
    }

    seenIds.add(menuItemId);
    menuItems.push({ id: menuItemId, label });
  }

  return { config: { deviceName, menuItems }, error: null };
}
