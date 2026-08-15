// {*Fungsi: API Endpoint Cron Job untuk Vercel / Scheduler Harian*}

import { NextResponse } from "next/server";
import { executeBpsSync } from "@/services/bpsScheduler";

export const maxDuration = 60; // Max duration for Vercel functions (if supported)
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // Keamanan opsional: Cek Authorization Header / CRON_SECRET jika dikirim oleh Vercel
    const authHeader = request.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: "Unauthorized cron execution" },
        { status: 401 }
      );
    }

    const result = await executeBpsSync();

    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    });
  } catch (error: any) {
    console.error("[Cron Sync BPS Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to execute cron sync" },
      { status: 500 }
    );
  }
}
