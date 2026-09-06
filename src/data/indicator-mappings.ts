export interface IndicatorMappingDef {
  indicatorKey: string;
  label: string;
  unit: string;
  varIdJateng: number | null;
  turvarJateng: string | null;
  varIdDemak: number | null;
  turvarDemak: string | null;
}

export const INDICATOR_MAPPINGS: IndicatorMappingDef[] = [
  {
    indicatorKey: "populasi_total",
    label: "Jumlah Penduduk",
    unit: "jiwa",
    varIdJateng: 860,
    turvarJateng: "Jumlah", // Exact match with BPS turvar label
    varIdDemak: 248,
    turvarDemak: null,      // No turvar needed for this level
  },
  // Future indicators can be added here
];
