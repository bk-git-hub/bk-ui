import type { ReactPodCoverflowAlbum } from "@/components/ReactPod";

export const REACT_POD_DEMO_COVERFLOW_ALBUMS = [
  {
    id: "blue-hour",
    title: "Blue Hour",
    coverSrc: "/reactpod/photos/han-river.webp",
    coverAlt: "Han River lights reflected at blue hour",
    tracks: [
      { id: "blue-hour-1", title: "Bridge Lights" },
      { id: "blue-hour-2", title: "Last Train Home" },
      { id: "blue-hour-3", title: "River Static" },
    ],
  },
  {
    id: "neon-streets",
    title: "Neon Streets",
    coverSrc: "/reactpod/photos/neon-alley.webp",
    coverAlt: "A bicycle waiting in a neon-lit alley",
    tracks: [
      { id: "neon-streets-1", title: "After the Rain" },
      { id: "neon-streets-2", title: "Violet Signs" },
      { id: "neon-streets-3", title: "Night Bicycle" },
    ],
  },
  {
    id: "ocean-line",
    title: "Ocean Line",
    coverSrc: "/reactpod/photos/sea-platform.webp",
    coverAlt: "A seaside train platform facing a blue ocean",
    tracks: [
      { id: "ocean-line-1", title: "Platform Two" },
      { id: "ocean-line-2", title: "Coastal Local" },
      { id: "ocean-line-3", title: "Next Stop, Summer" },
    ],
  },
  {
    id: "picnic-tape",
    title: "Picnic Tape",
    coverSrc: "/reactpod/photos/seaside-picnic.webp",
    coverAlt: "A camera and music player on a seaside picnic blanket",
    tracks: [
      { id: "picnic-tape-1", title: "Side A" },
      { id: "picnic-tape-2", title: "Tangerine Sun" },
      { id: "picnic-tape-3", title: "Wind Rewind" },
    ],
  },
] satisfies readonly ReactPodCoverflowAlbum[];
