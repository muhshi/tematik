"use client";

import type { Granularity } from "@/types/map";
import type { Indicator } from "@/actions/adminActions";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Elements/select";
import { Layers, Calendar, BookOpen, Home } from "lucide-react";

interface FilterBarProps {
  year: string;
  source: string;
  isCached: boolean;
  granularity: Granularity;
  onGranularityChange: (granularity: Granularity) => void;
  onYearChange: (year: string) => void;
  availableYears: string[];
  yearsLoading: boolean;
  activeIndicators: Indicator[];
  selectedCategory: string;
  selectedSubjectId: number | null;
  selectedIndicatorId: string;
  onIndicatorChange: (id: string) => void;
}

// {*Fungsi Utama: Komponen Bar Navigasi (Pilih Tahun, Kategori, Subjek, Indikator) di atas Peta*}
export function FilterBar({ 
  year, 
  source, 
  isCached, 
  granularity, 
  onGranularityChange, 
  onYearChange,
  availableYears,
  yearsLoading,
  activeIndicators,
  selectedSubjectId,
  selectedIndicatorId,
  onIndicatorChange,
  children
}: FilterBarProps & { children?: React.ReactNode }) {
  const filteredIndicators = selectedSubjectId !== null 
    ? activeIndicators.filter((i) => i.subjectId === selectedSubjectId)
    : [];

  const isKependudukan = selectedIndicatorId === "var-248";
  const selectedIndicatorObj = filteredIndicators.find((i) => i.id === selectedIndicatorId);

  return (
    <div className="flex min-h-16 flex-col lg:flex-row shrink-0 items-center justify-between gap-4 border-b border-border bg-card px-4 py-4 lg:px-6 lg:py-0">
      {/* Left side: Primary Filters */}
      <div className="flex flex-wrap items-center justify-center gap-4 lg:justify-start lg:gap-5">
        
        {/* Indicator Select (Dynamic Width) */}
        <div className="flex items-center gap-2 max-w-full">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-primary" />
            Indikator
          </span>
          {filteredIndicators.length === 0 ? (
            <span className="text-xs text-muted-foreground italic">Tidak ada indikator aktif</span>
          ) : (
            <Select
              value={selectedIndicatorId}
              onValueChange={(val) => {
                if (val) onIndicatorChange(val);
              }}
            >
              <SelectTrigger className="h-8 min-w-[220px] max-w-[85vw] md:max-w-[420px] lg:max-w-[480px] truncate bg-card">
                <SelectValue placeholder="Pilih Indikator">
                  {selectedIndicatorObj?.name || "Pilih Indikator"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {filteredIndicators.map((ind) => (
                  <SelectItem key={ind.id} value={ind.id} className="text-xs cursor-pointer">
                    {ind.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Year Select (Dynamic from BPS API) */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            Tahun
          </span>
          {yearsLoading ? (
            <span className="text-xs text-muted-foreground animate-pulse">Memuat tahun...</span>
          ) : availableYears.length === 0 ? (
            <span className="text-xs text-muted-foreground italic">Tidak ada data</span>
          ) : (
            <Select
              value={year}
              onValueChange={(val) => {
                if (val) onYearChange(val);
              }}
            >
              <SelectTrigger className="h-8 min-w-[90px] bg-card">
                <SelectValue placeholder="Tahun">{year || "Tahun"}</SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {availableYears.map((y) => (
                  <SelectItem key={y} value={y} className="text-xs cursor-pointer">
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

      </div>

      {/* Right side: Action Controls (Beranda, Panduan & Export) */}
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium text-slate-700 hover:text-primary hover:bg-slate-100 border border-slate-200 shadow-xs transition-colors"
          title="Kembali ke Beranda"
        >
          <Home className="h-3.5 w-3.5 text-primary" />
          <span className="hidden sm:inline">Beranda</span>
        </Link>
        <Link
          href="/docs"
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium text-slate-700 hover:text-primary hover:bg-slate-100 border border-slate-200 shadow-xs transition-colors"
          title="Panduan & Cara Baca Data"
        >
          <BookOpen className="h-3.5 w-3.5 text-primary" />
          <span className="hidden sm:inline">Panduan</span>
        </Link>
        {children}
      </div>
    </div>
  );
}
