import type { ReactPodCoverflowAlbum } from "@/components/ReactPod";
import { REACT_POD_DEMO_TRACKS } from "./react-pod-audio-tracks";

export const REACT_POD_DEMO_COVERFLOW_ALBUMS = REACT_POD_DEMO_TRACKS.map(
  (track) => ({
    id: `album-${track.id}`,
    title: track.album,
    coverSrc: track.artworkSrc,
    coverAlt: track.artworkAlt,
    tracks: [{ id: String(track.id), title: track.title }],
  }),
) satisfies readonly ReactPodCoverflowAlbum[];
