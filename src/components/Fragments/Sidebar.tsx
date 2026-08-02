"use client";

import { useState } from "react";
import Image from "next/image";
import {
  BarChart3,
  Users,
  Leaf,
  Building2,
  HelpCircle,
  FileText,
  Download,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Button } from "@/components/Elements/button";
import { Separator } from "@/components/Elements/separator";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Economy", icon: BarChart3 },
  { label: "Social", icon: Users, active: true },
  { label: "Environment", icon: Leaf },
  { label: "Infrastructure", icon: Building2 },
];

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ isMobileOpen = false, onCloseMobile }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const isTextVisible = !collapsed || isMobileOpen;

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="absolute inset-0 top-14 z-[1020] bg-black/50 md:hidden" 
          onClick={onCloseMobile} 
          aria-hidden="true" 
        />
      )}

      <aside
        className={`
          absolute top-14 bottom-0 left-0 z-[1030] flex flex-col border-r border-sidebar-border bg-sidebar
          transition-transform duration-300 ease-in-out md:relative md:top-0 md:bottom-0 md:translate-x-0
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
          ${collapsed ? "md:w-16" : "md:w-64"}
          w-64
        `}
      >
      {/* Logo Section - Hidden on Mobile */}
      <div className="hidden md:flex items-center gap-3 px-4 py-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center">
          <Image src="/logoBPS.png" alt="Logo BPS Demak" width={32} height={32} className="object-contain" priority />
        </div>
        {isTextVisible && (
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-sm font-semibold text-sidebar-foreground">
              Statistik Demak
            </span>
            <span className="truncate text-[11px] text-sidebar-foreground/60">
              Data Kependudukan
            </span>
          </div>
        )}
      </div>

      <Separator className="hidden md:block bg-sidebar-border" />

      {/* Navigation Items */}
      <nav className="flex flex-1 flex-col gap-1 px-2 py-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              className={`
                group flex items-center gap-3 rounded-lg px-3 py-2.5
                text-sm font-medium transition-all duration-200
                ${
                  item.active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }
              `}
              title={!isTextVisible ? item.label : undefined}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {isTextVisible && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="flex flex-col gap-1 px-2 pb-2">
        <Separator className="mb-2 bg-sidebar-border" />

        <button className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/60 transition-colors hover:text-sidebar-foreground">
          <HelpCircle className="h-[18px] w-[18px] shrink-0" />
          {isTextVisible && <span>Help Center</span>}
        </button>

        <button className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/60 transition-colors hover:text-sidebar-foreground">
          <FileText className="h-[18px] w-[18px] shrink-0" />
          {isTextVisible && <span>Documentation</span>}
        </button>

        <div className="px-1 pt-2">
          <Button
            variant="default"
            className={`
              w-full bg-sidebar-primary text-sidebar-primary-foreground
              hover:bg-sidebar-primary/90
              ${!isTextVisible ? "px-0" : ""}
            `}
          >
            <Download className="h-4 w-4 shrink-0" />
            {isTextVisible && <span>Export Data</span>}
          </Button>
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-7 z-10 hidden md:flex h-6 w-6 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground/60 shadow-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <PanelLeftOpen className="h-3.5 w-3.5" />
        ) : (
          <PanelLeftClose className="h-3.5 w-3.5" />
        )}
      </button>
    </aside>
    </>
  );
}
