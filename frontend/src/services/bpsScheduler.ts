// {*Fungsi: Modul Backend Scheduler BPS Jawa Tengah (Domain 3300) - Seluruh 35 Kab/Kota dengan Filter Rilis Minimal 2023-2025 dan Membawa Seluruh Seri Histori*}

import { db, IndicatorRecord, BpsDataPoint } from "@/lib/db";
import { deleteCache } from "@/lib/redis";
import { getApiKey } from "./bpsApi";
import { getBpsCategory } from "@/lib/bpsHelpers";

const BPS_BASE_URL = "https://webapi.bps.go.id/v1/api/list/model";
const DOMAIN = "3300"; // Domain BPS Jawa Tengah (Mencakup seluruh 35 Kab/Kota)
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
  if (varId === 31 || varId === 248 || varId === 178 || varId === 110) return true;
  const t = title.toLowerCase();
  const s = subject.toLowerCase();
  return STRATEGIC_KEYWORDS.some((kw) => t.includes(kw) || s.includes(kw));
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
 * Main Scheduler Engine:
 * 1. Filter seluruh Kabupaten/Kota di Jawa Tengah (Domain 3300).
 * 2. Filter Topik Strategis BPS.
 * 3. ATURAN FILTER MINIMAL: Update data terakhir HARUS berada di rentang 2023, 2024, atau 2025. Jika <= 2022 -> ABAIKAN.
 * 4. Jika lolos (memiliki data minimal 2023-2025), TETAP MEMBAWA SELURUH HISTORI TAHUN (2015-2025).
 */
export async function executeBpsSync(): Promise<SyncResult> {
  const apiKey = getApiKey();
  console.log("[BPS Sync] Memulai sinkronisasi Seluruh Kab/Kota (Syarat: Minimal Data 2023-2025 + Bawa Seluruh Histori)...");

  let totalIndicators = 0;
  let totalDataRows = 0;

  try {
    const subjectRes = await fetchWithRetry(
      `${BPS_BASE_URL}/subject/domain/${DOMAIN}/key/${apiKey}/`
    );

    if (!subjectRes || !Array.isArray(subjectRes.data) || !subjectRes.data[1]) {
      throw new Error("Gagal mengambil daftar Subjek BPS Jawa Tengah.");
    }

    const subjects: any[] = subjectRes.data[1];
    const allIndicators: IndicatorRecord[] = [];

    for (const sub of subjects) {
      const subId = sub.sub_id;
      const subName = sub.title || sub.sub_name || "Umum";

      await delay(100);

      const varRes = await fetchWithRetry(
        `${BPS_BASE_URL}/var/domain/${DOMAIN}/subject/${subId}/key/${apiKey}/`
      );

      if (!varRes || !Array.isArray(varRes.data) || !varRes.data[1]) continue;
      const variables: any[] = varRes.data[1];

      for (const v of variables) {
        const title: string = v.title || "";
        const varId: number = v.var_id;

        // 1. FILTER TOPIK STRATEGIS
        if (!isStrategicTopic(title, subName, varId)) continue;

        // 2. ATURAN PENTING: CEK RILIS DATA TERAKHIR (MINIMAL 2023, 2024, ATAU 2025)
        let latestAvailableYear: number | null = null;
        for (const checkYear of FILTER_RECENT_YEARS) {
          const checkThId = checkYear - 1900;
          await delay(60);
          const checkRes = await fetchWithRetry(
            `${BPS_BASE_URL}/data/domain/${DOMAIN}/var/${varId}/th/${checkThId}/key/${apiKey}/`
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

        // BILA UPDATE TERAKHIR <= 2022 (TIDAK ADA DATA DI 2023-2025) -> SKIP / ABAIKAN
        if (!latestAvailableYear || latestAvailableYear < 2023) {
          console.log(`[BPS Sync] SKIPPED: "${title}" (Var ${varId}) -> Data terakhir <= 2022`);
          continue;
        }

        console.log(`[BPS Sync] INCLUDED: "${title}" (Var ${varId}) -> Memenuhi syarat (Rilis: ${latestAvailableYear})`);

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
        totalIndicators++;

        // 3. TARIK SELURUH HISTORI TAHUN (2025, 2024, 2023, 2022, 2021, 2020, DST)
        for (const year of ALL_HISTORICAL_YEARS) {
          const thId = year - 1900;
          await delay(60);

          const dataRes = await fetchWithRetry(
            `${BPS_BASE_URL}/data/domain/${DOMAIN}/var/${varId}/th/${thId}/key/${apiKey}/`
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

    if (allIndicators.length > 0) {
      await db.saveIndicators(allIndicators);
    }

    await deleteCache("map:*");
    await deleteCache("indicators:*");

    const message = `Sinkronisasi BPS Berhasil! Tersaring ${totalIndicators} indikator strategis seluruh Kab/Kota (Syarat Minimal 2023-2025 + Seluruh Histori) dan ${totalDataRows} baris data tersimpan.`;
    console.log(`[BPS Sync Finished] ${message}`);

    return {
      success: true,
      message,
      totalIndicators,
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
