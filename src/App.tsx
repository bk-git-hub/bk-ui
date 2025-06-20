import { Outlet, NavLink } from "react-router-dom";

function App() {
  const linkClass =
    "block rounded-md px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white";
  const activeLinkClass = "bg-slate-900 text-white";

  return (
    <div className="flex min-h-screen w-full bg-slate-950 text-white">
      {/* 사이드바 네비게이션 */}
      <aside className="w-64 flex-shrink-0 border-r border-slate-800 p-4">
        <h1 className="mb-6 text-xl font-bold text-white">UI Components</h1>
        <nav className="flex flex-col space-y-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? `${linkClass} ${activeLinkClass}` : linkClass
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/components/tinder-slider"
            className={({ isActive }) =>
              isActive ? `${linkClass} ${activeLinkClass}` : linkClass
            }
          >
            Tinder Slider
          </NavLink>
          {/* 나중에 다른 컴포넌트 추가 예시
          <NavLink to="/components/accordion" className={...}>
            Accordion
          </NavLink>
          */}
        </nav>
      </aside>

      {/* 페이지 컨텐츠 영역 */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8">
        {/* 자식 라우트의 컴포넌트가 여기에 렌더링됩니다. */}
        <Outlet />
      </main>
    </div>
  );
}

export default App;
