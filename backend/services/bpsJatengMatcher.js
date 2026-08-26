const { BPS_CONFIG, getApiKey } = require("../config/bpsConfig");
const { calculateSimilarity, tokenizeAndClean } = require("../utils/stringSimilarity");
const { cacheManager } = require("../utils/cacheManager");
const { fetchBpsWithRetry, fetchDemakStrategicIndicators } = require("./bpsDemakFetcher");

/**
 * Mengambil variabel BPS Jateng (Domain 3300) secara efisien berdasarkan subjek relevan
 * @param {Array<number>} targetSubjectIds 
 * @param {boolean} forceRefresh 
 * @returns {Promise<Array<Object>>}
 */
async function fetchTargetJatengVariables(targetSubjectIds = [6, 12, 23, 26, 155], forceRefresh = false) {
  const cacheKey = "bps:jateng:target_variables";
  if (!forceRefresh) {
    const cached = cacheManager.get(cacheKey);
    if (cached) return cached;
  }

  const apiKey = getApiKey();
  const domain = BPS_CONFIG.DOMAIN_JATENG || BPS_CONFIG.DOMAIN || "3300";
  const allJatengVars = [];
  const seenVarIds = new Set();

  // 1. Fetch variabel berdasarkan subjek statistik relevan (Sangat cepat & hemat bandwidth)
  for (const subId of targetSubjectIds) {
    try {
      const url = `${BPS_CONFIG.BASE_URL}/list/model/var/domain/${domain}/subject/${subId}/key/${apiKey}/`;
      const res = await fetchBpsWithRetry(url, 2);

      if (res && res.status === "OK" && Array.isArray(res.data) && res.data[1]) {
        for (const v of res.data[1]) {
          if (!seenVarIds.has(v.var_id)) {
            seenVarIds.add(v.var_id);
            allJatengVars.push({ ...v, sub_id: subId });
          }
        }
      }
    } catch (err) {
      console.warn(`[bpsJatengMatcher] Notice fetch Jateng subjek ${subId}:`, err.message);
    }
  }

  // 2. Fetch 2 halaman teratas variabel umum untuk menangkap indikator terbaru
  try {
    for (let page = 1; page <= 2; page++) {
      const url = `${BPS_CONFIG.BASE_URL}/list/model/var/domain/${domain}/page/${page}/key/${apiKey}/`;
      const res = await fetchBpsWithRetry(url, 2);
      if (res && res.status === "OK" && Array.isArray(res.data) && res.data[1]) {
        for (const v of res.data[1]) {
          if (!seenVarIds.has(v.var_id)) {
            seenVarIds.add(v.var_id);
            allJatengVars.push(v);
          }
        }
      }
    }
  } catch (err) {
    console.warn("[bpsJatengMatcher] Notice fetch Jateng general vars:", err.message);
  }

  if (allJatengVars.length > 0) {
    cacheManager.set(cacheKey, allJatengVars, BPS_CONFIG.CACHE_TTL_MS);
    return allJatengVars;
  }

  // Fallback variabel Jateng esensial jika BPS server timeout
  return [
    { var_id: 2205, title: "Jumlah Penduduk Hasil Proyeksi Interim (Jiwa)", sub_id: 12, unit: "Jiwa" },
    { var_id: 34, title: "Persentase Penduduk Miskin Menurut Kabupaten/Kota", sub_id: 23, unit: "Persen" },
    { var_id: 2034, title: "Indeks Pembangunan Manusia (IPM)", sub_id: 26, unit: "" },
    { var_id: 63, title: "Tingkat Partisipasi Angkatan Kerja Menurut Kabupaten/Kota", sub_id: 6, unit: "Persen" },
    { var_id: 64, title: "Tingkat Pengangguran Terbuka Menurut Kabupaten/Kota", sub_id: 6, unit: "Persen" },
    { var_id: 1391, title: "Laju Pertumbuhan Produk Domestik Regional Bruto ADHK 2010 Menurut Kabupaten/Kota", sub_id: 155, unit: "Persen" },
  ];
}

/**
 * Fungsional 2: Semantic Mapping Service (Jateng Matcher)
 * Mencocokkan daftar indikator strategis Demak ke katalog variabel Jawa Tengah secara otomatis
 * 
 * @param {boolean} forceRefresh 
 * @returns {Promise<Array<Object>>}
 */
async function generateSemanticMapping(forceRefresh = false) {
  const cacheKey = "bps:semantic_mapping_table";
  if (!forceRefresh) {
    const cached = cacheManager.get(cacheKey);
    if (cached) return cached;
  }

  const demakIndicators = await fetchDemakStrategicIndicators(forceRefresh);
  const targetSubjectIds = Array.from(
    new Set(demakIndicators.map((d) => d.subjectId).filter(Boolean))
  );

  const jatengVars = await fetchTargetJatengVariables(
    targetSubjectIds.length > 0 ? targetSubjectIds : [6, 12, 23, 26, 155],
    forceRefresh
  );

  const mappingResults = [];

  for (const demakInd of demakIndicators) {
    let bestMatch = null;
    let highestScore = 0;

    const demakTokens = tokenizeAndClean(demakInd.rawTitle);

    for (const jVar of jatengVars) {
      const jTitle = jVar.title || "";
      const score = calculateSimilarity(demakInd.rawTitle, jTitle);

      let totalScore = score;
      // Bonus kesesuaian subjek BPS jika sub_id sama
      if (demakInd.subjectId && jVar.sub_id && demakInd.subjectId === jVar.sub_id) {
        totalScore = Math.min(1.0, score + 0.10);
      }

      // Bonus jika semua token penting Demak ada di judul Jateng
      const jTokens = tokenizeAndClean(jTitle);
      const isSubSet = demakTokens.length > 0 && demakTokens.every((t) => jTokens.includes(t));
      if (isSubSet) {
        totalScore = Math.min(1.0, totalScore + 0.15);
      }

      if (totalScore > highestScore) {
        highestScore = totalScore;
        bestMatch = jVar;
      }
    }

    const isMatchFound = highestScore >= BPS_CONFIG.SIMILARITY_THRESHOLD;

    mappingResults.push({
      demakVarId: demakInd.demakVarId,
      demakTitle: demakInd.rawTitle,
      unit: demakInd.unit,
      matchedJatengVarId: isMatchFound && bestMatch ? bestMatch.var_id : null,
      matchedJatengTitle: isMatchFound && bestMatch ? bestMatch.title : null,
      confidenceScore: parseFloat(highestScore.toFixed(3)),
      status: isMatchFound ? "MATCHED" : "UNMATCHED",
    });
  }

  cacheManager.set(cacheKey, mappingResults, BPS_CONFIG.CACHE_TTL_MS);
  return mappingResults;
}

/**
 * Mencari pasangan Jateng Var ID untuk Demak Var ID tertentu
 * @param {number|string} demakVarId 
 * @returns {Promise<number|null>}
 */
async function resolveJatengVarIdBySemantic(demakVarId) {
  if (!demakVarId) return null;
  const numId = parseInt(demakVarId.toString().replace(/\D/g, ""), 10);
  if (isNaN(numId)) return null;

  const mappings = await generateSemanticMapping();
  const match = mappings.find((m) => m.demakVarId === numId);
  if (match && match.matchedJatengVarId) {
    return match.matchedJatengVarId;
  }

  // Fallback static map jika confidence rendah
  const fallbackPairs = {
    115: 64,   // TPT
    114: 63,   // TPAK
    178: 34,   // Kemiskinan
    213: 2034, // IPM
    248: 2205, // Jumlah Penduduk
    110: 1391, // Laju PDRB
  };

  return fallbackPairs[numId] || numId;
}

module.exports = {
  fetchTargetJatengVariables,
  generateSemanticMapping,
  generateSemanticIndicatorMapping: generateSemanticMapping,
  resolveJatengVarIdBySemantic,
};
