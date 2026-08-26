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
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-primary/30 selection:text-slate-900">
      <AosInit />
      <LandingNavbar />

      <main className="flex-1">
        {/* Hero Section */}
        <div id="beranda" className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-slate-50 to-primary/10 -z-10"></div>
          
          <div className="container mx-auto px-4 md:px-8 max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
              
              {/* Left Content */}
              <div className="flex flex-col items-start text-left" data-aos="fade-right">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-6">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  WebGIS Resmi BPS Demak & Jawa Tengah
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-5xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.15]">
                  Visualisasi Peta Tematik & Data Kependudukan Demak
                </h1>
                
                <p className="text-base md:text-lg text-slate-600 mb-8 max-w-xl leading-relaxed">
                  Akses data kependudukan Kabupaten Demak dan 35 Kabupaten/Kota Jawa Tengah secara interaktif. 
                  Analisis tren indikator strategis dengan presisi teknis tingkat tinggi.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <Link href="/dashboard">
                    <Button className="bg-primary hover:opacity-90 text-primary-foreground font-semibold px-7 h-12 rounded-xl shadow-md transition-all hover:-translate-y-0.5">
                      Mulai Jelajah Peta
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="#fitur">
                    <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100 px-6 h-12 rounded-xl font-medium">
                      Pelajari Fitur
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right Mockup */}
              <div className="relative w-full h-[300px] sm:h-[400px] lg:h-[450px]" data-aos="fade-left" data-aos-delay="200">
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-200 to-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex items-center justify-center p-4">
                  <div className="w-full h-full bg-slate-100 rounded-xl border border-slate-200 relative overflow-hidden flex items-center justify-center shadow-inner">
                    <Image 
                      src="/dashboard-preview.jpg" 
                      alt="Hero Map Preview" 
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover object-left"
                      priority
                    />
                    <div className="absolute right-4 bottom-4 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-xl shadow-lg border border-slate-100 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
                        <MapIcon className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Update Terbaru</span>
                        <span className="text-sm font-bold text-slate-900">Data BPS 2024–2025</span>
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
              <p className="text-slate-600 text-base">Dirancang untuk memudahkan pengambilan kebijakan berbasis data bagi pemerintah daerah, peneliti, dan masyarakat luas.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-lg hover:border-primary/30 transition-all duration-300 group" data-aos="fade-up" data-aos-delay="100">
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <MapIcon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Peta Tematik Spasial</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Visualisasi choropleth degradasi warna interaktif per kecamatan di Kab. Demak dan seluruh 35 Kab/Kota se-Jawa Tengah.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-lg hover:border-primary/30 transition-all duration-300 group" data-aos="fade-up" data-aos-delay="200">
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">6 Indikator Strategis</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Pemantauan menyeluruh untuk Kependudukan, Kemiskinan, IPM, Pengangguran (TPT), Partisipasi Kerja (TPAK), dan PDRB.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-lg hover:border-primary/30 transition-all duration-300 group" data-aos="fade-up" data-aos-delay="300">
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Filter className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Filter Granularitas Ganda</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Beralih instan antara level Kabupaten (Jawa Tengah) dan level Kecamatan (Kabupaten Demak) dalam satu klik navigasi.
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
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">TOTAL PENDUDUK DEMAK</p>
                    <p className="text-2xl font-bold text-slate-900">1.252.970 Jiwa</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">IPM DEMAK 2024</p>
                    <p className="text-2xl font-bold text-primary">74,57</p>
                  </div>
                </div>
                <Link href="/dashboard" className="w-full sm:w-auto mt-4 sm:mt-0">
                  <Button className="w-full sm:w-auto bg-primary hover:opacity-90 text-primary-foreground rounded-full px-8 h-12 text-[15px] font-bold shadow-md transition-all hover:-translate-y-0.5 group">
                    Buka Dashboard Peta
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <FAQSection />
      </main>

      <LandingFooter />
    </div>
  );
}
