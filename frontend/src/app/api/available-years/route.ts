import { NextResponse } from "next/server";
import { getAvailableYearsForVar } from "@/services/bpsApi";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const varIdStr = searchParams.get("var");

  if (!varIdStr) {
    return NextResponse.json([], { status: 200 });
  }

  // 1. Try Backend API Server
  const backendUrl = process.env.BACKEND_API_URL || "http://localhost:5000/api";
  try {
    const res = await fetch(`${backendUrl}/available-years?var=${varIdStr}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(1500),
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
