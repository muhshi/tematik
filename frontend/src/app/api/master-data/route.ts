import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const jsonPath = path.join(process.cwd(), "../backend/data/db/master_data.json");
    const fileContent = await fs.readFile(jsonPath, "utf-8");
    const data = JSON.parse(fileContent);

    return NextResponse.json(data);
  } catch (err) {
    console.error("Gagal membaca master_data.json:", err);
    return NextResponse.json(
      { error: "Failed to load master data" },
      { status: 500 }
    );
  }
}
