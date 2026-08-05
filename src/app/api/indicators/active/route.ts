import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import type { Indicator } from "@/actions/adminActions";

export const dynamic = 'force-dynamic';

// {*Fungsi Utama: Endpoint API Next.js untuk membaca daftar indikator yang sedang aktif/dinyalakan di Admin*}
export async function GET() {
  try {
    const dataDir = join(process.cwd(), "src", "data");
    const catalogPath = join(dataDir, "bps-catalog.json");
    const configPath = join(dataDir, "admin-config.json");

    // 1. Read catalog
    const catalogRaw = await readFile(catalogPath, "utf-8");
    const catalog: Indicator[] = JSON.parse(catalogRaw);

    // 2. Read active config
    const configRaw = await readFile(configPath, "utf-8");
    const config = JSON.parse(configRaw);
    const activeIds: string[] = config.activeIndicators || [];

    // 3. Filter active indicators
    const activeIndicators = catalog.filter(ind => activeIds.includes(ind.id));

    // Sort by category then name
    activeIndicators.sort((a, b) => {
      if (a.category < b.category) return -1;
      if (a.category > b.category) return 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json(activeIndicators);
  } catch (error) {
    console.error("[api/indicators/active] Error:", error);
    return NextResponse.json({ error: "Failed to load active indicators" }, { status: 500 });
  }
}
