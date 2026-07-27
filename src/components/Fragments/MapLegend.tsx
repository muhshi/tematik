"use client";

import { Card } from "@/components/Elements/card";

export function MapLegend() {
  return (
    <Card className="absolute bottom-4 right-4 md:bottom-6 md:right-6 z-[1000] flex flex-col gap-1.5 md:gap-2 p-2.5 md:p-4 shadow-lg max-w-[200px] md:max-w-none">
      <div className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Populasi (Jiwa)
      </div>
      
      <div className="mt-0.5 md:mt-1 flex flex-col gap-1 md:gap-2">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="h-3 w-3 md:h-4 md:w-4 shrink-0 rounded-sm" style={{ backgroundColor: "var(--choropleth-4)" }} />
          <span className="text-[9px] md:text-xs leading-tight font-medium text-foreground">&gt; 100.000 (Tinggi)</span>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <div className="h-3 w-3 md:h-4 md:w-4 shrink-0 rounded-sm" style={{ backgroundColor: "var(--choropleth-3)" }} />
          <span className="text-[9px] md:text-xs leading-tight font-medium text-foreground">75.000 - 100.000 (Menengah Tinggi)</span>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <div className="h-3 w-3 md:h-4 md:w-4 shrink-0 rounded-sm" style={{ backgroundColor: "var(--choropleth-2)" }} />
          <span className="text-[9px] md:text-xs leading-tight font-medium text-foreground">50.000 - 75.000 (Menengah Rendah)</span>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <div className="h-3 w-3 md:h-4 md:w-4 shrink-0 rounded-sm" style={{ backgroundColor: "var(--choropleth-1)" }} />
          <span className="text-[9px] md:text-xs leading-tight font-medium text-foreground">&lt; 50.000 (Rendah)</span>
        </div>
        <div className="flex items-center gap-2 md:gap-3 mt-0.5 md:mt-1">
          <div className="h-3 w-3 md:h-4 md:w-4 shrink-0 rounded-sm bg-slate-200 border border-slate-300" />
          <span className="text-[9px] md:text-xs leading-tight font-medium text-muted-foreground">Data Tidak Tersedia</span>
        </div>
      </div>
      
      <div className="mt-1 md:mt-2 pt-1 md:pt-2 border-t border-border text-[8px] md:text-[10px] text-muted-foreground">
        Sumber: BPS Kabupaten Demak
      </div>
    </Card>
  );
}
