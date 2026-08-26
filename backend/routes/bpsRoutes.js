const express = require("express");
const router = express.Router();
const {
  getThematicMapData,
  fetchDemakStrategicIndicators,
  generateSemanticIndicatorMapping,
  getAvailableYearsForIndicator,
} = require("../services/unifiedBpsService");
const { cacheManager } = require("../utils/cacheManager");

/**
 * GET /api/bps/indicators/strategic
 * Mengambil daftar indikator acuan [Data Strategis] dari BPS Kabupaten Demak
 */
router.get("/indicators/strategic", async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === "true";
    const indicators = await fetchDemakStrategicIndicators(forceRefresh);
    return res.json({
      success: true,
      count: indicators.length,
      data: indicators,
    });
  } catch (error) {
    console.error("[GET /api/bps/indicators/strategic] Error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/bps/indicators/mapping
 * Melihat hasil pemetaan semantik dinamis antara variabel Demak & Jawa Tengah
 */
router.get("/indicators/mapping", async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === "true";
    const mappings = await generateSemanticIndicatorMapping(forceRefresh);
    return res.json({
      success: true,
      count: mappings.length,
      data: mappings,
    });
  } catch (error) {
    console.error("[GET /api/bps/indicators/mapping] Error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/bps/map-data
 * Endpoint terpadu untuk frontend peta tematik
 * Query params:
 *   - granularity: "kabupaten" | "kecamatan" (default: "kecamatan")
 *   - varId / var: ID variabel acuan Demak (contoh: 248 atau "var-248")
 *   - year: Tahun survei (contoh: 2024)
 *   - refresh: "true" untuk bypass cache
 */
router.get("/map-data", async (req, res) => {
  try {
    const granularity = req.query.granularity || "kecamatan";
    const varId = req.query.varId || req.query.var || "248";
    const year = req.query.year || "2024";
    const forceRefresh = req.query.refresh === "true";

    const result = await getThematicMapData({
      granularity,
      demakVarId: varId,
      year,
      forceRefresh,
    });

    return res.json(result);
  } catch (error) {
    console.error("[GET /api/bps/map-data] Error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/bps/available-years
 * Mengambil daftar tahun survei yang tersedia untuk suatu indikator
 */
router.get("/available-years", async (req, res) => {
  try {
    const varId = req.query.varId || req.query.var || "248";
    const years = await getAvailableYearsForIndicator(varId);
    return res.json({
      success: true,
      data: years,
    });
  } catch (error) {
    console.error("[GET /api/bps/available-years] Error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/bps/sync
 * Memicu sinkronisasi ulang live data BPS dan regenerasi semantic mapping
 */
router.post("/sync", async (req, res) => {
  try {
    const [indicators, mappings] = await Promise.all([
      fetchDemakStrategicIndicators(true),
      generateSemanticIndicatorMapping(true),
    ]);

    return res.json({
      success: true,
      message: "Sinkronisasi live BPS dan Semantic Mapping berhasil diperbarui.",
      strategicIndicatorsCount: indicators.length,
      matchedIndicatorsCount: mappings.filter((m) => m.status === "MATCHED").length,
    });
  } catch (error) {
    console.error("[POST /api/bps/sync] Error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/bps/cache/clear
 * Membersihkan cache memori & disk
 */
router.post("/cache/clear", (req, res) => {
  try {
    cacheManager.clear();
    return res.json({ success: true, message: "Cache BPS berhasil dibersihkan." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
