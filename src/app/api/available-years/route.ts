import { NextResponse } from "next/server";

const API_KEY = process.env.BPS_API_KEY;
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

    const defaultYears: AvailableYear[] = [
      { th_id: 124, year: "2024" },
      { th_id: 123, year: "2023" },
      { th_id: 122, year: "2022" },
      { th_id: 121, year: "2021" },
      { th_id: 120, year: "2020" },
    ];

    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(2500), // Max 2.5s timeout
        next: { revalidate: 3600 },
      });

      if (response.ok) {
        const result = await response.json();
        if (
          result["data-availability"] === "available" &&
          Array.isArray(result.data) &&
          result.data.length >= 2
        ) {
          const rawYears = result.data[1] as Array<{ th_id: number; th: string }>;
          const years: AvailableYear[] = rawYears
            .map((y) => ({ th_id: y.th_id, year: y.th }))
            .sort((a, b) => parseInt(b.year) - parseInt(a.year));

          if (years.length > 0) {
            return NextResponse.json(years, { status: 200 });
          }
        }
      }
    } catch (fetchErr) {
      console.warn("[available-years] BPS API fetch timed out, using fallback years");
    }

    return NextResponse.json(defaultYears, { status: 200 });
  } catch (error: any) {
    console.error("[available-years] Fatal error:", error);
    return NextResponse.json(
      [
        { th_id: 124, year: "2024" },
        { th_id: 123, year: "2023" },
      ],
      { status: 200 }
    );
  }
}
