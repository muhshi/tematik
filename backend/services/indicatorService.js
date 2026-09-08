const { BPS_CONFIG, getApiKey } = require("../config/bpsConfig");
const { db } = require("../db");
const CUSTOM_INDICATORS = require("../config/customIndicators");

const DOMAIN_DEMAK = BPS_CONFIG.DOMAIN_DEMAK || "3321"; // Kabupaten Demak
const ALL_HISTORICAL_YEARS = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015]; // Seluruh histori

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(5000)
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      await delay(400 * (i + 1));
    }
  }
  return null;
}

function getActiveIndicators() {
  const allIndicators = db.getIndicators();
  return allIndicators.filter((ind) => ind.isActive);
}

function getAllIndicators() {
  const indicators = db.getIndicators();
  return { indicators, syncDate: db.store.lastSyncedAt };
}

function saveActiveIndicators(activeIds) {
  try {
    db.updateActiveIndicators(activeIds);
    return { success: true, message: "Konfigurasi berhasil disimpan!" };
  } catch (error) {
    console.error("[indicatorService] Save error:", error.message);
    return { success: false, message: "Gagal menyimpan konfigurasi." };
  }
}

/**
 * Sinkronisasi Khusus Data Custom Indicators
 */
async function syncBpsCatalog() {
  try {
    const apiKey = getApiKey();
    let totalDataRows = 0;
    
    // Gunakan indikator custom
    const activeIndicatorsToSave = [...CUSTOM_INDICATORS];

    for (const indicator of activeIndicatorsToSave) {
      const varId = parseInt(indicator.id.replace("var-", ""), 10);
      
      let latestYear = "2024";
      try {
        const thRes = await fetchWithRetry(
          `${BPS_CONFIG.BASE_URL}/list/model/th/var/${varId}/domain/${DOMAIN_DEMAK}/key/${apiKey}/`
        );
        if (thRes && thRes.data && thRes.data[1]) {
          const sorted = thRes.data[1]
            .map((y) => parseInt(y.th, 10))
            .filter((y) => !isNaN(y))
            .sort((a, b) => b - a);
          if (sorted.length > 0) latestYear = sorted[0].toString();
        }
      } catch(err) {
        console.warn(`Gagal mengambil histori tahun untuk var ${varId}`);
      }

      indicator.lastUpdated = latestYear;

      // Tarik histori tahun untuk variabel strategis
      for (const year of ALL_HISTORICAL_YEARS) {
        const thId = year - 1900;
        await delay(50);

        try {
          const dataRes = await fetchWithRetry(
            `${BPS_CONFIG.BASE_URL}/list/model/data/domain/${DOMAIN_DEMAK}/var/${varId}/th/${thId}/key/${apiKey}/`
          );

          if (!dataRes || dataRes["data-availability"] !== "available" || !dataRes.datacontent) continue;

          const vervarList = dataRes.vervar || [];
          const datacontent = dataRes.datacontent || {};
          const turvarList = dataRes.turvar || [];
          const turvar_id = turvarList.length > 0 ? turvarList[turvarList.length - 1].val : 0;
          const turtahunList = dataRes.turtahun || [];
          const turtahun_id = turtahunList.length > 0 ? turtahunList[turtahunList.length - 1].val : 0;

          const dbPoints = [];
          for (const vervar of vervarList) {
            const regionId = vervar.val;
            const regionName = vervar.label;
            const dataKey = `${regionId}${varId}${turvar_id}${thId}${turtahun_id}`;
            let val = datacontent[dataKey];

            if (val === undefined && turvarList.length > 1) {
              for (const tv of turvarList) {
                const fallbackKey = `${regionId}${varId}${tv.val}${thId}${turtahun_id}`;
                if (datacontent[fallbackKey] !== undefined) {
                  val = datacontent[fallbackKey];
                  break;
                }
              }
            }

            if (val !== undefined && val !== null) {
              const numVal = typeof val === "number" ? val : parseFloat(val) || 0;
              dbPoints.push({
                varId,
                year,
                kecamatan: regionName,
                value: numVal,
                updatedAt: new Date().toISOString(),
              });
              totalDataRows++;
            }
          }

          if (dbPoints.length > 0) {
            await db.saveBpsDataPoints(varId, year, dbPoints);
          }
        } catch(err) {
           console.warn(`Gagal mengambil data untuk var ${varId} tahun ${year}`);
        }
      }
    }

    if (activeIndicatorsToSave.length > 0) {
      await db.saveIndicators(activeIndicatorsToSave);
      return {
        success: true,
        count: activeIndicatorsToSave.length,
        totalDataRows,
        message: `Berhasil sinkronisasi ${activeIndicatorsToSave.length} Indikator Utama BPS (${totalDataRows} baris data).`,
      };
    }

    return { success: false, message: "Gagal menyimpan indikator." };
  } catch (error) {
    console.error("[indicatorService] Sync error:", error.message);
    return { success: false, message: error.message || "Gagal sinkronisasi dengan BPS API." };
  }
}

module.exports = {
  getActiveIndicators,
  getAllIndicators,
  saveActiveIndicators,
  syncBpsCatalog,
};
