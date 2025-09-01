import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// ⬇️ 페이지 컴포넌트들을 import 합니다.
import HomePage from "./pages/HomePage.tsx";
import TinderDemoPage from "./pages/TinderDemoPage.tsx";
import CoverflowPage from "./pages/CoverflowPage.tsx";

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
        path: "components/tinder-slider", // path: '/components/tinder-slider'
        element: <TinderDemoPage />,
      },
      {
        path: "components/coverflow", // path: '/components/tinder-slider'
        element: <CoverflowPage />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
