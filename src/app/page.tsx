import Link from "next/link";
import { ArrowRight, Map as MapIcon, Filter, TrendingUp, Compass } from "lucide-react";
import { Button } from "@/components/Elements/button";
import { LandingNavbar } from "@/components/Fragments/LandingNavbar";
import { LandingFooter } from "@/components/Fragments/LandingFooter";
import { AosInit } from "@/components/Fragments/AosInit";
import { FAQSection } from "@/components/Fragments/FAQSection";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-teal-500/30 selection:text-teal-900">
      <AosInit />
      <LandingNavbar />

      <main className="flex-1">
        {/* Hero Section */}
        <div id="beranda" className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-slate-50 to-teal-50/50 -z-10"></div>
          
          <div className="container mx-auto px-4 md:px-8 max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
              
              {/* Left Content */}
              <div className="flex flex-col items-start text-left" data-aos="fade-right">
                
                <h1 className="text-4xl md:text-5xl lg:text-5xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.15]">
                  Visualisasi Peta Tematik & Data Kependudukan Demak
                </h1>
                
                <p className="text-base md:text-lg text-slate-600 mb-8 max-w-xl leading-relaxed">
                  Akses data kependudukan Kabupaten Demak interaktif dari tahun 2011 hingga 2024. 
                  Analisis tren wilayah dengan presisi teknis tingkat tinggi.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <Link href="/dashboard">
                    <Button className="bg-[#f99a40] hover:bg-[#e68a33] text-white font-medium px-6 h-11 rounded-md shadow-sm">
                      Mulai Jelajah
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="#fitur">
                    <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100 px-6 h-11 rounded-md font-medium">
                      Pelajari Fitur
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right Mockup */}
              <div className="relative w-full h-[300px] sm:h-[400px] lg:h-[450px]" data-aos="fade-left" data-aos-delay="200">
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-200 to-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex items-center justify-center p-4">
                  {/* Abstract Map placeholder for hero */}
                  <div className="w-full h-full bg-slate-100 rounded-xl border border-slate-200 relative overflow-hidden flex items-center justify-center shadow-inner">
                    <Image 
                      src="/dashboard-preview.jpg" 
                      alt="Hero Map Preview" 
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover object-left"
                      priority
                    />
                    <div className="absolute right-4 bottom-4 bg-white px-4 py-3 rounded-lg shadow-lg border border-slate-100 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-[#007067] flex items-center justify-center">
                        <MapIcon className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Update Terbaru</span>
                        <span className="text-sm font-bold text-slate-900">Data 2024 Tersedia</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="fitur" className="py-24 bg-white relative">
          <div className="container mx-auto px-4 md:px-8 max-w-7xl">
            <div className="text-center mb-16 max-w-2xl mx-auto" data-aos="fade-up">
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Kekuatan Data di Ujung Jari</h2>
              <p className="text-slate-600 text-base">Dirancang untuk memudahkan pengambilan kebijakan berbasis data bagi pemerintah daerah dan peneliti.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300" data-aos="fade-up" data-aos-delay="100">
                <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center mb-6">
                  <MapIcon className="h-6 w-6 text-[#007067]" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Peta Interaktif</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Visualisasi data berdasarkan wilayah hingga tingkat desa dengan mode heatmap, choropleth, dan distribusi titik yang akurat.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300" data-aos="fade-up" data-aos-delay="200">
                <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center mb-6">
                  <TrendingUp className="h-6 w-6 text-[#007067]" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Tren Historis</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Analisis perubahan populasi dari tahun ke tahun secara komprehensif untuk melihat pola migrasi dan pertumbuhan regional.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300" data-aos="fade-up" data-aos-delay="300">
                <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center mb-6">
                  <Filter className="h-6 w-6 text-[#007067]" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Filter Granular</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Saring data berdasarkan tahun, kecamatan, dan desa secara spesifik untuk mendapatkan insight yang relevan dengan kebutuhan Anda.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Instan Data Section */}
        <div id="data" className="py-24 bg-slate-50 border-t border-slate-200">
          <div className="container mx-auto px-4 md:px-8 max-w-7xl">
            <div className="text-center mb-10 max-w-2xl mx-auto" data-aos="fade-up">
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Lihat Data Secara Instan</h2>
              <p className="text-slate-600 text-base mb-6">Antarmuka dashboard yang bersih dan intuitif memungkinkan Anda mendapatkan angka statistik tanpa harus menjadi ahli GIS.</p>
              
            </div>

            {/* Dashboard Mockup Display */}
            <div className="relative max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 p-2 overflow-hidden" data-aos="zoom-in" data-aos-delay="200">
              <div className="aspect-[16/9] bg-slate-100 rounded-xl relative overflow-hidden flex flex-col items-center justify-center border border-slate-200">
                <Image 
                  src="/dashboard-preview.jpg" 
                  alt="Preview Dashboard Statistik Demak" 
                  fill
                  sizes="(max-width: 768px) 100vw, 896px"
                  className="object-cover object-top"
                  priority
                />
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 md:p-6 mt-2 bg-white">
                <div className="flex items-center gap-8 mb-4 sm:mb-0">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">TOTAL PENDUDUK</p>
                    <p className="text-2xl font-bold text-slate-900">1.158.423 Jiwa</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">PERTUMBUHAN</p>
                    <p className="text-lg font-bold text-emerald-600">+1.2%</p>
                  </div>
                </div>
                <Link href="/dashboard" className="w-full sm:w-auto mt-4 sm:mt-0">
                  <Button className="w-full sm:w-auto bg-[#f99a40] hover:bg-[#e68a33] text-white rounded-full px-8 h-12 text-[15px] font-bold shadow-md transition-all hover:-translate-y-0.5 group">
                    Lihat Dashboard Lengkap
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <FAQSection />

        {/* CTA Section */}
        <div className="py-28 bg-slate-50 border-t border-slate-100 relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] bg-[#f99a40]/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

          <div className="container mx-auto px-4 md:px-8 max-w-4xl text-center" data-aos="fade-up">
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
              Siap untuk menganalisis Demak?
            </h2>
            <p className="text-slate-600 text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
              Bergabunglah dengan ratusan pengambil kebijakan yang telah menggunakan 
              Statistik Demak untuk perencanaan daerah yang lebih baik.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/dashboard">
                <Button className="bg-[#f99a40] hover:bg-[#e68a33] text-white font-bold px-10 h-14 rounded-full text-base shadow-sm transition-all hover:-translate-y-0.5">
                  Buka Dashboard Sekarang
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 px-10 h-14 rounded-full text-base font-medium transition-all">
                  Hubungi Tim Teknis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
