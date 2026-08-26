"use client";

import Link from "next/link";
import { 
  Sliders, 
  Layers, 
  Download, 
  ArrowLeft, 
  CheckCircle2, 
  Info
} from "lucide-react";
import { Header } from "@/components/Fragments/Header";
import { Card } from "@/components/Elements/card";

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <Header title="Panduan Penggunaan Web" />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 space-y-10">
        
        {/* Navigation & Header */}
        <div className="space-y-4">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke Peta Utama
          </Link>

          <div className="border-b border-slate-200 pb-6 space-y-2">
            <h1 className="text-3xl font-extrabold text-slate-900">
              Panduan Penggunaan Web & Cara Membaca Data
            </h1>
            <p className="text-slate-600 text-sm max-w-3xl leading-relaxed">
              Panduan lengkap tata cara menjelajahi peta tematik BPS Kabupaten Demak dan Jawa Tengah, memilih variabel indikator, serta memahami visualisasi peta tematik spasial.
            </p>
          </div>
        </div>

        {/* Section 1: Cara Menggunakan WebGIS */}
        <section className="space-y-4" id="cara-menggunakan">
          <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Sliders className="h-5 w-5 text-primary" />
            <h2>1. Langkah demi Langkah Menggunakan Aplikasi</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-white border-slate-200 p-5 space-y-2 shadow-xs">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary font-bold text-xs">1</span>
              <h3 className="text-base font-bold text-slate-900">Pilih Tema & Subjek BPS</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Buka sidebar kiri dan pilih salah satu dari Tema Utama (<strong className="text-slate-800">Sosial & Kependudukan</strong> atau <strong className="text-slate-800">Ekonomi</strong>), lalu klik subjek topik yang Anda inginkan (misal: <em>Kependudukan</em>, <em>Kemiskinan</em>, <em>Ketenagakerjaan</em>).
              </p>
            </Card>

            <Card className="bg-white border-slate-200 p-5 space-y-2 shadow-xs">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary font-bold text-xs">2</span>
              <h3 className="text-base font-bold text-slate-900">Pilih Variabel Indikator</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pada bagian baris filter atas peta (Navbar Header), klik dropdown <strong className="text-slate-800">Indicator</strong> untuk memilih variabel spesifik yang ingin ditampilkan di peta.
              </p>
            </Card>

            <Card className="bg-white border-slate-200 p-5 space-y-2 shadow-xs">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary font-bold text-xs">3</span>
              <h3 className="text-base font-bold text-slate-900">Filter Tahun & Granularitas</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pilih survei tahun pada dropdown <strong className="text-slate-800">Year</strong>, lalu gunakan tombol toggle <strong className="text-slate-800">Granularity</strong> untuk beralih antara tingkat peta wilayah <strong className="text-slate-800">Kab/Kota</strong> (Jawa Tengah) atau <strong className="text-slate-800">Kecamatan</strong> (Kabupaten Demak).
              </p>
            </Card>

            <Card className="bg-white border-slate-200 p-5 space-y-2 shadow-xs">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary font-bold text-xs">4</span>
              <h3 className="text-base font-bold text-slate-900">Interaksi Klik Wilayah Peta</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Arahkan kursor atau klik pada salah satu polygon wilayah di peta untuk menampilkan panel informasi statistik detail di sisi kanan layar.
              </p>
            </Card>
          </div>
        </section>

        {/* Section 2: Membaca Gradasi Peta */}
        <section className="space-y-4" id="membaca-peta">
          <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Layers className="h-5 w-5 text-primary" />
            <h2>2. Cara Membaca Gradasi Warna Peta (Metode Choropleth)</h2>
          </div>

          <Card className="bg-white border-slate-200 p-6 space-y-4 shadow-xs">
            <p className="text-xs text-slate-600 leading-relaxed">
              Peta tematik menggunakan klasifikasi interval kuartil 4 kelas (*Quartile classification*), membagi seluruh wilayah ke dalam 4 tingkatan warna dari rendah hingga tinggi:
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-6 w-8 rounded border border-slate-200 shrink-0" style={{ backgroundColor: "var(--choropleth-4)" }} />
                <div>
                  <p className="text-xs font-bold text-slate-900">Kuartil 4 (Tinggi)</p>
                  <p className="text-[11px] text-slate-500">Nilai data berada di 25% rentang nilai tertinggi.</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-6 w-8 rounded border border-slate-200 shrink-0" style={{ backgroundColor: "var(--choropleth-3)" }} />
                <div>
                  <p className="text-xs font-bold text-slate-900">Kuartil 3 (Menengah Tinggi)</p>
                  <p className="text-[11px] text-slate-500">Nilai data di atas rata-rata tengah median.</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-6 w-8 rounded border border-slate-200 shrink-0" style={{ backgroundColor: "var(--choropleth-2)" }} />
                <div>
                  <p className="text-xs font-bold text-slate-900">Kuartil 2 (Menengah Rendah)</p>
                  <p className="text-[11px] text-slate-500">Nilai data di bawah rata-rata tengah median.</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-6 w-8 rounded border border-slate-200 shrink-0" style={{ backgroundColor: "var(--choropleth-1)" }} />
                <div>
                  <p className="text-xs font-bold text-slate-900">Kuartil 1 (Rendah)</p>
                  <p className="text-[11px] text-slate-500">Nilai data berada di 25% rentang nilai terendah.</p>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Section 3: Sumber Data */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Info className="h-5 w-5 text-primary" />
            <h2>3. Sumber & Keandalan Data</h2>
          </div>

          <Card className="bg-primary/5 border-primary/20 p-5 space-y-2">
            <h3 className="text-sm font-bold text-slate-900">Dynamic Table API BPS Resmi</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Seluruh data kependudukan dan sosial ekonomi ditarik secara langsung dari server API Resmi Badan Pusat Statistik (Domain 3321 untuk BPS Demak dan Domain 3300 untuk BPS Provinsi Jawa Tengah).
            </p>
          </Card>
        </section>

      </main>
    </div>
  );
}
