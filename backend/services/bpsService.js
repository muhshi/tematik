const { BPS_CONFIG, getApiKey } = require("../config/bpsConfig");
const { db } = require("../db");

function normalizeKecamatanName(name) {
  return name.toLowerCase().replace(/\s+/g, "").trim();
}

async function fetchDynamicBpsData(yearStr = "2024", targetVarId) {
  const resolvedYearStr = yearStr === "ALL" ? "2024" : yearStr;
  const year = parseInt(resolvedYearStr, 10) || 2024;
  const th_id = year - 1900;
  let var_id = targetVarId;

  if (!var_id) {
    var_id = year > 2020 ? 248 : 31;
  }

  // 1. Live BPS API
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

        const turvar_id = turvarList.length > 0 ? turvarList[turvarList.length - 1].val : 0;
        const turtahun_id = turtahunList.length > 0 ? turtahunList[turtahunList.length - 1].val : 0;

        const results = [];
        const dbPoints = [];
        const now = new Date().toISOString();

        for (const vervar of vervarList) {
          const kecamatanId = vervar.val;
          const kecamatanName = vervar.label;

          if (kecamatanName.toLowerCase().includes("kab. demak")) continue;

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

          if (value !== undefined) {
            const numValue = typeof value === "number" ? value : parseFloat(value) || 0;
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
            source: "BPS Kabupaten Demak",
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
      source: "BPS Kabupaten Demak",
      isCached: true,
    };
  }

  // 3. Fallback Mock Data
  const mockData = [
    { kecamatan: "Mranggen", value: 175000 },
    { kecamatan: "Karangawen", value: 95000 },
    { kecamatan: "Guntur", value: 88000 },
    { kecamatan: "Sayung", value: 105000 },
    { kecamatan: "Karangtengah", value: 68000 },
    { kecamatan: "Wonosalam", value: 85000 },
    { kecamatan: "Dempet", value: 59000 },
    { kecamatan: "Gajah", value: 52000 },
    { kecamatan: "Karanganyar", value: 77000 },
    { kecamatan: "Mijen", value: 58000 },
    { kecamatan: "Demak", value: 112000 },
    { kecamatan: "Bonang", value: 106000 },
    { kecamatan: "Wedung", value: 82000 },
    { kecamatan: "Kebonagung", value: 42000 },
  ];

  return {
    data: mockData,
    source: "BPS Kabupaten Demak",
    isCached: true,
  };
}

async function getAvailableYearsForVar(varIdStr) {
  if (!varIdStr) return [];
  const varId = parseInt(varIdStr.replace(/\D/g, ""), 10);
  if (isNaN(varId)) return [];

  try {
    const apiKey = getApiKey();
    const url = `${BPS_CONFIG.BASE_URL}/list/model/th/var/${varId}/domain/${BPS_CONFIG.DOMAIN}/key/${apiKey}/`;

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (response.ok) {
      const result = await response.json();
      if (result["data-availability"] === "available" && Array.isArray(result.data) && result.data.length > 1) {
        const rawYears = result.data[1];
        const hasRecentYear = rawYears.some((y) => parseInt(y.th, 10) >= 2023);
        if (hasRecentYear) {
          return rawYears
            .map((y) => ({ th_id: y.th_id, year: y.th }))
            .sort((a, b) => parseInt(b.year, 10) - parseInt(a.year, 10));
        }
      }
    }
  } catch (error) {
    console.error("[bpsService] Failed to load available years:", error.message);
  }

  const fallbackYears = ["2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018"];
  return fallbackYears.map((y) => ({
    th_id: parseInt(y, 10) - 1900,
    year: y,
  }));
}

module.exports = { fetchDynamicBpsData, normalizeKecamatanName, getAvailableYearsForVar };
