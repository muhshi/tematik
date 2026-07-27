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
  onYearChange: (year: string) => void;
}

export function FilterBar({ year, source, isCached, granularity, onGranularityChange, onYearChange }: FilterBarProps) {
  // Years available from BPS API (Var 31 for 2011-2020, Var 248 for 2021-2024)
  const availableYears = ["2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016", "2015", "2014", "2013", "2012", "2011"];

  return (
    <div className="flex min-h-16 flex-col lg:flex-row shrink-0 items-center justify-between gap-4 border-b border-border bg-card px-4 py-4 lg:px-6 lg:py-0">
      {/* Left side: Primary Filters */}
      <div className="flex flex-wrap items-center justify-center gap-4 lg:justify-start lg:gap-6">
        
        {/* Indicator Select (Mocked for V1) */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Indicator</span>
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-1.5 text-sm font-medium text-foreground">
            Jumlah Penduduk
          </div>
        </div>

        {/* Year Select (Dynamic from 2011 to 2020) */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Year</span>
          <select 
            value={year}
            onChange={(e) => onYearChange(e.target.value)}
            className="flex h-8 items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            {availableYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
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
