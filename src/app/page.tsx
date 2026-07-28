"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { DashboardLayout } from "@/components/Layouts/DashboardLayout";
import { FilterBar } from "@/components/Fragments/FilterBar";
import { MapLegend } from "@/components/Fragments/MapLegend";
import { RegionDetails } from "@/components/Fragments/RegionDetails";
import { Skeleton } from "@/components/Elements/skeleton";
import { fetchMapData } from "@/services/mapData";
import type { MapDataResponse, DemakFeature, RegionDetail } from "@/types/map";

// Dynamically import the MapCanvas with ssr: false to prevent "Window is not defined" error
const MapCanvas = dynamic(() => import("@/components/Fragments/MapCanvas"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-none" />,
});

export default function Page() {
  const [mapData, setMapData] = useState<MapDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<RegionDetail | null>(null);

  const [granularity, setGranularity] = useState<"Kecamatan" | "Desa">("Desa");
  const [selectedYear, setSelectedYear] = useState<string>("2024");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await fetchMapData(selectedYear);
        setMapData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedYear]);

  const handleRegionClick = (feature: DemakFeature) => {
    setSelectedRegion({
      kecamatan: feature.properties.district,
      village: feature.properties.village,
      jumlahPenduduk: feature.properties.jumlahPenduduk,
      luasWilayah: feature.properties.luasWilayah ?? null,
      kepadatan: feature.properties.kepadatan ?? null,
      jumlahDesa: feature.properties.jumlahDesa,
    });
  };

  return (
    <DashboardLayout>
      <div className="flex h-full w-full flex-col relative overflow-hidden">
        {/* Top Filter Bar */}
        <FilterBar
          year={selectedYear}
          source={mapData?.metadata.source ?? "Loading..."}
          isCached={mapData?.metadata.isCached ?? false}
          granularity={granularity}
          onGranularityChange={setGranularity}
          onYearChange={setSelectedYear}
        />

        {/* Main Map Area */}
        <div className="relative flex-1 bg-slate-50">
          {error ? (
            <div className="flex h-full w-full flex-col items-center justify-center text-destructive">
              <span className="font-semibold">Failed to load map data</span>
              <span className="text-sm">{error}</span>
            </div>
          ) : (
            <>
              {/* Map Canvas (Keep mounted if we have data) */}
              {mapData && (
                <MapCanvas
                  geojson={granularity === "Kecamatan" ? mapData.geojsonKecamatan : mapData.geojsonDesa}
                  onRegionClick={handleRegionClick}
                  granularity={granularity}
                />
              )}

              {/* Loading State / Spinner */}
              {loading && (
                <div className={`absolute inset-0 z-[2000] flex items-center justify-center ${mapData ? 'bg-white/40 backdrop-blur-[1px]' : 'bg-slate-50'}`}>
                  <div className="flex flex-col items-center gap-3 rounded-xl bg-card px-6 py-5 shadow-xl border border-border">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <span className="text-sm font-medium text-foreground">
                      {mapData ? "Menarik Data BPS..." : "Memuat Peta..."}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Overlays */}
          {!error && mapData && <MapLegend />}
          
          {selectedRegion && (
            <RegionDetails
              data={selectedRegion}
              onClose={() => setSelectedRegion(null)}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
