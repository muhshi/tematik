const fs = require("fs");
const path = require("path");
const { supabase } = require("../config/supabase");
const { redis } = require("../config/redis");

const DATA_DIR = path.join(__dirname, "..", "data");
const DB_FILE_PATH = path.join(DATA_DIR, "db-store.json");
const CATALOG_PATH = path.join(DATA_DIR, "bps-catalog.json");
const CONFIG_PATH = path.join(DATA_DIR, "admin-config.json");

class DatabaseManager {
  constructor() {
    this.isLoaded = false;
    this.store = {
      dataPoints: {},
      indicators: [],
      lastSyncedAt: null,
    };
  }

  static getInstance() {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  ensureLoaded() {
    if (this.isLoaded) return;

    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, "utf-8");
        this.store = JSON.parse(raw);
      } else {
        this.hydrateFromCatalog();
      }
    } catch (error) {
      console.error("[DatabaseManager] Load error:", error);
    } finally {
      this.isLoaded = true;
    }
  }

  hydrateFromCatalog() {
    let catalog = [];
    if (fs.existsSync(CATALOG_PATH)) {
      try {
        catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf-8"));
      } catch (err) {
        console.error("Failed to read catalog:", err);
      }
    }

    let activeIds = [];
    if (fs.existsSync(CONFIG_PATH)) {
      try {
        const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
        activeIds = config.activeIndicators || [];
      } catch (err) {
        console.error("Failed to read config:", err);
      }
    }

    this.store.indicators = catalog.map((item) => ({
      ...item,
      isActive: activeIds.length > 0 ? activeIds.includes(item.id) : (item.isActive !== false),
    }));

    this.persist();
  }

  persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.store, null, 2), "utf-8");
    } catch (error) {
      console.error("[DatabaseManager] Persist error:", error);
    }
  }

  async getBpsDataPoints(varId, year) {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("bps_datapoints")
          .select("*")
          .eq("var_id", varId)
          .eq("year", year);

        if (!error && data && data.length > 0) {
          return data.map((d) => ({
            varId: d.var_id,
            year: d.year,
            kecamatan: d.kecamatan,
            value: parseFloat(d.value) || 0,
            updatedAt: d.updated_at || new Date().toISOString(),
          }));
        }
      } catch (err) {
        console.warn("[DatabaseManager] Supabase error:", err.message);
      }
    }

    this.ensureLoaded();
    const key = `${varId}_${year}`;
    return this.store.dataPoints[key] || null;
  }

  async saveBpsDataPoints(varId, year, points) {
    this.ensureLoaded();
    const key = `${varId}_${year}`;
    this.store.dataPoints[key] = points;
    this.store.lastSyncedAt = new Date().toISOString();
    this.persist();

    if (supabase && points && points.length > 0) {
      try {
        const rows = points.map((p) => ({
          var_id: parseInt(varId, 10),
          year: parseInt(year, 10),
          kecamatan: p.kecamatan,
          value: parseFloat(p.value) || 0,
          updated_at: new Date().toISOString(),
        }));
        const { error } = await supabase.from("bps_datapoints").upsert(rows, { onConflict: "var_id,year,kecamatan" });
        if (error) {
          console.warn("[Supabase] Data points notice:", error.message);
        }
      } catch (err) {
        console.warn("[Supabase] Data points error:", err.message);
      }
    }
  }

  getIndicators() {
    this.ensureLoaded();
    return (this.store.indicators || []).map((ind) => ({
      ...ind,
      isActive: ind.isActive !== false,
    }));
  }

  async saveIndicators(indicators) {
    this.ensureLoaded();
    this.store.indicators = indicators;
    this.store.lastSyncedAt = new Date().toISOString();
    this.persist();

    if (redis) {
      try {
        await redis.set("bps_catalog", JSON.stringify(indicators), { ex: 7 * 24 * 60 * 60 });
      } catch (err) {
        console.warn("[Redis] Save indicators error:", err.message);
      }
    }

    if (supabase) {
      try {
        const rows = indicators.map((ind) => ({
          id: ind.id,
          name: ind.name,
          category: ind.category,
          var_id: parseInt(ind.id.replace(/\D/g, ""), 10) || null,
          unit: ind.unit || null,
          is_active: ind.isActive !== false,
          updated_at: new Date().toISOString(),
        }));
        await supabase.from("bps_indicators").upsert(rows, { onConflict: "id" });
      } catch (err) {
        console.warn("[Supabase] Save indicators error:", err.message);
      }
    }
  }

  async updateActiveIndicators(activeIds) {
    this.ensureLoaded();
    this.store.indicators = this.store.indicators.map((ind) => ({
      ...ind,
      isActive: activeIds.includes(ind.id),
    }));
    this.persist();

    await this.saveIndicators(this.store.indicators);
  }
}

const db = DatabaseManager.getInstance();
module.exports = { db };
