"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/Elements/button";
import { MapPin } from "lucide-react";

interface HeaderProps {
  title?: string;
}

export function Header({ title = "Statistik Demak" }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md px-4 md:px-8 py-3 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/logoBPS.png"
            alt="Logo BPS Demak"
            width={32}
            height={32}
            className="object-contain transition-transform group-hover:scale-105"
            priority
          />
          <div className="flex flex-col">
            <span className="text-base font-bold text-slate-900 leading-tight">
              WebGIS Demak
            </span>
            <span className="text-[11px] font-medium text-slate-500">
              {title}
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button size="sm" className="bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold gap-1.5 shadow-sm">
              <MapPin className="h-3.5 w-3.5" /> Dashboard Peta
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
