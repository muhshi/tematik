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
  demographics?: {
    gender: { L: number; P: number };
    age: Record<string, number>;
  };
}

// -- GeoJSON Property Types --

/** Properties embedded in each GeoJSON feature (before data join) */
export interface DemakGeoJsonBaseProperties {
  district: string;
  district_code?: string;
  regency?: string;
  village?: string;
  village_code?: string;
}

/** Properties after joining with BPS population data */
export interface DemakGeoJsonProperties extends DemakGeoJsonBaseProperties {
  value: number | null;
  luasWilayah?: number | null;
  kepadatan?: number | null;
  jumlahDesa?: number;
  demographics?: {
    gender?: { L: number; P: number };
    age?: Record<string, number>;
    ipm?: {
      usia_harapan_hidup: number;
      harapan_lama_sekolah: number;
      rata_rata_lama_sekolah: number;
      pengeluaran_per_kapita: number;
    };
    kemiskinan?: {
      jumlah_penduduk_miskin_ribu_jiwa: number;
      persentase_penduduk_miskin: number;
      garis_kemiskinan_rp: number;
    };
  };
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
  regency?: string;
  type?: string;
  year?: string;
  village?: string;
  value: number | null;
  luasWilayah: number | null;
  kepadatan: number | null;
  jumlahDesa?: number;
  demographics?: {
    gender?: { L: number; P: number };
    age?: Record<string, number>;
    ipm?: {
      usia_harapan_hidup: number;
      harapan_lama_sekolah: number;
      rata_rata_lama_sekolah: number;
      pengeluaran_per_kapita: number;
    };
    kemiskinan?: {
      jumlah_penduduk_miskin_ribu_jiwa: number;
      persentase_penduduk_miskin: number;
      garis_kemiskinan_rp: number;
    };
  };
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
    indicatorId?: string;
    kabupaten?: string | null;
  };
}
