import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import area from "@turf/area";
import { getCache, setCache } from "@/lib/redis";
import type {
  DemakFeatureCollection,
  DemakGeoJsonProperties,
  DemakFeature,
  KecamatanData,
  MapDataResponse,
} from "@/types/map";
import {
  fetchDynamicBpsData,
  fetchDemakStrategicData,
  normalizeRegionName,
} from "@/services/bpsApi";

export const dynamic = "force-dynamic";

let cachedGeojsonJateng: DemakFeatureCollection | null = null;
let cachedGeojsonKec: DemakFeatureCollection | null = null;

async function loadJawaTengahGeoJson(): Promise<DemakFeatureCollection> {
  if (cachedGeojsonJateng) return cachedGeojsonJateng;
  const filePath = join(process.cwd(), "src", "assets", "jawa_tengah_kabupaten.geojson");
  try {
    const raw = await readFile(filePath, "utf-8");
    cachedGeojsonJateng = JSON.parse(raw) as DemakFeatureCollection;
    return cachedGeojsonJateng;
  } catch {
    return loadDemakKecGeoJson();
  }
}

async function loadDemakKecGeoJson(): Promise<DemakFeatureCollection> {
  if (cachedGeojsonKec) return cachedGeojsonKec;
  const filePath = join(process.cwd(), "src", "assets", "demak_kecamatan.geojson");
  const raw = await readFile(filePath, "utf-8");
  cachedGeojsonKec = JSON.parse(raw) as DemakFeatureCollection;
  return cachedGeojsonKec;
}

function matchDistrict(feature: DemakFeature, dataList: KecamatanData[]): KecamatanData | undefined {
  if (!dataList || dataList.length === 0) return undefined;
  const code = (feature.properties as any)?.code;
  const districtName = feature.properties.district;
  const isKota = (feature.properties as any)?.type === "Kota" || districtName.toLowerCase().startsWith("kota");

  // 1. Match by 4-digit code if available (e.g. "3301")
  if (code) {
    const codeMatch = dataList.find((d) => {
      const dCode = (d.kecamatan.match(/^\d{4}/) || [])[0];
      return dCode === code;
    });
    if (codeMatch) return codeMatch;
  }

  // 2. Match by normalized name
  const normDistrict = normalizeRegionName(districtName);
  const nameMatch = dataList.find((d) => {
    const dIsKota = d.kecamatan.toLowerCase().includes("kota");
    if (code && isKota !== dIsKota) return false;
    return normalizeRegionName(d.kecamatan) === normDistrict;
  });
  if (nameMatch) return nameMatch;

  // 3. Jika hanya ada 1 data tunggal agregat (contoh: angka kemiskinan/IPM/TPT Demak), gunakan untuk kecamatan Demak
  if (dataList.length === 1) {
    return dataList[0];
  }

  return undefined;
}

function joinDataWithGeoJson(
  geoJson: DemakFeatureCollection,
  popData: KecamatanData[],
  isKabupatenLevel: boolean = false,
  demakDetailData: KecamatanData[] = []
): DemakFeatureCollection {
  const newFeatures = geoJson.features.map((feature) => {
    const match = matchDistrict(feature as DemakFeature, popData);
    let value = match && match.value !== null && !isNaN(match.value) ? match.value : null;

    const districtName = feature.properties?.district || "";
    const isDemak = normalizeRegionName(districtName) === "demak";

    // Khusus Peta Level Kab/Kota (Jateng): Jika nilai Demak belum terisi atau perlu penjumlahan kecamatan
    if (isKabupatenLevel && isDemak && (value === null || isNaN(value)) && demakDetailData && demakDetailData.length > 0) {
      const numValues = demakDetailData.map((d) => d.value).filter((v) => typeof v === "number" && !isNaN(v));
      if (numValues.length > 1) {
        // Penjumlahan total dari seluruh kecamatan (contoh: Jumlah Penduduk Demak = jumlah 14 kecamatan)
        value = numValues.reduce((a, b) => a + b, 0);
      } else if (numValues.length === 1) {
        value = numValues[0];
      }
    }

    const areaSqMeters = area(feature);
    const luasWilayah = areaSqMeters / 1_000_000;
    const kepadatan = value && luasWilayah > 0 ? value / luasWilayah : null;

    return {
      ...feature,
      properties: {
        ...feature.properties,
        value,
        luasWilayah,
        kepadatan,
      } as DemakGeoJsonProperties,
    };
  });

  return {
    ...geoJson,
    features: newFeatures,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedYear = searchParams.get("year") || "2024";
  const varIdStr = searchParams.get("var") || "";

  // 1. Try fetching from Backend API server if available
  const backendUrl = process.env.BACKEND_API_URL || "http://localhost:5000/api";
  try {
    const res = await fetch(`${backendUrl}/map-data?year=${requestedYear}&var=${varIdStr}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(1500),
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    // Backend server offline, fall through to local processing
  }

  // 2. Local Processing
  try {
    const targetVarId = varIdStr ? parseInt(varIdStr.replace(/\D/g, ""), 10) : 132;
    const cacheKey = `map:${targetVarId}:${requestedYear}`;

    const cachedResponse = await getCache<any>(cacheKey);
    if (cachedResponse) {
      return NextResponse.json(cachedResponse);
    }

    const geojsonKec = await loadDemakKecGeoJson();
    const geojsonJateng = await loadJawaTengahGeoJson();

    // Fetch dynamic Jateng data for all 35 Kab/Kota
    const { data: populationData, source, isCached } = await fetchDynamicBpsData(
      requestedYear,
      targetVarId
    );

    // Fetch [Data Strategis] for Kabupaten Demak kecamatan
    const demakStrategicData = await fetchDemakStrategicData(requestedYear, targetVarId);

    // Level Kab/Kota: 35 Kab/Kota di Jawa Tengah dengan Demak teragregasi
    const enrichedGeoJsonKabupaten = joinDataWithGeoJson(geojsonJateng, populationData, true, demakStrategicData);
    // Level Kecamatan: 14 Kecamatan di Kabupaten Demak dengan data per kecamatan
    const enrichedGeoJsonKecamatan = joinDataWithGeoJson(geojsonKec, demakStrategicData, false);

    const response: MapDataResponse = {
      geojsonKabupaten: enrichedGeoJsonKabupaten,
      geojsonKecamatan: enrichedGeoJsonKecamatan,
      metadata: {
        source,
        year: requestedYear,
        lastUpdated: new Date().toISOString(),
        isCached,
      },
    };

    await setCache(cacheKey, response, 86400);
    return NextResponse.json(response);
  } catch (error) {
    console.error("[map-data] Fatal error:", error);
    return NextResponse.json(
      { error: "Failed to load map data" },
      { status: 500 }
    );
  }
}
