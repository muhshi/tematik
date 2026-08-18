import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCache, setCache } from "@/lib/redis";
import type { Indicator } from "@/actions/adminActions";

export const dynamic = "force-dynamic";

const CACHE_KEY = "indicators:active";

export async function GET() {
  // 1. Try Backend API server
  const backendUrl = process.env.BACKEND_API_URL || "http://localhost:5000/api";
  try {
    const res = await fetch(`${backendUrl}/indicators/active`, {
      cache: "no-store",
      signal: AbortSignal.timeout(1500),
    });
    if (res.ok) {
      const activeIndicators = await res.json();
      return NextResponse.json(activeIndicators);
    }
  } catch (err) {
    // Backend offline, fallback to local DB manager
  }

  // 2. Local Fallback
  try {
    const cachedIndicators = await getCache<Indicator[]>(CACHE_KEY);
    if (cachedIndicators && cachedIndicators.length > 0) {
      return NextResponse.json(cachedIndicators);
    }

    const activeRecords = await db.getActiveIndicators();

    const indicators: Indicator[] = activeRecords.map((ind) => ({
      id: ind.id,
      name: ind.name,
      category: ind.category,
      code: ind.code || `Var ${ind.id.replace(/\D/g, "")}`,
      lastUpdated: ind.lastUpdated || "-",
      subjectId: ind.subjectId || 0,
      subjectName: ind.subjectName || ind.category,
      subcatId: ind.subcatId || 0,
      isActive: true,
    }));

    indicators.sort((a, b) => {
      if (a.category < b.category) return -1;
      if (a.category > b.category) return 1;
      return a.name.localeCompare(b.name);
    });

    if (indicators.length > 0) {
      await setCache(CACHE_KEY, indicators, 3600);
    }

    return NextResponse.json(indicators);
  } catch (error) {
    console.error("[api/indicators/active] Error:", error);
    return NextResponse.json({ error: "Failed to load active indicators" }, { status: 500 });
  }
}
