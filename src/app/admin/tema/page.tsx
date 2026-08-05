"use client";

import { useState } from "react";
import { CheckCircle2, Eye } from "lucide-react";

const themes = [
  {
    id: "blue",
    name: "Tema Biru (Default)",
    description: "Warna standar institusi dengan kontras tinggi untuk akurasi data.",
    colors: {
      sidebar: "bg-[#0A192F]",
      mapLight: "bg-blue-300",
      mapDark: "bg-blue-500",
      bgBase: "bg-blue-100",
    },
    buttonColor: "bg-slate-200 text-slate-700",
    buttonText: "Sedang Aktif",
    isActive: true,
  },
  {
    id: "orange",
    name: "Tema Oren",
    description: "Skema warna hangat, cocok untuk visualisasi kepadatan penduduk.",
    colors: {
      sidebar: "bg-[#3d2b1a]",
      mapLight: "bg-orange-300",
      mapDark: "bg-[#f99a40]",
      bgBase: "bg-orange-100",
    },
    buttonColor: "bg-teal-700 text-white hover:bg-teal-800",
    buttonText: "Terapkan Tema",
    isActive: false,
  },
  {
    id: "green",
    name: "Tema Hijau",
    description: "Aesthetic segar, ideal untuk data lingkungan dan agraria.",
    colors: {
      sidebar: "bg-[#0a2f1d]",
      mapLight: "bg-emerald-300",
      mapDark: "bg-emerald-500",
      bgBase: "bg-emerald-100",
    },
    buttonColor: "bg-teal-700 text-white hover:bg-teal-800",
    buttonText: "Terapkan Tema",
    isActive: false,
  }
];

export default function ThemeSettings() {
  const [activeTheme, setActiveTheme] = useState("blue");

  return (
    <div className="space-y-6 max-w-5xl pb-10">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Pengaturan Tema Warna
        </h1>
      </div>
      
      <p className="text-slate-600 max-w-3xl">
        Pilih skema warna utama untuk antarmuka dashboard peta. Perubahan akan diterapkan secara instan ke seluruh komponen visual sistem.
      </p>

      {/* Theme Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {themes.map((theme) => (
          <div 
            key={theme.id} 
            className={`bg-white rounded-xl border ${activeTheme === theme.id ? 'border-blue-500 shadow-md ring-1 ring-blue-500' : 'border-slate-200 shadow-sm'} p-5 flex flex-col transition-all`}
          >
            {/* Visual Preview Box */}
            <div className="aspect-[4/3] rounded-lg border border-slate-200 overflow-hidden flex mb-5 bg-white">
              {/* Fake Sidebar */}
              <div className={`${theme.colors.sidebar} w-1/4 h-full`}></div>
              {/* Fake Map Content */}
              <div className="w-3/4 h-full bg-slate-50 flex items-center justify-center p-4">
                <div className={`w-full h-full ${theme.colors.bgBase} rounded-md flex items-center justify-center relative`}>
                  {/* Fake Map Shapes */}
                  <div className={`absolute w-12 h-12 rounded-full ${theme.colors.mapLight} opacity-80 left-4 top-4 mix-blend-multiply`}></div>
                  <div className={`absolute w-14 h-10 rounded-lg ${theme.colors.mapDark} opacity-60 right-6 bottom-6 mix-blend-multiply`}></div>
                </div>
              </div>
            </div>

            {/* Theme Info */}
            <h3 className="text-lg font-bold text-slate-900 mb-2">{theme.name}</h3>
            <p className="text-sm text-slate-500 mb-6 flex-1">{theme.description}</p>

            {/* Action Button */}
            <button 
              onClick={() => setActiveTheme(theme.id)}
              className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
                activeTheme === theme.id 
                  ? "bg-slate-100 text-slate-700 cursor-default" 
                  : "bg-teal-700 text-white hover:bg-teal-800"
              }`}
            >
              {activeTheme === theme.id && <CheckCircle2 className="w-4 h-4" />}
              {activeTheme === theme.id ? "Sedang Aktif" : "Terapkan Tema"}
            </button>
          </div>
        ))}
      </div>

      {/* Preview Section Box */}
      <div className="mt-8 border border-slate-300 border-dashed rounded-xl bg-slate-50 p-16 flex flex-col items-center justify-center text-slate-400">
        <Eye className="w-10 h-10 mb-3 opacity-50" />
        <p className="font-medium">Klik &quot;Terapkan Tema&quot; untuk melihat preview instan di sini</p>
      </div>
    </div>
  );
}
