import { useState } from "react";
import Header from "./components/layout/header";
import { Outlet } from "react-router-dom";

// 1. Navigation links are now in a constant array for easier management

function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full flex-col bg-white font-sans text-slate-800 md:flex-row">
      <Header
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      <div className="flex flex-1 flex-col">
        {/* Page Content Area */}
        <main className="w-full flex-1 overflow-y-auto p-4 md:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default App;
