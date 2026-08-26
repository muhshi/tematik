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
    answer: "Seluruh masyarakat, peneliti, akademisi, maupun pengambil kebijakan di lingkungan Pemerintah Kabupaten Demak dan Provinsi Jawa Tengah dapat menggunakan dashboard ini secara terbuka dan gratis."
  },
  {
    question: "Berapa lama periode pembaruan data?",
    answer: "Data kependudukan dan indikator strategis kami terintegrasi langsung dengan Dynamic Table API Badan Pusat Statistik (BPS) dan diperbarui secara otomatis sesuai rilis resmi BPS."
  },
  {
    question: "Apakah tersedia visualisasi hingga tingkat kecamatan dan kabupaten?",
    answer: "Ya! Anda dapat beralih dengan mudah antara Level Kabupaten (35 Kab/Kota se-Jawa Tengah menggunakan domain BPS 3300) dan Level Kecamatan (14 Kecamatan di Kab. Demak menggunakan domain BPS 3321)."
  },
  {
    question: "Apakah data spasial (peta) bisa diunduh?",
    answer: "Data indikator dan peta tematik disajikan secara interaktif dengan sistem cache berkecepatan tinggi yang dapat diakses dari berbagai perangkat."
  },
  {
    question: "Bagaimana cara membaca gradasi warna pada peta tematik?",
    answer: "Sistem menggunakan metode Choropleth kuartil 4 kelas: warna yang lebih pekat menunjukkan nilai statistik yang lebih tinggi, sedangkan warna yang lebih muda/terang menunjukkan nilai yang lebih rendah."
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 bg-white relative">
      <div className="container mx-auto px-4 md:px-8 max-w-4xl">
        <div className="flex flex-col items-center mb-12" data-aos="fade-up">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 text-center">
            Frequently Asked Questions
          </h2>
          <div className="h-1.5 w-16 bg-primary rounded-full mt-4"></div>
        </div>

        <div className="flex flex-col gap-4" data-aos="fade-up" data-aos-delay="100">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div 
                key={index} 
                className={`border rounded-xl transition-all duration-300 overflow-hidden ${
                  isOpen ? "border-primary/40 shadow-sm ring-1 ring-primary/20" : "border-slate-200"
                }`}
              >
                <button
                  className={`w-full text-left px-6 py-5 flex items-center justify-between font-bold transition-colors ${
                    isOpen ? "text-primary bg-primary/5" : "text-slate-700 hover:text-primary bg-white"
                  }`}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                >
                  <span className="text-[15px]">{faq.question}</span>
                  <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${isOpen ? "rotate-180 text-primary" : "text-slate-400"}`} />
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
