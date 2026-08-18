"use server";

import { db } from "@/lib/db";
import { deleteCache } from "@/lib/redis";
import { executeBpsSync } from "@/services/bpsScheduler";

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

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:5000/api";

/**
 * Action 1: Get Indicator Data
 */
export async function getIndicatorData(): Promise<{ indicators: Indicator[]; syncDate: string | null }> {
  try {
    const res = await fetch(`${BACKEND_API_URL}/indicators`, {
      cache: "no-store",
      signal: AbortSignal.timeout(1500),
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch {
    // Backend offline, fallback to local DB manager
  }

  try {
    const rawIndicators = await db.getIndicators();
    const syncDate = db.getLastSyncedAt()
      ? new Date(db.getLastSyncedAt()!).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })
      : null;

    const indicators: Indicator[] = rawIndicators.map((ind) => ({
      id: ind.id,
      name: ind.name,
      category: ind.category,
      code: ind.code || `Var ${ind.id.replace(/\D/g, "")}`,
      lastUpdated: ind.lastUpdated || "-",
      subjectId: ind.subjectId || 0,
      subjectName: ind.subjectName || ind.category,
      subcatId: ind.subcatId || 0,
      isActive: ind.isActive,
    }));

    return { indicators, syncDate };
  } catch (error) {
    console.error("[adminActions] Failed to read indicator data:", error);
    return { indicators: [], syncDate: null };
  }
}

/**
 * Action 2: Save Active Indicators
 */
export async function saveActiveIndicators(activeIds: string[]): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${BACKEND_API_URL}/indicators/active`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activeIds }),
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) {
      await deleteCache("indicators:*");
      await deleteCache("map:*");
      return await res.json();
    }
  } catch {
    // Backend offline, fallback to local DB manager
  }

  try {
    await db.updateActiveIndicators(activeIds);

    await deleteCache("indicators:*");
    await deleteCache("map:*");

    return { success: true, message: "Konfigurasi indikator berhasil disimpan!" };
  } catch (error) {
    console.error("[adminActions] Failed to save configuration:", error);
    return { success: false, message: "Gagal menyimpan konfigurasi." };
  }
}

/**
 * Action 3: Trigger BPS Scheduler Sync
 */
export async function syncBpsApi(): Promise<{ success: boolean; count?: number; message: string }> {
  try {
    const res = await fetch(`${BACKEND_API_URL}/indicators/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(60000),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Backend offline, run local sync
  }

  try {
    const res = await executeBpsSync();
    return {
      success: res.success,
      count: res.totalIndicators,
      message: res.message,
    };
  } catch (error: any) {
    console.error("[adminActions] Sync failed:", error);
    return { success: false, message: error.message || "Gagal melakukan sinkronisasi BPS." };
  }
}
