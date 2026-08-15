"use server";

import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { deleteCache } from "@/lib/redis";
import { executeBpsSync } from "@/services/bpsScheduler";

// BPS API Constants
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

import { getBpsCategory } from "@/lib/bpsHelpers";

/**
 * Action 1: Get Indicator Data (reads from Supabase DB, falls back to JSON file)
 */
export async function getIndicatorData(): Promise<{ indicators: Indicator[]; syncDate: string | null }> {
  try {
    // 1. Try reading from Supabase DB via Prisma (dengan 5s timeout guard)
    try {
      const dbQueryPromise = prisma.strategicIndicator.findMany({
        orderBy: [{ subject: "asc" }, { name: "asc" }],
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Prisma connection timeout")), 5000)
      );

      const dbIndicators = await Promise.race([dbQueryPromise, timeoutPromise]);

      if (dbIndicators.length > 0) {
        const lastLog = await prisma.syncLog.findFirst({
          orderBy: { startedAt: "desc" },
        });

        const syncDate = lastLog?.finishedAt
          ? new Date(lastLog.finishedAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })
          : null;

        const indicators: Indicator[] = dbIndicators.map((ind) => ({
          id: `var-${ind.varId}`,
          name: ind.name,
          category: getBpsCategory(ind.subject),
          code: `Var ${ind.varId}`,
          lastUpdated: ind.updatedAt.toISOString(),
          subjectId: 0,
          subjectName: ind.subject,
          subcatId: 0,
          isActive: ind.isActive,
        }));

        return { indicators, syncDate };
      }
    } catch (dbErr: any) {
      console.warn("[adminActions] Supabase DB read skipped/failed, fallback to file:", dbErr.message || dbErr);
    }

    // 2. Fallback to file system
    ensureDataDir();
    
    let catalog: any[] = [];
    if (fs.existsSync(catalogPath)) {
      catalog = JSON.parse(fs.readFileSync(catalogPath, "utf-8"));
    }
    
    let config = { activeIndicators: [] as string[] };
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    }

    const indicators: Indicator[] = catalog.map((item: any) => ({
      ...item,
      category: getBpsCategory(item.subjectName || item.category || item.subject || ""),
      subjectName: item.subjectName || item.category || item.subject || "Lainnya",
      isActive: config.activeIndicators.includes(item.id),
    }));

    let syncDate = null;
    if (fs.existsSync(catalogPath)) {
      const stats = fs.statSync(catalogPath);
      syncDate = stats.mtime.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
    }

    return { indicators, syncDate };
  } catch (error) {
    console.error("Failed to read indicator data:", error);
    return { indicators: [], syncDate: null };
  }
}

/**
 * Action 2: Save Active Indicators (updates Supabase DB & invalidates Redis cache)
 */
export async function saveActiveIndicators(activeIds: string[]): Promise<{ success: boolean; message: string }> {
  try {
    const varIds = activeIds.map((id) => parseInt(id.replace(/\D/g, ""), 10)).filter((id) => !isNaN(id));

    // 1. Update Supabase Database
    try {
      await prisma.$transaction([
        prisma.strategicIndicator.updateMany({
          where: { varId: { in: varIds } },
          data: { isActive: true },
        }),
        prisma.strategicIndicator.updateMany({
          where: { varId: { notIn: varIds } },
          data: { isActive: false },
        }),
      ]);

      // Invalidate Redis cache so dashboard immediately reflects changes
      await deleteCache("indicators:*");
      await deleteCache("map:*");
    } catch (dbErr) {
      console.warn("[adminActions] DB update failed, saving to file:", dbErr);
    }

    // 2. Try saving to file system (wrapped in try/catch for read-only platforms like Vercel)
    try {
      ensureDataDir();
      const config = { activeIndicators: activeIds };
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
    } catch (fileErr) {
      console.info("[adminActions] File write skipped (read-only system):", fileErr);
    }

    return { success: true, message: "Konfigurasi indikator berhasil disimpan!" };
  } catch (error) {
    console.error("Failed to save configuration:", error);
    return { success: false, message: "Gagal menyimpan konfigurasi." };
  }
}

/**
 * Action 3: Trigger BPS Scheduler Sync
 */
export async function syncBpsApi(): Promise<{ success: boolean; count?: number; message: string }> {
  try {
    const res = await executeBpsSync();
    return {
      success: res.success,
      count: res.totalIndicators,
      message: res.message,
    };
  } catch (error: any) {
    console.error("Sync failed:", error);
    return { success: false, message: error.message || "Gagal melakukan sinkronisasi BPS." };
  }
}
