"use server";

import fs from "fs";
import path from "path";

// BPS API Constants
const API_KEY = "ac9780c3023e0762d5eb07f1c2f00dc6"; // Updated API KEY from test-api.js
const DOMAIN = "3321";
const BASE_URL = "https://webapi.bps.go.id/v1/api/list/model";

// Paths for JSON caching
const dataDir = path.join(process.cwd(), "src", "data");
const catalogPath = path.join(dataDir, "bps-catalog.json");
const configPath = path.join(dataDir, "admin-config.json");

// Types
export interface Indicator {
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

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch data with retry logic
 */
async function fetchWithRetry(url: string, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: { "Accept": "application/json" },
        cache: "no-store"
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data["data-availability"] === "available" && Array.isArray(data.data) && data.data.length > 1) {
        return data.data[1]; // BPS API returns data array at index 1
      } else {
        return [];
      }
    } catch (e) {
      if (i === retries - 1) throw e;
      await delay(1000 * (i + 1)); // Exponential backoff
    }
  }
}

/**
 * Ensures the data directory exists
 */
function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

/**
 * Action 1: Get Indicator Data (reads from cache)
 */
// {*Fungsi: Membaca file master katalog indikator BPS (bps-catalog.json)*}
export async function getIndicatorData(): Promise<{ indicators: Indicator[], syncDate: string | null }> {
  try {
    ensureDataDir();
    
    // Read catalog
    let catalog: any[] = [];
    if (fs.existsSync(catalogPath)) {
      catalog = JSON.parse(fs.readFileSync(catalogPath, "utf-8"));
    }
    
    // Read config
    let config = { activeIndicators: [] as string[] };
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    }

    // Merge active status
    const indicators: Indicator[] = catalog.map((item: any) => ({
      ...item,
      isActive: config.activeIndicators.includes(item.id)
    }));

    // Get file modified date as syncDate
    let syncDate = null;
    if (fs.existsSync(catalogPath)) {
      const stats = fs.statSync(catalogPath);
      syncDate = stats.mtime.toLocaleString("id-ID", { dateStyle: 'medium', timeStyle: 'short' });
    }

    return { indicators, syncDate };
  } catch (error) {
    console.error("Failed to read indicator data:", error);
    return { indicators: [], syncDate: null };
  }
}

/**
 * Action 2: Save Active Indicators
 */
// {*Fungsi: Menulis dan menyimpan perubahan status on/off indikator ke admin-config.json*}
export async function saveActiveIndicators(activeIds: string[]): Promise<{ success: boolean; message: string }> {
  try {
    ensureDataDir();
    const config = { activeIndicators: activeIds };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
    return { success: true, message: "Konfigurasi berhasil disimpan!" };
  } catch (error) {
    console.error("Failed to save configuration:", error);
    return { success: false, message: "Gagal menyimpan konfigurasi." };
  }
}

/**
 * Action 3: Sync BPS API (The Monster Fetcher)
 */
export async function syncBpsApi(): Promise<{ success: boolean; count?: number; message: string }> {
  try {
    ensureDataDir();
    
    const allIndicators: any[] = [];
    
    // 1. Fetch Subcategories
    console.log("Fetching subcategories...");
    const subcats = await fetchWithRetry(`${BASE_URL}/subcat/domain/${DOMAIN}/key/${API_KEY}/`);
    
    for (const subcat of subcats) {
      console.log(`Fetching subjects for subcat: ${subcat.title}`);
      await delay(500); // Wait 0.5s to avoid rate limit
      
      // 2. Fetch Subjects for each Subcat
      const subjects = await fetchWithRetry(`${BASE_URL}/subject/domain/${DOMAIN}/subcat/${subcat.subcat_id}/key/${API_KEY}/`);
      
      if (!subjects || subjects.length === 0) continue;

      for (const subject of subjects) {
        console.log(`Fetching vars for subject: ${subject.title}`);
        await delay(500); // Wait 0.5s to avoid rate limit
        
        // 3. Fetch Variables (Indicators) for each Subject
        const vars = await fetchWithRetry(`${BASE_URL}/var/domain/${DOMAIN}/subject/${subject.sub_id}/key/${API_KEY}/`);
        
        if (!vars || vars.length === 0) continue;

        for (const v of vars) {
          allIndicators.push({
            id: `var-${v.var_id}`,
            name: v.title,
            category: subcat.title,
            code: `Var ${v.var_id}`,
            lastUpdated: v.updt_year || "-",
            subjectId: subject.sub_id,
            subjectName: subject.title,
            subcatId: subcat.subcat_id
          });
        }
      }
    }

    // Write to catalog
    fs.writeFileSync(catalogPath, JSON.stringify(allIndicators, null, 2), "utf-8");
    
    return { 
      success: true, 
      count: allIndicators.length, 
      message: `Berhasil sinkronisasi ${allIndicators.length} indikator dari BPS.` 
    };

  } catch (error: any) {
    console.error("Sync failed:", error);
    return { success: false, message: error.message || "Gagal melakukan sinkronisasi dengan BPS API." };
  }
}
