"use client";

import { useState, useEffect } from "react";
import { 
  Save, 
  Search, 
  Filter, 
  Settings, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  ActivitySquare,
  Loader2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Switch } from "@/components/Elements/Switch";
import { 
  getIndicatorData, 
  saveActiveIndicators, 
  syncBpsApi,
  type Indicator 
} from "@/actions/adminActions";

// {*Fungsi Utama: Halaman Admin untuk mengatur Indikator mana yang boleh tampil di Dashboard Utama*}
export default function AdminIndikatorPage() {
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [filteredIndicators, setFilteredIndicators] = useState<Indicator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua Kategori");
  const [selectedSubject, setSelectedSubject] = useState("Semua Subjek");
  const [lastSyncDate, setLastSyncDate] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const { indicators: data, syncDate } = await getIndicatorData();
    setIndicators(data);
    setFilteredIndicators(data);
    setLastSyncDate(syncDate);
    setIsLoading(false);
  };

  // Compute available subjects based on selected category
  const availableSubjects = selectedCategory === "Semua Kategori"
    ? Array.from(new Set(indicators.map(i => i.subjectName || "Lainnya")))
    : Array.from(new Set(indicators.filter(i => i.category === selectedCategory).map(i => i.subjectName || "Lainnya")));

  // Search & Filter effect
  useEffect(() => {
    let result = [...indicators];

    if (selectedCategory !== "Semua Kategori") {
      result = result.filter(ind => ind.category === selectedCategory);
    }

    if (selectedSubject !== "Semua Subjek") {
      result = result.filter(ind => (ind.subjectName || "Lainnya") === selectedSubject);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(ind => 
        ind.name.toLowerCase().includes(q) || 
        ind.code.toLowerCase().includes(q)
      );
    }

    // Sort so active indicators are at the top, then alphabetically
    result.sort((a, b) => {
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      return a.name.localeCompare(b.name);
    });

    setFilteredIndicators(result);
    setCurrentPage(1); // Reset to page 1 on filter change
  }, [searchQuery, selectedCategory, selectedSubject, indicators]);

  // Reset subject when category changes
  useEffect(() => {
    setSelectedSubject("Semua Subjek");
  }, [selectedCategory]);

  const toggleIndicator = (id: string) => {
    setIndicators(indicators.map(ind => 
      ind.id === id ? { ...ind, isActive: !ind.isActive } : ind
    ));
  };

  // {*Fungsi: Menyimpan konfigurasi toggle ke file JSON via Server Action*}
  const handleSave = async () => {
    setIsSaving(true);
    const activeIds = indicators.filter(ind => ind.isActive).map(ind => ind.id);
    const res = await saveActiveIndicators(activeIds);
    if (res.success) {
      alert("Berhasil menyimpan indikator aktif!");
    } else {
      alert("Gagal menyimpan: " + res.message);
    }
    setIsSaving(false);
  };

  const handleSync = async () => {
    if (!confirm("Proses ini akan mengunduh seluruh data indikator dari API BPS dan bisa memakan waktu hingga 1-2 menit. Lanjutkan?")) return;
    
    setIsSyncing(true);
    const res = await syncBpsApi();
    
    if (res.success) {
      alert(res.message);
      await loadData();
    } else {
      alert("Gagal sinkronisasi: " + res.message);
    }
    setIsSyncing(false);
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredIndicators.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedIndicators = filteredIndicators.slice(startIndex, startIndex + itemsPerPage);

  const activeCount = indicators.filter(ind => ind.isActive).length;
  const inactiveCount = indicators.length - activeCount;

  return (
    <div className="space-y-6 max-w-6xl pb-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Manajemen Indikator BPS
          </h1>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 self-start">
            <div className={`w-2 h-2 rounded-full ${lastSyncDate ? 'bg-primary animate-pulse' : 'bg-amber-500'}`}></div>
            <span className={`text-xs font-semibold uppercase tracking-wider ${lastSyncDate ? 'text-primary' : 'text-amber-700'}`}>
              {lastSyncDate ? 'Tersinkronisasi' : 'Belum Tersinkronisasi'}
            </span>
          </div>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={isSaving || isLoading}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:opacity-90 disabled:opacity-50 text-primary-foreground rounded-lg font-medium transition-all shadow-sm"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Kategori Subjek */}
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Kategori Subjek
            </label>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer"
            >
              <option value="Semua Kategori">Semua Kategori</option>
              {Array.from(new Set(indicators.map(i => i.category))).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Subjek */}
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Subjek
            </label>
            <select 
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer"
            >
              <option value="Semua Subjek">Semua Subjek</option>
              {availableSubjects.sort().map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama indikator atau kode..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 md:px-6 py-4 md:py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Daftar Indikator Statistik</h2>
            {lastSyncDate && <p className="text-xs text-slate-500 mt-1">Update terakhir: {lastSyncDate}</p>}
          </div>
          <div className="inline-flex px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold self-start mt-2 sm:mt-0">
            {filteredIndicators.length} Indikator Ditemukan
          </div>
        </div>
        
        <div className="border-t border-slate-100">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p>Memuat data indikator...</p>
            </div>
          ) : filteredIndicators.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
              <ActivitySquare className="w-12 h-12 opacity-20" />
              <p className="font-medium text-slate-500">Data indikator tidak ditemukan.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <table className="hidden md:table w-full text-left text-sm whitespace-normal">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 w-20">Status</th>
                    <th className="px-6 py-4 min-w-[200px]">Nama Indikator</th>
                    <th className="px-6 py-4">Kode Variabel</th>
                    <th className="px-6 py-4">Terakhir Diperbarui</th>
                    <th className="px-6 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedIndicators.map((ind) => (
                    <tr key={ind.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <Switch 
                          checked={ind.isActive} 
                          onChange={() => toggleIndicator(ind.id)}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-normal">
                        <p className={`font-bold ${ind.isActive ? 'text-slate-900' : 'text-slate-500'}`}>
                          {ind.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{ind.subjectName || ind.category}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-slate-600">
                          <span className="text-slate-400 font-sans">Var</span>
                          {ind.code.replace('Var ', '')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {ind.lastUpdated}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                          <Settings className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile Card View */}
              <div className="md:hidden flex flex-col divide-y divide-slate-100">
                {paginatedIndicators.map((ind) => (
                  <div key={ind.id} className={`p-4 flex flex-col gap-3 transition-colors ${ind.isActive ? 'bg-white' : 'bg-slate-50/50'}`}>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-slate-600">
                        <span className="text-slate-400 font-sans">Var</span>
                        {ind.code.replace('Var ', '')}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${ind.isActive ? 'text-primary' : 'text-slate-400'}`}>
                          {ind.isActive ? 'AKTIF' : 'NONAKTIF'}
                        </span>
                        <Switch 
                          checked={ind.isActive} 
                          onChange={() => toggleIndicator(ind.id)}
                        />
                      </div>
                    </div>
                    <div>
                      <p className={`font-bold text-[15px] leading-snug ${ind.isActive ? 'text-slate-900' : 'text-slate-500'}`}>
                        {ind.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{ind.subjectName || ind.category}</p>
                    </div>
                    <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-100/60">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Diperbarui</span>
                        <span className="text-xs text-slate-600 font-medium">{ind.lastUpdated}</span>
                      </div>
                      <button className="p-2 text-slate-500 hover:text-slate-900 bg-white shadow-sm border border-slate-200 rounded-lg transition-colors flex items-center justify-center">
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        
        {/* Table Footer */}
        <div className="px-4 md:px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 rounded-lg font-medium transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Menyinkronkan...' : 'Refresh BPS API'}
          </button>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-slate-500">
            <span className="text-xs sm:text-sm">
              {filteredIndicators.length > 0 
                ? `Menampilkan ${startIndex + 1}-${Math.min(startIndex + itemsPerPage, filteredIndicators.length)} dari ${filteredIndicators.length} indikator`
                : "Tidak ada data"}
            </span>
            {totalPages > 1 && (
              <div className="flex gap-1">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="px-3 h-8 flex items-center justify-center rounded bg-primary text-primary-foreground font-medium text-xs">
                  Hal {currentPage} / {totalPages}
                </div>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-primary p-3 rounded-xl text-primary-foreground shadow-xs">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Indikator Aktif</p>
            <h3 className="text-2xl font-black text-slate-900">{activeCount}</h3>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-slate-200 p-3 rounded-xl text-slate-700">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Indikator Non-Aktif</p>
            <h3 className="text-2xl font-black text-slate-900">{inactiveCount}</h3>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-primary/20 p-3 rounded-xl text-primary">
            <ActivitySquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Indikator</p>
            <h3 className="text-2xl font-black text-slate-900">{indicators.length}</h3>
          </div>
        </div>
      </div>
    </div>
  );
}
