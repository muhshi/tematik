import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/prisma";
import { getCache, setCache } from "@/lib/redis";
import { getBpsCategory } from "@/lib/bpsHelpers";
import type { Indicator } from "@/actions/adminActions";

export const dynamic = "force-dynamic";

const CACHE_KEY = "indicators:active";

// {*Fungsi Utama: Endpoint API Next.js untuk membaca daftar indikator aktif (Redis Cache -> Supabase DB -> File JSON Fallback)*}
export async function GET() {
  try {
    // 1. Cek Redis Cache
    const cachedIndicators = await getCache<Indicator[]>(CACHE_KEY);
    if (cachedIndicators && cachedIndicators.length > 0) {
      return NextResponse.json(cachedIndicators);
    }

    // 2. Query Supabase Database via Prisma (dengan limit 5s timeout)
    try {
      const dbQueryPromise = prisma.strategicIndicator.findMany({
        where: { isActive: true },
        orderBy: [{ subject: "asc" }, { name: "asc" }],
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Prisma DB connection timeout")), 5000)
      );

      const dbIndicators = await Promise.race([dbQueryPromise, timeoutPromise]);

      if (dbIndicators.length > 0) {
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

        // Simpan ke Redis Cache (TTL 1 jam)
        await setCache(CACHE_KEY, indicators, 3600);
        return NextResponse.json(indicators);
      }
    } catch (dbErr: any) {
      console.warn("[api/indicators/active] DB query skipped/failed, fallback to JSON file:", dbErr.message || dbErr);
    }

    // 3. Fallback ke File JSON Lokal jika DB belum terisi
    const dataDir = join(process.cwd(), "src", "data");
    const catalogPath = join(dataDir, "bps-catalog.json");
    const configPath = join(dataDir, "admin-config.json");

    const catalogRaw = await readFile(catalogPath, "utf-8");
    const catalog: Indicator[] = JSON.parse(catalogRaw);

    const configRaw = await readFile(configPath, "utf-8");
    const config = JSON.parse(configRaw);
    const activeIds: string[] = config.activeIndicators || [];

    const activeIndicators = catalog.filter((ind) => activeIds.includes(ind.id));

    activeIndicators.sort((a, b) => {
      if (a.category < b.category) return -1;
      if (a.category > b.category) return 1;
      return a.name.localeCompare(b.name);
    });

    // Simpan fallback ke Redis Cache (TTL 10 menit)
    await setCache(CACHE_KEY, activeIndicators, 600);
    return NextResponse.json(activeIndicators);
  } catch (error) {
    console.error("[api/indicators/active] Error:", error);
    return NextResponse.json({ error: "Failed to load active indicators" }, { status: 500 });
  }
}
