import { NextResponse } from "next/server";
import { getCache, setCache } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedYear = searchParams.get("year") || "2024";
  const kabupaten = searchParams.get("kabupaten") || "";

  if (!kabupaten) {
    return NextResponse.json({ error: "Missing kabupaten parameter" }, { status: 400 });
  }

  // 1. Try fetching from Backend API server
  const backendUrl = process.env.BACKEND_API_URL || "http://localhost:5000/api";
  try {
    const res = await fetch(`${backendUrl}/map-data/kecamatan?year=${requestedYear}&kabupaten=${kabupaten}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    console.warn("Backend /map-data/kecamatan failed, no local fallback implemented yet.");
  }

  return NextResponse.json(
    { error: "Failed to load drilldown data from backend" },
    { status: 500 }
  );
}
