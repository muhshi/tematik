const { BPS_CONFIG, getApiKey } = require("../config/bpsConfig");
const { cacheManager } = require("../utils/cacheManager");
const { fetchBpsWithRetry, fetchDemakStrategicIndicators } = require("./bpsDemakFetcher");
const { generateSemanticMapping, resolveJatengVarIdBySemantic } = require("./bpsJatengMatcher");
const { transformBpsDynamicResponse } = require("./bpsTransformer");

/**
 * Service Utama: Orchestrator Pipeline BPS
 * Mengintegrasikan Demak Fetcher, Jateng Semantic Matcher, Transformer, dan Caching
 */

/**
 * Menarik data tematik peta terstandardisasi untuk frontend
 * 
 * @param {Object} params
 * @param {string} params.granularity - "kabupaten" | "kecamatan"
 * @param {number|string} params.demakVarId - ID Variabel acuan Demak (misal 248)
 * @param {number|string} params.year - Tahun survei (misal 2024)
 * @param {boolean} params.forceRefresh - Paksa update dari live API
 * @returns {Promise<Object>}
 */
async function getThematicMapData({
  granularity = "kecamatan",
  demakVarId,
  year = 2024,
  forceRefresh = false,
}) {
  const numericYear = parseInt(year, 10) || 2024;
  const numDemakVarId = parseInt(demakVarId.toString().replace(/\D/g, ""), 10);
  const thId = numericYear - 1900;

  const cacheKey = `bps:thematic:${granularity}:${numDemakVarId}:${numericYear}`;
  if (!forceRefresh) {
    const cached = cacheManager.get(cacheKey);
    if (cached) {
      return { ...cached, isCached: true };
    }
  }

  // 1. Dapatkan pemetaan semantik variabel Demak <-> Jateng
  const mappings = await generateSemanticMapping(forceRefresh);
  const matchedInfo = mappings.find((m) => m.demakVarId === numDemakVarId);

  let targetDomain = BPS_CONFIG.DOMAIN_DEMAK || "3321";
  let targetVarId = numDemakVarId;
  const indicatorMetadata = {
    id: `var-${numDemakVarId}`,
    name: matchedInfo ? matchedInfo.demakTitle : `Variabel ${numDemakVarId}`,
    unit: matchedInfo?.unit || "",
    matchedJatengVarId: matchedInfo?.matchedJatengVarId || null,
    matchedJatengTitle: matchedInfo?.matchedJatengTitle || null,
  };

  // 2. Jika level kabupaten: gunakan domain Jateng (3300) dan ID variabel Jateng hasil semantic match
  if (granularity === "kabupaten") {
    targetDomain = BPS_CONFIG.DOMAIN_JATENG || "3300";
    const jatengVarId = matchedInfo?.matchedJatengVarId || (await resolveJatengVarIdBySemantic(numDemakVarId));
    if (!jatengVarId) {
      throw new Error(`Tidak ditemukan padanan variabel BPS Jawa Tengah untuk variabel Demak ID ${numDemakVarId}.`);
    }
    targetVarId = jatengVarId;
  }

  // 3. Request ke Dynamic Table API BPS
  const apiKey = getApiKey();
  const url = `${BPS_CONFIG.BASE_URL}/list/model/data/domain/${targetDomain}/var/${targetVarId}/th/${thId}/key/${apiKey}/`;
  
  let rawResponse = null;
  try {
    rawResponse = await fetchBpsWithRetry(url, 2);
  } catch (err) {
    console.warn(`[unifiedBpsService] Gagal memanggil BPS API (${url}):`, err.message);
  }

  // 4. Normalisasi respons
  const normalizedResult = transformBpsDynamicResponse(
    rawResponse,
    granularity,
    numericYear,
    indicatorMetadata
  );

  // 5. Simpan ke Cache jika terdapat data valid
  if (normalizedResult.data && normalizedResult.data.length > 0) {
    cacheManager.set(cacheKey, normalizedResult, BPS_CONFIG.CACHE_TTL_MS);
  }

  return {
    ...normalizedResult,
    isCached: false,
  };
}

/**
 * Mengambil daftar tahun yang tersedia untuk indikator tertentu
 * @param {number|string} demakVarId 
 * @returns {Promise<Array<{ th_id: number, year: string }>>}
 */
async function getAvailableYearsForIndicator(demakVarId) {
  if (!demakVarId) return [];
  const numDemakVarId = parseInt(demakVarId.toString().replace(/\D/g, ""), 10);
  if (isNaN(numDemakVarId)) return [];

  const cacheKey = `bps:years:${numDemakVarId}`;
  const cached = cacheManager.get(cacheKey);
  if (cached) return cached;

  const apiKey = getApiKey();
  const jatengVarId = await resolveJatengVarIdBySemantic(numDemakVarId);

  const checkTargets = [
    { domain: BPS_CONFIG.DOMAIN_DEMAK || "3321", varId: numDemakVarId },
    { domain: BPS_CONFIG.DOMAIN_JATENG || "3300", varId: jatengVarId },
  ];

  for (const { domain, varId } of checkTargets) {
    if (!varId) continue;
    try {
      const url = `${BPS_CONFIG.BASE_URL}/list/model/th/var/${varId}/domain/${domain}/key/${apiKey}/`;
      const res = await fetchBpsWithRetry(url, 2);
      if (res && res["data-availability"] === "available" && Array.isArray(res.data) && res.data[1]) {
        const rawYears = res.data[1];
        if (rawYears.length > 0) {
          const formatted = rawYears
            .map((y) => ({ th_id: y.th_id, year: y.th }))
            .sort((a, b) => parseInt(b.year, 10) - parseInt(a.year, 10));

          cacheManager.set(cacheKey, formatted, BPS_CONFIG.CACHE_TTL_MS);
          return formatted;
        }
      }
    } catch (err) {
      console.warn(`[unifiedBpsService] Gagal fetch years dari domain ${domain}:`, err.message);
    }
  }

  // Fallback tahun default
  const defaultYears = ["2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018"].map((y) => ({
    th_id: parseInt(y, 10) - 1900,
    year: y,
  }));
  return defaultYears;
}

module.exports = {
  getThematicMapData,
  fetchDemakStrategicIndicators,
  generateSemanticIndicatorMapping: generateSemanticMapping,
  getAvailableYearsForIndicator,
};
