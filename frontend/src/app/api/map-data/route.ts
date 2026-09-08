import { NextResponse } from "next/server";
import { getCache, setCache } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedYear = searchParams.get("year") || "2024";
  const varIdStr = searchParams.get("var") || "";

  // 1. Try fetching from Backend API server
  const backendUrl = process.env.BACKEND_API_URL || "http://localhost:5000/api";
  try {
    const res = await fetch(`${backendUrl}/map-data?year=${requestedYear}&var=${varIdStr}`, {
      cache: "no-store",
      signal: request.signal, // Forward client abort signal
    });
    
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    } else {
      console.warn(`Backend returned status ${res.status}`);
    }
  } catch (err) {
    console.error("Backend /map-data proxy failed:", err);
  }

  return NextResponse.json(
    { error: "Failed to load map data from backend" },
    { status: 500 }
  );
}
