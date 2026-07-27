import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import area from "@turf/area";
import type {
  DemakFeatureCollection,
  DemakGeoJsonProperties,
  KecamatanData,
  MapDataResponse,
} from "@/types/map";
import {
  fetchDynamicPopulationData,
  normalizeKecamatanName,
} from "@/services/bpsApi";

export const revalidate = 86400; // Cache for 24 hours
export const dynamic = 'force-dynamic'; // Prevent Next.js from attempting static generation during build

/**
 * Load the local Demak GeoJSON file from assets.
 */
async function loadDemakGeoJson(): Promise<DemakFeatureCollection> {
  const filePath = join(process.cwd(), "src", "assets", "demak.geojson");
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw) as DemakFeatureCollection;
}

/**
 * Join BPS population data with GeoJSON features.
 * Matches kecamatan names using normalized string comparison and adds metrics.
 */
function joinDataWithGeoJson(
  geoJson: DemakFeatureCollection,
  popData: KecamatanData[],
  baseDesaGeoJson?: DemakFeatureCollection
): DemakFeatureCollection {
  const newFeatures = geoJson.features.map((feature) => {
    const districtName = feature.properties.district;
    const normalizedKec = normalizeKecamatanName(districtName);

    // Find matching population data
    const match = popData.find(
      (d) => normalizeKecamatanName(d.kecamatan) === normalizedKec
    );

    const population = match ? match.jumlahPenduduk : null;
    
    // Calculate Area (in square kilometers)
    const areaSqMeters = area(feature);
    const luasWilayah = areaSqMeters / 1_000_000;
    
    // Calculate Density (people per sq km)
    const kepadatan = population ? (population / luasWilayah) : null;
    
    // Calculate Jumlah Desa (if baseDesaGeoJson is provided, meaning we are processing Kecamatan map)
    let jumlahDesa = undefined;
    if (baseDesaGeoJson) {
      jumlahDesa = baseDesaGeoJson.features.filter(
        (f) => normalizeKecamatanName(f.properties.district) === normalizedKec
      ).length;
    }

    return {
      ...feature,
      properties: {
        ...feature.properties,
        jumlahPenduduk: population,
        luasWilayah,
        kepadatan,
        jumlahDesa,
      } as DemakGeoJsonProperties,
    };
  });

  return {
    ...geoJson,
    features: newFeatures,
  };
}

/**
 * GET /api/map-data
 * Returns enriched GeoJSON with population data from BPS.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedYear = searchParams.get("year") || "2024";

    // 1. Load GeoJSON files
    const geojsonDesa = await loadDemakGeoJson();
    
    // Load kecamatan geojson
    const kecPath = join(process.cwd(), "src", "assets", "demak_kecamatan.geojson");
    const rawKec = await readFile(kecPath, "utf-8");
    const geojsonKec = JSON.parse(rawKec) as DemakFeatureCollection;

    let populationData: KecamatanData[] = [];
    let isCached = false;
    let source = "BPS Kabupaten Demak";
    let year = requestedYear;

    try {
      // 2. Fetch dynamic population data from BPS for the requested year
      populationData = await fetchDynamicPopulationData(requestedYear);
    } catch (bpsError) {
      // BPS API is down or API key invalid -- use fallback (mock data)
      console.error("[map-data] BPS API error, using mock data for testing:", bpsError);
      source = "Mock Data (No API Key)";
      isCached = true;
      
      // Inject mock data so the choropleth colors can be tested
      // In a real scenario, this would be empty if the year doesn't exist, but for UI testing we always return something
      populationData = [
        { kecamatan: "Mranggen", jumlahPenduduk: 175000 },
        { kecamatan: "Karangawen", jumlahPenduduk: 95000 },
        { kecamatan: "Guntur", jumlahPenduduk: 88000 },
        { kecamatan: "Sayung", jumlahPenduduk: 105000 },
        { kecamatan: "Karangtengah", jumlahPenduduk: 68000 },
        { kecamatan: "Wonosalam", jumlahPenduduk: 85000 },
        { kecamatan: "Dempet", jumlahPenduduk: 59000 },
        { kecamatan: "Gajah", jumlahPenduduk: 52000 },
        { kecamatan: "Karanganyar", jumlahPenduduk: 77000 },
        { kecamatan: "Mijen", jumlahPenduduk: 58000 },
        { kecamatan: "Demak", jumlahPenduduk: 112000 },
        { kecamatan: "Bonang", jumlahPenduduk: 106000 },
        { kecamatan: "Wedung", jumlahPenduduk: 82000 },
        { kecamatan: "Kebonagung", jumlahPenduduk: 42000 },
      ];
    }

    // 5. Join data with GeoJSON
    const enrichedGeoJsonKecamatan = joinDataWithGeoJson(geojsonKec, populationData, geojsonDesa);
    const enrichedGeoJsonDesa = joinDataWithGeoJson(geojsonDesa, populationData);

    const response: MapDataResponse = {
      geojsonKecamatan: enrichedGeoJsonKecamatan,
      geojsonDesa: enrichedGeoJsonDesa,
      metadata: {
        source,
        year,
        lastUpdated: new Date().toISOString(),
        isCached,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[map-data] Fatal error:", error);
    return NextResponse.json(
      { error: "Failed to load map data" },
      { status: 500 }
    );
  }
}
