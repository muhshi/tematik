import { 
  Database, 
  Palette, 
  CheckCircle2, 
  Activity,
  ArrowRight,
  Sparkles,
  MapPin
} from "lucide-react";
import Link from "next/link";
import { cookies } from "next/headers";
import { getIndicatorData } from "@/actions/adminActions";
import { BPS_THEMES } from "@/lib/theme";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminOverview() {
  const { indicators, syncDate } = await getIndicatorData();

  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("bps-theme")?.value || "blue";
  const activeThemeObj = BPS_THEMES.find((t) => t.id === themeCookie) || BPS_THEMES[0];

  const activeIndicators = indicators.filter((ind) => ind.isActive);
  const activeCount = activeIndicators.length;
  const totalCount = indicators.length;
  const activeCategories = Array.from(new Set(activeIndicators.map((ind) => ind.category)));
  const totalCategories = Array.from(new Set(indicators.map((ind) => ind.category)));

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
            Dashboard Overview
          </h1>
          <p className="text-slate-500 text-sm">
            Ringkasan status sistem dan konfigurasi Peta Tematik BPS.
          </p>
        </div>
        {syncDate && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium self-start md:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Sinkronisasi terakhir: {syncDate}
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Status API */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between overflow-hidden">
          <div className="flex items-center gap-3.5 mb-3 min-w-0">
            <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600 shrink-0 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Status API</p>
              <h3 className="text-lg font-bold text-slate-900 truncate">Online</h3>
            </div>
          </div>
          <div className="text-xs text-emerald-600 font-medium truncate">
            Tersambung ke Server BPS
          </div>
        </div>

        {/* Card 2: Total Kategori */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between overflow-hidden">
          <div className="flex items-center gap-3.5 mb-3 min-w-0">
            <div className="bg-blue-100 p-3 rounded-xl text-blue-600 shrink-0 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Kategori</p>
              <h3 className="text-lg font-bold text-slate-900 truncate">
                {activeCategories.length > 0 ? `${activeCategories.length} Kategori` : `${totalCategories.length} Kategori`}
              </h3>
            </div>
          </div>
          <div className="text-xs text-slate-500 truncate" title={activeCategories.join(" & ") || "Domain BPS 3321 & 3300"}>
            {activeCategories.join(" & ") || "Domain BPS 3321 & 3300"}
          </div>
        </div>

        {/* Card 3: Indikator Aktif (Dinamis) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between overflow-hidden">
          <div className="flex items-center gap-3.5 mb-3 min-w-0">
            <div className="bg-orange-100 p-3 rounded-xl text-orange-600 shrink-0 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Indikator Aktif</p>
              <h3 className="text-xl font-bold text-slate-900 truncate">
                {activeCount} <span className="text-xs font-normal text-slate-400">/ {totalCount}</span>
              </h3>
            </div>
          </div>
          <div className="text-xs text-slate-500 truncate">
            Ditampilkan di Peta Publik
          </div>
        </div>

        {/* Card 4: Tema Aktif (Anti-Overflow / Responsif) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between overflow-hidden">
          <div className="flex items-center gap-3.5 mb-3 min-w-0">
            <div 
              className="p-3 rounded-xl text-white shrink-0 shadow-xs flex items-center justify-center"
              style={{ backgroundColor: activeThemeObj.hex }}
            >
              <Palette className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Tema Aktif</p>
              <h3 
                className="text-sm md:text-[15px] font-bold text-slate-900 leading-tight truncate" 
                title={activeThemeObj.name}
              >
                {activeThemeObj.name}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 min-w-0 overflow-hidden">
            <span 
              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" 
              style={{ backgroundColor: activeThemeObj.hex }}
            />
            <span className="font-mono font-bold text-slate-700 shrink-0">{activeThemeObj.hex}</span>
            <span className="text-[11px] text-slate-400 truncate">• Resmi BPS</span>
          </div>
        </div>
      </div>

      {/* Active Indicators Quick List */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-slate-900">
              Indikator Strategis Tayang ({activeCount})
            </h2>
          </div>
          <Link
            href="/admin/indikator"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            Kelola di Manajemen Indikator →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {activeIndicators.map((ind, idx) => (
            <div
              key={ind.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all"
            >
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="text-sm font-semibold text-slate-800 line-clamp-1">
                  {ind.name.replace(/\[.*?\]/g, "").trim()}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                  <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                    {ind.code || ind.id}
                  </span>
                  <span>•</span>
                  <span className="truncate">{ind.category}</span>
                </div>
              </div>
            </div>
          ))}
          {activeIndicators.length === 0 && (
            <div className="col-span-full py-6 text-center text-slate-400 text-sm">
              Belum ada indikator yang diaktifkan. Kunjungi menu Atur Indikator Data untuk mengaktifkan.
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Link href="/admin/indikator" className="group">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:border-slate-300 hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-primary transition-colors">
                  Atur Indikator Data
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed max-w-sm">
                  Pilih indikator mana saja dari BPS yang akan ditampilkan kepada publik di Peta Tematik.
                </p>
              </div>
              <div className="bg-slate-50 p-2 rounded-full group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </div>
        </Link>
        
        <Link href="/admin/tema" className="group">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:border-slate-300 hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-primary transition-colors">
                  Atur Tema Warna
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed max-w-sm">
                  Ubah skema warna tampilan dasbor peta dan *sidebar* publik dalam satu klik.
                </p>
              </div>
              <div className="bg-slate-50 p-2 rounded-full group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
