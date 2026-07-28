import type { MapDataResponse } from "@/types/map";

/**
 * Fetch merged GeoJSON data (spatial + population) from the internal API route.
 * This is the single entry point for frontend components to get map data.
 */
export async function fetchMapData(year: string = "2020"): Promise<MapDataResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const response = await fetch(`${baseUrl}/api/map-data?year=${year}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store", // Mencegah browser nge-cache GET request ini
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch map data: ${response.status}`);
  }

  const data: MapDataResponse = await response.json();
  return data;
}
