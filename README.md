# BK-UI

React 19와 Tailwind CSS v4를 기반으로 구축된 고성능 인터랙티브 UI 컴포넌트 라이브러리입니다.

## 기술 스택

- **Framework**: React 19 (Vite)
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript
- **Icons**: Lucide React
- **Utility**: tailwind-merge, clsx

## 주요 컴포넌트

### 1. Coverflow (3D Carousel)

- **성능 최적화**: 고빈도 드래그/휠 이벤트 발생 시 `useRef`와 직접적인 DOM 조작을 통해 리액트 리렌더링을 최소화하고 부드러운 60fps 애니메이션을 구현했습니다.
- **인터랙션**: 마우스 드래그, 터치 스와이프, 마우스 휠, 키보드 네비게이션을 모두 지원합니다.

### 2. Tinder Swipe (Card Deck)

- **설계 패턴**: Compound Component 패턴을 적용하여 UI 구조를 유연하게 정의할 수 있습니다.
- **기능**: 스와이프 방향에 따른 콜백(Like/Nope), 실행 취소(Undo), 초기화(Reset) 기능을 지원합니다.

### 3. ReactPod (Retro UI)

- **구조**: `Context API`를 활용한 상태 관리로 클릭 휠 인터랙션과 디스플레이 동기화를 구현했습니다.

## 프로젝트 구조

- `src/components/Coverflow`: 3D 이미지 캐러셀 로직 및 컴포넌트
- `src/components/Tinder`: 스와이프 카드 시스템 및 관련 훅
- `src/components/ReactPod`: 아이팟 스타일 UI 컴포넌트
- `src/components/layout`: 헤더 등 공통 레이아웃 컴포넌트

## 실행 방법

### 패키지 설치

```bash
pnpm install
```

### 개발 서버 실행

```bash
pnpm dev
```

## Export 탭 공개 전환

컴포넌트 페이지는 기본적으로 `Preview`, `Code`, `Usage`와 컴포넌트별
GitHub 소스 링크만 노출합니다. React/Next.js export 구현은 코드에 보존되며,
배포 준비가 끝난 뒤 아래 환경 변수 하나로 두 탭을 다시 공개할 수 있습니다.

```bash
VITE_ENABLE_COMPONENT_EXPORT_TABS=true
```

로컬 `.env` 또는 배포 환경 변수에 값을 설정한 뒤 다시 빌드하세요. 값을
설정하지 않거나 `false`로 두면 `React Export`, `Next.js Export` 탭은
접근성 트리와 키보드 탭 순서에서도 제외됩니다.

### 빌드

```bash
pnpm build
```

## Coverflow performance benchmark

The benchmark builds a dedicated production page and repeats a fixed wheel and drag scenario. Wheel input is dispatched in same-frame bursts so requestAnimationFrame coalescing is measurable, and frame statistics include only the active wheel and drag/inertia phases.

```bash
# Baseline
pnpm test:perf -- --label before --runs 10 --cpu 4 --assets fixture

# Optimized implementation
pnpm test:perf -- --label after --runs 10 --cpu 4 --assets fixture

# Compare both reports
pnpm test:perf:compare -- performance-results/before.json performance-results/after.json --output performance-results/comparison.md
```

Use `--assets fixture` for publishable before/after numbers because it removes external image and font variance. Use `--assets real` only as a network-inclusive reference. Test scalability with an option such as `--items 100`. Boolean options accept explicit values, so `--headed=false` and `--skip-build=false` remain disabled. `--connect http://127.0.0.1:9222` reuses an externally launched browser without requiring a locally discoverable Chrome executable.

Reports are written to `performance-results/<label>.json` and `.md`. Use at least 10 runs and report the median. The comparison command rejects different report schemas, harness workloads, run counts, browser/headless modes, platforms, CPU models, Node versions, viewports, CPU throttles, item counts, or asset modes. Unobserved metrics are reported as `n/a` rather than zero.

Key metrics:

- `p95 active frame time`: lower is better; 16.7ms is the 60fps frame budget.
- `active frames over 20ms`: percentage of visibly slow frames during the measured interaction phases.
- `p95 burst wheel handler`: synchronous cost per wheel event while several events arrive in one animation frame.
- `task/script/style/layout time`: main-thread time for the fixed interaction.
- `image requests/completed images`: initial image work affected by windowing; fixture runs fail if displayed images are not ready.
- `listener additions/removals`: event-listener churn during interaction.

Calculate reduction with `(before - after) / before * 100`. For percentage metrics, report the absolute difference in percentage points (`%p`) as well. Do not use total benchmark wall time as a performance claim because it includes browser startup and server waiting.
