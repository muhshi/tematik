"use client";

import { Card } from "@/components/Elements/card";
import { type FeatureCollection } from "geojson";
import { type DemakFeature } from "@/types/map";

interface MapLegendProps {
  data: FeatureCollection | null;
  indicatorName: string;
}

// {*Fungsi Utama: Menampilkan Kotak Legenda di Pojok Kanan Bawah Peta*}
export function MapLegend({ data, indicatorName }: MapLegendProps) {
  // {*Mengambil semua nilai (angka) dari tiap kecamatan*}
  const vals = data?.features
    ?.map(f => (f as DemakFeature).properties.value)
    .filter(v => v !== null) as number[] || [];

  // {*Menghitung batas minimum dan maksimum untuk range warna*}
  const min = vals.length > 0 ? Math.min(...vals) : 0;
  const max = vals.length > 0 ? Math.max(...vals) : 0;
  const range = max - min;

  // {*Format angka agar rapi dengan titik ribuan*}
  const format = (v: number) => new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(v);

  // {*Menghitung Kuartil (Q1, Q2, Q3) untuk membagi kelas warna*}
  const q1 = min + range * 0.25;
  const q2 = min + range * 0.5;
  const q3 = min + range * 0.75;

  return (
    <Card className="absolute bottom-4 right-4 md:bottom-6 md:right-6 z-[1000] flex flex-col gap-1.5 md:gap-2 p-2.5 md:p-4 shadow-lg max-w-[220px] md:max-w-[280px]">
      {/* {*Judul Indikator di Legenda*} */}
      <div className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate" title={indicatorName}>
        {indicatorName}
      </div>
      
      <div className="mt-0.5 md:mt-1 flex flex-col gap-1 md:gap-2">
        {/* {*Render Daftar Warna Jika Data Bervariasi*} */}
        {vals.length > 0 && range > 0 && (
          <>
            <div className="flex items-center gap-2 md:gap-3">
              <div className="h-3 w-3 md:h-4 md:w-4 shrink-0 rounded-sm" style={{ backgroundColor: "var(--choropleth-4)" }} />
              <span className="text-[9px] md:text-xs leading-tight font-medium text-foreground">&gt; {format(q3)} (Tinggi)</span>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <div className="h-3 w-3 md:h-4 md:w-4 shrink-0 rounded-sm" style={{ backgroundColor: "var(--choropleth-3)" }} />
              <span className="text-[9px] md:text-xs leading-tight font-medium text-foreground">{format(q2)} - {format(q3)} (Menengah Tinggi)</span>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <div className="h-3 w-3 md:h-4 md:w-4 shrink-0 rounded-sm" style={{ backgroundColor: "var(--choropleth-2)" }} />
              <span className="text-[9px] md:text-xs leading-tight font-medium text-foreground">{format(q1)} - {format(q2)} (Menengah Rendah)</span>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <div className="h-3 w-3 md:h-4 md:w-4 shrink-0 rounded-sm" style={{ backgroundColor: "var(--choropleth-1)" }} />
              <span className="text-[9px] md:text-xs leading-tight font-medium text-foreground">&lt; {format(q1)} (Rendah)</span>
            </div>
          </>
        )}
        
        {/* {*Render Jika Data Nilainya Sama Semua (Flat)*} */}
        {vals.length > 0 && range === 0 && (
          <div className="flex items-center gap-2 md:gap-3">
            <div className="h-3 w-3 md:h-4 md:w-4 shrink-0 rounded-sm" style={{ backgroundColor: "var(--choropleth-2)" }} />
            <span className="text-[9px] md:text-xs leading-tight font-medium text-foreground">{format(min)} (Sama Rata)</span>
          </div>
        )}
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
