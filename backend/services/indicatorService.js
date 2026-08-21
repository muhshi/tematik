const { BPS_CONFIG, getApiKey } = require("../config/bpsConfig");
const { db } = require("../db");

const DOMAIN_JATENG = BPS_CONFIG.DOMAIN || "3300"; // Jawa Tengah (All 35 Regencies)
const DOMAIN_DEMAK = BPS_CONFIG.DOMAIN_DEMAK || "3321"; // Kabupaten Demak
const FILTER_RECENT_YEARS = [2025, 2024, 2023]; // Syarat: Minimal memiliki data di 2023, 2024, atau 2025
const ALL_HISTORICAL_YEARS = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015]; // Seluruh histori yang dibawa jika lolos

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const STRATEGIC_KEYWORDS = [
  "[data strategis]",
  "[indikator strategis]",
  "penduduk miskin",
  "kemiskinan",
  "indeks pembangunan manusia",
  "ipm",
  "pengangguran",
  "ketenagakerjaan",
  "tingkat partisipasi angkatan kerja",
  "tpt",
  "tpak",
  "pdrb",
  "produk domestik regional bruto",
  "inflasi",
  "indeks harga konsumen",
  "gini",
  "pertumbuhan ekonomi",
  "harapan hidup",
  "lama sekolah",
  "pengeluaran per kapita",
  "jumlah penduduk",
  "kepadatan penduduk",
  "produksi padi",
  "luas panen",
  "produktivitas padi",
  "populasi ternak",
  "produksi perikanan",
  "sayuran",
  "gender",
  "ipg"
];

function isStrategicTopic(title, subject, varId) {
  const t = (title || "").toLowerCase();
  const explicitTags = ["[data strategis]", "[indikator strategis]"];
  const isExplicit = explicitTags.some((tag) => t.includes(tag));
  const isPairVar = [114, 115, 178, 213, 248, 110, 63, 64, 34, 2034, 2205, 1391, 2412, 2413, 2414, 2415, 2417].includes(varId);
  return isExplicit || isPairVar;
}

function getBpsCategory(subjectTitle) {
  const s = (subjectTitle || "").toLowerCase();
  if (
    s.includes("pdrb") ||
    s.includes("inflasi") ||
    s.includes("ekonomi") ||
    s.includes("keuangan") ||
    s.includes("industri") ||
    s.includes("perdagangan") ||
    s.includes("pariwisata") ||
    s.includes("energi") ||
    s.includes("transportasi")
  ) {
    return "Ekonomi dan Perdagangan";
  }
  if (
    s.includes("tanaman") ||
    s.includes("pangan") ||
    s.includes("pertanian") ||
    s.includes("perkebunan") ||
    s.includes("peternakan") ||
    s.includes("perikanan") ||
    s.includes("kehutanan") ||
    s.includes("hortikultura")
  ) {
    return "Pertanian dan Pertambangan";
  }
  return "Sosial dan Kependudukan";
}

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
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
  return { indicators, syncDate: new Date().toISOString() };
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
 * Filter dan Sinkronisasi Khusus Data Kabupaten Demak (Domain 3321) untuk [Data Strategis]
 */
async function syncDemakStrategicData() {
  try {
    const apiKey = getApiKey();
    const demakIndicators = [];
    let totalDataRows = 0;

    let page = 1;
    let allDemakVars = [];
    while (true) {
      const varUrl = `${BPS_CONFIG.BASE_URL}/list/model/var/domain/${DOMAIN_DEMAK}/page/${page}/key/${apiKey}/`;
      const varRes = await fetchWithRetry(varUrl);
      if (varRes && varRes.data && varRes.data[1]) {
        allDemakVars.push(...varRes.data[1]);
        const totalPages = varRes.data[0]?.pages || 1;
        if (page >= totalPages) break;
        page++;
      } else {
        break;
      }
    }

    // Filter KHUSUS yang mengandung [data strategis]
    const strategicVars = allDemakVars.filter((v) => {
      const title = (v.title || "").toLowerCase();
      return title.includes("[data strategis]") || title.includes("[indikator strategis]");
    });

    for (const v of strategicVars) {
      const varId = v.var_id;
      const title = v.title || "";
      const subId = v.sub_id;

      let subName = "Umum";
      if (subId === 6) subName = "Ketenagakerjaan";
      else if (subId === 12) subName = "Kependudukan";
      else if (subId === 23) subName = "Kemiskinan dan Ketimpangan";
      else if (subId === 26) subName = "Indeks Pembangunan Manusia";
      else if (subId === 155) subName = "Produk Domestik Regional Bruto";

      const thRes = await fetchWithRetry(
        `${BPS_CONFIG.BASE_URL}/list/model/th/var/${varId}/domain/${DOMAIN_DEMAK}/key/${apiKey}/`
      );

      let latestYear = "2024";
      if (thRes && thRes.data && thRes.data[1]) {
        const sorted = thRes.data[1]
          .map((y) => parseInt(y.th, 10))
          .filter((y) => !isNaN(y))
          .sort((a, b) => b - a);
        if (sorted.length > 0) latestYear = sorted[0].toString();
      }

      demakIndicators.push({
        id: `var-${varId}`,
        name: title,
        category: getBpsCategory(subName),
        code: `Var ${varId}`,
        lastUpdated: latestYear,
        subjectId: subId,
        subjectName: subName,
        subcatId: 0,
        isActive: true,
        domain: DOMAIN_DEMAK,
      });

      // Tarik histori tahun untuk variabel strategis Demak
      for (const year of ALL_HISTORICAL_YEARS) {
        const thId = year - 1900;
        await delay(50);

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
      }
    }

    return { indicators: demakIndicators, totalDataRows };
  } catch (error) {
    console.error("[indicatorService] Error syncing Demak strategic data:", error.message);
    return { indicators: [], totalDataRows: 0 };
  }
}

async function syncBpsCatalog() {
  try {
    const apiKey = getApiKey();
    let totalDataRows = 0;

    // 1. Sinkronisasi Khusus Kabupaten Demak [Data Strategis] (Domain 3321)
    const { indicators: demakIndicators, totalDataRows: demakRows } = await syncDemakStrategicData();
    totalDataRows += demakRows;

    // 2. Sinkronisasi Provinsi Jawa Tengah (Domain 3300)
    const jatengIndicators = [];
    const subjectRes = await fetchWithRetry(
      `${BPS_CONFIG.BASE_URL}/list/model/subject/domain/${DOMAIN_JATENG}/key/${apiKey}/`
    );

    if (subjectRes && Array.isArray(subjectRes.data) && subjectRes.data[1]) {
      const subjects = subjectRes.data[1];

      for (const sub of subjects) {
        const subId = sub.sub_id;
        const subName = sub.title || sub.sub_name || "Umum";

        await delay(80);

        const varRes = await fetchWithRetry(
          `${BPS_CONFIG.BASE_URL}/list/model/var/domain/${DOMAIN_JATENG}/subject/${subId}/key/${apiKey}/`
        );

        if (!varRes || !Array.isArray(varRes.data) || !varRes.data[1]) continue;
        const variables = varRes.data[1];

        for (const v of variables) {
          const title = v.title || "";
          const varId = v.var_id;

          // Filter Topik Strategis
          if (!isStrategicTopic(title, subName, varId)) continue;

          // Filter Update Minimal 2023, 2024, 2025
          let latestAvailableYear = null;
          for (const checkYear of FILTER_RECENT_YEARS) {
            const checkThId = checkYear - 1900;
            await delay(50);
            const checkRes = await fetchWithRetry(
              `${BPS_CONFIG.BASE_URL}/list/model/data/domain/${DOMAIN_JATENG}/var/${varId}/th/${checkThId}/key/${apiKey}/`
            );
            if (
              checkRes &&
              checkRes["data-availability"] === "available" &&
              checkRes.datacontent &&
              Object.keys(checkRes.datacontent).length > 0
            ) {
              latestAvailableYear = checkYear;
              break;
            }
          }

          if (!latestAvailableYear || latestAvailableYear < 2023) {
            continue;
          }

          jatengIndicators.push({
            id: `var-${varId}`,
            name: title,
            category: getBpsCategory(subName),
            code: `Var ${varId}`,
            lastUpdated: latestAvailableYear.toString(),
            subjectId: subId,
            subjectName: subName,
            subcatId: 0,
            isActive: true,
          });

          // Simpan seluruh seri histori tahun (2015-2025)
          for (const year of ALL_HISTORICAL_YEARS) {
            const thId = year - 1900;
            await delay(50);
            const dataRes = await fetchWithRetry(
              `${BPS_CONFIG.BASE_URL}/list/model/data/domain/${DOMAIN_JATENG}/var/${varId}/th/${thId}/key/${apiKey}/`
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
          }
        }
      }
    }

    // Gabungkan dengan menempatkan [Data Strategis] Demak di urutan teratas
    const demakIds = new Set(demakIndicators.map((d) => d.id));
    const mergedIndicators = [...demakIndicators, ...jatengIndicators.filter((j) => !demakIds.has(j.id))];

    if (mergedIndicators.length > 0) {
      await db.saveIndicators(mergedIndicators);
      return {
        success: true,
        count: mergedIndicators.length,
        demakCount: demakIndicators.length,
        totalDataRows,
        message: `Berhasil sinkronisasi ${demakIndicators.length} [Data Strategis] Kabupaten Demak dan ${mergedIndicators.length} total indikator (${totalDataRows} baris data).`,
      };
    }

    return { success: false, message: "Tidak ada indikator yang memenuhi kriteria." };
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
  syncDemakStrategicData,
};
