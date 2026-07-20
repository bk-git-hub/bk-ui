# ReactPod

`ReactPod`은 프레임워크 중립적인 React + Tailwind 컴포넌트입니다. 내부 입력에는 독립 공개 컴포넌트인 `ClickWheel`을 사용하고, `Coverflow`, `SlicerSlider`, `ExpoSlider`, `CardsStackSlider` 공개 코어를 작은 디스플레이에 맞게 합성합니다. `next/*` 또는 Next.js 런타임에는 의존하지 않습니다.

## 일반 React / Vite

```tsx
import {
  ReactPod,
  type ReactPodCoverflowAlbum,
  type ReactPodSliderItem,
  type ReactPodTrack,
} from "@/components/ReactPod";

const tracks = [
  {
    id: "streetlights",
    title: "Streetlights",
    artist: "Night Drive",
    album: "Night Drive",
    duration: 214,
    src: "/audio/streetlights.mp3",
    artworkSrc: "/albums/night-drive.webp",
    artworkAlt: "Blue city lights on the Night Drive album cover",
  },
] satisfies readonly ReactPodTrack[];

const coverflowAlbums = [
  {
    id: "night-drive",
    title: "Night Drive",
    coverSrc: "/albums/night-drive.webp",
    coverAlt: "Blue city lights on the Night Drive album cover",
    tracks: [{ id: "streetlights", title: "Streetlights" }],
  },
] satisfies readonly ReactPodCoverflowAlbum[];

const sliderItems = [
  {
    id: "platform-blue",
    title: "Platform Blue",
    description: "A pause between the railway and an open horizon.",
    imageSrc: "/slides/platform-blue.webp",
    imageAlt: "A railway platform facing a bright blue sea",
  },
  {
    id: "after-rain",
    title: "After Rain",
    description: "Neon gathers in every footprint after rain.",
    imageSrc: "/slides/after-rain.webp",
    imageAlt: "A neon-lit city street after rain",
  },
] satisfies readonly ReactPodSliderItem[];

export function PlayerPreview() {
  return (
    <ReactPod
      deviceName="My Pod"
      tracks={tracks}
      coverflowAlbums={coverflowAlbums}
      sliderItems={sliderItems}
      wheelSensitivity={1.25}
    />
  );
}
```

`tracks`에는 소비자가 소유한 음원 URL과 메타데이터를 주입합니다. `src`가
있으면 ReactPod은 브라우저의 네이티브 `<audio>` 한 개로 실제 음원을
재생하고, 재생/일시정지·이전/다음·진행률·종료 후 다음 곡·Now Playing
화면의 휠 볼륨을 동기화합니다. 활성 곡만 `preload="metadata"`로 로드하며
추가 미디어 라이브러리는 필요하지 않습니다. `artworkSrc`는 Now Playing과
메뉴 미리보기에 표시되고, `artwork`에는 이미지가 없을 때 사용할 CSS
배경을 전달할 수 있습니다.

기본 메인 메뉴에는 `Coverflow` 항목이 포함됩니다. `coverflowAlbums`는 빈 배열이 기본값이며, 앨범과 트랙은 소비자가 직렬화 가능한 데이터로 주입합니다. Coverflow 화면에서는 ReactPod 클릭휠의 원형 회전·마우스 휠·방향키가 활성 앨범 인덱스를 이동하며, Coverflow 자체의 좌우 방향키·마우스 휠·드래그와 같은 상태를 공유합니다. 활성 커버의 Enter/Space 또는 클릭으로 상세 면을 뒤집고, X와 바깥 클릭은 앞면으로 돌아가며 ReactPod의 MENU는 이전 메뉴로 복귀합니다.

`sliderItems`도 빈 배열이 기본값입니다. 같은 직렬화 가능한 데이터가 Slicer Slider, Expo Slider, Cards Stack 세 화면에 공급됩니다. 각 화면은 기존 slider의 공개 Previous/Next primitive를 공통 ClickWheel controller에 등록하므로, 원형 회전·휠 좌우 버튼과 slider 자체의 드래그·키보드 입력이 동일한 내부 전환 상태를 사용합니다. 가운데 버튼은 현재 항목의 설명을 열고, MENU는 이전 메뉴, MENU 길게 누르기와 Home은 메인 메뉴로 돌아갑니다. 세 slider의 전환 로직을 ReactPod reducer로 복제하지 않습니다.

휠만 필요한 경우에는 `@/components/ClickWheel`에서 가져오고, 버튼 내용·ARIA·클래스·이벤트는 `buttonProps`로 바꿉니다. 자세한 예시는 [ClickWheel README](../ClickWheel/README.md)에 있습니다.

`wheelSensitivity`는 원형 드래그 민감도 배율이며 기본값은 `1`입니다. `0.5`–`2` 범위에서 값이 클수록 작은 원형 움직임에 더 빠르게 반응합니다. 키보드와 마우스 휠 입력은 항상 한 번에 한 단계씩 이동합니다.

## Next.js App Router

`ReactPod` 자체가 Client Component 경계를 제공하므로 Server Component에서 명시적인 client 진입점을 가져와 직렬화 가능한 props를 전달할 수 있습니다.

```tsx
// app/player/page.tsx
import {
  ReactPod,
  type ReactPodCoverflowAlbum,
  type ReactPodSliderItem,
  type ReactPodTrack,
} from "@/components/ReactPod/client";

const tracks = [
  {
    id: "streetlights",
    title: "Streetlights",
    artist: "Night Drive",
    album: "Night Drive",
    duration: 214,
    src: "/audio/streetlights.mp3",
    artworkSrc: "/albums/night-drive.webp",
    artworkAlt: "Blue city lights on the Night Drive album cover",
  },
] satisfies readonly ReactPodTrack[];

const coverflowAlbums = [
  {
    id: "night-drive",
    title: "Night Drive",
    coverSrc: "/albums/night-drive.webp",
    coverAlt: "Blue city lights on the Night Drive album cover",
    tracks: [{ id: "streetlights", title: "Streetlights" }],
  },
] satisfies readonly ReactPodCoverflowAlbum[];

const sliderItems = [
  {
    id: "platform-blue",
    title: "Platform Blue",
    description: "A pause between the railway and an open horizon.",
    imageSrc: "/slides/platform-blue.webp",
    imageAlt: "A railway platform facing a bright blue sea",
  },
] satisfies readonly ReactPodSliderItem[];

export default function PlayerPage() {
  return (
    <ReactPod
      deviceName="My Pod"
      tracks={tracks}
      coverflowAlbums={coverflowAlbums}
      sliderItems={sliderItems}
      wheelSensitivity={1.25}
    />
  );
}
```

예시 MP3는 `public/audio/streetlights.mp3`, 이미지는 `public/albums/night-drive.webp`와 `public/slides/platform-blue.webp`에 둡니다. 복사한 소스의 `@/*` import는 `src/*` alias를 전제로 하므로, 프로젝트에 alias가 없다면 `tsconfig.json`에 추가하거나 상대 경로로 바꿉니다. 트랙·앨범·slider 데이터는 직렬화 가능하므로 Server Component에서 전달할 수 있습니다. controller 함수와 ref는 ReactPod의 기존 client 경계 안에서만 생성됩니다. 렌더 중 `window`, `document`, `new Audio()`에 접근하지 않고 실제 재생과 slider의 측정·입력 listener는 hydration 이후 effect 또는 사용자 입력에서만 실행되므로 SSR에 안전합니다. Next.js 전용 소스 복제나 런타임 의존성은 필요하지 않습니다.

## Tailwind CSS

컴포넌트를 소비 앱의 `src` 또는 `app` 아래에 복사하면 Tailwind CSS v4가 클래스를 자동 탐지합니다. 별도 모노레포 경로에서 직접 가져올 때는 전역 CSS에 관련 소스 경로를 등록합니다.

```css
@import "tailwindcss";
@source "../packages/bk-ui/src/components/ReactPod";
@source "../packages/bk-ui/src/components/ClickWheel";
@source "../packages/bk-ui/src/components/Coverflow";
@source "../packages/bk-ui/src/components/SlicerSlider";
@source "../packages/bk-ui/src/components/ExpoSlider";
@source "../packages/bk-ui/src/components/CardsStackSlider";
```

## 데모 Usage 코드

ReactPod 데모의 Usage 탭은 여러 TSX 예제를 받을 수 있으며 현재 두 항목을 제공합니다.

- `Public API`: 소비자가 공개 `ReactPod` entry와 직렬화 가능한 props만 사용해 가져오는 완전한 예제
- `Internal composition`: Display가 모든 메뉴 화면을 선택하고, Coverflow의 controlled index와 세 slider의 Previous/Next primitive를 공통 ClickWheel controller에 연결하는 현재 구조

추가 예제가 필요하면 `ReactPodPage`의 `usageExamples` 배열에 고유한 `id`, 표시할 `label`, `code`, `language`, `description`을 가진 항목을 더합니다.
