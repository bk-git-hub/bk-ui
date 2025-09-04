import NavigationLink from "./navigation-link";

const Header = ({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}: {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
}) => {
  return (
    <>
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 flex-shrink-0 border-r border-slate-200 bg-slate-50/95 p-4 backdrop-blur-sm transition-transform duration-300 ease-in-out md:static md:inset-auto md:z-auto md:translate-x-0 md:bg-slate-50/50 md:backdrop-blur-none ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } `}
      >
        <div className="flex items-center justify-between">
          <h1 className="font-praise mb-6 text-4xl text-black">Bk ui</h1>
          {/* Close button for mobile */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 md:hidden"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <NavigationLink onLinkClick={() => setIsMobileMenuOpen(false)} />
      </aside>

      {/* Mobile Header */}
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-sm md:hidden">
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
        <span className="font-praise text-2xl">Bk ui</span>
      </header>
    </>
  );
};

export default Header;
