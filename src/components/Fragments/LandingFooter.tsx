"use client";

import Link from "next/link";
import { ArrowUp } from "lucide-react";
import { useState, useEffect } from "react";

// Lucide removed brand icons in recent versions, so we use inline SVGs instead
const FacebookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

const YoutubeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/>
    <path d="m10 15 5-3-5-3z"/>
  </svg>
);

export function LandingFooter() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-slate-50 pt-20 pb-10 border-t border-slate-200">
      <div className="container mx-auto px-4 md:px-8 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 mb-16">
          
          {/* Left Column (Span 5) */}
          <div className="md:col-span-5 flex flex-col gap-6">
            <h3 className="text-2xl font-bold text-slate-700 tracking-tight">Statistik Demak</h3>
            
            <div className="text-sm text-slate-600 leading-relaxed flex flex-col mt-2">
              <p>Jl. Sultan Hadiwijaya No.23</p>
              <p>Krajan, Mangunjiwan, Demak</p>
            </div>

            <div className="text-sm text-slate-600 flex flex-col gap-1.5 mt-2">
              <p><span className="font-bold text-slate-700">Phone:</span> (0291) 685445</p>
              <p><span className="font-bold text-slate-700">Email:</span> bps3321@bps.go.id.</p>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <a href="#" className="h-10 w-10 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:border-slate-400 transition-colors bg-white">
                <TwitterIcon />
              </a>
              <a href="#" className="h-10 w-10 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:border-slate-400 transition-colors bg-white">
                <FacebookIcon />
              </a>
              <a href="#" className="h-10 w-10 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:border-slate-400 transition-colors bg-white">
                <InstagramIcon />
              </a>
              <a href="#" className="h-10 w-10 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:border-slate-400 transition-colors bg-white">
                <YoutubeIcon />
              </a>
            </div>
          </div>

          {/* Middle Column (Span 3) */}
          <div className="md:col-span-3 flex flex-col gap-6">
            <h4 className="text-base font-bold text-slate-700">Tautan</h4>
            <ul className="flex flex-col gap-4 text-sm text-slate-500">
              <li><Link href="/" className="hover:text-slate-800 transition-colors">Beranda</Link></li>
              <li><Link href="#fitur" className="hover:text-slate-800 transition-colors">Fitur</Link></li>
              <li><Link href="#data" className="hover:text-slate-800 transition-colors">Data Interaktif</Link></li>
              <li><Link href="/dashboard" className="hover:text-slate-800 transition-colors">Dashboard GIS</Link></li>
              <li><Link href="#" className="hover:text-slate-800 transition-colors">FAQ</Link></li>
              <li><Link href="#" className="hover:text-slate-800 transition-colors">Kontak</Link></li>
            </ul>
          </div>

          {/* Right Column (Span 4) */}
          <div className="md:col-span-4 flex flex-col gap-6">
            <h4 className="text-base font-bold text-slate-700">Layanan & Program</h4>
            <ul className="flex flex-col gap-4 text-sm text-slate-500">
              <li><Link href="#" className="hover:text-slate-800 transition-colors">Peta Kependudukan Demak</Link></li>
              <li><Link href="#" className="hover:text-slate-800 transition-colors">Analisis Tren Sosial & Ekonomi</Link></li>
              <li><Link href="#" className="hover:text-slate-800 transition-colors">Pengambilan Data Penelitian</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-200 pt-8 relative flex flex-col items-center gap-1.5">
          <p className="text-[13px] text-slate-600">
            &copy; Copyright <span className="font-bold text-slate-700">Statistik Demak</span> All Rights Reserved
          </p>
          <p className="text-[13px] text-slate-600">
            Designed by <span className="text-[#f99a40] hover:text-amber-600 transition-colors font-medium cursor-pointer">BPS Demak Web Team</span>
          </p>
        </div>
      </div>

      {/* Floating Scroll to Top Button */}
      <button 
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 md:bottom-10 md:right-10 h-14 w-14 rounded-full bg-[#f99a40] hover:bg-[#e68a33] text-white flex items-center justify-center shadow-lg shadow-orange-500/20 transition-all duration-300 z-50 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
        }`}
        aria-label="Scroll to top"
      >
        <ArrowUp className="h-6 w-6" />
      </button>
    </footer>
  );
}
