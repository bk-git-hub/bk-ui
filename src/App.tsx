import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";

function App() {
  // 모바일 메뉴가 열렸는지 여부를 관리하는 상태
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const linkClass =
    "block rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors";
  const activeLinkClass = "bg-slate-200 text-slate-900 font-semibold";

  return (
    <div className="flex min-h-screen w-full bg-white font-sans text-slate-800">
      {/* 모바일 메뉴 오버레이
        - 메뉴가 열렸을 때만 보임
        - 클릭하면 메뉴가 닫힘
      */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 사이드바 네비게이션
        - 평소엔 숨겨져 있다가(hidden), 중간 사이즈(md) 화면 이상에서만 보임(md:block)
        - 모바일에서는 isMobileMenuOpen 상태에 따라 보이고 사라짐
      */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 flex-shrink-0 border-r border-slate-200 bg-slate-50/95 p-4 backdrop-blur-sm transition-transform duration-300 ease-in-out md:static md:inset-auto md:z-auto md:translate-x-0 md:bg-slate-50/50 md:backdrop-blur-none ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} `}
      >
        <h1 className="font-praise mb-6 text-4xl text-black">Bk ui</h1>
        <nav className="flex flex-col space-y-1">
          <NavLink
            to="/"
            end
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
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        {/* 모바일 헤더
          - 중간 사이즈(md) 화면 이상에서는 숨겨짐 (md:hidden)
        */}
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-sm md:hidden">
          <span className="font-praise text-2xl">B k - u i</span>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </header>

        {/* 페이지 컨텐츠 영역 */}
        <main className="w-screen flex-1 overflow-y-auto p-4 sm:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default App;
