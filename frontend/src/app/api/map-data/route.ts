import { NextResponse } from "next/server";
import { getCache, setCache } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedYear = searchParams.get("year") || "2024";
  const varIdStr = searchParams.get("var") || "";

  // 1. Try fetching from Backend API server
  const rawBackendUrl = process.env.BACKEND_API_URL || "http://127.0.0.1:5000/api";
  const backendUrl = rawBackendUrl.replace("localhost", "127.0.0.1");
  try {
    const res = await fetch(`${backendUrl}/map-data?year=${requestedYear}&var=${encodeURIComponent(varIdStr)}`, {
      cache: "no-store",
      signal: request.signal, // Forward client abort signal
    });
    
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    } else {
      console.warn(`Backend returned status ${res.status}`);
    }
  } catch (err: any) {
    if (err.name === 'AbortError' || err.name === 'ResponseAborted' || err.message?.includes('aborted') || request.signal.aborted) {
      return new Response(null, { status: 499 });
    }
    console.error("Backend /map-data proxy failed:", err);
  }

  if (request.signal.aborted) {
    return new Response(null, { status: 499 });
  }

  return NextResponse.json(
    { error: "Failed to load map data from backend" },
    { status: 500 }
  );
}
