const { BPS_CONFIG, getApiKey } = require("../config/bpsConfig");
const { db } = require("../db");

const DOMAIN = "3300"; // Jawa Tengah (All 35 Regencies)
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
  if (varId === 31 || varId === 248 || varId === 178 || varId === 110) return true;
  const t = (title || "").toLowerCase();
  const s = (subject || "").toLowerCase();
  return STRATEGIC_KEYWORDS.some((kw) => t.includes(kw) || s.includes(kw));
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
      await delay(600 * (i + 1));
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

async function syncBpsCatalog() {
  try {
    const apiKey = getApiKey();
    const allIndicators = [];
    let totalDataRows = 0;

    const subjectRes = await fetchWithRetry(
      `${BPS_CONFIG.BASE_URL}/list/model/subject/domain/${DOMAIN}/key/${apiKey}/`
    );

    if (!subjectRes || !Array.isArray(subjectRes.data) || !subjectRes.data[1]) {
      throw new Error("Gagal mengambil daftar Subjek BPS Jawa Tengah.");
    }

    const subjects = subjectRes.data[1];

    for (const sub of subjects) {
      const subId = sub.sub_id;
      const subName = sub.title || sub.sub_name || "Umum";

      await delay(100);

      const varRes = await fetchWithRetry(
        `${BPS_CONFIG.BASE_URL}/list/model/var/domain/${DOMAIN}/subject/${subId}/key/${apiKey}/`
      );

      if (!varRes || !Array.isArray(varRes.data) || !varRes.data[1]) continue;
      const variables = varRes.data[1];

      for (const v of variables) {
        const title = v.title || "";
        const varId = v.var_id;

        // 1. Filter Topik Strategis
        if (!isStrategicTopic(title, subName, varId)) continue;

        // 2. Filter Update Minimal 2023, 2024, 2025
        let latestAvailableYear = null;
        for (const checkYear of FILTER_RECENT_YEARS) {
          const checkThId = checkYear - 1900;
          await delay(60);
          const checkRes = await fetchWithRetry(
            `${BPS_CONFIG.BASE_URL}/list/model/data/domain/${DOMAIN}/var/${varId}/th/${checkThId}/key/${apiKey}/`
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

        allIndicators.push({
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

        // 3. Simpan seluruh seri histori tahun (2015-2025)
        for (const year of ALL_HISTORICAL_YEARS) {
          const thId = year - 1900;
          await delay(60);
          const dataRes = await fetchWithRetry(
            `${BPS_CONFIG.BASE_URL}/list/model/data/domain/${DOMAIN}/var/${varId}/th/${thId}/key/${apiKey}/`
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
            db.saveBpsDataPoints(varId, year, dbPoints);
          }
        }
      }
    }

    if (allIndicators.length > 0) {
      db.saveIndicators(allIndicators);
      return {
        success: true,
        count: allIndicators.length,
        totalDataRows,
        message: `Berhasil sinkronisasi ${allIndicators.length} indikator seluruh Kab/Kota (Syarat Minimal 2023-2025 + Seluruh Histori).`,
      };
    }

    return { success: false, message: "Tidak ada indikator yang memenuhi kriteria rilis 2023-2025." };
  } catch (error) {
    console.error("[indicatorService] Sync error:", error.message);
    return { success: false, message: error.message || "Gagal sinkronisasi dengan BPS API." };
  }
}

module.exports = { getActiveIndicators, getAllIndicators, saveActiveIndicators, syncBpsCatalog };
