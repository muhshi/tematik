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
  fetchDynamicBpsData,
  normalizeKecamatanName,
} from "@/services/bpsApi";

export const dynamic = 'force-dynamic'; // Prevent Next.js from attempting static generation during build

// {*Fungsi: Membaca file GeoJSON Demak lokal (file aset polygon wilayah)*}
async function loadDemakGeoJson(): Promise<DemakFeatureCollection> {
  const filePath = join(process.cwd(), "src", "assets", "demak.geojson");
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw) as DemakFeatureCollection;
}

// {*Fungsi Utama: Menggabungkan data spasial GeoJSON dengan angka statistik dari BPS berdasarkan nama Kecamatan*}
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

    const value = match ? match.value : null;
    
    // Calculate Area (in square kilometers)
    const areaSqMeters = area(feature);
    const luasWilayah = areaSqMeters / 1_000_000;
    
    // Calculate Density (people per sq km)
    const kepadatan = value ? (value / luasWilayah) : null;
    
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
        value,
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

// {*Fungsi Utama: Endpoint API Next.js yang mengembalikan GeoJSON utuh lengkap dengan nilai statistik dari BPS*}
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedYear = searchParams.get("year") || "2024";
    const varIdStr = searchParams.get("var");
    
    // Ekstrak ID dari string 'var-31' menjadi number 31
    const targetVarId = varIdStr ? parseInt(varIdStr.replace(/\D/g, ''), 10) : undefined;

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
      populationData = await fetchDynamicBpsData(requestedYear, targetVarId);
    } catch (bpsError) {
      // BPS API is down or API key invalid -- use fallback (mock data)
      console.error("[map-data] BPS API error, using mock data for testing:", bpsError);
      source = "Mock Data (No API Key)";
      isCached = true;
      
      // Inject mock data so the choropleth colors can be tested
      // In a real scenario, this would be empty if the year doesn't exist, but for UI testing we always return something
      populationData = [
        { kecamatan: "Mranggen", value: 175000 },
        { kecamatan: "Karangawen", value: 95000 },
        { kecamatan: "Guntur", value: 88000 },
        { kecamatan: "Sayung", value: 105000 },
        { kecamatan: "Karangtengah", value: 68000 },
        { kecamatan: "Wonosalam", value: 85000 },
        { kecamatan: "Dempet", value: 59000 },
        { kecamatan: "Gajah", value: 52000 },
        { kecamatan: "Karanganyar", value: 77000 },
        { kecamatan: "Mijen", value: 58000 },
        { kecamatan: "Demak", value: 112000 },
        { kecamatan: "Bonang", value: 106000 },
        { kecamatan: "Wedung", value: 82000 },
        { kecamatan: "Kebonagung", value: 42000 },
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
