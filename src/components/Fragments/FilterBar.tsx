"use client";

import { SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/Elements/badge";
import { Button } from "@/components/Elements/button";
import type { Granularity } from "@/types/map";
import type { Indicator } from "@/actions/adminActions";

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
  selectedCategory,
  selectedSubjectId,
  selectedIndicatorId,
  onIndicatorChange
}: FilterBarProps) {
  const filteredIndicators = selectedSubjectId !== null 
    ? activeIndicators.filter(i => i.subjectId === selectedSubjectId)
    : [];

  return (
    <div className="flex min-h-16 flex-col lg:flex-row shrink-0 items-center justify-between gap-4 border-b border-border bg-card px-4 py-4 lg:px-6 lg:py-0">
      {/* Left side: Primary Filters */}
      <div className="flex flex-wrap items-center justify-center gap-4 lg:justify-start lg:gap-6">
        
        {/* Indicator Select (Dynamic) */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Indicator</span>
          <select
            value={selectedIndicatorId}
            onChange={(e) => onIndicatorChange(e.target.value)}
            className="flex h-8 w-48 md:w-64 items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {filteredIndicators.length === 0 ? (
              <option value="">Tidak ada indikator aktif</option>
            ) : (
              filteredIndicators.map(ind => (
                <option key={ind.id} value={ind.id}>
                  {ind.name}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Year Select (Dynamic from BPS API) */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Year</span>
          <select 
            value={year}
            onChange={(e) => onYearChange(e.target.value)}
            disabled={yearsLoading || availableYears.length === 0}
            className="flex h-8 items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            {yearsLoading ? (
              <option value="">Loading...</option>
            ) : availableYears.length === 0 ? (
              <option value="">Tidak ada data</option>
            ) : (
              availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))
            )}
          </select>
        </div>

        {/* Granularity Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Granularity</span>
          <div className="flex items-center rounded-md border border-border bg-muted/50 p-0.5">
            <button 
              className={`rounded-sm px-3 py-1 text-sm font-medium transition-colors ${granularity === "Kecamatan" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => onGranularityChange("Kecamatan")}
            >
              Kecamatan
            </button>
            <button 
              className={`rounded-sm px-3 py-1 text-sm font-medium transition-colors ${granularity === "Desa" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => onGranularityChange("Desa")}
            >
              Desa
            </button>
          </div>
        </div>

        {/* Advanced Filters Button */}
        {/* <div className="flex flex-col">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-transparent">
            Filter
          </span>
          <Button variant="outline" size="sm" className="gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Advanced Filters
          </Button>
        </div> */}
      </div>

      {/* Right side: Data source info */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs font-normal">
          {source}
        </Badge>
        {isCached && (
          <Badge variant="secondary" className="text-xs font-normal">
            Cached
          </Badge>
        )}
      </div>
    </div>
  );
}
