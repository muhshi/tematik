import { NextResponse } from "next/server";

const API_KEY = process.env.BPS_API_KEY || "ac9780c3023e0762d5eb07f1c2f00dc6";
const DOMAIN = "3321";
const BASE_URL = "https://webapi.bps.go.id/v1";

export interface AvailableYear {
  th_id: number;
  year: string;
}

// {*Fungsi Utama: Endpoint API Next.js untuk menarik daftar tahun dari API BPS berdasarkan satu Indikator spesifik*}
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const varIdStr = searchParams.get("var");

    if (!varIdStr) {
      return NextResponse.json([], { status: 200 });
    }

    // Extract numeric ID from "var-134" format
    const varId = parseInt(varIdStr.replace(/\D/g, ""), 10);

    if (isNaN(varId)) {
      return NextResponse.json([], { status: 200 });
    }

    const url = `${BASE_URL}/api/list/model/th/var/${varId}/domain/${DOMAIN}/key/${API_KEY}/`;

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      console.error(`[available-years] BPS API returned ${response.status}`);
      return NextResponse.json([], { status: 200 });
    }

    const result = await response.json();

    if (
      result["data-availability"] !== "available" ||
      !Array.isArray(result.data) ||
      result.data.length < 2
    ) {
      return NextResponse.json([], { status: 200 });
    }

    const rawYears = result.data[1] as Array<{ th_id: number; th: string }>;

    const years: AvailableYear[] = rawYears
      .map((y) => ({ th_id: y.th_id, year: y.th }))
      .sort((a, b) => parseInt(b.year) - parseInt(a.year)); // Newest first

    return NextResponse.json(years, { status: 200 });
  } catch (error: any) {
    console.error("[available-years] Fatal error:", error);
    return NextResponse.json([], { status: 200 });
  }
}
