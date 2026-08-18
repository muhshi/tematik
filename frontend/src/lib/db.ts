import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { supabase } from "./supabase";
import { getBpsCategory } from "./bpsHelpers";

export interface BpsDataPoint {
  varId: number;
  year: number;
  kecamatan: string;
  value: number;
  updatedAt: string;
}

export interface IndicatorRecord {
  id: string;
  name: string;
  category: string;
  code: string;
  lastUpdated: string;
  subjectId: number;
  subjectName: string;
  subcatId: number;
  isActive: boolean;
}

export interface FallbackDatabaseStore {
  dataPoints: Record<string, BpsDataPoint[]>; // Format key: `${varId}_${year}`
  indicators: IndicatorRecord[];
  lastSyncedAt: string | null;
}

const DATA_DIR = join(process.cwd(), "src", "data");
const DB_FILE_PATH = join(DATA_DIR, "db-store.json");
const CATALOG_PATH = join(DATA_DIR, "bps-catalog.json");
const CONFIG_PATH = join(DATA_DIR, "admin-config.json");

/**
 * Database Manager (Hybrid: Supabase PostgreSQL + Local JSON Fallback)
 * No Prisma dependency.
 */
export class DatabaseManager {
  private static instance: DatabaseManager;
  private isLoaded = false;
  private store: FallbackDatabaseStore = {
    dataPoints: {},
    indicators: [],
    lastSyncedAt: null,
  };

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  private async ensureLoaded() {
    if (this.isLoaded) return;

    try {
      if (!existsSync(DATA_DIR)) {
        await mkdir(DATA_DIR, { recursive: true });
      }

      if (existsSync(DB_FILE_PATH)) {
        const raw = await readFile(DB_FILE_PATH, "utf-8");
        this.store = JSON.parse(raw);
      } else {
        await this.hydrateFromLegacyFiles();
      }
    } catch (error) {
      console.error("[DatabaseManager] Error loading local store, hydrating:", error);
      await this.hydrateFromLegacyFiles();
    } finally {
      this.isLoaded = true;
    }
  }

  private async hydrateFromLegacyFiles() {
    let catalog: any[] = [];
    if (existsSync(CATALOG_PATH)) {
      try {
        const rawCatalog = await readFile(CATALOG_PATH, "utf-8");
        catalog = JSON.parse(rawCatalog);
      } catch (err) {
        console.error("[DatabaseManager] Failed to read catalog:", err);
      }
    }

    let activeIds: string[] = [];
    if (existsSync(CONFIG_PATH)) {
      try {
        const rawConfig = await readFile(CONFIG_PATH, "utf-8");
        const config = JSON.parse(rawConfig);
        activeIds = config.activeIndicators || [];
      } catch (err) {
        console.error("[DatabaseManager] Failed to read admin-config:", err);
      }
    }

    this.store.indicators = catalog.map((item: any) => ({
      id: item.id || `var-${item.var_id}`,
      name: item.name || item.title,
      category: item.category || getBpsCategory(item.subjectName || item.subject || ""),
      code: item.code || `Var ${item.var_id || item.id?.replace(/\D/g, "")}`,
      lastUpdated: item.lastUpdated || item.updt_year || "-",
      subjectId: item.subjectId || item.sub_id || 0,
      subjectName: item.subjectName || item.subject || item.category || "Umum",
      subcatId: item.subcatId || item.subcat_id || 0,
      isActive: activeIds.length > 0 ? activeIds.includes(item.id) : (item.isActive ?? true),
    }));

    await this.persist();
  }

  private async persist() {
    try {
      if (!existsSync(DATA_DIR)) {
        await mkdir(DATA_DIR, { recursive: true });
      }
      await writeFile(DB_FILE_PATH, JSON.stringify(this.store, null, 2), "utf-8");
    } catch (error) {
      console.warn("[DatabaseManager] Failed to persist local store (read-only filesystem):", error);
    }
  }

  // --- Data Point Operations ---

  public async getBpsDataPoints(varId: number, year: number): Promise<BpsDataPoint[] | null> {
    // 1. Try Supabase first if available
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
            value: Number(d.value),
            updatedAt: d.updated_at || new Date().toISOString(),
          }));
        }
      } catch (err) {
        console.warn("[DatabaseManager] Supabase getBpsDataPoints error, fallback to local store:", err);
      }
    }

    // 2. Fallback to local store
    await this.ensureLoaded();
    const key = `${varId}_${year}`;
    return this.store.dataPoints[key] || null;
  }

  public async saveBpsDataPoints(varId: number, year: number, points: BpsDataPoint[]): Promise<void> {
    // 1. Try Supabase upsert if available
    if (supabase && points.length > 0) {
      try {
        const rows = points.map((p) => ({
          var_id: varId,
          year: year,
          kecamatan: p.kecamatan,
          value: p.value,
          updated_at: new Date().toISOString(),
        }));

        await supabase.from("bps_datapoints").upsert(rows, {
          onConflict: "var_id,year,kecamatan",
        });
      } catch (err) {
        console.warn("[DatabaseManager] Supabase saveBpsDataPoints error:", err);
      }
    }

    // 2. Save to local store
    await this.ensureLoaded();
    const key = `${varId}_${year}`;
    this.store.dataPoints[key] = points;
    this.store.lastSyncedAt = new Date().toISOString();
    await this.persist();
  }

  // --- Indicator Operations ---

  public async getIndicators(): Promise<IndicatorRecord[]> {
    // 1. Try Supabase first if available
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("bps_indicators")
          .select("*")
          .order("category", { ascending: true })
          .order("name", { ascending: true });

        if (!error && data && data.length > 0) {
          return data.map((item) => ({
            id: item.id,
            name: item.name,
            category: item.category,
            code: `Var ${item.var_id || item.id.replace(/\D/g, "")}`,
            lastUpdated: item.updated_at ? new Date(item.updated_at).toISOString() : "-",
            subjectId: item.subject_id || 0,
            subjectName: item.subject_name || item.category,
            subcatId: item.subcat_id || 0,
            isActive: item.is_active ?? true,
          }));
        }
      } catch (err) {
        console.warn("[DatabaseManager] Supabase getIndicators error, fallback to local store:", err);
      }
    }

    // 2. Fallback to local store
    await this.ensureLoaded();
    return this.store.indicators;
  }

  public async getActiveIndicators(): Promise<IndicatorRecord[]> {
    const indicators = await this.getIndicators();
    return indicators.filter((ind) => ind.isActive);
  }

  public async saveIndicators(indicators: IndicatorRecord[]): Promise<void> {
    // 1. Try Supabase upsert if available
    if (supabase && indicators.length > 0) {
      try {
        const rows = indicators.map((ind) => {
          const varId = parseInt(ind.id.replace(/\D/g, ""), 10);
          return {
            id: ind.id,
            name: ind.name,
            category: ind.category,
            var_id: isNaN(varId) ? null : varId,
            description: ind.subjectName,
            is_active: ind.isActive,
            updated_at: new Date().toISOString(),
          };
        });

        await supabase.from("bps_indicators").upsert(rows, {
          onConflict: "id",
        });
      } catch (err) {
        console.warn("[DatabaseManager] Supabase saveIndicators error:", err);
      }
    }

    // 2. Save to local store
    await this.ensureLoaded();
    this.store.indicators = indicators;
    this.store.lastSyncedAt = new Date().toISOString();
    await this.persist();
  }

  public async updateActiveIndicators(activeIds: string[]): Promise<void> {
    // 1. Try Supabase update if available
    if (supabase) {
      try {
        // Set all to false, then set activeIds to true
        await supabase.from("bps_indicators").update({ is_active: false }).neq("id", "");
        if (activeIds.length > 0) {
          await supabase.from("bps_indicators").update({ is_active: true }).in("id", activeIds);
        }
      } catch (err) {
        console.warn("[DatabaseManager] Supabase updateActiveIndicators error:", err);
      }
    }

    // 2. Update local store and admin-config.json
    await this.ensureLoaded();
    this.store.indicators = this.store.indicators.map((ind) => ({
      ...ind,
      isActive: activeIds.includes(ind.id),
    }));
    await this.persist();

    try {
      const config = { activeIndicators: activeIds };
      await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
    } catch (e) {
      console.warn("[DatabaseManager] Could not update admin-config.json:", e);
    }
  }

  public getLastSyncedAt(): string | null {
    return this.store.lastSyncedAt;
  }
}

export const db = DatabaseManager.getInstance();
