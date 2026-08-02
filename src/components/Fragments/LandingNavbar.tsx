"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/Elements/button";
import { useState, useEffect } from "react";
import { Menu } from "lucide-react";

export function LandingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("beranda");

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 20);

      // Determine active section
      const sections = ["fitur", "data"];
      let current = "beranda";

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          // Navbar height offset + some buffer
          if (scrollY >= element.offsetTop - 150) {
            current = section;
          }
        }
      }
      setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll);
    // Trigger once on mount
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getLinkClass = (section: string) => {
    return activeSection === section
      ? "text-slate-900 font-semibold transition-colors"
      : "text-slate-500 font-medium hover:text-slate-900 transition-colors";
  };

  const getMobileLinkClass = (section: string) => {
    return activeSection === section
      ? "block w-full text-left text-slate-900 font-semibold py-3 border-b border-slate-100"
      : "block w-full text-left text-slate-600 font-medium py-3 border-b border-slate-100";
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
          <Image src="/logoBPS.png" alt="Logo BPS Demak" width={44} height={44} className="object-contain" priority />
          <span className="text-2xl font-bold text-slate-800 tracking-tight">
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
            <Button className="bg-[#f99a40] hover:bg-[#e68a33] text-white font-medium rounded-full px-7 h-10 text-sm shadow-sm transition-transform hover:-translate-y-0.5">
              Masuk Dashboard
            </Button>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-slate-900 p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-lg py-4 px-4 flex flex-col gap-4">
          <ul className="flex flex-col">
            <li>
              <a href="#beranda" onClick={() => setIsMobileMenuOpen(false)} className={getMobileLinkClass("beranda")}>
                Beranda
              </a>
            </li>
            <li>
              <a href="#fitur" onClick={() => setIsMobileMenuOpen(false)} className={getMobileLinkClass("fitur")}>
                Fitur
              </a>
            </li>
            <li>
              <a href="#data" onClick={() => setIsMobileMenuOpen(false)} className={getMobileLinkClass("data")}>
                Data
              </a>
            </li>
          </ul>
          <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
            <Button className="w-full bg-slate-950 hover:bg-slate-800 text-white rounded-full mt-2">
              Buka Dashboard
            </Button>
          </Link>
        </div>
      )}
    </nav>
  );
}
