"use client";

import { SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/Elements/badge";
import { Button } from "@/components/Elements/button";
import type { Granularity } from "@/types/map";

interface FilterBarProps {
  year: string;
  source: string;
  isCached: boolean;
  granularity: Granularity;
  onGranularityChange: (granularity: Granularity) => void;
}

export function FilterBar({ year, source, isCached, granularity, onGranularityChange }: FilterBarProps) {
  return (
    <div className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6">
      {/* Left side: Primary Filters */}
      <div className="flex items-center gap-6">
        
        {/* Indicator Select (Mocked for V1) */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Indicator</span>
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-1.5 text-sm font-medium text-foreground">
            Jumlah Penduduk
          </div>
        </div>

        {/* Year Select (Mocked for V1, dynamic based on data) */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Year</span>
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-1.5 text-sm font-medium text-foreground">
            {year || "2024"}
          </div>
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
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-transparent">
            Filter
          </span>
          <Button variant="outline" size="sm" className="gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Advanced Filters
          </Button>
        </div>
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
