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

### 빌드
```bash
pnpm build
```
