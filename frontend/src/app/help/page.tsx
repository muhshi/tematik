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
    answer: "Data ditarik secara otomatis dari API Resmi BPS Web Service Indonesia (domain 3321 untuk Kabupaten Demak dan domain 3300 untuk Provinsi Jawa Tengah) serta disinkronkan dengan database Supabase PostGIS dan cache Upstash Redis."
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
            className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke Peta Utama
          </Link>

          <div className="bg-sidebar rounded-2xl p-6 md:p-8 text-sidebar-foreground flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="space-y-2 z-10 max-w-xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider border border-primary/30">
                Pusat Bantuan
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                Ada yang bisa kami bantu?
              </h1>
              <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
                Cari jawaban cepat seputar cara membaca data, integrasi API BPS, dan pengoperasian peta spasial.
              </p>
            </div>

            {/* Quick Search */}
            <div className="w-full md:w-80 relative z-10">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik kata kunci pertanyaan..."
                className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-xs md:text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <Card 
                key={idx} 
                className={`bg-white transition-all duration-200 overflow-hidden ${
                  isOpen ? "border-primary/40 ring-1 ring-primary/20 shadow-sm" : "border-slate-200 shadow-xs"
                }`}
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className={`w-full px-5 py-4 flex items-center justify-between text-left font-bold text-sm transition-colors ${
                    isOpen ? "text-primary bg-primary/5" : "text-slate-800 hover:text-primary"
                  }`}
                >
                  <span className="pr-4">{faq.question}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180 text-primary" : "text-slate-400"}`} />
                </button>

                {isOpen && (
                  <div className="px-5 pb-4 pt-1 text-xs md:text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                    {faq.answer}
                  </div>
                )}
              </Card>
            );
          })}
        </div>

      </main>
    </div>
  );
}
