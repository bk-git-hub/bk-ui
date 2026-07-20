// @vitest-environment node

import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ReactPod as ClientReactPod } from "./client";
import { ReactPod as CoreReactPod } from "./index";
import { ReactPodContext } from "./ReactPodContext";
import ReactPodCoverflow from "./ReactPodCoverflow";
import { initialReactPodState } from "./reactPodState";
import type { ReactPodCoverflowAlbum, ReactPodTrack } from "./index";

const coverflowAlbums = [
  {
    id: "server-album",
    title: "Server Album",
    coverSrc: "/server-album.webp",
    coverAlt: "Server Album cover",
    tracks: [{ id: "server-track", title: "Hydration" }],
  },
] satisfies readonly ReactPodCoverflowAlbum[];

const tracks = [
  {
    id: "server-track",
    title: "Server Track",
    artist: "Server Artist",
    album: "Server Album",
    duration: 90,
    src: "/server-track.mp3",
    artworkSrc: "/server-track.jpg",
    artworkAlt: "Server Track album cover",
  },
] satisfies readonly ReactPodTrack[];

describe("ReactPod SSR", () => {
  it("shares its client entry and renders serializable Coverflow data", () => {
    expect(typeof window).toBe("undefined");
    expect(ClientReactPod).toBe(CoreReactPod);

    const props = {
      deviceName: "Server Pod",
      menuItems: [{ id: "coverflow", label: "Coverflow" }] as const,
      coverflowAlbums,
      tracks,
      coverflowAriaLabel: "Server album browser",
    };
    const coreHtml = renderToString(<CoreReactPod {...props} />);
    const clientHtml = renderToString(<ClientReactPod {...props} />);

    expect(coreHtml).toBe(clientHtml);
    expect(coreHtml).toContain("Server Pod");
    expect(coreHtml).toContain("Coverflow");
    expect(coreHtml).toContain("/server-album.webp");
    expect(coreHtml).toContain("/server-track.mp3");
    expect(coreHtml).not.toContain(' coverflowAlbums="');
  });

  it("server-renders the composed Coverflow screen without browser globals", () => {
    const noop = () => undefined;
    const html = renderToString(
      <ReactPodContext.Provider
        value={{
          state: {
            ...initialReactPodState,
            screen: "coverflow",
            navigationHistory: ["menu"],
          },
          deviceName: "Server Pod",
          menuItems: [{ id: "coverflow", label: "Coverflow" }],
          photoAlbums: [],
          coverflowAlbums,
          tracks,
          coverflowAriaLabel: "Server album browser",
          rotate: noop,
          setCoverflowIndex: noop,
          select: noop,
          back: noop,
          goToMainMenu: noop,
          togglePlay: noop,
          next: noop,
          previous: noop,
        }}
      >
        <ReactPodCoverflow />
      </ReactPodContext.Provider>,
    );

    expect(typeof window).toBe("undefined");
    expect(html).toContain("Server album browser");
    expect(html).toContain("Server Album");
    expect(html).toContain("/server-album.webp");
  });
});
