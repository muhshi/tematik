"use client";

import Link from "next/link";
import { ArrowUp } from "lucide-react";
import { useState, useEffect } from "react";

const FacebookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
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

const TiktokIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"/>
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
            <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Statistik Demak</h3>
            
            <div className="text-sm text-slate-600 leading-relaxed flex flex-col mt-2">
              <p>Badan Pusat Statistik Kabupaten Demak</p>
              <p>Jl. Sultan Hadiwijaya No.23, Krajan, Mangunjiwan, Demak</p>
            </div>

            <div className="text-sm text-slate-600 flex flex-col gap-1.5 mt-2">
              <p><span className="font-bold text-slate-700">Telepon:</span> (0291) 685445</p>
              <p><span className="font-bold text-slate-700">Email:</span> bps3321@bps.go.id</p>
            </div>

            <div className="flex items-center gap-2.5 mt-4 flex-wrap">
              <a
                href="https://www.instagram.com/bpskabdemak?stkn=MW82b2c3dWhiZWd2OA=="
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram BPS Demak"
                className="h-10 w-10 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary transition-colors bg-white shadow-xs"
              >
                <InstagramIcon />
              </a>
              <a
                href="https://www.tiktok.com/@bpskabdemak?_r=1&_t=ZS-99fYBV6oC97"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok BPS Demak"
                className="h-10 w-10 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary transition-colors bg-white shadow-xs"
              >
                <TiktokIcon />
              </a>
              <a
                href="https://youtube.com/@bpskabdemak?si=sW7JkhLyCHrSVnGO"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube BPS Demak"
                className="h-10 w-10 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary transition-colors bg-white shadow-xs"
              >
                <YoutubeIcon />
              </a>
              <a
                href="https://www.facebook.com/share/1Mj9EFSjFh/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook BPS Demak"
                className="h-10 w-10 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary transition-colors bg-white shadow-xs"
              >
                <FacebookIcon />
              </a>
              <a
                href="https://x.com/bpskabdemak"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X (Twitter) BPS Demak"
                className="h-10 w-10 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary transition-colors bg-white shadow-xs"
              >
                <XIcon />
              </a>
            </div>
          </div>

          {/* Middle Column (Span 3) */}
          <div className="md:col-span-3 flex flex-col gap-6">
            <h4 className="text-base font-bold text-slate-800">Tautan Cepat</h4>
            <ul className="flex flex-col gap-3.5 text-sm text-slate-500">
              <li><Link href="/" className="hover:text-primary transition-colors">Beranda</Link></li>
              <li><Link href="#fitur" className="hover:text-primary transition-colors">Fitur</Link></li>
              <li><Link href="#data" className="hover:text-primary transition-colors">Data Interaktif</Link></li>
              <li><Link href="/dashboard" className="hover:text-primary transition-colors font-medium">Dashboard WebGIS</Link></li>
              <li><Link href="#faq" className="hover:text-primary transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Right Column (Span 4) */}
          <div className="md:col-span-4 flex flex-col gap-6">
            <h4 className="text-base font-bold text-slate-800">Portal Layanan BPS</h4>
            <ul className="flex flex-col gap-3.5 text-sm text-slate-500">
              <li><Link href="/dashboard" className="hover:text-primary transition-colors">Peta Kependudukan Demak</Link></li>
              <li><Link href="/dashboard" className="hover:text-primary transition-colors">Analisis 35 Kab/Kota Jawa Tengah</Link></li>
              <li><Link href="/docs" className="hover:text-primary transition-colors">Panduan & Cara Baca Data</Link></li>
              <li><Link href="/help" className="hover:text-primary transition-colors">Pusat Bantuan & FAQ</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-200 pt-8 relative flex flex-col items-center gap-1.5">
          <p className="text-[13px] text-slate-600">
            &copy; {new Date().getFullYear()} <span className="font-bold text-slate-800">Badan Pusat Statistik Kabupaten Demak</span>. All Rights Reserved.
          </p>
          <p className="text-[13px] text-slate-500">
            Designed for <span className="text-primary font-bold">Portal WebGIS Tematik Demak & Jateng</span>
          </p>
        </div>
      </div>

      {/* Floating Scroll to Top Button */}
      <button 
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 md:bottom-10 md:right-10 h-13 w-13 rounded-full bg-primary hover:opacity-90 text-primary-foreground flex items-center justify-center shadow-xl transition-all duration-300 z-50 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
        }`}
        aria-label="Scroll to top"
      >
        <ArrowUp className="h-6 w-6" />
      </button>
    </footer>
  );
}
