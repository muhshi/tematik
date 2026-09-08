"use client";

import { X, TrendingUp, Users, Map as MapIcon, Maximize, Activity } from "lucide-react";
import { Button } from "@/components/Elements/button";
import { Separator } from "@/components/Elements/separator";
import type { RegionDetail } from "@/types/map";
import { DemographicCharts } from "./DemographicCharts";

interface RegionDetailsProps {
  data: RegionDetail | null;
  indicatorName: string;
  onClose: () => void;
  onDrillDown?: () => void;
}

// {*Fungsi Utama: Menampilkan Panel Samping Kanan (Detail Kecamatan/Desa) saat wilayah diklik*}
export function RegionDetails({ data, indicatorName, onClose, onDrillDown }: RegionDetailsProps) {
  if (!data) return null;

  const formattedVal = data.value !== null
    ? new Intl.NumberFormat("id-ID").format(data.value)
    : "N/A";

  return (
    <div className="region-panel-enter absolute bottom-0 right-0 top-0 z-[1010] flex w-full sm:w-80 flex-col border-l border-border bg-card shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-5">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-foreground">
            {data.kecamatan}
          </h2>
          <span className="text-xs text-muted-foreground">
            {(data.kecamatan?.toLowerCase().includes("kab") || data.kecamatan?.toLowerCase().includes("kota"))
              ? "Provinsi Jawa Tengah"
              : (data.regency || "Kabupaten Demak")}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {/* Main Statistic */}
        <div className="mb-6 rounded-xl bg-slate-50 p-4 dark:bg-slate-900/50">
          <div className="text-sm font-medium text-muted-foreground">
            {indicatorName}
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-primary">
              {formattedVal}
            </span>
          </div>
          {data.value !== null && (
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Data BPS</span>
              </div>
              {data.year && (
                <div className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  Tahun: {data.year}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Demographic Charts (Only for 'Jumlah Penduduk' or if demographics data exists) */}
        {(indicatorName.toLowerCase().includes("penduduk") || data.demographics) && (
          <div className="mb-6">
            <DemographicCharts data={data.demographics} regionName={data.kecamatan} />
          </div>
        )}

        {/* Action Button */}
        {onDrillDown ? (
          <Button onClick={onDrillDown} className="w-full justify-center bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md">
            Lihat Peta Tingkat Kecamatan
          </Button>
        ) : (
          <Button variant="outline" className="w-full justify-center" onClick={onClose}>Tutup Panel</Button>
        )}
      </div>
    </div>
  );
}
