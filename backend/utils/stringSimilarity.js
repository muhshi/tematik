/**
 * Modul String Similarity & Text Preprocessing
 * Digunakan untuk mencocokkan indikator BPS Demak (3321) dengan BPS Jawa Tengah (3300)
 */

// Kamus sinonim & ekspansi singkatan statistik
const ABBREVIATIONS = {
  tpt: "tingkat pengangguran terbuka",
  tpak: "tingkat partisipasi angkatan kerja",
  ipm: "indeks pembangunan manusia",
  pdrb: "produk domestik regional bruto",
  ihk: "indeks harga konsumen",
  uhh: "umur harapan hidup",
  rls: "rata rata lama sekolah",
  hls: "harapan lama sekolah",
  lf: "long form",
  sp2020: "sensus penduduk 2020",
  adhk: "atas dasar harga konstan",
  adhb: "atas dasar harga berlaku",
  p0: "persentase penduduk miskin",
};

// Stopwords umum dalam judul indikator BPS
const STOP_WORDS = new Set([
  "menurut", "berdasarkan", "kabupaten", "kota", "kabupaten/kota",
  "provinsi", "jawa", "tengah", "demak", "di", "ke", "dari", "dan",
  "yang", "hasil", "seri", "metode", "baru", "adhk", "adhb", "tahun",
  "tahunan", "semester", "bulan", "bulanan", "lapangan", "usaha",
  "persen", "jiwa", "rupiah", "ribu", "juta", "total"
]);

/**
 * Membersihkan dan mengubah teks indikator menjadi array token kata unik
 * @param {string} text 
 * @returns {string[]}
 */
function tokenizeAndClean(text) {
  if (!text || typeof text !== "string") return [];

  let cleaned = text
    .toLowerCase()
    // Hapus label tag dalam tanda kurung siku seperti [data strategis], [ipm metode baru]
    .replace(/\[.*?\]/g, " ")
    // Hapus kurung biasa
    .replace(/[()]/g, " ")
    // Hapus tanda baca lainnya
    .replace(/[^a-z0-9\s]/g, " ")
    .trim();

  const rawTokens = cleaned.split(/\s+/).filter(Boolean);
  const expandedTokens = [];

  for (const token of rawTokens) {
    if (ABBREVIATIONS[token]) {
      expandedTokens.push(...ABBREVIATIONS[token].split(" "));
    } else if (!STOP_WORDS.has(token) && token.length > 1) {
      expandedTokens.push(token);
    }
  }

  // Deduplikasi token
  return Array.from(new Set(expandedTokens));
}

/**
 * Menghitung skor kemiripan Dice-Sørensen Token Coefficient (0.0 s.d 1.0)
 * @param {string} strA 
 * @param {string} strB 
 * @returns {number}
 */
function calculateSimilarity(strA, strB) {
  const tokensA = tokenizeAndClean(strA);
  const tokensB = tokenizeAndClean(strB);

  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  const setB = new Set(tokensB);
  let intersectionCount = 0;

  for (const token of tokensA) {
    if (setB.has(token)) {
      intersectionCount++;
    }
  }

  // Dice Coefficient: (2 * |A ∩ B|) / (|A| + |B|)
  const score = (2 * intersectionCount) / (tokensA.length + tokensB.length);
  return Math.min(1.0, Math.max(0.0, score));
}

/**
 * Normalisasi nama wilayah (Kecamatan / Kabupaten)
 * @param {string} name 
 * @returns {string}
 */
function normalizeRegionName(name) {
  if (!name || typeof name !== "string") return "";
  return name
    .toLowerCase()
    .replace(/^\d+\s*/, "") // Hapus kode angka di depan
    .replace(/^(kabupaten|kab\.?|kota|kecamatan|kec\.?)\s+/i, "") // Hapus prefix
    .replace(/\s+/g, "") // Hapus spasi
    .trim();
}

module.exports = {
  ABBREVIATIONS,
  STOP_WORDS,
  tokenizeAndClean,
  calculateSimilarity,
  normalizeRegionName,
};
