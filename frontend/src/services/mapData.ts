import type { MapDataResponse } from "@/types/map";

// {*Fungsi Utama: Fetch API internal Next.js untuk menyatukan Peta GeoJSON & Data BPS*}
export async function fetchMapData(year: string = "2024", indicator?: string, kabupaten?: string): Promise<MapDataResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  
  // Jika sedang mode Drilldown (ada kabupaten), panggil endpoint kecamatan
  const endpoint = kabupaten ? `/api/map-data/kecamatan` : `/api/map-data`;
  
  const params = new URLSearchParams();
  params.append("year", year);
  if (indicator) params.append("var", indicator);
  if (kabupaten) params.append("kabupaten", kabupaten);

  const response = await fetch(`${baseUrl}${endpoint}?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store", // {*Mencegah caching agar data selalu baru*}
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch map data: ${response.status}`);
  }

  const data: MapDataResponse = await response.json();
  return data;
}
