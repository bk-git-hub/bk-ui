import { covers } from "@/data/covers";

const MAX_SOURCE_LENGTH = 50_000;
const MAX_ALBUM_COUNT = 20;
const MAX_TRACK_COUNT = 5;
const MAX_ID_LENGTH = 60;
const MAX_TITLE_LENGTH = 80;
const MAX_TRACK_LENGTH = 100;
const MAX_LABEL_LENGTH = 120;
export const MIN_COVERFLOW_DEMO_ITEM_SIZE = 80;
export const MAX_COVERFLOW_DEMO_ITEM_SIZE = 800;

const toImageKey = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const demoCovers = covers.map((cover) => ({
  imageKey: toImageKey(cover.title),
  imageUrl: cover.src,
  title: cover.title,
  tracks: cover.tracks.map((track) => track.title),
}));
const imageUrlByKey = new Map(
  demoCovers.map((cover) => [cover.imageKey, cover.imageUrl]),
);

export interface CoverflowDemoAlbumConfig {
  id: string;
  title: string;
  imageKey: string;
  tracks: string[];
}

export interface CoverflowDemoConfig {
  ariaLabel: string;
  itemSize: number;
  showIndexes: boolean;
  albums: CoverflowDemoAlbumConfig[];
}

export const DEFAULT_COVERFLOW_DEMO_CONFIG: CoverflowDemoConfig = {
  ariaLabel: "Album covers",
  itemSize: 280,
  showIndexes: true,
  albums: demoCovers.slice(0, 8).map((cover, index) => ({
    id: "album-" + (index + 1),
    title: cover.title,
    imageKey: cover.imageKey,
    tracks: cover.tracks.slice(0, MAX_TRACK_COUNT),
  })),
};

export const DEFAULT_COVERFLOW_DEMO_CODE = JSON.stringify(
  DEFAULT_COVERFLOW_DEMO_CONFIG,
  null,
  2,
);

type ParseResult =
  | { config: CoverflowDemoConfig; error: null }
  | { config: null; error: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const readText = (
  value: unknown,
  field: string,
  maxLength: number,
): { value: string; error: null } | { value: null; error: string } => {
  if (typeof value !== "string" || value.trim() === "") {
    return { value: null, error: field + " must be a non-empty string." };
  }

  const text = value.trim();
  if (text.length > maxLength) {
    return {
      value: null,
      error: field + " must be " + maxLength + " characters or fewer.",
    };
  }

  return { value: text, error: null };
};

export function parseCoverflowDemoCode(source: string): ParseResult {
  if (source.length > MAX_SOURCE_LENGTH) {
    return {
      config: null,
      error: "The configuration is too large to preview.",
    };
  }

  let value: unknown;
  try {
    value = JSON.parse(source);
  } catch {
    return { config: null, error: "Enter valid JSON to update the preview." };
  }

  if (!isRecord(value)) {
    return { config: null, error: "The configuration must be a JSON object." };
  }

  const ariaLabel = readText(value.ariaLabel, "ariaLabel", MAX_LABEL_LENGTH);
  if (ariaLabel.error !== null) return { config: null, error: ariaLabel.error };

  const itemSizeValue =
    value.itemSize === undefined
      ? DEFAULT_COVERFLOW_DEMO_CONFIG.itemSize
      : value.itemSize;
  if (
    typeof itemSizeValue !== "number" ||
    !Number.isInteger(itemSizeValue) ||
    itemSizeValue < MIN_COVERFLOW_DEMO_ITEM_SIZE ||
    itemSizeValue > MAX_COVERFLOW_DEMO_ITEM_SIZE
  ) {
    return {
      config: null,
      error:
        "itemSize must be an integer from " +
        MIN_COVERFLOW_DEMO_ITEM_SIZE +
        " to " +
        MAX_COVERFLOW_DEMO_ITEM_SIZE +
        ".",
    };
  }

  if (typeof value.showIndexes !== "boolean") {
    return { config: null, error: "showIndexes must be a boolean." };
  }

  if (!Array.isArray(value.albums) || value.albums.length === 0) {
    return { config: null, error: "albums must contain at least one album." };
  }
  if (value.albums.length > MAX_ALBUM_COUNT) {
    return {
      config: null,
      error: "albums can contain at most " + MAX_ALBUM_COUNT + " albums.",
    };
  }

  const albums: CoverflowDemoAlbumConfig[] = [];
  const seenIds = new Set<string>();

  for (const [index, albumValue] of value.albums.entries()) {
    const field = "albums[" + index + "]";
    if (!isRecord(albumValue)) {
      return { config: null, error: field + " must be a JSON object." };
    }

    const id = readText(albumValue.id, field + ".id", MAX_ID_LENGTH);
    if (id.error !== null) return { config: null, error: id.error };
    if (seenIds.has(id.value)) {
      return {
        config: null,
        error: 'Album id "' + id.value + '" is duplicated.',
      };
    }

    const title = readText(
      albumValue.title,
      field + ".title",
      MAX_TITLE_LENGTH,
    );
    if (title.error !== null) return { config: null, error: title.error };

    const imageKey = readText(
      albumValue.imageKey,
      field + ".imageKey",
      MAX_ID_LENGTH,
    );
    if (imageKey.error !== null) return { config: null, error: imageKey.error };
    if (!imageUrlByKey.has(imageKey.value)) {
      return {
        config: null,
        error: field + ".imageKey must reference a bundled demo cover.",
      };
    }

    if (!Array.isArray(albumValue.tracks) || albumValue.tracks.length === 0) {
      return {
        config: null,
        error: field + ".tracks must contain at least one track.",
      };
    }
    if (albumValue.tracks.length > MAX_TRACK_COUNT) {
      return {
        config: null,
        error:
          field + ".tracks can contain at most " + MAX_TRACK_COUNT + " tracks.",
      };
    }

    const tracks: string[] = [];
    for (const [trackIndex, trackValue] of albumValue.tracks.entries()) {
      const track = readText(
        trackValue,
        field + ".tracks[" + trackIndex + "]",
        MAX_TRACK_LENGTH,
      );
      if (track.error !== null) return { config: null, error: track.error };
      tracks.push(track.value);
    }

    seenIds.add(id.value);
    albums.push({
      id: id.value,
      title: title.value,
      imageKey: imageKey.value,
      tracks,
    });
  }

  return {
    config: {
      ariaLabel: ariaLabel.value,
      itemSize: itemSizeValue,
      showIndexes: value.showIndexes,
      albums,
    },
    error: null,
  };
}

export function resolveCoverflowDemoAlbums(config: CoverflowDemoConfig) {
  return config.albums.map((album) => ({
    ...album,
    imageUrl: imageUrlByKey.get(album.imageKey) ?? "",
  }));
}
