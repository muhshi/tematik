/**
 * Helper: Memetakan Subjek BPS ke 3 Kategori Utama BPS Web API:
 * 1. Sosial dan Kependudukan
 * 2. Ekonomi dan Perdagangan
 * 3. Pertanian dan Pertambangan / Multi-Domain
 */
export function getBpsCategory(subjectName: string): string {
  const nameLower = (subjectName || "").toLowerCase();

  // 2. Ekonomi dan Perdagangan
  if (
    nameLower.includes("ekonomi") ||
    nameLower.includes("inflasi") ||
    nameLower.includes("pdrb") ||
    nameLower.includes("keuangan") ||
    nameLower.includes("perdagangan") ||
    nameLower.includes("industri")
  ) {
    return "Ekonomi dan Perdagangan";
  }

  // 3. Pertanian dan Pertambangan / Multi-Domain
  if (
    nameLower.includes("pertanian") ||
    nameLower.includes("peternakan") ||
    nameLower.includes("perikanan") ||
    nameLower.includes("pertambangan") ||
    nameLower.includes("lingkungan") ||
    nameLower.includes("energi") ||
    nameLower.includes("telekomunikasi") ||
    nameLower.includes("pariwisata")
  ) {
    return "Pertanian dan Pertambangan";
  }

  // 1. Sosial dan Kependudukan (Default untuk IPM, Kemiskinan, Gender, Kependudukan, Agama, Kesehatan, Pendidikan, Pengeluaran, dll)
  return "Sosial dan Kependudukan";
}
