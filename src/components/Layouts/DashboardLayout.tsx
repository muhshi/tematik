"use client";

import { type ReactNode, useState } from "react";
import { Sidebar } from "@/components/Fragments/Sidebar";
import { Menu } from "lucide-react";
import { Button } from "@/components/Elements/button";
import Image from "next/image";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="relative flex h-screen w-full flex-col md:flex-row overflow-hidden bg-background">
      {/* Mobile Header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-sidebar px-4 md:hidden">
        <div className="flex items-center gap-3">
          <Image src="/logoBPS.png" alt="Logo BPS Demak" width={28} height={28} className="object-contain" />
          <span className="text-sm font-semibold text-sidebar-foreground">
            Statistik Demak
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-sidebar-foreground"
          onClick={() => setIsMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Sidebar */}
      <Sidebar isMobileOpen={isMobileOpen} onCloseMobile={() => setIsMobileOpen(false)} />

      {/* Main Content Area */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
