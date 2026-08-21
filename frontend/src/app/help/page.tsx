"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  HelpCircle, 
  Search, 
  ChevronDown, 
  ArrowLeft,
  MapPin,
  Database,
  MessageSquare,
  ExternalLink
} from "lucide-react";
import { Header } from "@/components/Fragments/Header";
import { Card } from "@/components/Elements/card";

interface FAQItem {
  question: string;
  answer: string;
  category: "Umum" | "Peta & GIS" | "BPS & Data";
}

const FAQS: FAQItem[] = [
  {
    category: "Umum",
    question: "Apa itu WebGIS Tematik Jawa Tengah & Kabupaten Demak?",
    answer: "WebGIS Tematik adalah platform sistem informasi geografis interaktif yang menggabungkan data statistik resmi dari BPS dengan batas wilayah spasial (Kab/Kota Jawa Tengah dan Kecamatan Demak) untuk visualisasi peta tematik choropleth."
  },
  {
    category: "Peta & GIS",
    question: "Bagaimana cara mengubah tampilan peta dari Kab/Kota ke Kecamatan?",
    answer: "Pada baris filter bagian atas peta, Anda dapat mengklik tombol toggle 'Granularity' untuk beralih antara tingkat wilayah Kab/Kota (Jawa Tengah) dan Kecamatan (Kabupaten Demak)."
  },
  {
    category: "BPS & Data",
    question: "Dari mana asal data indikator statistik yang ditampilkan?",
    answer: "Data ditarik secara otomatis dari API Resmi BPS Web Service Indonesia (domain 3321 untuk Kabupaten Demak) serta disinkronkan dengan database Supabase PostGIS dan cache Upstash Redis."
  },
  {
    category: "BPS & Data",
    question: "Mengapa beberapa indikator hanya tersedia di tahun tertentu?",
    answer: "BPS melaksanakan survei dan sensus berkala (seperti Sensus Penduduk 10 tahunan atau Survei Pertanian tahunan). Filter tahun pada aplikasi ini secara dinamis hanya menampilkan tahun survei yang tersedia untuk variabel tersebut."
  },
  {
    category: "Peta & GIS",
    question: "Bagaimana cara mendownload data hasil visualisasi peta?",
    answer: "Anda dapat mengklik tombol 'Export Data' pada sidebar navigasi untuk mengunduh data statistik dalam format GeoJSON, JSON, atau CSV."
  }
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const categories = ["Semua", "Umum", "Peta & GIS", "BPS & Data"];

  const filteredFaqs = FAQS.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === "Semua" || faq.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <Header title="Pusat Bantuan & FAQ" />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-8">
        
        {/* Back Link & Hero Banner */}
        <div className="space-y-4">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 text-xs font-semibold text-sky-700 hover:text-sky-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke Peta Utama
          </Link>

          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-700 via-indigo-600 to-sky-800 text-white p-8 md:p-10 shadow-md">
            <div className="relative z-10 space-y-4 max-w-2xl">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
                Ada yang bisa kami bantu?
              </h1>
              <p className="text-sky-100 text-sm md:text-base leading-relaxed">
                Cari panduan penggunaan, pertanyaan umum tentang data BPS Demak, serta tips penggunaan fitur GIS tematik.
              </p>

              {/* Search Bar */}
              <div className="relative max-w-xl pt-2">
                <Search className="absolute left-4 top-5 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari pertanyaan, indikator, atau kata kunci..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 rounded-xl bg-white text-slate-900 placeholder-slate-400 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Help Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="bg-white border-slate-200 p-6 rounded-xl shadow-xs hover:shadow-md transition-all">
            <div className="h-10 w-10 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 mb-4">
              <MapPin className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">Panduan Navigasi Peta</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Pelajari cara membaca legenda warna choropleth, berpindah antara Kecamatan & Desa, serta mengklik daerah.
            </p>
            <Link href="/docs#membaca-peta" className="text-xs font-semibold text-sky-600 hover:underline inline-flex items-center gap-1">
              Baca Panduan <ExternalLink className="h-3 w-3" />
            </Link>
          </Card>

          <Card className="bg-white border-slate-200 p-6 rounded-xl shadow-xs hover:shadow-md transition-all">
            <div className="h-10 w-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
              <Database className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">Penjelasan Tema & Subjek</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Pelajari pengelompokan 3 Tema Utama BPS (Sosial, Ekonomi, Pertanian) serta tata cara memilih subjek dan variabel.
            </p>
            <Link href="/docs#cara-menggunakan" className="text-xs font-semibold text-indigo-600 hover:underline inline-flex items-center gap-1">
              Lihat Panduan Web <ExternalLink className="h-3 w-3" />
            </Link>
          </Card>

          <Card className="bg-white border-slate-200 p-6 rounded-xl shadow-xs hover:shadow-md transition-all">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
              <MessageSquare className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">Hubungi Layanan BPS</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Membutuhkan data statistik khusus Kabupaten Demak yang tidak tercantum di portal WebGIS?
            </p>
            <a 
              href="https://demakkab.bps.go.id" 
              target="_blank" 
              rel="noreferrer"
              className="text-xs font-semibold text-emerald-600 hover:underline inline-flex items-center gap-1"
            >
              Kunjungi PST BPS Demak <ExternalLink className="h-3 w-3" />
            </a>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Pertanyaan yang Sering Diajukan (FAQ)</h2>
              <p className="text-xs text-slate-500">Temukan jawaban cepat seputar penggunaan aplikasi WebGIS Tematik Demak.</p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedCategory === cat 
                      ? "bg-sky-600 text-white font-semibold shadow-xs" 
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Accordions */}
          <div className="space-y-3">
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-300 rounded-xl bg-white">
                <HelpCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-500">Tidak ada pertanyaan yang sesuai pencarian Anda.</p>
              </div>
            ) : (
              filteredFaqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div 
                    key={idx}
                    className="rounded-xl bg-white border border-slate-200 shadow-xs overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
                    >
                      <span className="text-sm font-semibold text-slate-800 pr-4">
                        {faq.question}
                      </span>
                      <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-sky-600" : ""}`} />
                    </button>
                    
                    {isOpen && (
                      <div className="px-6 pb-5 pt-1 text-xs md:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
