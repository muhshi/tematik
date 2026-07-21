import type { MapDataResponse } from "@/types/map";

/**
 * Fetch merged GeoJSON data (spatial + population) from the internal API route.
 * This is the single entry point for frontend components to get map data.
 */
export async function fetchMapData(): Promise<MapDataResponse> {
  const response = await fetch("/api/map-data", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch map data: ${response.status}`);
  }

  const data: MapDataResponse = await response.json();
  return data;
}
