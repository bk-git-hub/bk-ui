import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";

function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const linkClass =
    "block rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors";
  const activeLinkClass = "bg-slate-200 text-slate-900 font-semibold";

  return (
    <div className="flex min-h-screen w-full bg-white font-sans text-slate-800">
      {/* 모바일 메뉴 오버레이 */}
      {isMobileMenuOpen && (
        <div
          // ⬇️ md:hidden -> sm:hidden
          className="fixed inset-0 z-20 bg-black/30 sm:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 사이드바 네비게이션 */}
      <aside
        // ⬇️ 모든 md: 클래스를 sm: 으로 변경
        className={`fixed inset-y-0 left-0 z-30 w-64 flex-shrink-0 border-r border-slate-200 bg-slate-50/95 p-4 backdrop-blur-sm transition-transform duration-300 ease-in-out sm:static sm:inset-auto sm:z-auto sm:translate-x-0 sm:bg-slate-50/50 sm:backdrop-blur-none ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } `}
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
        {/* 모바일 헤더 */}
        <header
          // ⬇️ md:hidden -> sm:hidden
          className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-sm sm:hidden"
        >
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
        <main className="w-full flex-1 overflow-y-auto p-4 sm:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default App;
