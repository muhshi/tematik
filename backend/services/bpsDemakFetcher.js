const { BPS_CONFIG, getApiKey } = require("../config/bpsConfig");
const { cacheManager } = require("../utils/cacheManager");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetcher helper dengan timeout dan retry exponential backoff
 * @param {string} url 
 * @param {number} retries 
 * @returns {Promise<any>}
 */
async function fetchBpsWithRetry(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), BPS_CONFIG.REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      return json;
    } catch (err) {
      clearTimeout(timeoutId);
      if (attempt === retries) {
        console.error(`[bpsDemakFetcher] Fetch gagal setelah ${retries} percobaan: ${url}`, err.message);
        throw err;
      }
      await delay(500 * attempt);
    }
  }
  return null;
}

/**
 * Fungsional 1: Demak Target Fetcher
 * Menarik seluruh variabel BPS Demak (domain 3321), memfilter indikator berlabel "[data strategis]",
 * dan menyimpan daftar indikator acuan.
 * 
 * @param {boolean} forceRefresh - Abaikan cache jika true
 * @returns {Promise<Array<Object>>}
 */
async function fetchDemakStrategicIndicators(forceRefresh = false) {
  const cacheKey = "bps:demak:strategic_indicators";
  if (!forceRefresh) {
    const cached = cacheManager.get(cacheKey);
    if (cached) return cached;
  }

  const apiKey = getApiKey();
  const domain = BPS_CONFIG.DOMAIN_DEMAK || "3321";
  let page = 1;
  let totalPages = 1;
  const allDemakVars = [];

  try {
    while (page <= totalPages) {
      const url = `${BPS_CONFIG.BASE_URL}/list/model/var/domain/${domain}/page/${page}/key/${apiKey}/`;
      const res = await fetchBpsWithRetry(url);

      if (res && res.status === "OK" && Array.isArray(res.data) && res.data[1]) {
        allDemakVars.push(...res.data[1]);
        totalPages = res.data[0]?.pages || 1;
        page++;
      } else {
        break;
      }
    }

    // Filter KHUSUS yang mengandung substring "[data strategis]" atau "[indikator strategis]"
    const strategicIndicators = allDemakVars
      .filter((v) => {
        const title = (v.title || "").toLowerCase();
        return title.includes("[data strategis]") || title.includes("[indikator strategis]");
      })
      .map((v) => {
        const varId = v.var_id;
        const title = v.title || "";
        const cleanTitle = title.replace(/\[.*?\]/g, "").trim();

        let category = "Sosial dan Kependudukan";
        const subId = v.sub_id;
        if (subId === 155 || title.toLowerCase().includes("pdrb")) {
          category = "Ekonomi dan Perdagangan";
        }

        return {
          id: `var-${varId}`,
          varId: varId,
          demakVarId: varId,
          rawTitle: title,
          name: title,
          cleanTitle: cleanTitle,
          category: category,
          subjectId: v.sub_id,
          unit: v.unit || "",
          domain: domain,
          isActive: true,
          fetchedAt: new Date().toISOString(),
        };
      });

    if (strategicIndicators.length > 0) {
      cacheManager.set(cacheKey, strategicIndicators, BPS_CONFIG.CACHE_TTL_MS);
      return strategicIndicators;
    }
  } catch (error) {
    console.warn("[bpsDemakFetcher] Gagal menarik live API Demak, mengecek cache fallback...", error.message);
    const staleCache = cacheManager.get(cacheKey);
    if (staleCache) return staleCache;
  }

  // Fallback data strategis acuan default jika API BPS offline
  const fallbackDemakStrategic = [
    {
      id: "var-248",
      varId: 248,
      demakVarId: 248,
      rawTitle: "[Data Strategis] Jumlah Penduduk (Hasil LF SP2020)",
      name: "[Data Strategis] Jumlah Penduduk (Hasil LF SP2020)",
      cleanTitle: "Jumlah Penduduk",
      category: "Sosial dan Kependudukan",
      subjectId: 12,
      unit: "Jiwa",
      domain: domain,
      isActive: true,
    },
    {
      id: "var-178",
      varId: 178,
      demakVarId: 178,
      rawTitle: "[Data Strategis] Persentase Penduduk Miskin",
      name: "[Data Strategis] Persentase Penduduk Miskin",
      cleanTitle: "Persentase Penduduk Miskin",
      category: "Sosial dan Kependudukan",
      subjectId: 23,
      unit: "Persen",
      domain: domain,
      isActive: true,
    },
    {
      id: "var-213",
      varId: 213,
      demakVarId: 213,
      rawTitle: "[Data Strategis] [IPM Metode Baru] Indeks Pembangunan Manusia",
      name: "[Data Strategis] [IPM Metode Baru] Indeks Pembangunan Manusia",
      cleanTitle: "Indeks Pembangunan Manusia",
      category: "Sosial dan Kependudukan",
      subjectId: 26,
      unit: "",
      domain: domain,
      isActive: true,
    },
    {
      id: "var-114",
      varId: 114,
      demakVarId: 114,
      rawTitle: "[Data Strategis] Tingkat Partisipasi Angkatan Kerja (TPAK)",
      name: "[Data Strategis] Tingkat Partisipasi Angkatan Kerja (TPAK)",
      cleanTitle: "Tingkat Partisipasi Angkatan Kerja",
      category: "Sosial dan Kependudukan",
      subjectId: 6,
      unit: "Persen",
      domain: domain,
      isActive: true,
    },
    {
      id: "var-115",
      varId: 115,
      demakVarId: 115,
      rawTitle: "[Data Strategis] Tingkat Pengangguran Terbuka (TPT)",
      name: "[Data Strategis] Tingkat Pengangguran Terbuka (TPT)",
      cleanTitle: "Tingkat Pengangguran Terbuka",
      category: "Sosial dan Kependudukan",
      subjectId: 6,
      unit: "Persen",
      domain: domain,
      isActive: true,
    },
    {
      id: "var-110",
      varId: 110,
      demakVarId: 110,
      rawTitle: "[Data Strategis] Laju Pertumbuhan PDRB ADHK Seri 2010 Menurut Lapangan Usaha",
      name: "[Data Strategis] Laju Pertumbuhan PDRB ADHK Seri 2010 Menurut Lapangan Usaha",
      cleanTitle: "Laju Pertumbuhan PDRB",
      category: "Ekonomi dan Perdagangan",
      subjectId: 155,
      unit: "Persen",
      domain: domain,
      isActive: true,
    },
  ];

  cacheManager.set(cacheKey, fallbackDemakStrategic, BPS_CONFIG.CACHE_TTL_MS);
  return fallbackDemakStrategic;
}

module.exports = {
  fetchBpsWithRetry,
  fetchDemakStrategicIndicators,
};
