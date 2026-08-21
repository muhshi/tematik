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
            className="inline-flex items-center gap-2 text-xs font-semibold text-sky-700 hover:text-sky-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke Peta Utama
          </Link>

          <div className="border-b border-slate-200 pb-6 space-y-2">
            <h1 className="text-3xl font-extrabold text-slate-900">
              Panduan Penggunaan Web & Cara Membaca Data
            </h1>
            <p className="text-slate-600 text-sm max-w-3xl leading-relaxed">
              Panduan lengkap tata cara menjelajahi peta tematik BPS Kabupaten Demak, memilih variabel indikator, serta memahami visualisasi peta tematik spasial.
            </p>
          </div>
        </div>

        {/* Section 1: Cara Menggunakan WebGIS */}
        <section className="space-y-4" id="cara-menggunakan">
          <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Sliders className="h-5 w-5 text-sky-600" />
            <h2>1. Langkah demi Langkah Menggunakan Aplikasi</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-white border-slate-200 p-5 space-y-2 shadow-xs">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-sky-100 text-sky-700 font-bold text-xs">1</span>
              <h3 className="text-base font-bold text-slate-900">Pilih Tema & Subjek BPS</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Buka sidebar kiri dan pilih salah satu dari 3 Tema Utama (<strong className="text-slate-800">Sosial & Kependudukan</strong>, <strong className="text-slate-800">Ekonomi</strong>, atau <strong className="text-slate-800">Pertanian</strong>), lalu klik subjek topik yang Anda inginkan (misal: <em>Kependudukan</em>, <em>Kemiskinan</em>, <em>Tanaman Pangan</em>).
              </p>
            </Card>

            <Card className="bg-white border-slate-200 p-5 space-y-2 shadow-xs">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-sky-100 text-sky-700 font-bold text-xs">2</span>
              <h3 className="text-base font-bold text-slate-900">Pilih Variabel Indikator</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pada bagian baris filter atas peta (Navbar Header), klik dropdown <strong className="text-slate-800">Indicator</strong> untuk memilih variabel spesifik yang ingin ditampilkan di peta.
              </p>
            </Card>

            <Card className="bg-white border-slate-200 p-5 space-y-2 shadow-xs">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-sky-100 text-sky-700 font-bold text-xs">3</span>
              <h3 className="text-base font-bold text-slate-900">Filter Tahun & Granularitas</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pilih survei tahun pada dropdown <strong className="text-slate-800">Year</strong>, lalu gunakan tombol toggle <strong className="text-slate-800">Granularity</strong> untuk beralih antara tingkat peta wilayah <strong className="text-slate-800">Kab/Kota</strong> (Jawa Tengah) atau <strong className="text-slate-800">Kecamatan</strong> (Kabupaten Demak).
              </p>
            </Card>

            <Card className="bg-white border-slate-200 p-5 space-y-2 shadow-xs">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-sky-100 text-sky-700 font-bold text-xs">4</span>
              <h3 className="text-base font-bold text-slate-900">Interaksi Klik Wilayah Peta</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Arahkan kursor atau klik pada salah satu polygon wilayah di peta untuk menampilkan panel informasi statistik detail di sisi kanan layar.
              </p>
            </Card>
          </div>
        </section>

        {/* Section 2: Cara Membaca Data & Legenda Warna */}
        <section className="space-y-4" id="membaca-peta">
          <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Layers className="h-5 w-5 text-indigo-600" />
            <h2>2. Cara Membaca Visualisasi Peta Tematik (Choropleth)</h2>
          </div>

          <div className="rounded-xl bg-white border border-slate-200 p-6 space-y-4 shadow-xs">
            <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
              Peta pada aplikasi ini menggunakan teknik visualisasi <strong className="text-slate-900">Choropleth</strong>, di mana setiap wilayah Kecamatan/Desa diwarnai berdasarkan angka statistik dari BPS:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-lg bg-sky-50 border border-sky-100 space-y-1">
                <span className="text-xs font-bold text-sky-800 uppercase">Warna Pekat / Gelap</span>
                <p className="text-xs text-slate-700">
                  Menandakan daerah dengan **nilai indikator yang relatif tinggi** (misal: jumlah penduduk terbanyak atau hasil panen terbesar).
                </p>
              </div>

              <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-100 space-y-1">
                <span className="text-xs font-bold text-indigo-800 uppercase">Warna Sedang</span>
                <p className="text-xs text-slate-700">
                  Menandakan daerah dengan **nilai indikator menengah** mendekati nilai rata-rata kabupaten.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-100 border border-slate-200 space-y-1">
                <span className="text-xs font-bold text-slate-700 uppercase">Warna Terang / Muda</span>
                <p className="text-xs text-slate-700">
                  Menandakan daerah dengan **nilai indikator yang lebih rendah**.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Membaca Panel Detail Wilayah */}
        <section className="space-y-4" id="detail-wilayah">
          <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Info className="h-5 w-5 text-emerald-600" />
            <h2>3. Informasi dalam Panel Detail Wilayah</h2>
          </div>

          <div className="rounded-xl bg-white border border-slate-200 p-6 space-y-3 shadow-xs">
            <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
              Saat Anda mengklik wilayah di peta, panel kanan akan menampilkan data berikut:
            </p>
            
            <ul className="space-y-2.5 text-xs md:text-sm text-slate-700">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong className="text-slate-900">Nama Wilayah:</strong> Nama Kecamatan dan Desa yang dipilih.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong className="text-slate-900">Nilai Indikator Utama:</strong> Angka aktual hasil survei resmi BPS untuk variabel yang sedang dipilih.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong className="text-slate-900">Luas Wilayah (km²):</strong> Luas geografis wilayah yang dihitung otomatis menggunakan standar proyeksi spasial.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong className="text-slate-900">Kepadatan / Rasio Spasial:</strong> Perhitungan rasio nilai indikator terhadap luas permukaan wilayah.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Section 4: Mengunduh Data */}
        <section className="space-y-4" id="export">
          <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Download className="h-5 w-5 text-amber-600" />
            <h2>4. Mengunduh & Mengeksport Data</h2>
          </div>

          <div className="rounded-xl bg-white border border-slate-200 p-6 space-y-3 shadow-xs">
            <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
              Anda dapat mengklik tombol <strong className="text-slate-900">Export Data</strong> pada bagian bawah sidebar kiri untuk menyimpan hasil visualisasi peta tematik ke dalam format data standar (<strong className="text-slate-800">GeoJSON</strong>, <strong className="text-slate-800">JSON</strong>, atau <strong className="text-slate-800">CSV</strong>).
            </p>
          </div>
        </section>

      </main>
    </div>
  );
}
