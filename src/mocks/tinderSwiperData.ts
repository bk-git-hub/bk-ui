const RESPONSIVE_IMAGE_WIDTHS = [400, 800, 1200] as const;

const createUnsplashImage = (photoUrl: string) => {
  const url = new URL(photoUrl);
  url.searchParams.set("auto", "format");
  url.searchParams.set("fit", "crop");
  url.searchParams.set("q", "80");

  const urlForWidth = (width: number) => {
    const sizedUrl = new URL(url);
    sizedUrl.searchParams.set("w", String(width));
    return sizedUrl.toString();
  };

  return {
    src: urlForWidth(800),
    srcSet: RESPONSIVE_IMAGE_WIDTHS.map(
      (width) => `${urlForWidth(width)} ${width}w`,
    ).join(", "),
  };
};

export const TINDER_DEMO_IMAGES = {
  jennifer: createUnsplashImage(
    "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e",
  ),
  david: createUnsplashImage(
    "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6",
  ),
  sophia: createUnsplashImage(
    "https://images.unsplash.com/photo-1580489944761-15a19d654956",
  ),
  michael: createUnsplashImage(
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d",
  ),
  emily: createUnsplashImage(
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2",
  ),
} as const;

export type TinderDemoImageKey = keyof typeof TINDER_DEMO_IMAGES;

export const SAMPLE_CARDS = [
  {
    id: "1",
    name: "Jennifer",
    age: 24,
    imageKey: "jennifer",
    image: TINDER_DEMO_IMAGES.jennifer,
  },
  {
    id: "2",
    name: "David",
    age: 28,
    imageKey: "david",
    image: TINDER_DEMO_IMAGES.david,
  },
  {
    id: "3",
    name: "Sophia",
    age: 26,
    imageKey: "sophia",
    image: TINDER_DEMO_IMAGES.sophia,
  },
  {
    id: "4",
    name: "Michael",
    age: 30,
    imageKey: "michael",
    image: TINDER_DEMO_IMAGES.michael,
  },
  {
    id: "5",
    name: "Emily",
    age: 22,
    imageKey: "emily",
    image: TINDER_DEMO_IMAGES.emily,
  },
] as const satisfies readonly {
  id: string;
  name: string;
  age: number;
  imageKey: TinderDemoImageKey;
  image: { src: string; srcSet: string };
}[];
