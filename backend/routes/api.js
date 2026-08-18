const express = require("express");
const router = express.Router();
const { getEnrichedMapData } = require("../services/mapService");
const { getAvailableYearsForVar } = require("../services/bpsService");
const {
  getActiveIndicators,
  getAllIndicators,
  saveActiveIndicators,
  syncBpsCatalog,
} = require("../services/indicatorService");

// GET /api/map-data
router.get("/map-data", async (req, res) => {
  try {
    const requestedYear = req.query.year || "2024";
    const varIdStr = req.query.var;
    const targetVarId = varIdStr ? parseInt(varIdStr.replace(/\D/g, ""), 10) : undefined;

    const data = await getEnrichedMapData(requestedYear, targetVarId);
    return res.json(data);
  } catch (error) {
    console.error("[GET /api/map-data] Error:", error.message);
    return res.status(500).json({ error: "Failed to load map data" });
  }
});

// GET /api/available-years
router.get("/available-years", async (req, res) => {
  try {
    const varIdStr = req.query.var;
    if (!varIdStr) return res.json([]);
    const years = await getAvailableYearsForVar(varIdStr);
    return res.json(years);
  } catch (error) {
    console.error("[GET /api/available-years] Error:", error.message);
    return res.json([]);
  }
});

// GET /api/indicators/active
router.get("/indicators/active", (req, res) => {
  try {
    const activeIndicators = getActiveIndicators();
    activeIndicators.sort((a, b) => {
      if (a.category < b.category) return -1;
      if (a.category > b.category) return 1;
      return a.name.localeCompare(b.name);
    });
    return res.json(activeIndicators);
  } catch (error) {
    console.error("[GET /api/indicators/active] Error:", error.message);
    return res.status(500).json({ error: "Failed to load active indicators" });
  }
});

// GET /api/indicators
router.get("/indicators", (req, res) => {
  try {
    const data = getAllIndicators();
    return res.json(data);
  } catch (error) {
    console.error("[GET /api/indicators] Error:", error.message);
    return res.status(500).json({ error: "Failed to load indicators" });
  }
});

// POST /api/indicators/active
router.post("/indicators/active", (req, res) => {
  try {
    const { activeIds } = req.body;
    const result = saveActiveIndicators(activeIds || []);
    return res.json(result);
  } catch (error) {
    console.error("[POST /api/indicators/active] Error:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /api/indicators/sync
router.post("/indicators/sync", async (req, res) => {
  try {
    const result = await syncBpsCatalog();
    return res.json(result);
  } catch (error) {
    console.error("[POST /api/indicators/sync] Error:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
