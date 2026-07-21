"use client";

import { Card } from "@/components/Elements/card";

export function MapLegend() {
  return (
    <Card className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-2 p-4 shadow-lg">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Populasi (Jiwa)
      </div>
      
      <div className="mt-1 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 rounded-sm" style={{ backgroundColor: "var(--choropleth-4)" }} />
          <span className="text-xs font-medium text-foreground">&gt; 100.000 (Tinggi)</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 rounded-sm" style={{ backgroundColor: "var(--choropleth-3)" }} />
          <span className="text-xs font-medium text-foreground">75.000 - 100.000 (Menengah Tinggi)</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 rounded-sm" style={{ backgroundColor: "var(--choropleth-2)" }} />
          <span className="text-xs font-medium text-foreground">50.000 - 75.000 (Menengah Rendah)</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 rounded-sm" style={{ backgroundColor: "var(--choropleth-1)" }} />
          <span className="text-xs font-medium text-foreground">&lt; 50.000 (Rendah)</span>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <div className="h-4 w-4 rounded-sm bg-slate-200 border border-slate-300" />
          <span className="text-xs font-medium text-muted-foreground">Data Tidak Tersedia</span>
        </div>
      </div>
      
      <div className="mt-2 pt-2 border-t border-border text-[10px] text-muted-foreground">
        Sumber: BPS Kabupaten Demak
      </div>
    </Card>
  );
}
