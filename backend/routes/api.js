const express = require("express");
const router = express.Router();
const { getEnrichedMapData, getDrilldownMapData } = require("../services/mapService");
const { getAvailableYearsForVar, normalizeRegionName } = require("../services/bpsService");
const { cacheManager } = require("../utils/cacheManager");
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
    const targetVarId = varIdStr ? parseInt(varIdStr.replace(/\D/g, ""), 10) : 248;

    // 1. Cek Deterministic Composite Cache Key
    const cacheKey = `map:v3:jateng:var=${targetVarId}:year=${requestedYear}`;
    const cached = cacheManager.get(cacheKey);
    if (cached) {
      return res.json({
        ...cached,
        metadata: {
          ...cached.metadata,
          isCached: true,
        },
      });
    }

    // 2. Fetch fresh data dan kalkulasi
    const data = await getEnrichedMapData(requestedYear, targetVarId);
    
    // 3. Simpan ke cache selama 12 jam (43.200.000 ms)
    if (data && data.geojsonKabupaten) {
      cacheManager.set(cacheKey, data, 43200000);
    }

    return res.json(data);
  } catch (error) {
    console.error("[GET /api/map-data] Error:", error.message);
    return res.status(500).json({ error: "Failed to load map data" });
  }
});

// GET /api/map-data/kecamatan
router.get("/map-data/kecamatan", async (req, res) => {
  try {
    const requestedYear = req.query.year || "2024";
    const kabupaten = req.query.kabupaten;
    if (!kabupaten) return res.status(400).json({ error: "Missing kabupaten param" });

    // 1. Cek Deterministic Composite Cache Key
    const normKab = normalizeRegionName(kabupaten);
    const cacheKey = `map:v2:kecamatan:kab=${normKab}:year=${requestedYear}`;
    const cached = cacheManager.get(cacheKey);
    if (cached) {
      return res.json({
        ...cached,
        metadata: {
          ...cached.metadata,
          isCached: true,
        },
      });
    }

    // 2. Fetch fresh drilldown data
    const data = await getDrilldownMapData(kabupaten, requestedYear);

    // 3. Simpan ke cache
    if (data && data.geojsonKecamatan) {
      cacheManager.set(cacheKey, data, 43200000);
    }

    return res.json(data);
  } catch (error) {
    console.error("[GET /api/map-data/kecamatan] Error:", error.message);
    return res.status(500).json({ error: "Failed to load drilldown data" });
  }
});

// GET /api/available-years
router.get("/available-years", async (req, res) => {
  try {
    const varIdStr = req.query.var;
    const kabupaten = req.query.kabupaten;
    if (!varIdStr) return res.json([]);
    
    // Jika indikator ada di DB Statis, gunakan daftar tahun asli dari DB
    const targetVarId = parseInt(varIdStr.replace(/\D/g, ""), 10);
    const { getAvailableYears } = require("../services/dbService");
    
    let dbLevel = null;
    if (targetVarId === 248) {
      dbLevel = kabupaten ? 'kabupaten' : 'provinsi';
    } else if (targetVarId === 213) {
      dbLevel = 'ipm';
    } else if (targetVarId === 178) {
      dbLevel = 'kemiskinan';
    } else if (targetVarId === 114) {
      dbLevel = 'tpak';
    } else if (targetVarId === 115) {
      dbLevel = 'tpt';
    }
    
    if (dbLevel) {
      try {
        const localYears = await getAvailableYears(dbLevel, kabupaten);
        if (localYears && localYears.length > 0) {
          localYears.sort((a, b) => b.localeCompare(a));
          const mappedYears = localYears.map((y, i) => ({ th_id: i + 1, year: y }));
          return res.json(mappedYears);
        }
      } catch (err) {
        console.warn(`[available-years] DB lookup failed for ${dbLevel}:`, err.message);
      }
    }

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
    cacheManager.clearMapCache();
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
    cacheManager.clearMapCache();
    return res.json(result);
  } catch (error) {
    console.error("[POST /api/indicators/sync] Error:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
