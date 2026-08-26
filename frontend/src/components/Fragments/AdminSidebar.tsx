"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Settings2, 
  Palette, 
  LogOut,
  Map,
  User
} from "lucide-react";
import Image from "next/image";

export function AdminSidebar({ 
  isOpen, 
  setIsOpen 
}: { 
  isOpen: boolean; 
  setIsOpen: (val: boolean) => void; 
}) {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Dashboard Overview",
      href: "/admin",
      icon: LayoutDashboard
    },
    {
      name: "Pengaturan Indikator",
      href: "/admin/indikator",
      icon: Settings2
    },
    {
      name: "Pengaturan Tema",
      href: "/admin/tema",
      icon: Palette
    }
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside 
        className={`fixed left-0 top-0 z-40 h-screen w-64 md:w-72 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Header Logo */}
        <div className="flex h-20 items-center justify-between border-b border-sidebar-border px-6">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="bg-primary p-1.5 rounded-lg flex items-center justify-center shadow-xs">
              <Map className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              Admin Demak
            </span>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-4 py-3.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-white/10 text-white shadow-sm border-l-4 border-primary"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-slate-500"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Profile Section */}
        <div className="border-t border-sidebar-border p-4">
          <div className="mb-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              <Map className="h-5 w-5 text-slate-500" />
              Kembali ke Peta
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
            >
              <LogOut className="h-5 w-5 opacity-70" />
              Logout
            </Link>
          </div>

          {/* User Profile Box */}
          <div className="flex items-center gap-3 rounded-xl bg-black/20 p-3 border border-white/5">
            <div className="h-10 w-10 overflow-hidden rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-bold text-white">
                Admin Utama
              </span>
              <span className="truncate text-xs font-medium text-slate-400">
                Super Administrator
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
