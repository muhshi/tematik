import { Download } from "lucide-react";
import Papa from "papaparse";
import type { DemakFeatureCollection } from "@/types/map";

interface ExportButtonProps {
  data: DemakFeatureCollection | undefined | null;
  indicatorName: string;
  year: string;
  granularity: string;
}

export function ExportButton({ data, indicatorName, year, granularity }: ExportButtonProps) {
  const handleExport = () => {
    if (!data || !data.features || data.features.length === 0) return;

    const csvData = data.features.map(f => {
      const p = f.properties;
      return {
        Wilayah: granularity === "Kecamatan" ? p.district : (p.regency || p.district),
        Indikator: indicatorName,
        Tahun: year,
        Nilai: p.value !== null && p.value !== undefined ? p.value : "Tidak Ada Data",
        "Laki-laki": p.demographics?.gender?.L || "-",
        "Perempuan": p.demographics?.gender?.P || "-",
        "Luas Wilayah (km2)": p.luasWilayah ? p.luasWilayah.toFixed(2) : "-",
        "Kepadatan": p.kepadatan ? p.kepadatan.toFixed(2) : "-"
      };
    });

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    
    // Safely format filename
    const safeIndicatorName = indicatorName.replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 30);
    link.setAttribute("download", `Data_${safeIndicatorName}_${granularity}_${year}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={handleExport}
      disabled={!data || data.features.length === 0}
      className="flex h-8 items-center gap-2 rounded-md bg-primary px-3 py-1 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
      title="Download Data CSV"
    >
      <Download className="h-4 w-4" />
      <span className="hidden sm:inline">Export CSV</span>
    </button>
  );
}
