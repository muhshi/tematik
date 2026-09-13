import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

export const dynamic = "force-dynamic";

function isAbortError(err: any, request: Request): boolean {
  if (request.signal.aborted) return true;
  if (!err) return false;
  return (
    err.name === "AbortError" ||
    err.name === "ResponseAborted" ||
    err.code === 20 ||
    err.cause?.name === "AbortError" ||
    err.message?.includes("aborted") ||
    err.message?.includes("The user aborted a request")
  );
}

// Local fallback if backend is momentarily restarting or unreachable
async function getLocalFallback(kabupaten: string, year: string) {
  try {
    const isDemak = kabupaten.toLowerCase().includes("demak");
    const filename = isDemak ? "demak_kecamatan.geojson" : "jateng_kecamatan_merged.geojson";
    const geoPath = path.join(process.cwd(), "src", "assets", filename);
    const raw = await fs.readFile(geoPath, "utf-8");
    const geojson = JSON.parse(raw);

    let filteredFeatures = geojson.features || [];
    if (!isDemak) {
      const cleanKab = kabupaten.toLowerCase().replace(/^(kabupaten|kota)\s+/i, "").trim();
      filteredFeatures = geojson.features.filter((f: any) => {
        const reg = (f.properties?.regency || "").toLowerCase().replace(/^(kabupaten|kota)\s+/i, "").trim();
        return reg === cleanKab;
      });
    }

    // Try reading local demographic data from backend/data/db
    let dbData: any = null;
    const dbPath = path.join(process.cwd(), "..", "backend", "data", "db", `kabupaten_3321_${year}.json`);
    try {
      const rawDb = await fs.readFile(dbPath, "utf-8");
      dbData = JSON.parse(rawDb);
    } catch {
      // Ignore if not found
    }

    const newFeatures = filteredFeatures.map((f: any) => {
      let value = null;
      let demographics = undefined;
      if (dbData?.kecamatan_data) {
        const distName = (f.properties?.district || "").toLowerCase().trim();
        const match = dbData.kecamatan_data.find((d: any) => (d.nama_kecamatan || "").toLowerCase().trim() === distName);
        if (match) {
          value = match.total_penduduk?.Total ?? 0;
          demographics = {
            gender: {
              L: match.total_penduduk?.["Laki-laki"] ?? 0,
              P: match.total_penduduk?.["Perempuan"] ?? 0,
            }
          };
        }
      }
      return {
        ...f,
        properties: {
          ...f.properties,
          value,
          demographics,
        }
      };
    });

    return {
      geojsonKecamatan: {
        type: "FeatureCollection",
        features: newFeatures,
      },
      metadata: {
        source: "Local Backup Cache",
        year,
        lastUpdated: new Date().toISOString(),
        isCached: true,
      }
    };
  } catch (err: any) {
    console.error("[map-data/kecamatan] Fallback error:", err.message);
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedYear = searchParams.get("year") || "2024";
  const kabupaten = searchParams.get("kabupaten") || "";

  if (!kabupaten) {
    return NextResponse.json({ error: "Missing kabupaten parameter" }, { status: 400 });
  }

  // 1. Try fetching from Backend API server with 1 automatic retry
  const rawBackendUrl = process.env.BACKEND_API_URL || "http://127.0.0.1:5000/api";
  const backendUrl = rawBackendUrl.replace("localhost", "127.0.0.1");
  const targetUrl = `${backendUrl}/map-data/kecamatan?year=${requestedYear}&kabupaten=${encodeURIComponent(kabupaten)}`;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      if (request.signal.aborted) {
        return new Response(null, { status: 499 });
      }

      const res = await fetch(targetUrl, {
        cache: "no-store",
        signal: request.signal,
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      } else {
        console.warn(`[map-data/kecamatan] Backend returned ${res.status} on attempt ${attempt + 1}`);
      }
    } catch (err: any) {
      if (isAbortError(err, request)) {
        return new Response(null, { status: 499 });
      }
      console.warn(`[map-data/kecamatan] Backend fetch failed on attempt ${attempt + 1}: ${err.message}`);
    }

    // Brief delay before retry if not aborted
    if (attempt === 0 && !request.signal.aborted) {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  if (request.signal.aborted) {
    return new Response(null, { status: 499 });
  }

  // 2. Fallback to local data if backend is offline or restarting
  console.warn(`[map-data/kecamatan] Serving local fallback for ${kabupaten} (${requestedYear})`);
  const fallbackData = await getLocalFallback(kabupaten, requestedYear);
  if (fallbackData && fallbackData.geojsonKecamatan.features.length > 0) {
    return NextResponse.json(fallbackData);
  }

  return NextResponse.json(
    { error: "Failed to load drilldown data from backend" },
    { status: 500 }
  );
}
