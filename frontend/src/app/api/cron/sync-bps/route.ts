import { NextResponse } from "next/server";
import { executeBpsSync } from "@/services/bpsScheduler";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await executeBpsSync();

    return NextResponse.json({
      status: result.success ? "success" : "partial_error",
      message: result.message,
      totalIndicators: result.totalIndicators,
      totalDataRows: result.totalDataRows,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Cron Sync BPS] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}
