# Coverflow

An interactive React + Tailwind CSS component for browsing items and flipping
the active item between front and back faces, inspired by Apple Cover Flow. The
shared implementation is framework-neutral and contains no `next/*` imports or
Next.js runtime dependency.

## React and Vite

Import from the framework-neutral entry:

```tsx
import { Coverflow, CoverflowItem, LazyImage } from "@/components/Coverflow";

export function AlbumGallery({ albums }: { albums: Album[] }) {
  return (
    <div className="h-96 w-full">
      <Coverflow aria-label="Album covers">
        {albums.map((album, index) => (
          <CoverflowItem
            key={album.id}
            flipLabel={`Toggle details for ${album.title}`}
            closeLabel={`Close details for ${album.title}`}
            backContent={
              <section className="aspect-square rounded-md bg-slate-950 p-5 text-white">
                <h2 className="text-xl font-semibold">{album.title}</h2>
                <ol className="mt-4 list-decimal pl-5">
                  {album.tracks.map((track) => (
                    <li key={track.id}>{track.title}</li>
                  ))}
                </ol>
              </section>
            }
          >
            <LazyImage
              src={album.coverUrl}
              alt={`${album.title} cover`}
              isPriority={index < 3}
            />
          </CoverflowItem>
        ))}
      </Coverflow>
    </div>
  );
}
```

When the source files live under the application's `src/components` directory,
they are covered by the usual Tailwind source scan.

`Coverflow` fills the width and height of its nearest sized parent and centers
the largest square item that fits inside it. Give the parent a definite height
when it should fill a fixed area. Without one, the component uses a 3.6:1
fallback aspect ratio so width-only layouts retain a useful natural height.

## Next.js App Router

This is an interactive component. Import it from the entry that explicitly
provides the `'use client'` boundary:

```tsx
// app/albums/album-coverflow.tsx
"use client";

import {
  Coverflow,
  CoverflowItem,
  LazyImage,
} from "@/components/Coverflow/client";

export function AlbumCoverflow({ albums }: { albums: Album[] }) {
  return (
    <div className="h-96 w-full">
      <Coverflow aria-label="Album covers">
        {albums.map((album) => (
          <CoverflowItem
            key={album.id}
            flipLabel={`Toggle details for ${album.title}`}
            closeLabel={`Close details for ${album.title}`}
            backContent={<AlbumDetails album={album} />}
          >
            <LazyImage src={album.coverUrl} alt={`${album.title} cover`} />
          </CoverflowItem>
        ))}
      </Coverflow>
    </div>
  );
}
```

A Server Component can fetch the album data and pass serializable props to this
Client Component. Keep consumer callbacks and browser APIs inside the same
client boundary. To use `next/image`, compose it as the item's front content;
the Coverflow core itself remains independent of Next.js.

If the package source or output is installed under `node_modules` and Tailwind
CSS v4 does not discover its classes automatically, register the actual package
path in the application's global CSS:

```css
@import "tailwindcss";
@source "../node_modules/bk-ui/src/components/Coverflow";
```

If only `dist` is published, point `@source` to the real `dist` directory
that contains the Coverflow classes.

## SSR and hydration

- Server rendering starts from a deterministic 200 px item size. A
  `ResizeObserver` measures the parent content box after mount and fits the
  square item to both its width and height.
- `window`, `ResizeObserver`, media queries, and global input listeners are
  accessed only from effects.
- `requestAnimationFrame` runs only after user input.
- `prefers-reduced-motion: reduce` disables transitions and drag inertia.

## Public API and accessibility

- React/Vite entry: `@/components/Coverflow`
- Next.js entry: `@/components/Coverflow/client`
- `Coverflow` accepts children, `className`, standard div attributes,
  ARIA/data attributes, and event handlers.
- `CoverflowItem` uses `children` as the front face and optional
  `backContent` as the back. `flipLabel` names its toggle button and
  `closeLabel` names the close button.
- `LazyImage` reports image readiness to its containing item.

Only the active item's native toggle button participates in the Tab order.
Enter and Space flip it; Left and Right move within a focused Coverflow. Hidden
faces use `aria-hidden` and `inert` so assistive technology and keyboard focus
do not enter them. While an item is flipped, its top-right close button or a
click outside the square item surface returns it to the front face.

The same core implementation can therefore be used in React/Vite and Next.js
App Router projects without duplication.
