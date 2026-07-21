import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import type {
  DemakFeatureCollection,
  DemakGeoJsonProperties,
  KecamatanData,
  MapDataResponse,
} from "@/types/map";
import {
  fetchStaticTableList,
  fetchStaticTableView,
  parsePopulationTable,
  normalizeKecamatanName,
} from "@/services/bpsApi";

export const revalidate = 86400; // Cache for 24 hours

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
 * Matches kecamatan names using normalized string comparison.
 */
function joinDataWithGeoJson(
  geojson: DemakFeatureCollection,
  populationData: KecamatanData[]
): DemakFeatureCollection {
  // Build a lookup map with normalized kecamatan names
  const dataMap = new Map<string, number>();
  for (const item of populationData) {
    const normalized = normalizeKecamatanName(item.kecamatan);
    dataMap.set(normalized, item.jumlahPenduduk);
  }

  // Inject population data into GeoJSON properties
  const enrichedFeatures = geojson.features.map((feature) => {
    const kecName = feature.properties.district;
    const normalizedName = normalizeKecamatanName(kecName);
    const population = dataMap.get(normalizedName) ?? null;

    return {
      ...feature,
      properties: {
        ...feature.properties,
        jumlahPenduduk: population,
      } as DemakGeoJsonProperties,
    };
  });

  return {
    ...geojson,
    features: enrichedFeatures,
  };
}

/**
 * GET /api/map-data
 * Returns enriched GeoJSON with population data from BPS.
 */
export async function GET() {
  try {
    // 1. Load GeoJSON files
    const geojsonDesa = await loadDemakGeoJson();
    
    // Load kecamatan geojson
    const kecPath = join(process.cwd(), "src", "assets", "demak_kecamatan.geojson");
    const rawKec = await readFile(kecPath, "utf-8");
    const geojsonKec = JSON.parse(rawKec) as DemakFeatureCollection;

    let populationData: KecamatanData[] = [];
    let isCached = false;
    let source = "BPS Kabupaten Demak";
    let year = new Date().getFullYear().toString();

    try {
      // 2. Fetch BPS table list to find population table ID
      const tables = await fetchStaticTableList();

      if (tables.length > 0) {
        // Use the first matching table
        const targetTable = tables[0];

        // 3. Fetch the table view (raw HTML)
        const tableView = await fetchStaticTableView(targetTable.table_id);

        if (tableView?.table) {
          // 4. Parse HTML to extract population data
          populationData = parsePopulationTable(tableView.table);

          // Extract year from title if available
          const yearMatch = tableView.title.match(/(\d{4})/);
          if (yearMatch) {
            year = yearMatch[1];
          }
        }
      }
    } catch (bpsError) {
      // BPS API is down or API key invalid -- use fallback (null data)
      console.error("[map-data] BPS API error, serving GeoJSON without population data:", bpsError);
      source = "Fallback (BPS Unavailable)";
      isCached = true;
    }

    // 5. Join data with GeoJSON
    const enrichedGeoJsonKecamatan = joinDataWithGeoJson(geojsonKec, populationData);
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
