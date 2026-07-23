import type { KecamatanData } from "@/types/map";

const BPS_BASE_URL = "https://webapi.bps.go.id/v1";

export function getApiKey(): string {
  const key = process.env.BPS_API_KEY;
  if (!key || key === "your_bps_api_key_here") {
    throw new Error("BPS_API_KEY is not configured in .env.local");
  }
  return key;
}

export function normalizeKecamatanName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "").trim();
}

export async function fetchDynamicPopulationData(yearStr: string = "2024"): Promise<KecamatanData[]> {
  const apiKey = getApiKey();
  
  // Mapping Year to BPS 'th' parameter
  // BPS uses th_id = year - 1900. (e.g., 2024 -> 124, 2020 -> 120)
  const year = parseInt(yearStr, 10) || 2024;
  const th_id = year - 1900;
  
  // BPS changed the variable ID after the 2020 census:
  // 2011-2020 uses var 31 (Jumlah Penduduk) with turvar 25 (Laki-laki+Perempuan)
  // 2021-2024 uses var 248 (Proyeksi Hasil LFSP2020) with turvar 0 (Tidak ada)
  const isPost2020 = year > 2020;
  const var_id = isPost2020 ? 248 : 31;
  const turvar_id = isPost2020 ? 0 : 25;
  
  const url = `${BPS_BASE_URL}/api/list/model/data/domain/3321/var/${var_id}/th/${th_id}/key/${apiKey}/`;

  const response = await fetch(url, { next: { revalidate: 86400 } });

  if (!response.ok) {
    throw new Error(`BPS API request failed: ${response.status}`);
  }

  const result = await response.json();

  if (result.status === "Error" || result["data-availability"] === "not-available") {
    throw new Error("Data not available from BPS API for this year");
  }

  // Parse the dynamic data format
  const vervarList = result.vervar || []; // List of kecamatans
  const datacontent = result.datacontent || {};
  
  const results: KecamatanData[] = [];
  
  for (const vervar of vervarList) {
    const kecamatanId = vervar.val;
    const kecamatanName = vervar.label;
    
    if (kecamatanName.toLowerCase().includes("kab. demak")) continue;
    
    // Construct the data key based on BPS rule: vervar + var + turvar + th + turtahun
    // e.g. vervarId + 248 + 0 + th_id + 0
    const dataKey = `${kecamatanId}${var_id}${turvar_id}${th_id}0`;
    
    const population = datacontent[dataKey];
    
    if (population !== undefined) {
      results.push({
        kecamatan: kecamatanName,
        jumlahPenduduk: population
      });
    }
  }

  return results;
}
