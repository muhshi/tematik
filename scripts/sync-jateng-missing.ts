/**
 * Script Dinamis: Fetch data 3 indikator Jateng (TPAK, TPT, Kemiskinan) dari BPS API
 * dan insert ke Supabase. Semua data di-fetch secara real-time, BUKAN hardcode.
 * 
 * Cara pakai: npx dotenvx run -- npx tsx scripts/sync-jateng-missing.ts
 */
import { config } from "dotenv";
config();
import { sql } from "../src/lib/db";

const BPS_API_KEY = process.env.BPS_API_KEY;
const DOMAIN_JATENG = 3300;
const ALL_YEARS = [2025, 2024, 2023, 2022, 2021, 2020];

// Indikator Jateng yang perlu di-fetch
const JATENG_VARS = [
  { varId: 63, name: "TPAK" },
  { varId: 64, name: "TPT" },
  { varId: 137, name: "Laju Pertumbuhan PDRB" },
];

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function fetchBpsData(varId: number, thId: number): Promise<any | null> {
  const url = `https://webapi.bps.go.id/v1/api/list/model/data/domain/${DOMAIN_JATENG}/var/${varId}/th/${thId}/key/${BPS_API_KEY}/`;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });
    const json = await res.json();
    if (json && json["data-availability"] === "available" && json.datacontent) {
      return json;
    }
    return null;
  } catch (e: any) {
    console.warn(`  Fetch failed for var ${varId} th ${thId}: ${e.message}`);
    return null;
  }
}

async function main() {
  console.log("=== Sync Jateng Missing Indicators (Dinamis) ===\n");

  for (const { varId, name } of JATENG_VARS) {
    console.log(`\n--- ${name} (var ${varId}) ---`);

    for (const year of ALL_YEARS) {
      const thId = year - 1900;
      await delay(300); // Rate limiting

      const data = await fetchBpsData(varId, thId);
      if (!data) {
        console.log(`  ${year}: No data`);
        continue;
      }

      const vervarList = data.vervar || [];
      const datacontent = data.datacontent || {};
      const turvarList = data.turvar || [];
      const turvar_id = turvarList.length > 0 ? turvarList[0].val : 0;
      const turtahunList = data.turtahun || [];
      const turtahun_id = turtahunList.length > 0 ? turtahunList[0].val : 0;

      let insertCount = 0;

      for (const vervar of vervarList) {
        const regionId = parseInt(vervar.val, 10);
        const regionLabel: string = vervar.label || "";
        if (isNaN(regionId)) continue;

        // Extract BPS code from label (e.g. "3321 Kabupaten Demak" -> "3321")
        const codeMatch = regionLabel.match(/^(\d{4})\s/);
        const regionCode = codeMatch ? codeMatch[1] : String(regionId);
        const regionName = regionLabel.replace(/^\d+\s*/, "").trim();

        // Build data key: regionId + varId + turvar_id + thId + turtahun_id
        const dataKey = `${regionId}${varId}${turvar_id}${thId}${turtahun_id}`;
        let val = datacontent[dataKey];

        // Fallback: try different turvar combinations
        if (val === undefined && turvarList.length > 1) {
          for (const tv of turvarList) {
            const fallbackKey = `${regionId}${varId}${tv.val}${thId}${turtahun_id}`;
            if (datacontent[fallbackKey] !== undefined) {
              val = datacontent[fallbackKey];
              break;
            }
          }
        }

        if (val !== undefined && val !== null) {
          const numVal = typeof val === "number" ? val : parseFloat(val) || 0;

          await sql`
            INSERT INTO bps_data (domain, var_id, year, region_id, region_code, region_name, value, fetched_at)
            VALUES (${DOMAIN_JATENG}, ${varId}, ${year}, ${regionId}, ${regionCode}, ${regionName}, ${numVal}, NOW())
            ON CONFLICT (domain, var_id, year, region_id) 
            DO UPDATE SET 
              value = EXCLUDED.value, 
              region_code = EXCLUDED.region_code,
              region_name = EXCLUDED.region_name, 
              fetched_at = NOW()
          `;
          insertCount++;
        }
      }

      console.log(`  ${year}: Inserted ${insertCount} rows`);
    }
  }

  // Clear redis cache
  console.log("\nClearing Redis cache...");
  try {
    const { deleteCache } = await import("../src/lib/redis");
    await deleteCache("map:*");
    await deleteCache("indicators:*");
    console.log("Redis cache cleared!");
  } catch {
    console.warn("Redis clear failed (non-critical)");
  }

  console.log("\nDone!");
  process.exit(0);
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
