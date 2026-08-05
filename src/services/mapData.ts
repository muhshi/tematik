import type { MapDataResponse } from "@/types/map";

// {*Fungsi Utama: Fetch API internal Next.js untuk menyatukan Peta GeoJSON & Data BPS*}
export async function fetchMapData(year: string = "2020", indicator?: string): Promise<MapDataResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const query = indicator ? `?year=${year}&var=${indicator}` : `?year=${year}`;
  const response = await fetch(`${baseUrl}/api/map-data${query}`, {
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
