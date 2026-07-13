import type {
  ReactPodPhoto,
  ReactPodPhotoAlbum,
} from "@/components/ReactPod/ReactPod";

const REACT_POD_DEMO_PHOTOS = [
  {
    id: "han-river-blue-hour",
    src: "/reactpod/photos/han-river.webp",
    alt: "Han River and bridge lights reflected on the water at blue hour",
    caption: "Han River · Blue Hour",
  },
  {
    id: "neon-alley",
    src: "/reactpod/photos/neon-alley.webp",
    alt: "A bicycle in a neon-lit alley after rain",
    caption: "Neon Alley · Late Night",
  },
  {
    id: "sea-platform",
    src: "/reactpod/photos/sea-platform.webp",
    alt: "A quiet seaside train platform facing a bright blue ocean",
    caption: "Next Stop · The Sea",
  },
  {
    id: "seaside-picnic",
    src: "/reactpod/photos/seaside-picnic.webp",
    alt: "Tangerines, a camera, and a music player on a seaside picnic blanket",
    caption: "Picnic Tape · Side A",
  },
] satisfies readonly ReactPodPhoto[];

export const REACT_POD_DEMO_PHOTO_ALBUMS: readonly ReactPodPhotoAlbum[] = [
  {
    id: "photo-library",
    title: "Photo Library",
    photos: REACT_POD_DEMO_PHOTOS,
  },
  {
    id: "city-lights",
    title: "City Lights",
    photos: REACT_POD_DEMO_PHOTOS.slice(0, 2),
  },
  {
    id: "weekend-away",
    title: "Weekend Away",
    photos: REACT_POD_DEMO_PHOTOS.slice(2),
  },
];
