"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/Elements/button";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

export function LandingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("beranda");

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 20);

      const sections = ["fitur", "data", "faq"];
      let current = "beranda";

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          if (scrollY >= element.offsetTop - 150) {
            current = section;
          }
        }
      }
      setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getLinkClass = (section: string) => {
    return activeSection === section
      ? "text-primary font-bold transition-colors"
      : "text-slate-600 font-medium hover:text-primary transition-colors";
  };

  const getMobileLinkClass = (section: string) => {
    return activeSection === section
      ? "block w-full text-left text-primary font-bold py-3 border-b border-slate-100"
      : "block w-full text-left text-slate-600 font-medium py-3 border-b border-slate-100 hover:text-primary";
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/90 backdrop-blur-md shadow-sm py-4"
          : "bg-transparent py-6"
      }`}
    >
      <div className="container mx-auto px-4 md:px-8 max-w-7xl flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logoBPS.png" alt="Logo BPS Demak" width={40} height={40} className="object-contain" priority />
          <span className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Statistik Demak
          </span>
        </Link>

        {/* Desktop Nav & Action (Right) */}
        <div className="hidden md:flex items-center gap-10">
          <ul className="flex items-center gap-8 text-[15px]">
            <li>
              <a href="#beranda" className={getLinkClass("beranda")}>
                Beranda
              </a>
            </li>
            <li>
              <a href="#fitur" className={getLinkClass("fitur")}>
                Fitur
              </a>
            </li>
            <li>
              <a href="#data" className={getLinkClass("data")}>
                Data
              </a>
            </li>
            <li>
              <a href="#faq" className={getLinkClass("faq")}>
                FAQ
              </a>
            </li>
          </ul>
          <Link href="/dashboard">
            <Button className="bg-primary hover:opacity-90 text-primary-foreground font-semibold rounded-full px-7 h-10 text-sm shadow-sm transition-transform hover:-translate-y-0.5">
              Masuk Dashboard
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden p-2 text-slate-700 hover:text-primary transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-6 py-4 shadow-lg flex flex-col gap-2 animate-fade-in-up">
          <a href="#beranda" onClick={() => setIsMobileMenuOpen(false)} className={getMobileLinkClass("beranda")}>
            Beranda
          </a>
          <a href="#fitur" onClick={() => setIsMobileMenuOpen(false)} className={getMobileLinkClass("fitur")}>
            Fitur
          </a>
          <a href="#data" onClick={() => setIsMobileMenuOpen(false)} className={getMobileLinkClass("data")}>
            Data
          </a>
          <a href="#faq" onClick={() => setIsMobileMenuOpen(false)} className={getMobileLinkClass("faq")}>
            FAQ
          </a>
          <Link href="/dashboard" className="pt-2" onClick={() => setIsMobileMenuOpen(false)}>
            <Button className="w-full bg-primary hover:opacity-90 text-primary-foreground font-semibold rounded-xl h-11 text-sm shadow-sm">
              Masuk Dashboard
            </Button>
          </Link>
        </div>
      )}
    </nav>
  );
}
