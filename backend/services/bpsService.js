const { BPS_CONFIG, getApiKey } = require("../config/bpsConfig");
const { db } = require("../db");

function normalizeRegionName(name) {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/^\d+\s*/, "")
    .replace(/^(kabupaten|kab\.?|kota|kecamatan|kec\.?)\s+/i, "")
    .replace(/\s+/g, "")
    .trim();
}

function normalizeKecamatanName(name) {
  return normalizeRegionName(name);
}

function selectOptimalTurvar(varId, turvarList) {
  if (!turvarList || turvarList.length === 0) return 0;
  if (turvarList.length === 1) return turvarList[0].val;

  // 1. Khusus Var 2205 (Jumlah Penduduk Jateng): Pilih turvar 'Penduduk (ribu jiwa)'
  if (varId === 2205) {
    const popTurvar = turvarList.find((t) => t.label && (t.label.toLowerCase().includes("ribu jiwa") || t.val == 2423));
    if (popTurvar) return popTurvar.val;
  }

  // 2. Khusus Var 34 (Kemiskinan Jateng): Pilih turvar 'Persentase Penduduk Miskin'
  if (varId === 34) {
    const pctTurvar = turvarList.find((t) => t.label && (t.label.toLowerCase().includes("persentase") || t.val == 55));
    if (pctTurvar) return pctTurvar.val;
  }

  // 3. Preferensi persen
  const pct = turvarList.find((t) => t.label && (t.label.toLowerCase().includes("persen") || t.label.toLowerCase().includes("persentase")));
  if (pct) return pct.val;

  return turvarList[0].val;
}

// Tabel Pemetaan Indikator Strategis Lintas Domain (Demak 3321 <-> Jawa Tengah 3300)
const STRATEGIC_INDICATOR_PAIRS = [
  {
    theme: "TPT",
    title: "Tingkat Pengangguran Terbuka (TPT)",
    demakVarId: 115,
    jatengVarId: 64,
    keywords: ["tingkat pengangguran terbuka", "tpt", "pengangguran"]
  },
  {
    theme: "TPAK",
    title: "Tingkat Partisipasi Angkatan Kerja (TPAK)",
    demakVarId: 114,
    jatengVarId: 63,
    keywords: ["tingkat partisipasi angkatan kerja", "tpak", "angkatan kerja"]
  },
  {
    theme: "KEMISKINAN",
    title: "Persentase Penduduk Miskin",
    demakVarId: 178,
    jatengVarId: 34,
    keywords: ["penduduk miskin", "kemiskinan", "persentase kemiskinan", "garis kemiskinan", "p0"]
  },
  {
    theme: "IPM",
    title: "Indeks Pembangunan Manusia (IPM)",
    demakVarId: 213,
    jatengVarId: 2034,
    keywords: ["indeks pembangunan manusia", "ipm", "harapan hidup", "uhh"]
  },
  {
    theme: "PENDUDUK",
    title: "Jumlah Penduduk",
    demakVarId: 248,
    jatengVarId: 2205,
    keywords: ["jumlah penduduk", "proyeksi penduduk", "penduduk", "kepadatan penduduk"]
  },
  {
    theme: "PDRB",
    title: "Laju Pertumbuhan PDRB",
    demakVarId: 110,
    jatengVarId: 1391,
    keywords: ["laju pertumbuhan pdrb", "pdrb", "pertumbuhan ekonomi", "produk domestik"]
  }
];

function resolveJatengVarId(targetVarId) {
  if (!targetVarId) return 63;
  const numId = parseInt(targetVarId.toString().replace(/\D/g, ""), 10);
  if (isNaN(numId)) return 63;

  const pair = STRATEGIC_INDICATOR_PAIRS.find((p) => p.demakVarId === numId || p.jatengVarId === numId);
  if (pair) return pair.jatengVarId;
  return numId;
}

function resolveDemakVarId(targetVarId) {
  if (!targetVarId) return 248;
  const numId = parseInt(targetVarId.toString().replace(/\D/g, ""), 10);
  if (isNaN(numId)) return 248;

  const pair = STRATEGIC_INDICATOR_PAIRS.find((p) => p.demakVarId === numId || p.jatengVarId === numId);
  if (pair) return pair.demakVarId;
  return numId;
}

async function fetchDynamicBpsData(yearStr = "2024", targetVarId) {
  const resolvedYearStr = yearStr === "ALL" ? "2024" : yearStr;
  const year = parseInt(resolvedYearStr, 10) || 2024;
  const th_id = year - 1900;
  const var_id = resolveJatengVarId(targetVarId);

  // 1. Live BPS API (Domain 3300 - Jawa Tengah 35 Kab/Kota)
  try {
    const apiKey = getApiKey();
    const url = `${BPS_CONFIG.BASE_URL}/list/model/data/domain/${BPS_CONFIG.DOMAIN}/var/${var_id}/th/${th_id}/key/${apiKey}/`;

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (response.ok) {
      const result = await response.json();

      if (result.status === "OK" && result["data-availability"] !== "not-available") {
        const vervarList = result.vervar || [];
        const datacontent = result.datacontent || {};
        const turvarList = result.turvar || [];
        const turtahunList = result.turtahun || [];

        const turvar_id = selectOptimalTurvar(var_id, turvarList);
        const turtahun_id = turtahunList.length > 0 ? turtahunList[turtahunList.length - 1].val : 0;

        const results = [];
        const dbPoints = [];
        const now = new Date().toISOString();

        for (const vervar of vervarList) {
          const kecamatanId = vervar.val;
          const kecamatanName = vervar.label;

          const dataKey = `${kecamatanId}${var_id}${turvar_id}${th_id}${turtahun_id}`;
          let value = datacontent[dataKey];

          if (value === undefined && turvarList.length > 1) {
            for (const tv of turvarList) {
              const fallbackKey = `${kecamatanId}${var_id}${tv.val}${th_id}${turtahun_id}`;
              if (datacontent[fallbackKey] !== undefined) {
                value = datacontent[fallbackKey];
                break;
              }
            }
          }

          if (value !== undefined && value !== null && value !== "-" && value !== "...") {
            let numValue = typeof value === "number" ? value : parseFloat(value) || 0;
            // Konversi satuan ribu jiwa menjadi jiwa utuh untuk var 2205
            if (var_id === 2205 && numValue > 0 && numValue < 100000) {
              numValue = Math.round(numValue * 1000);
            }

            results.push({
              kecamatan: kecamatanName,
              value: numValue,
            });
            dbPoints.push({
              varId: var_id,
              year,
              kecamatan: kecamatanName,
              value: numValue,
              updatedAt: now,
            });
          }
        }

        if (results.length > 0) {
          await db.saveBpsDataPoints(var_id, year, dbPoints);
          return {
            data: results,
            source: "BPS Provinsi Jawa Tengah",
            isCached: false,
          };
        }
      }
    }
  } catch (bpsError) {
    console.warn("[bpsService] Live BPS API query failed, checking DB fallback:", bpsError.message);
  }

  // 2. DB Fallback Store
  const storedPoints = await db.getBpsDataPoints(var_id, year);
  if (storedPoints && storedPoints.length > 0) {
    return {
      data: storedPoints.map((p) => ({ kecamatan: p.kecamatan, value: p.value })),
      source: "BPS Provinsi Jawa Tengah",
      isCached: true,
    };
  }

  return {
    data: [],
    source: "BPS Provinsi Jawa Tengah",
    isCached: false,
  };
}

async function fetchDemakStrategicData(yearStr = "2024", targetVarId) {
  const resolvedYearStr = yearStr === "ALL" ? "2024" : yearStr;
  const year = parseInt(resolvedYearStr, 10) || 2024;
  const th_id = year - 1900;
  const var_id = resolveDemakVarId(targetVarId);

  // 1. Live BPS API (Domain 3321 - Kabupaten Demak)
  try {
    const apiKey = getApiKey();
    const domain = BPS_CONFIG.DOMAIN_DEMAK || "3321";
    const url = `${BPS_CONFIG.BASE_URL}/list/model/data/domain/${domain}/var/${var_id}/th/${th_id}/key/${apiKey}/`;

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (response.ok) {
      const result = await response.json();
      if (result.status === "OK" && result["data-availability"] !== "not-available") {
        const vervarList = result.vervar || [];
        const datacontent = result.datacontent || {};
        const turvarList = result.turvar || [];
        const turtahunList = result.turtahun || [];

        const turvar_id = selectOptimalTurvar(var_id, turvarList);
        const turtahun_id = turtahunList.length > 0 ? turtahunList[turtahunList.length - 1].val : 0;

        const results = [];
        const dbPoints = [];
        const now = new Date().toISOString();

        for (const vervar of vervarList) {
          const regionId = vervar.val;
          const regionName = vervar.label;

          // For kecamatan level maps, skip total "Kab. Demak" summary row if individual kecamatans exist
          if (vervarList.length > 1 && (regionName.toLowerCase().includes("kab. demak") || regionName.toLowerCase().includes("kabupaten demak"))) {
            continue;
          }

          const dataKey = `${regionId}${var_id}${turvar_id}${th_id}${turtahun_id}`;
          let value = datacontent[dataKey];

          if (value === undefined && turvarList.length > 1) {
            for (const tv of turvarList) {
              const fallbackKey = `${regionId}${var_id}${tv.val}${th_id}${turtahun_id}`;
              if (datacontent[fallbackKey] !== undefined) {
                value = datacontent[fallbackKey];
                break;
              }
            }
          }

          if (value !== undefined && value !== null && value !== "-" && value !== "...") {
            const numValue = typeof value === "number" ? value : parseFloat(value) || 0;
            results.push({
              kecamatan: regionName,
              value: numValue,
            });
            dbPoints.push({
              varId: var_id,
              year,
              kecamatan: regionName,
              value: numValue,
              updatedAt: now,
            });
          }
        }

        if (results.length > 0) {
          await db.saveBpsDataPoints(var_id, year, dbPoints);
          return results;
        }
      }
    }
  } catch (err) {
    console.warn("[bpsService] Demak strategic data live fetch notice:", err.message);
  }

  // 2. DB Fallback Store
  const storedPoints = await db.getBpsDataPoints(var_id, year);
  if (storedPoints && storedPoints.length > 0) {
    return storedPoints.map((p) => ({ kecamatan: p.kecamatan, value: p.value }));
  }

  // 3. Fallback for Var 248 (Kecamatan Demak)
  if (var_id === 248) {
    return [
      { kecamatan: "Mranggen", value: 181444 },
      { kecamatan: "Karangawen", value: 98566 },
      { kecamatan: "Guntur", value: 91123 },
      { kecamatan: "Sayung", value: 108177 },
      { kecamatan: "Karangtengah", value: 72140 },
      { kecamatan: "Bonang", value: 110024 },
      { kecamatan: "Demak", value: 113928 },
      { kecamatan: "Wonosalam", value: 89384 },
      { kecamatan: "Dempet", value: 62686 },
      { kecamatan: "Kebonagung", value: 42699 },
      { kecamatan: "Gajah", value: 54948 },
      { kecamatan: "Karanganyar", value: 80582 },
      { kecamatan: "Mijen", value: 61019 },
      { kecamatan: "Wedung", value: 86250 },
    ];
  }

  return [];
}

async function getAvailableYearsForVar(varIdStr) {
  if (!varIdStr) return [];
  const varId = parseInt(varIdStr.replace(/\D/g, ""), 10);
  if (isNaN(varId)) return [];

  const apiKey = getApiKey();
  const jatengVarId = resolveJatengVarId(varId);
  const demakVarId = resolveDemakVarId(varId);

  const checks = [
    { domain: BPS_CONFIG.DOMAIN_DEMAK || "3321", varId: demakVarId },
    { domain: BPS_CONFIG.DOMAIN || "3300", varId: jatengVarId },
    { domain: BPS_CONFIG.DOMAIN_DEMAK || "3321", varId },
    { domain: BPS_CONFIG.DOMAIN || "3300", varId },
  ];

  for (const { domain, varId: vId } of checks) {
    try {
      const url = `${BPS_CONFIG.BASE_URL}/list/model/th/var/${vId}/domain/${domain}/key/${apiKey}/`;
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
      });

      if (response.ok) {
        const result = await response.json();
        if (result["data-availability"] === "available" && Array.isArray(result.data) && result.data.length > 1) {
          const rawYears = result.data[1];
          const hasRecentYear = rawYears.some((y) => parseInt(y.th, 10) >= 2021);
          if (hasRecentYear) {
            return rawYears
              .map((y) => ({ th_id: y.th_id, year: y.th }))
              .sort((a, b) => parseInt(b.year, 10) - parseInt(a.year, 10));
          }
        }
      }
    } catch (error) {
      console.warn(`[bpsService] Failed to load years from domain ${domain}:`, error.message);
    }
  }

  const fallbackYears = ["2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018"];
  return fallbackYears.map((y) => ({
    th_id: parseInt(y, 10) - 1900,
    year: y,
  }));
}

module.exports = {
  STRATEGIC_INDICATOR_PAIRS,
  resolveJatengVarId,
  resolveDemakVarId,
  fetchDynamicBpsData,
  fetchDemakStrategicData,
  normalizeRegionName,
  normalizeKecamatanName,
  getAvailableYearsForVar,
};
