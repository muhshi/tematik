import { NextResponse } from "next/server";
import { getAvailableYearsForVar } from "@/services/bpsApi";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const varIdStr = searchParams.get("var");
  const kabupaten = searchParams.get("kabupaten");

  if (!varIdStr) {
    return NextResponse.json([], { status: 200 });
  }

  // 1. Try Backend API Server
  const rawBackendUrl = process.env.BACKEND_API_URL || "http://127.0.0.1:5000/api";
  const backendUrl = rawBackendUrl.replace("localhost", "127.0.0.1");
  try {
    const query = kabupaten ? `var=${encodeURIComponent(varIdStr)}&kabupaten=${encodeURIComponent(kabupaten)}` : `var=${encodeURIComponent(varIdStr)}`;
    const res = await fetch(`${backendUrl}/available-years?${query}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) {
      const years = await res.json();
      return NextResponse.json(years, { status: 200 });
    }
  } catch (err) {
    // Backend offline, fallback to local BPS API fetcher
  }

  // 2. Local Fallback
  try {
    const years = await getAvailableYearsForVar(varIdStr);
    return NextResponse.json(years, { status: 200 });
  } catch (error: any) {
    console.error("[available-years] Error:", error);
    return NextResponse.json([], { status: 200 });
  }
}
