export type ThemeId = "blue" | "orange" | "green";

export interface ThemeOption {
  id: ThemeId;
  name: string;
  hex: string;
  tagline: string;
  description: string;
  colors: {
    sidebarBg: string;
    sidebarClass: string;
    primary: string;
    primaryHover: string;
    mapLight: string;
    mapDark: string;
    bgBase: string;
  };
}

export const BPS_THEMES: ThemeOption[] = [
  {
    id: "blue",
    name: "Tema Biru BPS",
    hex: "#3db7e4",
    tagline: "Identitas Biru Resmi BPS",
    description: "Warna Biru Khas BPS (#3db7e4), melambangkan akurasi, integrasi data, dan keterpercayaan institusional.",
    colors: {
      sidebarBg: "#0A192F",
      sidebarClass: "bg-[#0A192F]",
      primary: "#3db7e4",
      primaryHover: "#28a2cf",
      mapLight: "#d4f3fd",
      mapDark: "#3db7e4",
      bgBase: "bg-sky-50",
    },
  },
  {
    id: "orange",
    name: "Tema Oranye BPS",
    hex: "#ff8849",
    tagline: "Identitas Oranye Inovasi BPS",
    description: "Warna Oranye Khas BPS (#ff8849), melambangkan semangat inovasi, ketangkasan, dan pelayanan data modern.",
    colors: {
      sidebarBg: "#2b180d",
      sidebarClass: "bg-[#2b180d]",
      primary: "#ff8849",
      primaryHover: "#f5742f",
      mapLight: "#ffeade",
      mapDark: "#ff8849",
      bgBase: "bg-orange-50",
    },
  },
  {
    id: "green",
    name: "Tema Hijau BPS",
    hex: "#69be28",
    tagline: "Identitas Hijau Agraria BPS",
    description: "Warna Hijau Khas BPS (#69be28), melambangkan pertumbuhan berkelanjutan, sensus agraria, dan kesegaran visual.",
    colors: {
      sidebarBg: "#0d2610",
      sidebarClass: "bg-[#0d2610]",
      primary: "#69be28",
      primaryHover: "#55a31c",
      mapLight: "#e4f9d2",
      mapDark: "#69be28",
      bgBase: "bg-emerald-50",
    },
  },
];

export const DEFAULT_THEME: ThemeId = "blue";
