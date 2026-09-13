"use client";

import { X, TrendingUp, Users, Map as MapIcon, Maximize, Activity } from "lucide-react";
import { Button } from "@/components/Elements/button";
import { Separator } from "@/components/Elements/separator";
import type { RegionDetail, Granularity } from "@/types/map";
import { DemographicCharts } from "./DemographicCharts";

interface RegionDetailsProps {
  data: RegionDetail | null;
  indicatorName: string;
  granularity?: Granularity;
  onClose: () => void;
  onDrillDown?: () => void;
}

// {*Fungsi Utama: Menampilkan Panel Samping Kanan (Detail Kecamatan/Desa) saat wilayah diklik*}
export function RegionDetails({ data, indicatorName, granularity, onClose, onDrillDown }: RegionDetailsProps) {
  if (!data) return null;

  const hasValue = data.value !== null && data.value !== undefined;
  const formattedVal = hasValue
    ? new Intl.NumberFormat("id-ID").format(data.value!)
    : "Data Tidak Tersedia";

  const isKecamatanLevel = granularity === "Kecamatan" || Boolean(data.regency);

  let title = data.kecamatan || "";
  let subtitle = "Provinsi Jawa Tengah";

  if (isKecamatanLevel) {
    // Mode Kecamatan: Judul adalah nama Kecamatan, Subtitle adalah Kabupaten induknya
    title = title.toLowerCase().startsWith("kecamatan") ? title : `Kecamatan ${title}`;
    if (data.regency) {
      const lowerReg = data.regency.toLowerCase();
      subtitle = lowerReg.startsWith("kab") || lowerReg.startsWith("kota") 
        ? data.regency 
        : `Kabupaten ${data.regency}`;
    } else {
      subtitle = "Provinsi Jawa Tengah";
    }
  } else {
    // Mode Kabupaten/Kota: Judul adalah nama Kabupaten/Kota, Subtitle adalah Provinsi Jawa Tengah
    const lowerTitle = title.toLowerCase();
    const typePrefix = data.type || (["salatiga", "surakarta"].includes(lowerTitle) ? "Kota" : "Kabupaten");
    if (!lowerTitle.startsWith("kabupaten") && !lowerTitle.startsWith("kota")) {
      title = `${typePrefix} ${title}`;
    }
    subtitle = "Provinsi Jawa Tengah";
  }

  return (
    <div className="region-panel-enter absolute bottom-0 right-0 top-0 z-[1010] flex w-full sm:w-80 flex-col border-l border-border bg-card shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-5">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-foreground">
            {title}
          </h2>
          <span className="text-xs text-muted-foreground">
            {subtitle}
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
            <span className={`tracking-tight ${hasValue ? 'text-3xl font-bold text-primary' : 'text-lg font-semibold text-slate-400'}`}>
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

        {/* Demographic Charts (Only for 'Jumlah Penduduk' or if demographics data exists and has value) */}
        {hasValue && (indicatorName.toLowerCase().includes("jumlah penduduk") || data.demographics) && (
          <div className="mb-6">
            <DemographicCharts data={data.demographics} regionName={data.kecamatan} />
          </div>
        )}

        {/* Action Button & Regional Scope Note */}
        {onDrillDown ? (
          <Button onClick={onDrillDown} className="w-full justify-center bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md">
            Lihat Peta Tingkat Kecamatan
          </Button>
        ) : (
          <div className="flex flex-col gap-2.5">
            {!indicatorName.toLowerCase().includes("jumlah penduduk") && (
              <p className="text-[11px] text-muted-foreground text-center bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-lg border border-border leading-relaxed">
                Data indikator ini dipublikasikan BPS pada tingkat agregat Kabupaten/Kota se-Jawa Tengah.
              </p>
            )}
            <Button variant="outline" className="w-full justify-center" onClick={onClose}>Tutup Panel</Button>
          </div>
        )}
      </div>
    </div>
  );
}
