import type { KecamatanData } from "@/types/map";

const BPS_BASE_URL = "https://webapi.bps.go.id/v1";

// {*Fungsi: Mengambil API Key BPS dari file .env.local*}
export function getApiKey(): string {
  const key = process.env.BPS_API_KEY;
  if (!key || key === "your_bps_api_key_here") {
    throw new Error("BPS_API_KEY is not configured in .env.local");
  }
  return key;
}

// {*Fungsi: Membersihkan dan menyamakan format nama kecamatan (huruf kecil, tanpa spasi)*}
export function normalizeKecamatanName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "").trim();
}

// {*Fungsi: Menarik data dinamis dari server BPS berdasarkan Tahun dan ID Indikator*}
export async function fetchDynamicBpsData(yearStr: string = "2024", targetVarId?: number): Promise<KecamatanData[]> {
  const apiKey = getApiKey();
  
  // {*Konversi Tahun ke ID BPS (1900 = 0)*}
  const year = parseInt(yearStr, 10) || 2024;
  const th_id = year - 1900;
  
  let var_id = targetVarId;
  
  // {*Fallback Indikator Default jika kosong*}
  if (!var_id) {
    const isPost2020 = year > 2020;
    var_id = isPost2020 ? 248 : 31;
  }
  
  // {*Fetching API BPS Backend*}
  const url = `${BPS_BASE_URL}/api/list/model/data/domain/3321/var/${var_id}/th/${th_id}/key/${apiKey}/`;

  const response = await fetch(url, {
    signal: AbortSignal.timeout(3000), // Max 3s timeout
    next: { revalidate: 86400 },
  });

  if (!response.ok) {
    throw new Error(`BPS API request failed: ${response.status}`);
  }

  const result = await response.json();

  if (result.status === "Error" || result["data-availability"] === "not-available") {
    throw new Error("Data not available from BPS API for this year");
  }

  // {*Parsing Data Mentah BPS*}
  const vervarList = result.vervar || []; 
  const datacontent = result.datacontent || {};
  
  // {*Mencari Variabel Turunan (Total) Terbaik*}
  const turvarList = result.turvar || [];
  const turvar_id = turvarList.length > 0 ? turvarList[turvarList.length - 1].val : 0;
  
  const turtahunList = result.turtahun || [];
  const turtahun_id = turtahunList.length > 0 ? turtahunList[turtahunList.length - 1].val : 0;
  
  const results: KecamatanData[] = [];
  
  for (const vervar of vervarList) {
    const kecamatanId = vervar.val;
    const kecamatanName = vervar.label;
    
    if (kecamatanName.toLowerCase().includes("kab. demak")) continue;
    
    // {*Menyusun Kunci Unik Data BPS*}
    const dataKey = `${kecamatanId}${var_id}${turvar_id}${th_id}${turtahun_id}`;
    
    let value = datacontent[dataKey];
    
    // {*Mencoba Kunci Cadangan jika Kunci Utama Kosong*}
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
      results.push({
        kecamatan: kecamatanName,
        value: typeof value === "number" ? value : parseFloat(value) || 0
      });
    }
  }

  return results;
}
