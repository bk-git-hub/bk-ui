import { describe, expect, it } from "vitest";
import {
  DEFAULT_COVERFLOW_DEMO_CODE,
  parseCoverflowDemoCode,
  resolveCoverflowDemoAlbums,
} from "./coverflow-demo.util";

const readDefaultConfig = () =>
  JSON.parse(DEFAULT_COVERFLOW_DEMO_CODE) as {
    ariaLabel: string;
    itemSize: number;
    showIndexes: boolean;
    albums: Array<{
      id: string;
      title: string;
      imageKey: string;
      tracks: string[];
    }>;
  };

describe("parseCoverflowDemoCode", () => {
  it("parses the default configuration and resolves allowlisted covers", () => {
    const result = parseCoverflowDemoCode(DEFAULT_COVERFLOW_DEMO_CODE);

    expect(result.error).toBeNull();
    expect(result.config?.itemSize).toBe(280);
    expect(result.config?.albums).toHaveLength(12);
    expect(result.config?.albums[0]).toMatchObject({
      title: "Hollow Nomad",
      imageKey: "hollow-nomad",
    });
    expect(
      result.config && resolveCoverflowDemoAlbums(result.config)[0]?.imageUrl,
    ).toContain("picsum.photos/seed/HollowNomad");
  });

  it("accepts editable labels, album content, and bundled image keys", () => {
    const config = readDefaultConfig();
    config.ariaLabel = "Edited albums";
    config.itemSize = 360;
    config.showIndexes = false;
    config.albums[0] = {
      ...config.albums[0]!,
      title: "Edited Album",
      imageKey: "cosmic-oracle",
      tracks: ["First Track", "Second Track"],
    };

    const result = parseCoverflowDemoCode(JSON.stringify(config));

    expect(result.error).toBeNull();
    expect(result.config).toMatchObject({
      ariaLabel: "Edited albums",
      itemSize: 360,
      showIndexes: false,
    });
    expect(result.config?.albums[0]).toMatchObject({
      title: "Edited Album",
      tracks: ["First Track", "Second Track"],
    });
  });

  it("rejects invalid or oversized JSON", () => {
    expect(parseCoverflowDemoCode("{")).toEqual({
      config: null,
      error: "Enter valid JSON to update the preview.",
    });
    expect(parseCoverflowDemoCode(" ".repeat(50_001)).error).toBe(
      "The configuration is too large to preview.",
    );
  });

  it("validates itemSize and defaults older configurations", () => {
    const legacyConfig = readDefaultConfig() as Partial<
      ReturnType<typeof readDefaultConfig>
    >;
    delete legacyConfig.itemSize;
    expect(
      parseCoverflowDemoCode(JSON.stringify(legacyConfig)).config?.itemSize,
    ).toBe(280);

    const invalidItemSize = readDefaultConfig();
    invalidItemSize.itemSize = 801;
    expect(parseCoverflowDemoCode(JSON.stringify(invalidItemSize)).error).toBe(
      "itemSize must be an integer from 80 to 800.",
    );

    invalidItemSize.itemSize = 120.5;
    expect(parseCoverflowDemoCode(JSON.stringify(invalidItemSize)).error).toBe(
      "itemSize must be an integer from 80 to 800.",
    );

    expect(
      parseCoverflowDemoCode(
        JSON.stringify({ ...readDefaultConfig(), itemSize: null }),
      ).error,
    ).toBe("itemSize must be an integer from 80 to 800.");
  });

  it("rejects duplicate ids and unsupported image keys", () => {
    const duplicateIds = readDefaultConfig();
    duplicateIds.albums[1]!.id = duplicateIds.albums[0]!.id;
    expect(parseCoverflowDemoCode(JSON.stringify(duplicateIds)).error).toBe(
      'Album id "album-1" is duplicated.',
    );

    const unsupportedImage = readDefaultConfig();
    unsupportedImage.albums[0]!.imageKey = "remote-image";
    expect(parseCoverflowDemoCode(JSON.stringify(unsupportedImage)).error).toBe(
      "albums[0].imageKey must reference a bundled demo cover.",
    );
  });

  it("rejects empty labels and oversized album or track collections", () => {
    const emptyLabel = readDefaultConfig();
    emptyLabel.ariaLabel = " ";
    expect(parseCoverflowDemoCode(JSON.stringify(emptyLabel)).error).toBe(
      "ariaLabel must be a non-empty string.",
    );

    const oversizedAlbums = readDefaultConfig();
    oversizedAlbums.albums = Array.from({ length: 21 }, (_, index) => ({
      ...oversizedAlbums.albums[0]!,
      id: "album-" + (index + 1),
    }));
    expect(parseCoverflowDemoCode(JSON.stringify(oversizedAlbums)).error).toBe(
      "albums can contain at most 20 albums.",
    );

    const oversizedTracks = readDefaultConfig();
    oversizedTracks.albums[0]!.tracks = Array.from(
      { length: 6 },
      (_, index) => "Track " + (index + 1),
    );
    expect(parseCoverflowDemoCode(JSON.stringify(oversizedTracks)).error).toBe(
      "albums[0].tracks can contain at most 5 tracks.",
    );
  });
});
