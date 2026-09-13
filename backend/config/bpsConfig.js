require("dotenv").config();

const BPS_CONFIG = {
  BASE_URL: "https://webapi.bps.go.id/v1/api",
  DOMAIN: "3300", // Central Java Domain Code (All 35 Regencies/Cities)
  DOMAIN_JATENG: "3300", // Alias for Central Java Domain
  DOMAIN_DEMAK: "3321", // BPS Kabupaten Demak Domain Code
  API_KEY: process.env.BPS_API_KEY || "",
  CACHE_REVALIDATE_SECONDS: 86400, // 24 hours
  CACHE_TTL_MS: 86400 * 1000, // 24 hours in ms
  SIMILARITY_THRESHOLD: 0.55, // Threshold for fuzzy semantic matching
  REQUEST_TIMEOUT_MS: 10000, // 10s request timeout
  PORT: process.env.PORT || 5000,
};

function getApiKey() {
  const key = process.env.BPS_API_KEY;
  if (!key) {
    console.error("[BPS Config Error] Environment variable BPS_API_KEY belum diset pada file .env!");
  }
  return key || "";
}

module.exports = { BPS_CONFIG, getApiKey };

