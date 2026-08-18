import { 
  Database, 
  Palette, 
  CheckCircle2, 
  Activity,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

export default function AdminOverview() {
  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
          Dashboard Overview
        </h1>
        <p className="text-slate-500">
          Ringkasan status sistem dan konfigurasi Peta Tematik BPS.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-emerald-100 p-3 rounded-lg text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Status API</p>
              <h3 className="text-xl font-bold text-slate-900">Online</h3>
            </div>
          </div>
          <div className="text-sm text-emerald-600 font-medium">
            Tersambung ke Server BPS
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Kategori</p>
              <h3 className="text-xl font-bold text-slate-900">3 Kategori</h3>
            </div>
          </div>
          <div className="text-sm text-slate-500">
            Dari API Domain 3321
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-orange-100 p-3 rounded-lg text-orange-600">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Indikator Aktif</p>
              <h3 className="text-xl font-bold text-slate-900">28</h3>
            </div>
          </div>
          <div className="text-sm text-slate-500">
            Ditampilkan di Peta Publik
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-purple-100 p-3 rounded-lg text-purple-600">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Tema Aktif</p>
              <h3 className="text-xl font-bold text-slate-900">Tema Biru</h3>
            </div>
          </div>
          <div className="text-sm text-slate-500">
            Konfigurasi tampilan UI
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Link href="/admin/indikator" className="group">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:border-slate-300 hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                  Atur Indikator Data
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed max-w-sm">
                  Pilih indikator mana saja dari BPS yang akan ditampilkan kepada publik di Peta Tematik.
                </p>
              </div>
              <div className="bg-slate-50 p-2 rounded-full group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </div>
        </Link>
        
        <Link href="/admin/tema" className="group">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:border-slate-300 hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-[#f99a40] transition-colors">
                  Atur Tema Warna
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed max-w-sm">
                  Ubah skema warna tampilan dasbor peta dan *sidebar* publik dalam satu klik.
                </p>
              </div>
              <div className="bg-slate-50 p-2 rounded-full group-hover:bg-orange-50 group-hover:text-[#f99a40] transition-colors">
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
