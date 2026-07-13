export const coverflowUsageCode = `import {
  Coverflow,
  CoverflowItem,
  LazyImage,
} from "@/components/Coverflow";

const albums = [
  {
    id: "hollow-nomad",
    title: "Hollow Nomad",
    coverUrl: "/albums/hollow-nomad.webp",
    tracks: ["Rising Memories", "Chasing Silence", "Drifting Yesterday"],
  },
  {
    id: "velvet-waltz",
    title: "Velvet Waltz",
    coverUrl: "/albums/velvet-waltz.webp",
    tracks: ["Falling The Summit", "Healing Starlight", "Remembering Horizons"],
  },
  {
    id: "cosmic-oracle",
    title: "Cosmic Oracle",
    coverUrl: "/albums/cosmic-oracle.webp",
    tracks: ["Breaking The Summit", "Remembering Memories", "Chasing The Deep"],
  },
];

export default function AlbumCoverflow() {
  return (
    <Coverflow aria-label="Album covers">
      {albums.map((album, index) => (
        <CoverflowItem
          key={album.id}
          flipLabel={"Show details for " + album.title}
          closeLabel={"Close details for " + album.title}
          backContent={
            <section className="aspect-square rounded-md bg-slate-950 p-5 text-white">
              <h2 className="text-xl font-semibold">{album.title}</h2>
              <ol className="mt-4 list-decimal pl-5">
                {album.tracks.map((track) => (
                  <li key={track}>{track}</li>
                ))}
              </ol>
            </section>
          }
        >
          <LazyImage
            src={album.coverUrl}
            alt={album.title}
            isPriority={index < 3}
          />
        </CoverflowItem>
      ))}
    </Coverflow>
  );
}`;
