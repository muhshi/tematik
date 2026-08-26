"use client";

import { useState } from "react";
import { 
  CheckCircle2, 
  Eye, 
  Palette, 
  Sparkles, 
  Layers, 
  Check, 
  Compass, 
  MapPin 
} from "lucide-react";
import { useTheme } from "@/components/Providers/ThemeProvider";
import type { ThemeId } from "@/lib/theme";

export default function ThemeSettings() {
  const { theme: activeTheme, setTheme, themes, currentThemeConfig } = useTheme();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleApplyTheme = (themeId: ThemeId) => {
    setTheme(themeId);
    const target = themes.find((t) => t.id === themeId);
    setToastMessage(`Tema berhasil diubah ke ${target?.name} (${target?.hex})!`);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  return (
    <div className="space-y-8 max-w-5xl pb-12">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Palette className="w-7 h-7 text-primary" />
            Pengaturan Tema Warna
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Sesuaikan skema warna antarmuka publik dan dasbor menggunakan palet warna resmi identitas BPS.
          </p>
        </div>

        {/* Current Active Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-xs self-start md:self-auto">
          <span 
            className="w-3.5 h-3.5 rounded-full ring-2 ring-white shadow-xs" 
            style={{ backgroundColor: currentThemeConfig.hex }}
          />
          <span className="text-xs font-semibold text-slate-700">
            Aktif: <span className="font-bold text-slate-900">{currentThemeConfig.name}</span>
          </span>
          <span 
            className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded text-white"
            style={{ backgroundColor: currentThemeConfig.hex }}
          >
            {currentThemeConfig.hex}
          </span>
        </div>
      </div>

      {/* Notification Toast */}
      {toastMessage && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium animate-fade-in-up shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Theme Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {themes.map((t) => {
          const isSelected = activeTheme === t.id;
          return (
            <div 
              key={t.id} 
              className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col ${
                isSelected 
                  ? 'border-primary ring-2 ring-primary/30 shadow-lg -translate-y-0.5' 
                  : 'border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md'
              }`}
            >
              {/* Visual Preview Box */}
              <div className="aspect-[16/10] border-b border-slate-100 flex relative overflow-hidden bg-slate-50">
                {/* Fake Mini Sidebar */}
                <div 
                  className="w-[28%] h-full p-2 flex flex-col justify-between"
                  style={{ backgroundColor: t.colors.sidebarBg }}
                >
                  <div className="space-y-1.5">
                    <div className="w-6 h-1.5 rounded-full bg-white/40" />
                    <div className="w-10 h-1.5 rounded-full bg-white/20" />
                    <div className="w-8 h-1.5 rounded-full bg-white/20" />
                  </div>
                  <div 
                    className="w-full h-3 rounded text-[7px] font-bold text-white flex items-center justify-center"
                    style={{ backgroundColor: t.hex }}
                  >
                    BPS
                  </div>
                </div>

                {/* Fake Mini Map Canvas */}
                <div className="flex-1 h-full p-3 flex flex-col justify-between relative bg-slate-50">
                  {/* Top Bar Preview */}
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                    <div className="w-12 h-1.5 rounded-full bg-slate-300" />
                    <div 
                      className="px-1.5 py-0.5 rounded text-[7px] font-bold text-white"
                      style={{ backgroundColor: t.hex }}
                    >
                      Kab/Kota
                    </div>
                  </div>

                  {/* Choropleth Map Shapes Preview */}
                  <div className="relative flex-1 flex items-center justify-center my-1">
                    <div 
                      className="absolute w-14 h-14 rounded-full opacity-90 transition-transform" 
                      style={{ backgroundColor: t.colors.mapLight }}
                    />
                    <div 
                      className="absolute w-10 h-10 rounded-lg opacity-80 rotate-12" 
                      style={{ backgroundColor: t.colors.mapDark }}
                    />
                    <div 
                      className="absolute w-6 h-6 rounded-full opacity-95" 
                      style={{ backgroundColor: t.hex }}
                    />
                  </div>

                  {/* Gradient Legend Strip */}
                  <div className="h-1.5 w-full rounded-full flex overflow-hidden">
                    <div className="flex-1" style={{ backgroundColor: t.colors.mapLight }} />
                    <div className="flex-1 opacity-75" style={{ backgroundColor: t.hex }} />
                    <div className="flex-1" style={{ backgroundColor: t.hex }} />
                    <div className="flex-1" style={{ backgroundColor: t.colors.mapDark }} />
                  </div>
                </div>

                {/* Hex Code Overlay Badge */}
                <div className="absolute top-2.5 right-2.5">
                  <span 
                    className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold text-white shadow-xs"
                    style={{ backgroundColor: t.hex }}
                  >
                    {t.hex}
                  </span>
                </div>
              </div>

              {/* Theme Info & Action */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-lg font-bold text-slate-900">{t.name}</h3>
                    {isSelected && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <Check className="w-3 h-3" />
                        Aktif
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t.tagline}</p>
                  <p className="text-xs text-slate-600 leading-relaxed mb-6">{t.description}</p>
                </div>

                {/* Action Button */}
                <button 
                  onClick={() => handleApplyTheme(t.id)}
                  disabled={isSelected}
                  className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-xs ${
                    isSelected 
                      ? "bg-slate-100 text-slate-500 cursor-default" 
                      : "text-white hover:opacity-95 active:scale-[0.98]"
                  }`}
                  style={{
                    backgroundColor: isSelected ? undefined : t.hex,
                  }}
                >
                  {isSelected ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Sedang Digunakan</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Terapkan {t.name}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Interactive Component Preview */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-slate-900">
              Live Preview Komponen ({currentThemeConfig.name})
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Komponen di bawah otomatis berubah warna sesuai tema yang dipilih.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Preview 1: Primary Buttons */}
          <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tombol & Aksi Utama</p>
            <div className="flex flex-col gap-2">
              <button className="w-full py-2 px-3 rounded-lg bg-primary text-primary-foreground font-semibold text-xs shadow-xs hover:opacity-90 transition-opacity">
                Tombol Primary (bg-primary)
              </button>
              <button className="w-full py-2 px-3 rounded-lg border border-primary text-primary font-semibold text-xs bg-white hover:bg-primary/5 transition-colors">
                Tombol Outline (border-primary)
              </button>
            </div>
          </div>

          {/* Preview 2: Granularity / Filter Badges */}
          <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filter Bar & Toggle</p>
            <div className="flex items-center rounded-lg border border-border bg-muted/60 p-1">
              <button className="flex-1 py-1 rounded bg-primary text-primary-foreground text-xs font-bold shadow-xs text-center">
                Kab/Kota
              </button>
              <button className="flex-1 py-1 text-slate-600 text-xs font-medium text-center hover:text-slate-900">
                Kecamatan
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                Badge Aktif
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold text-white bg-primary">
                {currentThemeConfig.hex}
              </span>
            </div>
          </div>

          {/* Preview 3: Choropleth Gradient */}
          <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gradasi Peta Tematik</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: "var(--choropleth-4)" }} />
                <span className="text-xs text-slate-700 font-medium">Tinggi (var(--choropleth-4))</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: "var(--choropleth-3)" }} />
                <span className="text-xs text-slate-700 font-medium">Menengah Tinggi (var(--choropleth-3))</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: "var(--choropleth-2)" }} />
                <span className="text-xs text-slate-700 font-medium">Menengah Rendah (var(--choropleth-2))</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: "var(--choropleth-1)" }} />
                <span className="text-xs text-slate-700 font-medium">Rendah (var(--choropleth-1))</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
