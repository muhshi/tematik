"use client";

import { useState, useRef, useEffect } from "react";
import { Download, ChevronDown, FileSpreadsheet, Map as MapIcon, FileCode } from "lucide-react";
import Papa from "papaparse";
import type { DemakFeatureCollection } from "@/types/map";

interface ExportButtonProps {
  data: DemakFeatureCollection | undefined | null;
  indicatorName: string;
  year: string;
  granularity: string;
}

export function ExportButton({ data, indicatorName, year, granularity }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const safeIndicatorName = indicatorName.replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 30);
  const baseFilename = `WebGIS_${safeIndicatorName}_${granularity}_${year}`;

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  // 1. Export CSV
  const handleExportCSV = () => {
    if (!data || !data.features || data.features.length === 0) return;

    const csvData = data.features.map((f) => {
      const p = f.properties;
      return {
        Wilayah: granularity === "Kecamatan" ? p.district : (p.regency || p.district),
        Tingkat: granularity,
        Indikator: indicatorName,
        Tahun: year,
        Nilai: p.value !== null && p.value !== undefined ? p.value : "Tidak Ada Data",
        "Laki-laki": p.demographics?.gender?.L || "-",
        "Perempuan": p.demographics?.gender?.P || "-",
        "Luas Wilayah (km2)": p.luasWilayah ? p.luasWilayah.toFixed(2) : "-",
        "Kepadatan": p.kepadatan ? p.kepadatan.toFixed(2) : "-",
      };
    });

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    triggerDownload(blob, `${baseFilename}.csv`);
  };

  // 2. Export GeoJSON
  const handleExportGeoJSON = () => {
    if (!data || !data.features || data.features.length === 0) return;

    const enrichedGeoJSON = {
      type: "FeatureCollection",
      metadata: {
        indicatorName,
        granularity,
        year,
        exportedAt: new Date().toISOString(),
      },
      features: data.features,
    };

    const jsonStr = JSON.stringify(enrichedGeoJSON, null, 2);
    const blob = new Blob([jsonStr], { type: "application/geo+json;charset=utf-8;" });
    triggerDownload(blob, `${baseFilename}.geojson`);
  };

  // 3. Export JSON
  const handleExportJSON = () => {
    if (!data || !data.features || data.features.length === 0) return;

    const exportData = {
      metadata: {
        indicator: indicatorName,
        year,
        granularity,
        totalRegions: data.features.length,
        exportedAt: new Date().toISOString(),
      },
      data: data.features.map((f) => ({
        region: f.properties.district,
        regency: f.properties.regency || null,
        value: f.properties.value,
        luasWilayahKm2: f.properties.luasWilayah || null,
        kepadatan: f.properties.kepadatan || null,
        demographics: f.properties.demographics || null,
      })),
    };

    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8;" });
    triggerDownload(blob, `${baseFilename}.json`);
  };

  const isDisabled = !data || !data.features || data.features.length === 0;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isDisabled}
        className="flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0 cursor-pointer"
        title="Opsi Unduh Data"
      >
        <Download className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Export Data</span>
        <ChevronDown className="h-3 w-3 opacity-80" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl bg-card border border-border shadow-xl z-[1050] py-1 animate-in fade-in-0 zoom-in-95 duration-100">
          <div className="px-3 py-1.5 border-b border-border/60">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Pilih Format Unduhan
            </span>
          </div>

          <button
            onClick={handleExportCSV}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors text-left cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
            <div className="flex flex-col">
              <span className="font-semibold">Format Tabel (.CSV)</span>
              <span className="text-[10px] text-muted-foreground">Excel / Spreadsheet</span>
            </div>
          </button>

          <button
            onClick={handleExportGeoJSON}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors text-left cursor-pointer"
          >
            <MapIcon className="h-4 w-4 text-primary shrink-0" />
            <div className="flex flex-col">
              <span className="font-semibold">Format Spasial (.GeoJSON)</span>
              <span className="text-[10px] text-muted-foreground">QGIS / ArcGIS / SIG</span>
            </div>
          </button>

          <button
            onClick={handleExportJSON}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors text-left cursor-pointer"
          >
            <FileCode className="h-4 w-4 text-amber-600 shrink-0" />
            <div className="flex flex-col">
              <span className="font-semibold">Format Data (.JSON)</span>
              <span className="text-[10px] text-muted-foreground">Aplikasi / API dev</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
