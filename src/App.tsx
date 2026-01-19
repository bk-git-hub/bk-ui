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
      <div className="flex h-screen w-full flex-1 flex-col px-5 py-5 md:px-10">
        {/* Page Content Area */}

        <Outlet />
      </div>
    </div>
  );
}

export default App;
