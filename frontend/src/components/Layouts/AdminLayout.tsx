"use client";

import { ReactNode, useState } from "react";
import { AdminSidebar } from "../Fragments/AdminSidebar";
import { Menu } from "lucide-react";
import Link from "next/link";

export function AdminLayout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-72 transition-all">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between bg-white border-b border-slate-200 h-16 px-4 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="bg-[#f99a40] p-1.5 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">Peta</span>
            </div>
            <span className="font-bold text-slate-900">Admin Demak</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -mr-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        <main className="flex-1 overflow-x-hidden p-4 md:p-8 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
