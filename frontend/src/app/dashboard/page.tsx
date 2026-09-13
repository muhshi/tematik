"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { DashboardLayout } from "@/components/Layouts/DashboardLayout";
import { FilterBar } from "@/components/Fragments/FilterBar";
import { MapLegend } from "@/components/Fragments/MapLegend";
import { RegionDetails } from "@/components/Fragments/RegionDetails";
import { ExportButton } from "@/components/Fragments/ExportButton";
import { Skeleton } from "@/components/Elements/skeleton";
import { ArrowLeft } from "lucide-react";
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
  const [drilldownKabupaten, setDrilldownKabupaten] = useState<string | null>(null);

  const [granularity, setGranularity] = useState<Granularity>("Kabupaten");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [preDrilldownYear, setPreDrilldownYear] = useState<string | null>(null);
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
              const savedIndicatorId = localStorage.getItem("selectedIndicatorId");
              const savedCat = localStorage.getItem("selectedCategory");
              const savedSubId = localStorage.getItem("selectedSubjectId");
              
              if (savedIndicatorId && savedCat && savedSubId && indicators.some(i => i.id === savedIndicatorId)) {
                setSelectedCategory(savedCat);
                setSelectedSubjectId(parseInt(savedSubId, 10));
                setSelectedIndicatorId(savedIndicatorId);
              } else {
                setSelectedCategory(indicators[0].category);
                setSelectedSubjectId(indicators[0].subjectId);
                setSelectedIndicatorId(indicators[0].id);
              }
            } else {
            setSelectedIndicatorId("var-248");
          }
        } else {
          setSelectedIndicatorId("var-248");
        }
      } catch (err) {
        console.error("Failed to load active indicators", err);
        setSelectedIndicatorId("var-248");
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

  // {*Simpan state ke localStorage agar tidak reset saat refresh*}
  useEffect(() => {
    if (selectedIndicatorId && selectedCategory && selectedSubjectId !== null) {
      localStorage.setItem("selectedIndicatorId", selectedIndicatorId);
      localStorage.setItem("selectedCategory", selectedCategory);
      localStorage.setItem("selectedSubjectId", selectedSubjectId.toString());
    }
  }, [selectedIndicatorId, selectedCategory, selectedSubjectId]);

  // {*Fungsi: Menarik Daftar Tahun Tersedia dari BPS saat Indikator diganti*}
  useEffect(() => {
    if (!selectedIndicatorId) return;

    // Reset drilldown jika indikator yang dipilih bukan Kependudukan (karena hanya var 248 yang ada drilldown)
    let currentDrilldown = drilldownKabupaten;
    const isExitingDrilldown = Boolean(currentDrilldown && selectedIndicatorId !== "var-248");

    if (isExitingDrilldown) {
      setDrilldownKabupaten(null);
      setGranularity("Kabupaten");
      setSelectedRegion(null);
      currentDrilldown = null;
    }

    async function loadYears() {
      setYearsLoading(true);
      try {
        const query = currentDrilldown 
          ? `var=${selectedIndicatorId}&kabupaten=${encodeURIComponent(currentDrilldown)}` 
          : `var=${selectedIndicatorId}`;
        const res = await fetch(`/api/available-years?${query}`);
        if (res.ok) {
          const years: { th_id: number; year: string }[] = await res.json();
          const yearStrings = years.map((y) => y.year);
          setAvailableYears(yearStrings);
          if (yearStrings.length > 0) {
            setSelectedYear((prevYear) => {
              // Jika keluar dari drilldown kecamatan, pulihkan tahun provinsi atau tahun terbaru
              if (isExitingDrilldown) {
                if (preDrilldownYear && yearStrings.includes(preDrilldownYear)) {
                  return preDrilldownYear;
                }
                return yearStrings[0];
              }
              // Setiap kali berpindah ke indikator baru, default ke tahun terbaru data tersebut
              return yearStrings[0];
            });
            if (isExitingDrilldown) setPreDrilldownYear(null);
          } else {
            setSelectedYear("");
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
    const abortController = new AbortController();

    async function loadData() {
      if (!selectedIndicatorId || !selectedYear) return;
      
      // Lewati fetch HANYA jika data yang ada di memory benar-benar sudah cocok dengan indikator, tahun, dan wilayah yang aktif
      const currentMeta = mapData?.metadata as any;
      if (
        currentMeta &&
        currentMeta.indicatorId === selectedIndicatorId &&
        currentMeta.year === selectedYear &&
        (currentMeta.kabupaten || null) === (drilldownKabupaten || null)
      ) {
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setSelectedRegion(null); 
        const data = await fetchMapData(selectedYear, selectedIndicatorId, drilldownKabupaten || undefined, abortController.signal);
        setMapData(prev => {
          const merged = {
            ...data,
            metadata: {
              ...data.metadata,
              indicatorId: selectedIndicatorId,
              kabupaten: drilldownKabupaten || null,
              year: selectedYear,
            }
          };
          if (drilldownKabupaten && prev?.geojsonKabupaten) {
            merged.geojsonKabupaten = prev.geojsonKabupaten;
          }
          return merged;
        });
      } catch (err: any) {
        if (err.name === 'AbortError') {
          // Request dibatalkan, jangan tampilkan error
          return;
        }
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    }
    loadData();

    return () => {
      abortController.abort(); // Cancel previous request
    };
  }, [selectedYear, selectedIndicatorId, drilldownKabupaten]);

  // {*Fungsi: Menyimpan data daerah yang diklik user untuk ditampilkan di Panel Kanan & Drill-down*}
  const handleRegionClick = async (feature: DemakFeature) => {
    setSelectedRegion({
      kecamatan: feature.properties.district,
      regency: feature.properties.regency,
      type: (feature.properties as any).type,
      year: mapData?.metadata.year,
      village: feature.properties.village,
      value: feature.properties.value,
      luasWilayah: feature.properties.luasWilayah ?? null,
      kepadatan: feature.properties.kepadatan ?? null,
      jumlahDesa: feature.properties.jumlahDesa,
      demographics: feature.properties.demographics,
    });
    // Tidak langsung drill-down, biarkan User melihat panel kanan terlebih dahulu.
  };

  const handleDrillDown = async (kabName: string) => {
    try {
      setLoading(true);
      setYearsLoading(true);
      setPreDrilldownYear(selectedYear); // Simpan tahun provinsi saat ini (misal: "2025")

      // 1. Ambil daftar tahun asli kabupaten dari database
      const res = await fetch(`/api/available-years?var=${selectedIndicatorId}&kabupaten=${encodeURIComponent(kabName)}`);
      let kabYears: string[] = [];
      if (res.ok) {
        const yearsData: { th_id: number; year: string }[] = await res.json();
        kabYears = yearsData.map((y) => y.year);
      }

      // 2. Pilih tahun yang valid untuk kabupaten ini (jangan gunakan tahun provinsi jika tidak ada!)
      const nextYear = kabYears.includes(selectedYear) ? selectedYear : (kabYears[0] || "");

      // 3. Tarik data peta kecamatan SEBELUM mengganti granularity agar tidak terjadi flash peta kabupaten lain
      const drillData = await fetchMapData(nextYear, selectedIndicatorId, kabName);

      // 4. Update data peta, tahun, dan granularity secara bersamaan
      setMapData(prev => ({
        ...drillData,
        geojsonKabupaten: prev?.geojsonKabupaten || drillData.geojsonKabupaten,
        metadata: {
          ...drillData.metadata,
          indicatorId: selectedIndicatorId,
          kabupaten: kabName,
          year: nextYear,
        }
      }));
      setAvailableYears(kabYears);
      setSelectedYear(nextYear);
      setDrilldownKabupaten(kabName);
      setGranularity("Kecamatan");
      setSelectedRegion(null);
    } catch (error) {
      console.error("Gagal memuat drill-down data", error);
    } finally {
      setYearsLoading(false);
      setLoading(false);
    }
  };

  const handleReturnToProvinsi = async () => {
    try {
      setLoading(true);
      setYearsLoading(true);

      // 1. Ambil daftar tahun provinsi dari database
      const res = await fetch(`/api/available-years?var=${selectedIndicatorId}`);
      let provYears: string[] = [];
      if (res.ok) {
        const yearsData: { th_id: number; year: string }[] = await res.json();
        provYears = yearsData.map((y) => y.year);
      }

      // 2. Kembalikan ke tahun provinsi sebelum drill-down (atau tahun provinsi terbaru)
      const nextYear = (preDrilldownYear && provYears.includes(preDrilldownYear))
        ? preDrilldownYear
        : (provYears.includes(selectedYear) ? selectedYear : (provYears[0] || ""));

      // 3. Tarik data provinsi SEBELUM mengganti granularity
      const provData = await fetchMapData(nextYear, selectedIndicatorId);

      // 4. Update state secara atomik
      setMapData({
        ...provData,
        metadata: {
          ...provData.metadata,
          indicatorId: selectedIndicatorId,
          kabupaten: null,
          year: nextYear,
        }
      });
      setAvailableYears(provYears);
      setSelectedYear(nextYear);
      setPreDrilldownYear(null);
      setDrilldownKabupaten(null);
      setGranularity("Kabupaten");
      setSelectedRegion(null);
    } catch (error) {
      console.error("Gagal kembali ke peta provinsi", error);
    } finally {
      setYearsLoading(false);
      setLoading(false);
    }
  };

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    const inCat = activeIndicators.filter((i) => i.category === cat);
    if (inCat.length > 0) {
      const firstSubId = inCat[0].subjectId;
      setSelectedSubjectId(firstSubId);
      const inSub = inCat.filter((i) => i.subjectId === firstSubId);
      if (inSub.length > 0) {
        setSelectedIndicatorId(inSub[0].id);
      }
    }
  };

  const handleSubjectSelect = (subId: number) => {
    setSelectedSubjectId(subId);
    const inSub = activeIndicators.filter((i) => i.subjectId === subId);
    if (inSub.length > 0) {
      setSelectedIndicatorId(inSub[0].id);
    }
  };

  const displayGeojson = (granularity === "Kabupaten" || granularity === "Provinsi")
    ? mapData?.geojsonKabupaten
    : mapData?.geojsonKecamatan;

  return (
    <DashboardLayout 
      activeIndicators={activeIndicators}
      selectedCategory={selectedCategory} 
      onCategorySelect={handleCategorySelect}
      selectedSubjectId={selectedSubjectId}
      onSubjectSelect={handleSubjectSelect}
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
        >
          {displayGeojson && (
            <ExportButton 
              data={displayGeojson}
              indicatorName={activeIndicators.find((i) => i.id === selectedIndicatorId)?.name || "Nilai Indikator"}
              year={selectedYear}
              granularity={granularity}
            />
          )}
        </FilterBar>

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
              {mapData && displayGeojson && (
                <MapCanvas
                  geojson={displayGeojson}
                  onRegionClick={handleRegionClick}
                  granularity={granularity}
                  year={mapData.metadata.year.toString()}
                  indicatorName={activeIndicators.find((i) => i.id === selectedIndicatorId)?.name || "Nilai Indikator"}
                  dataKey={mapData.metadata.lastUpdated}
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
          {!error && mapData && displayGeojson && (
            <MapLegend 
              data={displayGeojson} 
              indicatorName={activeIndicators.find((i) => i.id === selectedIndicatorId)?.name || "Nilai Indikator"}
            />
          )}

          {/* Tombol Navigasi Kembali ke Level Kabupaten Jateng */}
          {granularity !== "Kabupaten" && (
              <button
                onClick={handleReturnToProvinsi}
                className="absolute top-4 left-14 z-[1000] flex items-center gap-2 px-3 py-1.5 bg-white/90 hover:bg-white text-slate-800 text-xs font-semibold rounded-lg shadow-md border border-slate-200 backdrop-blur-sm transition-all"
              >
                <ArrowLeft className="h-3.5 w-3.5 text-slate-700" />
                <span>Kembali ke Peta Jawa Tengah</span>
              </button>
          )}
          
          {selectedRegion && (
            <RegionDetails
              data={selectedRegion}
              granularity={granularity}
              indicatorName={activeIndicators.find((i) => i.id === selectedIndicatorId)?.name || "Nilai Indikator"}
              onClose={() => setSelectedRegion(null)}
              onDrillDown={
                selectedIndicatorId === "var-248" && (granularity === "Kabupaten" || granularity === "Provinsi") && selectedRegion.kecamatan
                  ? () => handleDrillDown(selectedRegion.kecamatan!) 
                  : undefined
              }
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
