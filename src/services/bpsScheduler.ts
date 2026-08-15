// {*Fungsi: Modul Backend Scheduler BPS Jawa Tengah (Domain 3300) dengan Filter Rilis Terakhir >= 2023 & Full Histori 2020-2025*}

import { prisma } from "@/lib/prisma";
import { deleteCache } from "@/lib/redis";

const BPS_BASE_URL = "https://webapi.bps.go.id/v1/api/list/model";
const DOMAIN = "3300"; // Domain BPS Jawa Tengah (Mencakup 35 Kab/Kota)
const ALL_HISTORICAL_YEARS = [2025, 2024, 2023, 2022, 2021, 2020]; // Full seri histori untuk indikator aktif

function getApiKey(): string {
  const key = process.env.BPS_API_KEY;
  if (!key || key === "your_bps_api_key_here") {
    throw new Error("BPS_API_KEY tidak ditemukan di environment variable (.env / .env.local)");
  }
  return key;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch helper with retries and timeout
 */
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
 * 1. Tarik indikator Jawa Tengah (Domain 3300).
 * 2. Filter Topik Strategis & ATURAN RILIS TERAKHIR (Update terakhir harus 2023, 2024, atau 2025). Jika <= 2022 -> ABAIKAN.
 * 3. Jika rilis terakhir >= 2023, TARIK SELURUH SERI HISTORI DARI TAHUN TERAKHIR SAMPAI PALING LAMPAU (2020-2025).
 */
export async function executeBpsSync(): Promise<SyncResult> {
  const apiKey = getApiKey();
  console.log("[BPS Sync] Starting BPS Sync (Rule: Latest update 2023-2025 + Full Historical Series)...");

  // Create log entry in Supabase
  let logId: number | null = null;
  try {
    const logPromise = prisma.syncLog.create({
      data: {
        startedAt: new Date(),
        status: "running",
        message: "Proses sinkronisasi BPS Jateng (Update Terakhir 2023-2025 + Full Histori) dimulai...",
      },
    });
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout log create")), 2500)
    );
    const log = await Promise.race([logPromise, timeoutPromise]);
    logId = log.id;
  } catch (err) {
    console.warn("[bpsScheduler] DB SyncLog creation skipped/failed:", err);
  }

  let totalIndicators = 0;
  let totalDataRows = 0;
  const errors: string[] = [];

  try {
    // 1. Fetch Subjects list for domain 3300 (Jawa Tengah)
    const subjectRes = await fetchWithRetry(
      `${BPS_BASE_URL}/subject/domain/${DOMAIN}/key/${apiKey}/`
    );

    if (
      !subjectRes ||
      subjectRes["data-availability"] !== "available" ||
      !Array.isArray(subjectRes.data) ||
      !subjectRes.data[1]
    ) {
      throw new Error("Gagal mengambil daftar Subjek BPS Jawa Tengah.");
    }

    const subjects: any[] = subjectRes.data[1];

    // Daftar Kata Kunci Topik Strategis
    const strategicKeywords = [
      "[data strategis]",
      "[indikator strategis]",
      "penduduk miskin",
      "pembangunan manusia",
      "pengangguran",
      "jumlah penduduk",
      "harapan hidup",
      "lama sekolah",
      "pengeluaran per kapita",
      "pertumbuhan penduduk",
      "kemiskinan",
      "ipm",
      "tpt",
      "ipg",
    ];

    for (const sub of subjects) {
      const subId = sub.sub_id;
      const subName = sub.title || sub.sub_name || "Umum";

      await delay(80);

      const varRes = await fetchWithRetry(
        `${BPS_BASE_URL}/var/domain/${DOMAIN}/subject/${subId}/key/${apiKey}/`
      );

      if (
        !varRes ||
        varRes["data-availability"] !== "available" ||
        !Array.isArray(varRes.data) ||
        !varRes.data[1]
      ) {
        continue;
      }

      const variables: any[] = varRes.data[1];

      for (const v of variables) {
        const title: string = v.title || "";
        const titleLower = title.toLowerCase();

        // 1. FILTER TOPIK STRATEGIS
        const isStrategicTopic =
          title.startsWith("[") ||
          strategicKeywords.some((keyword) => titleLower.includes(keyword)) ||
          v.var_id === 31 ||
          v.var_id === 248;

        if (!isStrategicTopic) continue;

        const varId: number = v.var_id;

        // 2. ATURAN PENTING: CEK RILIS DATA TERAKHIR (TERBARU)
        // Syarat: Update terakhir HARUS di rentang 2023-2025. Jika 2022 atau lebih lampau -> ABAIKAN.
        let latestAvailableYear: number | null = null;
        for (const checkYear of [2025, 2024, 2023]) {
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
            break; // Ketemu tahun rilis terbaru!
          }
        }

        // BILA UPDATE TERAKHIR <= 2022 (TIDAK ADA RILIS DI 2023-2025) -> SKIPPED/ABAIKAN!
        if (!latestAvailableYear || latestAvailableYear < 2023) {
          console.log(`[BPS Sync] SKIPPED: "${title}" (Var ${varId}) -> Rilis terakhir <= 2022`);
          continue;
        }

        console.log(`[BPS Sync] MATCHED & INCLUDED: "${title}" (Var ${varId}) -> Update Terakhir: ${latestAvailableYear}`);

        // Upsert Indikator Strategis ke Supabase
        try {
          await prisma.strategicIndicator.upsert({
            where: { varId },
            update: {
              name: title,
              subject: subName,
              unit: v.unit || "",
              domain: parseInt(DOMAIN, 10),
              isActive: true,
            },
            create: {
              varId,
              name: title,
              subject: subName,
              unit: v.unit || "",
              domain: parseInt(DOMAIN, 10),
              isActive: true,
            },
          });
        } catch (e) {}

        totalIndicators++;

        // 3. KARENA LOLOS (UPDATE TERAKHIR 2023-2025), AMBIL SELURUH SERI HISTORI (2020 s/d 2025)
        for (const year of ALL_HISTORICAL_YEARS) {
          const thId = year - 1900;

          await delay(60);

          const dataRes = await fetchWithRetry(
            `${BPS_BASE_URL}/data/domain/${DOMAIN}/var/${varId}/th/${thId}/key/${apiKey}/`
          );

          if (
            !dataRes ||
            dataRes["data-availability"] !== "available" ||
            !dataRes.datacontent ||
            Object.keys(dataRes.datacontent).length === 0
          ) {
            continue;
          }

          // Parse Datacontent 35 Kabupaten/Kota Jawa Tengah
          const vervarList: any[] = dataRes.vervar || [];
          const datacontent: Record<string, any> = dataRes.datacontent || {};
          const turvarList: any[] = dataRes.turvar || [];
          const turvar_id = turvarList.length > 0 ? turvarList[turvarList.length - 1].val : 0;
          const turtahunList: any[] = dataRes.turtahun || [];
          const turtahun_id = turtahunList.length > 0 ? turtahunList[turtahunList.length - 1].val : 0;

          for (const vervar of vervarList) {
            const regionId = parseInt(vervar.val, 10);
            const regionName = vervar.label;

            if (isNaN(regionId)) continue;

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
              const numericVal = typeof val === "number" ? val : parseFloat(val) || null;

              try {
                await prisma.bpsData.upsert({
                  where: {
                    unique_bps_record: {
                      domain: parseInt(DOMAIN, 10),
                      varId,
                      year,
                      regionId,
                    },
                  },
                  update: {
                    regionName,
                    value: numericVal,
                    fetchedAt: new Date(),
                  },
                  create: {
                    domain: parseInt(DOMAIN, 10),
                    varId,
                    year,
                    regionId,
                    regionName,
                    value: numericVal,
                  },
                });
              } catch (e) {}

              totalDataRows++;
            }
          }
        }
      }
    }

    const message = `Sinkronisasi BPS Jateng Berhasil! Terverifikasi ${totalIndicators} indikator strategis (Rilis Terakhir 2023-2025 + Full Histori 2020-2025) dan ${totalDataRows} baris data tersimpan ke Supabase.`;
    console.log(`[BPS Sync Finished] ${message}`);

    // Invalidate Redis Cache setelah sync sukses
    await deleteCache("map:*");
    await deleteCache("indicators:*");

    if (logId) {
      try {
        await prisma.syncLog.update({
          where: { id: logId },
          data: {
            finishedAt: new Date(),
            status: "success",
            totalRows: totalDataRows,
            message,
          },
        });
      } catch (e) {}
    }

    return {
      success: true,
      message,
      totalIndicators,
      totalDataRows,
    };
  } catch (err: any) {
    const errorMsg = err.message || "Terjadi kesalahan pada scheduler BPS.";
    errors.push(errorMsg);

    if (logId) {
      try {
        await prisma.syncLog.update({
          where: { id: logId },
          data: {
            finishedAt: new Date(),
            status: "failed",
            totalRows: totalDataRows,
            errors: JSON.stringify(errors),
            message: `Sinkronisasi gagal: ${errorMsg}`,
          },
        });
      } catch (e) {}
    }

    return {
      success: false,
      message: errorMsg,
      totalIndicators,
      totalDataRows,
    };
  }
}
