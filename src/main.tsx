import React, { lazy } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import LazyPage from "./components/layout/lazy-page.tsx";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import HomePage from "./pages/HomePage.tsx";

const loadTinderDemoPage = () => import("./pages/TinderDemoPage.tsx");
const loadCoverflowPage = () => import("./pages/CoverflowPage.tsx");
const loadReactPodPage = () => import("./pages/ReactPodPage.tsx");
const loadLottoDemoPage = () => import("./pages/LottoDemoPage.tsx");
const loadSlotMachineDemoPage = () => import("./pages/SlotMachineDemoPage.tsx");
const loadBaccaratSqueezeDemoPage = () =>
  import("./pages/BaccaratSqueezeDemoPage.tsx");
const loadCardsStackSliderDemoPage = () =>
  import("./pages/CardsStackSliderDemoPage.tsx");
const loadShaderSliderDemoPage = () =>
  import("./pages/ShaderSliderDemoPage.tsx");

const TinderDemoPage = lazy(loadTinderDemoPage);
const CoverflowPage = lazy(loadCoverflowPage);
const ReactPodPage = lazy(loadReactPodPage);
const LottoDemoPage = lazy(loadLottoDemoPage);
const SlotMachineDemoPage = lazy(loadSlotMachineDemoPage);
const BaccaratSqueezeDemoPage = lazy(loadBaccaratSqueezeDemoPage);
const CardsStackSliderDemoPage = lazy(loadCardsStackSliderDemoPage);
const ShaderSliderDemoPage = lazy(loadShaderSliderDemoPage);

const routePageLoaders = new Map<string, () => Promise<unknown>>([
  ["/components/tinder-swiper", loadTinderDemoPage],
  ["/components/coverflow", loadCoverflowPage],
  ["/components/react-pod", loadReactPodPage],
  ["/components/lotto", loadLottoDemoPage],
  ["/components/slot-machine", loadSlotMachineDemoPage],
  ["/components/baccarat-squeeze", loadBaccaratSqueezeDemoPage],
  ["/components/cards-stack-slider", loadCardsStackSliderDemoPage],
  ["/components/shader-slider", loadShaderSliderDemoPage],
]);
const preloadedRoutes = new Set<string>();

function preloadLinkedRoute(event: Event) {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const link = target.closest("a");
  if (!(link instanceof HTMLAnchorElement)) return;

  const loader = routePageLoaders.get(link.pathname);
  if (!loader || preloadedRoutes.has(link.pathname)) return;

  preloadedRoutes.add(link.pathname);
  void loader().catch(() => preloadedRoutes.delete(link.pathname));
}

document.addEventListener("pointerover", preloadLinkedRoute, { passive: true });
document.addEventListener("focusin", preloadLinkedRoute);

// ⬇️ 라우터 설정을 생성합니다.
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />, // App 컴포넌트가 전체 레이아웃(사이드바 등) 역할을 합니다.
    children: [
      {
        index: true, // 기본 페이지 (path: '/')
        element: <HomePage />,
      },
      {
        path: "components/tinder-swiper", // path: '/components/tinder-swiper'
        element: (
          <LazyPage>
            <TinderDemoPage />
          </LazyPage>
        ),
      },
      {
        path: "components/coverflow", // path: '/components/tinder-swiper'
        element: (
          <LazyPage>
            <CoverflowPage />
          </LazyPage>
        ),
      },
      {
        path: "components/react-pod", // path: '/components/tinder-swiper'
        element: (
          <LazyPage>
            <ReactPodPage />
          </LazyPage>
        ),
      },
      {
        path: "components/lotto",
        element: (
          <LazyPage>
            <LottoDemoPage />
          </LazyPage>
        ),
      },
      {
        path: "components/slot-machine",
        element: (
          <LazyPage>
            <SlotMachineDemoPage />
          </LazyPage>
        ),
      },
      {
        path: "components/baccarat-squeeze",
        element: (
          <LazyPage>
            <BaccaratSqueezeDemoPage />
          </LazyPage>
        ),
      },
      {
        path: "components/cards-stack-slider",
        element: (
          <LazyPage>
            <CardsStackSliderDemoPage />
          </LazyPage>
        ),
      },
      {
        path: "components/shader-slider",
        element: (
          <LazyPage>
            <ShaderSliderDemoPage />
          </LazyPage>
        ),
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
