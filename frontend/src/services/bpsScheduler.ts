// {*Fungsi: Modul Backend Scheduler BPS Jawa Tengah & Kabupaten Demak - Filter [Data Strategis] Demak & Indikator Strategis Jateng dengan Seri Histori*}

import { db, IndicatorRecord, BpsDataPoint } from "@/lib/db";
import { deleteCache } from "@/lib/redis";
import { getApiKey } from "./bpsApi";
import { getBpsCategory } from "@/lib/bpsHelpers";

const BPS_BASE_URL = "https://webapi.bps.go.id/v1/api/list/model";
const DOMAIN_JATENG = "3300"; // Domain BPS Jawa Tengah (Mencakup seluruh 35 Kab/Kota)
const DOMAIN_DEMAK = "3321"; // Domain BPS Kabupaten Demak
const FILTER_RECENT_YEARS = [2025, 2024, 2023]; // Syarat: Minimal memiliki data di 2023, 2024, atau 2025
const ALL_HISTORICAL_YEARS = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015]; // Seluruh histori tahun yang ditarik jika lolos

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

function isStrategicTopic(title: string, subject: string, varId: number): boolean {
  const t = title.toLowerCase();
  const explicitTags = ["[data strategis]", "[indikator strategis]"];
  const isExplicit = explicitTags.some((tag) => t.includes(tag));
  const isPairVar = [114, 115, 178, 213, 248, 110, 63, 64, 34, 2034, 2205, 1391, 2412, 2413, 2414, 2415, 2417].includes(varId);
  return isExplicit || isPairVar;
}

async function fetchWithRetry(url: string, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
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

export interface SyncResult {
  success: boolean;
  message: string;
  totalIndicators: number;
  totalDataRows: number;
}

/**
 * Filter dan Sinkronisasi Khusus Data Kabupaten Demak (Domain 3321) untuk [Data Strategis]
 */
export async function syncDemakStrategicData(): Promise<{ indicators: IndicatorRecord[]; totalDataRows: number }> {
  const apiKey = getApiKey();
  const demakIndicators: IndicatorRecord[] = [];
  let totalDataRows = 0;

  try {
    let page = 1;
    let allDemakVars: any[] = [];
    while (true) {
      const varUrl = `${BPS_BASE_URL}/var/domain/${DOMAIN_DEMAK}/page/${page}/key/${apiKey}/`;
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
      const varId: number = v.var_id;
      const title: string = v.title || "";
      const subId: number = v.sub_id;

      let subName = "Umum";
      if (subId === 6) subName = "Ketenagakerjaan";
      else if (subId === 12) subName = "Kependudukan";
      else if (subId === 23) subName = "Kemiskinan dan Ketimpangan";
      else if (subId === 26) subName = "Indeks Pembangunan Manusia";
      else if (subId === 155) subName = "Produk Domestik Regional Bruto";

      const thRes = await fetchWithRetry(
        `${BPS_BASE_URL}/th/var/${varId}/domain/${DOMAIN_DEMAK}/key/${apiKey}/`
      );

      let latestYear = "2024";
      if (thRes && thRes.data && thRes.data[1]) {
        const sorted = (thRes.data[1] as any[])
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
      });

      // Tarik histori tahun untuk variabel strategis Demak
      for (const year of ALL_HISTORICAL_YEARS) {
        const thId = year - 1900;
        await delay(50);

        const dataRes = await fetchWithRetry(
          `${BPS_BASE_URL}/data/domain/${DOMAIN_DEMAK}/var/${varId}/th/${thId}/key/${apiKey}/`
        );

        if (!dataRes || dataRes["data-availability"] !== "available" || !dataRes.datacontent) continue;

        const vervarList: any[] = dataRes.vervar || [];
        const datacontent: Record<string, any> = dataRes.datacontent || {};
        const turvarList: any[] = dataRes.turvar || [];
        const turvar_id = turvarList.length > 0 ? turvarList[turvarList.length - 1].val : 0;
        const turtahunList: any[] = dataRes.turtahun || [];
        const turtahun_id = turtahunList.length > 0 ? turtahunList[turtahunList.length - 1].val : 0;

        const dbPoints: BpsDataPoint[] = [];
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
  } catch (error: any) {
    console.error("[bpsScheduler] Error syncing Demak strategic data:", error.message);
    return { indicators: [], totalDataRows: 0 };
  }
}

/**
 * Main Scheduler Engine:
 * 1. Filter dan Sinkronisasi [Data Strategis] Kabupaten Demak (Domain 3321).
 * 2. Filter Indikator Strategis BPS Jawa Tengah (Domain 3300) dengan syarat minimal rilis 2023-2025.
 * 3. Membawa seluruh seri histori tahun (2015-2025).
 */
export async function executeBpsSync(): Promise<SyncResult> {
  const apiKey = getApiKey();
  console.log("[BPS Sync] Memulai sinkronisasi [Data Strategis] Demak & Jawa Tengah...");

  let totalIndicators = 0;
  let totalDataRows = 0;

  try {
    // 1. Sinkronisasi Khusus [Data Strategis] Kabupaten Demak
    const { indicators: demakIndicators, totalDataRows: demakRows } = await syncDemakStrategicData();
    totalDataRows += demakRows;
    totalIndicators += demakIndicators.length;

    // 2. Sinkronisasi Indikator Jawa Tengah (Domain 3300)
    const jatengIndicators: IndicatorRecord[] = [];
    const subjectRes = await fetchWithRetry(
      `${BPS_BASE_URL}/subject/domain/${DOMAIN_JATENG}/key/${apiKey}/`
    );

    if (subjectRes && Array.isArray(subjectRes.data) && subjectRes.data[1]) {
      const subjects: any[] = subjectRes.data[1];

      for (const sub of subjects) {
        const subId = sub.sub_id;
        const subName = sub.title || sub.sub_name || "Umum";

        await delay(80);

        const varRes = await fetchWithRetry(
          `${BPS_BASE_URL}/var/domain/${DOMAIN_JATENG}/subject/${subId}/key/${apiKey}/`
        );

        if (!varRes || !Array.isArray(varRes.data) || !varRes.data[1]) continue;
        const variables: any[] = varRes.data[1];

        for (const v of variables) {
          const title: string = v.title || "";
          const varId: number = v.var_id;

          // 1. FILTER TOPIK STRATEGIS
          if (!isStrategicTopic(title, subName, varId)) continue;

          // 2. CEK RILIS DATA TERAKHIR (MINIMAL 2023, 2024, ATAU 2025)
          let latestAvailableYear: number | null = null;
          for (const checkYear of FILTER_RECENT_YEARS) {
            const checkThId = checkYear - 1900;
            await delay(50);
            const checkRes = await fetchWithRetry(
              `${BPS_BASE_URL}/data/domain/${DOMAIN_JATENG}/var/${varId}/th/${checkThId}/key/${apiKey}/`
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
          totalIndicators++;

          // 3. TARIK SELURUH HISTORI TAHUN (2015-2025)
          for (const year of ALL_HISTORICAL_YEARS) {
            const thId = year - 1900;
            await delay(50);

            const dataRes = await fetchWithRetry(
              `${BPS_BASE_URL}/data/domain/${DOMAIN_JATENG}/var/${varId}/th/${thId}/key/${apiKey}/`
            );

            if (!dataRes || dataRes["data-availability"] !== "available" || !dataRes.datacontent) continue;

            const vervarList: any[] = dataRes.vervar || [];
            const datacontent: Record<string, any> = dataRes.datacontent || {};
            const turvarList: any[] = dataRes.turvar || [];
            const turvar_id = turvarList.length > 0 ? turvarList[turvarList.length - 1].val : 0;
            const turtahunList: any[] = dataRes.turtahun || [];
            const turtahun_id = turtahunList.length > 0 ? turtahunList[turtahunList.length - 1].val : 0;

            const dbPoints: BpsDataPoint[] = [];

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

    const demakIds = new Set(demakIndicators.map((d) => d.id));
    const mergedIndicators = [...demakIndicators, ...jatengIndicators.filter((j) => !demakIds.has(j.id))];

    if (mergedIndicators.length > 0) {
      await db.saveIndicators(mergedIndicators);
    }

    await deleteCache("map:*");
    await deleteCache("indicators:*");

    const message = `Sinkronisasi BPS Berhasil! Tersaring ${demakIndicators.length} [Data Strategis] Demak dan total ${mergedIndicators.length} indikator (${totalDataRows} baris data tersimpan).`;
    console.log(`[BPS Sync Finished] ${message}`);

    return {
      success: true,
      message,
      totalIndicators: mergedIndicators.length,
      totalDataRows,
    };
  } catch (err: any) {
    const errorMsg = err.message || "Terjadi kesalahan pada scheduler BPS.";
    console.error("[BPS Sync Error]:", errorMsg);
    return {
      success: false,
      message: errorMsg,
      totalIndicators,
      totalDataRows,
    };
  }
}
