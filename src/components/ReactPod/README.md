# ReactPod

`ReactPod`은 프레임워크 중립적인 React + Tailwind 컴포넌트입니다. 내부 입력에는 독립 공개 컴포넌트인 `ClickWheel`을 사용하고 앨범 탐색에는 공개 `Coverflow` 코어를 합성하며, `next/*` 또는 Next.js 런타임에 의존하지 않습니다.

## 일반 React / Vite

```tsx
import { ReactPod, type ReactPodCoverflowAlbum } from "@/components/ReactPod";

const coverflowAlbums = [
  {
    id: "night-drive",
    title: "Night Drive",
    coverSrc: "/albums/night-drive.webp",
    coverAlt: "Blue city lights on the Night Drive album cover",
    tracks: [{ id: "streetlights", title: "Streetlights" }],
  },
] satisfies readonly ReactPodCoverflowAlbum[];

export function PlayerPreview() {
  return (
    <ReactPod
      deviceName="My Pod"
      coverflowAlbums={coverflowAlbums}
      wheelSensitivity={1.25}
    />
  );
}
```

기본 메인 메뉴에는 `Coverflow` 항목이 포함됩니다. `coverflowAlbums`는 빈 배열이 기본값이며, 앨범과 트랙은 소비자가 직렬화 가능한 데이터로 주입합니다. Coverflow 화면에서는 ReactPod 클릭휠의 원형 회전·마우스 휠·방향키가 활성 앨범 인덱스를 이동하며, Coverflow 자체의 좌우 방향키·마우스 휠·드래그와 같은 상태를 공유합니다. 활성 커버의 Enter/Space 또는 클릭으로 상세 면을 뒤집고, X와 바깥 클릭은 앞면으로 돌아가며 ReactPod의 MENU는 이전 메뉴로 복귀합니다.

휠만 필요한 경우에는 `@/components/ClickWheel`에서 가져오고, 버튼 내용·ARIA·클래스·이벤트는 `buttonProps`로 바꿉니다. 자세한 예시는 [ClickWheel README](../ClickWheel/README.md)에 있습니다.

`wheelSensitivity`는 원형 드래그 민감도 배율이며 기본값은 `1`입니다. `0.5`–`2` 범위에서 값이 클수록 작은 원형 움직임에 더 빠르게 반응합니다. 키보드와 마우스 휠 입력은 항상 한 번에 한 단계씩 이동합니다.

## Next.js App Router

`ReactPod` 자체가 Client Component 경계를 제공하므로 Server Component에서 명시적인 client 진입점을 가져와 직렬화 가능한 props를 전달할 수 있습니다.

```tsx
// app/player/page.tsx
import {
  ReactPod,
  type ReactPodCoverflowAlbum,
} from "@/components/ReactPod/client";

const coverflowAlbums = [
  {
    id: "night-drive",
    title: "Night Drive",
    coverSrc: "/albums/night-drive.webp",
    coverAlt: "Blue city lights on the Night Drive album cover",
    tracks: [{ id: "streetlights", title: "Streetlights" }],
  },
] satisfies readonly ReactPodCoverflowAlbum[];

export default function PlayerPage() {
  return (
    <ReactPod
      deviceName="My Pod"
      coverflowAlbums={coverflowAlbums}
      wheelSensitivity={1.25}
    />
  );
}
```

예시 이미지는 `public/albums/night-drive.webp`에 둡니다. 복사한 소스의 `@/*` import는 `src/*` alias를 전제로 하므로, 프로젝트에 alias가 없다면 `tsconfig.json`에 추가하거나 상대 경로로 바꿉니다. 앨범 데이터는 직렬화 가능하므로 Server Component에서 전달할 수 있습니다. 렌더 중 `window`나 `document`에 접근하지 않고 Coverflow의 측정·입력 listener도 effect 이후에 연결되므로 SSR에 안전합니다. Next.js 전용 소스 복제나 런타임 의존성은 필요하지 않습니다.

## Tailwind CSS

컴포넌트를 소비 앱의 `src` 또는 `app` 아래에 복사하면 Tailwind CSS v4가 클래스를 자동 탐지합니다. 별도 모노레포 경로에서 직접 가져올 때는 전역 CSS에 세 소스 경로를 등록합니다.

```css
@import "tailwindcss";
@source "../packages/bk-ui/src/components/ReactPod";
@source "../packages/bk-ui/src/components/ClickWheel";
@source "../packages/bk-ui/src/components/Coverflow";
```
