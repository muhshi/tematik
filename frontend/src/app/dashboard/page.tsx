"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { DashboardLayout } from "@/components/Layouts/DashboardLayout";
import { FilterBar } from "@/components/Fragments/FilterBar";
import { MapLegend } from "@/components/Fragments/MapLegend";
import { RegionDetails } from "@/components/Fragments/RegionDetails";
import { Skeleton } from "@/components/Elements/skeleton";
import { fetchMapData } from "@/services/mapData";
import type { MapDataResponse, DemakFeature, RegionDetail, Granularity } from "@/types/map";
import type { Indicator } from "@/actions/adminActions";

// {*Import dinamis agar Map tidak error di SSR Next.js*}
const MapCanvas = dynamic(() => import("@/components/Fragments/MapCanvas"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-none" />,
});

// {*Fungsi Utama: Komponen Induk (Halaman Dashboard) yang menggabungkan seluruh layout & logika*}
export default function Page() {
  const [mapData, setMapData] = useState<MapDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<RegionDetail | null>(null);

  const [granularity, setGranularity] = useState<Granularity>("Kabupaten");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [yearsLoading, setYearsLoading] = useState(false);
  
  const [activeIndicators, setActiveIndicators] = useState<Indicator[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("Sosial dan Kependudukan");
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string>("");

  // {*Fungsi: Menarik Indikator Aktif dari API saat halaman pertama kali dibuka*}
  useEffect(() => {
    async function loadIndicators() {
      try {
        const res = await fetch("/api/indicators/active");
        if (res.ok) {
          const indicators: Indicator[] = await res.json();
          setActiveIndicators(indicators);
          if (indicators.length > 0) {
            setSelectedCategory(indicators[0].category);
            setSelectedSubjectId(indicators[0].subjectId);
            setSelectedIndicatorId(indicators[0].id);
          } else {
            setSelectedIndicatorId("var-31");
          }
        } else {
          setSelectedIndicatorId("var-31");
        }
      } catch (err) {
        console.error("Failed to load active indicators", err);
        setSelectedIndicatorId("var-31");
      }
    }
    loadIndicators();
  }, []);

  // {*Auto-select subjek & indikator pertama jika kategori diganti*}
  useEffect(() => {
    if (activeIndicators.length > 0 && selectedCategory) {
      const indicatorsInCat = activeIndicators.filter((i) => i.category === selectedCategory);
      if (indicatorsInCat.length > 0) {
        const isCurrentSubjectInCat = indicatorsInCat.some((i) => i.subjectId === selectedSubjectId);
        if (!isCurrentSubjectInCat) {
          setSelectedSubjectId(indicatorsInCat[0].subjectId);
          setSelectedIndicatorId(indicatorsInCat[0].id);
        }
      }
    }
  }, [selectedCategory, activeIndicators, selectedSubjectId]);

  // {*Auto-select indikator pertama jika subjek diganti*}
  useEffect(() => {
    if (activeIndicators.length > 0 && selectedSubjectId !== null) {
      const indicatorsInSubject = activeIndicators.filter((i) => i.subjectId === selectedSubjectId);
      if (indicatorsInSubject.length > 0) {
        const isCurrentIndicatorInSubject = indicatorsInSubject.some((i) => i.id === selectedIndicatorId);
        if (!isCurrentIndicatorInSubject) {
          setSelectedIndicatorId(indicatorsInSubject[0].id);
        }
      }
    }
  }, [selectedSubjectId, activeIndicators, selectedIndicatorId]);

  // {*Fungsi: Menarik Daftar Tahun Tersedia dari BPS saat Indikator diganti*}
  useEffect(() => {
    if (!selectedIndicatorId) return;
    
    async function loadYears() {
      setYearsLoading(true);
      try {
        const res = await fetch(`/api/available-years?var=${selectedIndicatorId}`);
        if (res.ok) {
          const years: { th_id: number; year: string }[] = await res.json();
          const yearStrings = years.map((y) => y.year);
          setAvailableYears(yearStrings);
          if (yearStrings.length > 0) {
            setSelectedYear(yearStrings[0]);
          }
        } else {
          setAvailableYears([]);
        }
      } catch (err) {
        console.error("Failed to load available years", err);
        setAvailableYears([]);
      } finally {
        setYearsLoading(false);
      }
    }
    loadYears();
  }, [selectedIndicatorId]);

  // {*Fungsi: Menarik Data Mentah Peta & BPS saat Tahun/Indikator berubah*}
  useEffect(() => {
    async function loadData() {
      if (!selectedIndicatorId || !selectedYear) return;
      
      try {
        setLoading(true);
        setError(null);
        setSelectedRegion(null); 
        const data = await fetchMapData(selectedYear, selectedIndicatorId);
        setMapData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedYear, selectedIndicatorId]);

  // {*Fungsi: Menyimpan data daerah yang diklik user untuk ditampilkan di Panel Kanan & Drill-down*}
  const handleRegionClick = (feature: DemakFeature) => {
    setSelectedRegion({
      kecamatan: feature.properties.district,
      village: feature.properties.village,
      value: feature.properties.value,
      luasWilayah: feature.properties.luasWilayah ?? null,
      kepadatan: feature.properties.kepadatan ?? null,
      jumlahDesa: feature.properties.jumlahDesa,
    });
  };

  return (
    <DashboardLayout 
      activeIndicators={activeIndicators}
      selectedCategory={selectedCategory} 
      onCategorySelect={setSelectedCategory}
      selectedSubjectId={selectedSubjectId}
      onSubjectSelect={setSelectedSubjectId}
    >
      <div className="flex h-full w-full flex-col relative overflow-hidden">
        {/* Top Filter Bar */}
        <FilterBar
          year={selectedYear}
          source={mapData?.metadata.source ?? "Loading..."}
          isCached={mapData?.metadata.isCached ?? false}
          granularity={granularity}
          onGranularityChange={setGranularity}
          onYearChange={setSelectedYear}
          availableYears={availableYears}
          yearsLoading={yearsLoading}
          activeIndicators={activeIndicators}
          selectedCategory={selectedCategory}
          selectedSubjectId={selectedSubjectId}
          selectedIndicatorId={selectedIndicatorId}
          onIndicatorChange={setSelectedIndicatorId}
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
              {/* {*Render Kanvas Peta Utama*} */}
              {mapData && (
                <MapCanvas
                  geojson={
                    granularity === "Kabupaten" || granularity === "Provinsi"
                      ? ((mapData as any).geojsonKabupaten || mapData.geojsonKecamatan)
                      : granularity === "Kecamatan"
                      ? mapData.geojsonKecamatan
                      : mapData.geojsonDesa
                  }
                  onRegionClick={handleRegionClick}
                  granularity={granularity}
                  year={mapData.metadata.year.toString()}
                  indicatorName={activeIndicators.find((i) => i.id === selectedIndicatorId)?.name || "Nilai Indikator"}
                />
              )}

              {/* {*Render UI Loading (Spinner)*} */}
              {loading && (
                <div className={`absolute inset-0 z-[2000] flex items-center justify-center ${mapData ? 'bg-white/40 backdrop-blur-[1px]' : 'bg-slate-50'}`}>
                  <div className="flex flex-col items-center gap-3 rounded-xl bg-card px-6 py-5 shadow-xl border border-border">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <span className="text-sm font-medium text-foreground">
                      {mapData ? "Sedang mengambil data..." : "Memuat Peta..."}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* {*Render UI Kotak Legenda Warna Peta*} */}
          {!error && mapData && (
            <MapLegend 
              data={
                granularity === "Kabupaten" || granularity === "Provinsi"
                  ? ((mapData as any).geojsonKabupaten || mapData.geojsonKecamatan)
                  : granularity === "Kecamatan"
                  ? mapData.geojsonKecamatan
                  : mapData.geojsonDesa
              } 
              indicatorName={activeIndicators.find((i) => i.id === selectedIndicatorId)?.name || "Nilai Indikator"}
            />
          )}

          {/* Tombol Navigasi Kembali ke Level Kabupaten Jateng */}
          {granularity !== "Kabupaten" && (
            <button
              onClick={() => {
                setGranularity("Kabupaten");
                setSelectedRegion(null);
              }}
              className="absolute top-4 left-14 z-[1000] flex items-center gap-2 px-3 py-1.5 bg-white/90 hover:bg-white text-slate-800 text-xs font-semibold rounded-lg shadow-md border border-slate-200 backdrop-blur-sm transition-all"
            >
              ← Kembali ke Peta Jawa Tengah
            </button>
          )}
          
          {selectedRegion && (
            <RegionDetails
              data={selectedRegion}
              indicatorName={activeIndicators.find((i) => i.id === selectedIndicatorId)?.name || "Nilai Indikator"}
              onClose={() => setSelectedRegion(null)}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
