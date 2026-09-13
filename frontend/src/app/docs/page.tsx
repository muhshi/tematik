"use client";

import Link from "next/link";
import { 
  Sliders, 
  Layers, 
  Download, 
  ArrowLeft,
  ArrowRight,
  CheckCircle2, 
  Info,
  MapPin,
  BarChart3,
  Users,
  Compass,
  TrendingUp,
  FileSpreadsheet,
  ActivitySquare
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
          <div className="flex items-center justify-between flex-wrap gap-3">
            <Link 
              href="/" 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-primary bg-white hover:bg-slate-100 border border-slate-200 shadow-xs transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-slate-500" />
              <span>Kembali ke Beranda</span>
            </Link>

            <Link 
              href="/dashboard" 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-primary hover:bg-primary/90 shadow-xs transition-all"
            >
              <MapPin className="h-3.5 w-3.5" />
              <span>Buka Dashboard Peta</span>
              <ArrowRight className="h-3.5 w-3.5 ml-0.5" />
            </Link>
          </div>

          <div className="border-b border-slate-200 pb-6 space-y-2">
            <h1 className="text-3xl font-extrabold text-slate-900">
              Panduan Penggunaan Web & Cara Membaca Data
            </h1>
            <p className="text-slate-600 text-sm max-w-3xl leading-relaxed">
              Panduan resmi tata cara menjelajahi peta tematik BPS, memilih variabel indikator strategis, membaca metrik rincian di panel informasi, hingga melakukan drill-down spasial tingkat kecamatan.
            </p>
          </div>
        </div>

        {/* Section 1: Cara Menggunakan WebGIS */}
        <section className="space-y-4" id="cara-menggunakan">
          <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Sliders className="h-5 w-5 text-primary" />
            <h2>1. Langkah demi Langkah Menggunakan Dashboard Peta</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-white border-slate-200 p-5 space-y-2.5 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary font-bold text-xs">1</span>
                <h3 className="text-base font-bold text-slate-900">Pilih Kategori & Subjek di Sidebar Kiri</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Buka menu sidebar di sisi kiri layar. Pilih salah satu kategori utama (<strong className="text-slate-800">Sosial dan Kependudukan</strong> atau <strong className="text-slate-800">Ekonomi dan Perdagangan</strong>), lalu klik subjek yang ingin dianalisis (misalnya: <em>Kependudukan</em>, <em>Kemiskinan dan Ketimpangan</em>, <em>Indeks Pembangunan Manusia</em>, atau <em>Ketenagakerjaan</em>).
              </p>
            </Card>

            <Card className="bg-white border-slate-200 p-5 space-y-2.5 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary font-bold text-xs">2</span>
                <h3 className="text-base font-bold text-slate-900">Tentukan Indikator & Tahun pada Filter Atas</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pada baris filter bagian atas peta, gunakan dropdown <strong className="text-slate-800">Indikator</strong> untuk memilih variabel turunan, serta dropdown <strong className="text-slate-800">Tahun</strong> untuk menentukan tahun survei. Daftar tahun secara dinamis hanya menampilkan tahun-tahun yang memiliki rilis data valid dari BPS.
              </p>
            </Card>

            <Card className="bg-white border-slate-200 p-5 space-y-2.5 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary font-bold text-xs">3</span>
                <h3 className="text-base font-bold text-slate-900">Interaksi Klik Wilayah & Panel Kanan</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Peta awal memvisualisasikan 35 Kabupaten/Kota se-Jawa Tengah. Arahkan kursor (*hover*) untuk membaca tooltip ringkas, atau <strong className="text-slate-800">klik pada poligon wilayah</strong> untuk membuka panel rincian statistik lengkap di sisi kanan layar.
              </p>
            </Card>

            <Card className="bg-white border-slate-200 p-5 space-y-2.5 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary font-bold text-xs">4</span>
                <h3 className="text-base font-bold text-slate-900">Membaca Rincian Multi-Indikator</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Panel samping kanan otomatis memperkaya data wilayah yang dipilih dengan indikator komposit resmi:
              </p>
              <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                <li><strong className="text-slate-700">Kemiskinan:</strong> Persentase P0, Jumlah Penduduk Miskin (Ribu Jiwa), dan Garis Kemiskinan (Rp/kapita/bulan).</li>
                <li><strong className="text-slate-700">IPM:</strong> Usia Harapan Hidup, Harapan Lama Sekolah, Rata-rata Lama Sekolah, dan Pengeluaran Riil.</li>
                <li><strong className="text-slate-700">Kependudukan:</strong> Komposisi Gender & diagram kelompok umur.</li>
              </ul>
            </Card>

            <Card className="bg-white border-slate-200 p-5 space-y-2.5 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary font-bold text-xs">5</span>
                <h3 className="text-base font-bold text-slate-900">Fitur Drill-Down Spasial ke Kecamatan</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Khusus untuk indikator <strong className="text-slate-800">Jumlah Penduduk</strong>, klik tombol <strong className="text-primary font-semibold">"Lihat Peta Tingkat Kecamatan"</strong> di bagian bawah panel kanan. Peta akan otomatis memuat batas dan data spesifik per kecamatan untuk kabupaten tersebut. Tombol <strong className="text-slate-800">"Kembali ke Peta Jawa Tengah"</strong> akan muncul di kiri atas peta.
              </p>
            </Card>

            <Card className="bg-white border-slate-200 p-5 space-y-2.5 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary font-bold text-xs">6</span>
                <h3 className="text-base font-bold text-slate-900">Ekspor Data Tabular & Spasial</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Gunakan tombol <strong className="text-slate-800">Export</strong> pada baris filter atas untuk mengunduh hasil visualisasi:
              </p>
              <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                <li><strong className="text-slate-700">GeoJSON:</strong> Format data spasial vektor untuk aplikasi GIS (QGIS, ArcGIS).</li>
                <li><strong className="text-slate-700">CSV:</strong> Format tabel data angka untuk Microsoft Excel atau software statistik.</li>
                <li><strong className="text-slate-700">PNG / Cetak:</strong> Tangkapan visual peta tematik beresolusi tinggi.</li>
              </ul>
            </Card>
          </div>
        </section>

        {/* Section 2: Membaca Gradasi Peta */}
        <section className="space-y-4" id="membaca-peta">
          <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Layers className="h-5 w-5 text-primary" />
            <h2>2. Cara Membaca Gradasi Warna Peta (Klasifikasi Choropleth)</h2>
          </div>

          <Card className="bg-white border-slate-200 p-6 space-y-5 shadow-xs">
            <p className="text-xs text-slate-600 leading-relaxed">
              Peta tematik ini menerapkan metode klasifikasi <strong className="text-slate-800">Kuartil 4 Kelas (*Quartile Interval*)</strong>. Metode ini mengurutkan nilai statistik dari yang terendah ke tertinggi lalu membaginya ke dalam 4 kuadran kelompok secara seimbang:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50/60">
                <div className="h-7 w-9 rounded border border-slate-300 shrink-0 mt-0.5" style={{ backgroundColor: "#0284c7" }} />
                <div>
                  <p className="text-xs font-bold text-slate-900">Kuartil 4 (Tertinggi / Warna Pekat)</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                    Mewakili 25% wilayah dengan nilai angka statistik tertinggi (rentang persentil 75% - 100%).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50/60">
                <div className="h-7 w-9 rounded border border-slate-300 shrink-0 mt-0.5" style={{ backgroundColor: "#38bdf8" }} />
                <div>
                  <p className="text-xs font-bold text-slate-900">Kuartil 3 (Menengah Tinggi)</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                    Mewakili wilayah dengan nilai di atas rata-rata tengah median (rentang persentil 50% - 75%).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50/60">
                <div className="h-7 w-9 rounded border border-slate-300 shrink-0 mt-0.5" style={{ backgroundColor: "#7dd3fc" }} />
                <div>
                  <p className="text-xs font-bold text-slate-900">Kuartil 2 (Menengah Rendah)</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                    Mewakili wilayah dengan nilai di bawah rata-rata tengah median (rentang persentil 25% - 50%).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50/60">
                <div className="h-7 w-9 rounded border border-slate-300 shrink-0 mt-0.5" style={{ backgroundColor: "#bae6fd" }} />
                <div>
                  <p className="text-xs font-bold text-slate-900">Kuartil 1 (Terendah / Warna Muda)</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                    Mewakili 25% wilayah dengan nilai angka statistik paling rendah (rentang persentil 0% - 25%).
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-slate-200 bg-white">
              <div className="h-6 w-9 rounded border border-slate-300 shrink-0 bg-slate-200" />
              <div className="text-xs text-slate-600">
                <strong className="text-slate-800">Warna Abu-abu Netral:</strong> Menandakan bahwa data indikator untuk wilayah tersebut belum dipublikasikan secara resmi oleh BPS pada tahun survei yang bersangkutan.
              </div>
            </div>
          </Card>
        </section>

        {/* Section 3: Indikator Strategis Utama */}
        <section className="space-y-4" id="indikator-strategis">
          <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <ActivitySquare className="h-5 w-5 text-primary" />
            <h2>3. Penjelasan Variabel Indikator Strategis BPS</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-white border-slate-200 p-5 space-y-2 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-primary" />
                Kemiskinan & Ketimpangan
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Diukur menggunakan konsep kebutuhan dasar (*basic needs approach*). Penduduk miskin adalah penduduk yang memiliki rata-rata pengeluaran per kapita per bulan di bawah Garis Kemiskinan. Indikator mencakup persentase penduduk miskin (P0), estimasi jumlah jiwa, dan nilai rupiah garis kemiskinan.
              </p>
            </Card>

            <Card className="bg-white border-slate-200 p-5 space-y-2 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Indeks Pembangunan Manusia (IPM)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Mengukur capaian pembangunan manusia berbasis tiga dimensi dasar: umur panjang dan hidup sehat (UHH), pengetahuan (Harapan Lama Sekolah & Rata-rata Lama Sekolah), serta standar hidup layak (Pengeluaran Riil per Kapita yang disesuaikan).
              </p>
            </Card>

            <Card className="bg-white border-slate-200 p-5 space-y-2 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Users className="h-4 w-4 text-primary" />
                Kependudukan & Demografi
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Berdasarkan hasil Sensus Penduduk dan Proyeksi Penduduk resmi BPS. Menyajikan jumlah total penduduk, rasio jenis kelamin (gender), dan distribusi kelompok umur produktif vs non-produktif.
              </p>
            </Card>

            <Card className="bg-white border-slate-200 p-5 space-y-2 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4 text-primary" />
                Ketenagakerjaan (TPT & TPAK)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tingkat Pengangguran Terbuka (TPT) mengukur persentase angkatan kerja yang belum bekerja dan sedang mencari pekerjaan. Tingkat Partisipasi Angkatan Kerja (TPAK) mengukur persentase penduduk usia kerja yang aktif secara ekonomi.
              </p>
            </Card>
          </div>
        </section>

        {/* Section 4: Sumber & Keandalan Data */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Info className="h-5 w-5 text-primary" />
            <h2>4. Sumber & Keandalan Data</h2>
          </div>

          <Card className="bg-primary/5 border-primary/20 p-5 space-y-2">
            <h3 className="text-sm font-bold text-slate-900">Integrasi Web API & Publikasi Resmi BPS</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Seluruh data yang disajikan di WebGIS ini ditarik secara terverifikasi dari Badan Pusat Statistik Republik Indonesia (BPS Domain 3321 untuk Kabupaten Demak dan BPS Domain 3300 untuk Provinsi Jawa Tengah). Sistem menerapkan prinsip ketat <em>Zero Fake Data</em>, di mana seluruh angka statistik bersumber langsung dari catatan publikasi sensus dan survei berkala BPS.
            </p>
          </Card>
        </section>

      </main>
    </div>
  );
}
