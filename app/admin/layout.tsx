"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  // const [isMounted, setIsMounted] = useState(false);

  // useEffect(() => {
  //   const saved = localStorage.getItem("sidebar_collapsed");
  //   if (saved === "true") {
  //     setIsCollapsed(true);
  //   }
  //   setIsMounted(true);
  // }, []);

  const toggleSidebar = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem("sidebar_collapsed", String(nextState));
  };

  return (
    <div className="relative flex h-dvh min-h-0 overflow-hidden">
      {/* Sidebar container */}
      <div
        className={`shrink-0 overflow-hidden bg-slate-900 ${
          ""
          // isMounted ? "transition-all duration-300 ease-in-out" : ""
        } ${isCollapsed ? "w-0" : "w-64"}`}
      >
        <div className="w-64 h-full">
          <Sidebar />
        </div>
      </div>

      {/* Collapse/Expand Toggle Button */}
      <button
        onClick={toggleSidebar}
        className={`absolute top-[38px] z-50 flex h-6 w-6 items-center justify-center rounded-full border shadow-md cursor-pointer ${
          ""
          // isMounted ? "transition-all duration-300 ease-in-out" : ""
        } ${
          isCollapsed
            ? "left-4 bg-white border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            : "left-[244px] bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
        }`}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Main Content Area */}
      <main
        className={`min-h-0 flex-1 overflow-y-auto bg-slate-50 ${
          ""
          // isMounted ? "transition-all duration-300 ease-in-out" : ""
        } ${isCollapsed ? "pl-12" : ""}`}
      >
        {children}
      </main>
    </div>
  );
}
