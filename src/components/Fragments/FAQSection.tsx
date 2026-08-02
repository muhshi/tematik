"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "Siapa saja yang bisa menggunakan dashboard ini?",
    answer: "Seluruh masyarakat, peneliti, maupun pengambil kebijakan di lingkungan Pemerintah Kabupaten Demak dapat menggunakan dashboard ini secara gratis tanpa perlu registrasi tambahan untuk akses data publik."
  },
  {
    question: "Berapa lama periode pembaruan data?",
    answer: "Data kependudukan kami bersumber langsung dari Badan Pusat Statistik (BPS) Kabupaten Demak dan diperbarui secara berkala sesuai dengan rilis data resmi tahunan."
  },
  {
    question: "Apakah data spasial (peta) bisa diunduh?",
    answer: "Saat ini data spasial tersedia untuk divisualisasikan secara interaktif. Fitur unduh file GeoJSON atau CSV sedang dalam tahap pengembangan dan akan segera hadir."
  },
  {
    question: "Apakah aplikasi ini gratis untuk digunakan?",
    answer: "Ya, Statistik Demak WebGIS adalah proyek data publik terbuka (Open Data) yang disediakan sepenuhnya gratis untuk mendukung perencanaan pembangunan dan transparansi informasi daerah."
  },
  {
    question: "Bagaimana cara membaca degradasi warna pada peta?",
    answer: "Warna yang lebih pekat/gelap menunjukkan jumlah kepadatan atau nilai statistik yang lebih tinggi pada suatu wilayah, sedangkan warna yang lebih terang menunjukkan nilai yang lebih rendah (metode Choropleth)."
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // Default open first

  return (
    <section id="faq" className="py-24 bg-white relative">
      <div className="container mx-auto px-4 md:px-8 max-w-4xl">
        <div className="flex flex-col items-center mb-12" data-aos="fade-up">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-700 text-center">
            Frequently Asked Questions
          </h2>
          <div className="h-1 w-16 bg-[#f99a40] rounded-full mt-5"></div>
        </div>

        <div className="flex flex-col gap-4" data-aos="fade-up" data-aos-delay="100">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div 
                key={index} 
                className={`border rounded-md transition-all duration-300 overflow-hidden ${
                  isOpen ? "border-[#f99a40]/20 shadow-[0_0_15px_rgba(249,154,64,0.05)]" : "border-slate-200"
                }`}
              >
                <button
                  className={`w-full text-left px-6 py-5 flex items-center justify-between font-bold transition-colors ${
                    isOpen ? "text-[#f99a40] bg-[#f99a40]/[0.02]" : "text-slate-600 hover:text-slate-800 bg-white"
                  }`}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                >
                  <span className="text-[15px]">{faq.question}</span>
                  <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${isOpen ? "rotate-180" : "text-slate-400"}`} />
                </button>
                <div 
                  className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? "max-h-[500px] py-4 bg-white border-t border-slate-100" : "max-h-0 py-0 bg-white"
                  }`}
                >
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
