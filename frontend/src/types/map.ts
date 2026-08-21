import type { FeatureCollection, Feature, Polygon, MultiPolygon } from "geojson";

// -- BPS API Response Types --

/** Single item from BPS static table list endpoint */
export interface BpsStaticTableListItem {
  table_id: number;
  title: string;
  subj_id: number;
  subj: string;
  updt_date: string;
  size: string;
}

/** Paginated wrapper from BPS list endpoint */
export interface BpsListResponse {
  status: string;
  "data-availability": string;
  data: [
    { page: number; pages: number; count: number; total: number },
    BpsStaticTableListItem[],
  ];
}

/** Response from BPS view endpoint for statictable */
export interface BpsStaticTableView {
  status: string;
  "data-availability": string;
  data: {
    table_id: number;
    title: string;
    subj_id: number;
    def: string;
    notes: string;
    table: string; // Raw HTML string -- must be parsed with Cheerio
    excel: string;
    updt_date: string;
    size: string;
  };
}

// -- Parsed Data Types --

export interface KecamatanData {
  kecamatan: string;
  value: number;
}

// -- GeoJSON Property Types --

/** Properties embedded in each GeoJSON feature (before data join) */
export interface DemakGeoJsonBaseProperties {
  district: string;
  district_code?: string;
  village?: string;
  village_code?: string;
}

/** Properties after joining with BPS population data */
export interface DemakGeoJsonProperties extends DemakGeoJsonBaseProperties {
  value: number | null;
  luasWilayah?: number | null;
  kepadatan?: number | null;
  jumlahDesa?: number;
}

/** A single feature in the Demak GeoJSON */
export type DemakFeature = Feature<
  Polygon | MultiPolygon,
  DemakGeoJsonProperties
>;

/** The complete Demak GeoJSON FeatureCollection */
export type DemakFeatureCollection = FeatureCollection<
  Polygon | MultiPolygon,
  DemakGeoJsonProperties
>;

// -- UI State Types --

export type Granularity = "Provinsi" | "Kabupaten" | "Kecamatan";

export interface RegionDetail {
  kecamatan: string;
  village?: string;
  value: number | null;
  luasWilayah: number | null;
  kepadatan: number | null;
  jumlahDesa?: number;
}

/** API response wrapper from /api/map-data */
export interface MapDataResponse {
  geojsonKabupaten?: DemakFeatureCollection;
  geojsonKecamatan: DemakFeatureCollection;
  geojsonDesa?: DemakFeatureCollection;
  metadata: {
    source: string;
    year: string;
    lastUpdated: string;
    isCached: boolean;
  };
}
