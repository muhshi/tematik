import type { KecamatanData } from "@/types/map";
import { db, BpsDataPoint } from "@/lib/db";

const BPS_BASE_URL = "https://webapi.bps.go.id/v1";
const DOMAIN = "3300"; // Central Java Domain Code (All 35 Regencies/Cities)
const DOMAIN_DEMAK = "3321"; // BPS Kabupaten Demak Domain Code
const DEFAULT_API_KEY = "ac9780c3023e0762d5eb07f1c2f00dc6";

// {*Fungsi: Mengambil API Key BPS dari file .env.local atau default*}
export function getApiKey(): string {
  const key = process.env.BPS_API_KEY || DEFAULT_API_KEY;
  return key;
}

// {*Fungsi: Membersihkan dan menyamakan format nama wilayah/kabupaten/kecamatan*}
export function normalizeRegionName(name: string): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/^\d+\s*/, "") // Hapus kode angka di awal (misal: "3301 ")
    .replace(/^(kabupaten|kab\.?|kota|kecamatan|kec\.?)\s+/i, "") // Hapus prefix admin
    .replace(/\s+/g, "") // Hapus seluruh spasi
    .trim();
}

export function normalizeKecamatanName(name: string): string {
  return normalizeRegionName(name);
}

function selectOptimalTurvar(varId: number, turvarList: Array<{ val: number | string; label: string }>): number | string {
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

  // 3. Cari turvar yang memiliki kata persen
  const pct = turvarList.find((t) => t.label && (t.label.toLowerCase().includes("persen") || t.label.toLowerCase().includes("persentase")));
  if (pct) return pct.val;

  return turvarList[0].val;
}

export interface BpsFetchResult {
  data: KecamatanData[];
  source: string;
  isCached: boolean;
}

// Tabel Pemetaan Indikator Strategis Lintas Domain (Demak 3321 <-> Jawa Tengah 3300)
export const STRATEGIC_INDICATOR_PAIRS = [
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

export function resolveJatengVarId(targetVarId?: number | string): number {
  if (!targetVarId) return 63;
  const numId = parseInt(targetVarId.toString().replace(/\D/g, ""), 10);
  if (isNaN(numId)) return 63;

  const pair = STRATEGIC_INDICATOR_PAIRS.find((p) => p.demakVarId === numId || p.jatengVarId === numId);
  if (pair) return pair.jatengVarId;
  return numId;
}

export function resolveDemakVarId(targetVarId?: number | string): number {
  if (!targetVarId) return 248;
  const numId = parseInt(targetVarId.toString().replace(/\D/g, ""), 10);
  if (isNaN(numId)) return 248;

  const pair = STRATEGIC_INDICATOR_PAIRS.find((p) => p.demakVarId === numId || p.jatengVarId === numId);
  if (pair) return pair.demakVarId;
  return numId;
}

// {*Fungsi: Menarik data dinamis dari server BPS Jawa Tengah (Domain 3300) untuk seluruh Kab/Kota*}
export async function fetchDynamicBpsData(
  yearStr: string = "2024",
  targetVarId?: number | string
): Promise<BpsFetchResult> {
  const resolvedYearStr = yearStr === "ALL" ? "2024" : yearStr;
  const year = parseInt(resolvedYearStr, 10) || 2024;
  const th_id = year - 1900;
  const var_id = resolveJatengVarId(targetVarId);

  // 1. Try Live BPS API (Domain 3300 - Jawa Tengah 35 Kab/Kota)
  try {
    const apiKey = getApiKey();
    const url = `${BPS_BASE_URL}/api/list/model/data/domain/${DOMAIN}/var/${var_id}/th/${th_id}/key/${apiKey}/`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(4000),
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 },
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

        const results: KecamatanData[] = [];
        const dbPoints: BpsDataPoint[] = [];
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
          // Save to local database for fallback
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
    console.warn("[bpsApi] Live BPS API query failed, checking DB fallback:", bpsError);
  }

  // 2. Check DB Fallback Store (Supabase / Local JSON)
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

// {*Fungsi: Menarik [Data Strategis] BPS Kabupaten Demak (Domain 3321) untuk tingkat Kecamatan*}
export async function fetchDemakStrategicData(
  yearStr: string = "2024",
  targetVarId?: number | string
): Promise<KecamatanData[]> {
  const resolvedYearStr = yearStr === "ALL" ? "2024" : yearStr;
  const year = parseInt(resolvedYearStr, 10) || 2024;
  const th_id = year - 1900;
  const var_id = resolveDemakVarId(targetVarId);

  try {
    const apiKey = getApiKey();
    const url = `${BPS_BASE_URL}/api/list/model/data/domain/${DOMAIN_DEMAK}/var/${var_id}/th/${th_id}/key/${apiKey}/`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(4000),
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 },
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

        const results: KecamatanData[] = [];
        const dbPoints: BpsDataPoint[] = [];
        const now = new Date().toISOString();

        for (const vervar of vervarList) {
          const kecamatanId = vervar.val;
          const kecamatanName = vervar.label;
          if (
            vervarList.length > 1 &&
            (kecamatanName.toLowerCase().includes("kab. demak") ||
            kecamatanName.toLowerCase().includes("kabupaten demak"))
          ) {
            continue;
          }

          const dataKey = `${kecamatanId}${var_id}${turvar_id}${th_id}${turtahun_id}`;
          let value = datacontent[dataKey];
          if (value !== undefined && value !== null && value !== "-" && value !== "...") {
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
          return results;
        }
      }
    }
  } catch (err) {
    console.warn("[bpsApi] Demak strategic data fetch notice:", err);
  }

  // 2. Check DB Fallback Store
  const storedPoints = await db.getBpsDataPoints(var_id, year);
  if (storedPoints && storedPoints.length > 0) {
    return storedPoints.map((p) => ({ kecamatan: p.kecamatan, value: p.value }));
  }

  // 3. Fallback default Demak strategic kecamatan population data
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

// {*Fungsi: Mengambil daftar tahun survei yang tersedia untuk suatu variabel*}
export async function getAvailableYearsForVar(varIdStr: string): Promise<Array<{ th_id: number; year: string }>> {
  if (!varIdStr) return [];
  const varId = parseInt(varIdStr.replace(/\D/g, ""), 10);
  if (isNaN(varId)) return [];

  const apiKey = getApiKey();
  const jatengVarId = resolveJatengVarId(varId);
  const demakVarId = resolveDemakVarId(varId);

  const checks = [
    { dom: DOMAIN_DEMAK, vId: demakVarId },
    { dom: DOMAIN, vId: jatengVarId },
    { dom: DOMAIN_DEMAK, vId: varId },
    { dom: DOMAIN, vId: varId },
  ];

  for (const { dom, vId } of checks) {
    try {
      const url = `${BPS_BASE_URL}/api/list/model/th/var/${vId}/domain/${dom}/key/${apiKey}/`;

      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        next: { revalidate: 3600 },
      });

      if (response.ok) {
        const result = await response.json();
        if (result["data-availability"] === "available" && Array.isArray(result.data) && result.data.length > 1) {
          const rawYears = result.data[1] as Array<{ th_id: number; th: string }>;
          const hasRecentYear = rawYears.some((y) => parseInt(y.th, 10) >= 2021);
          if (hasRecentYear) {
            return rawYears
              .map((y) => ({ th_id: y.th_id, year: y.th }))
              .sort((a, b) => parseInt(b.year, 10) - parseInt(a.year, 10));
          }
        }
      }
    } catch (error) {
      console.warn(`[bpsApi] Failed to load available years from domain ${dom}:`, error);
    }
  }

  // Fallback default full historical years
  const fallbackYears = ["2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018"];
  return fallbackYears.map((y) => ({
    th_id: parseInt(y, 10) - 1900,
    year: y,
  }));
}
