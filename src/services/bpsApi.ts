import * as cheerio from "cheerio";
import type {
  BpsListResponse,
  BpsStaticTableListItem,
  BpsStaticTableView,
  KecamatanData,
} from "@/types/map";

const BPS_BASE_URL = "https://webapi.bps.go.id/v1";

/**
 * Retrieve the BPS API key from environment variables.
 * Throws if the key is not configured.
 */
function getApiKey(): string {
  const key = process.env.BPS_API_KEY;
  if (!key || key === "your_bps_api_key_here") {
    throw new Error("BPS_API_KEY is not configured in .env.local");
  }
  return key;
}

/**
 * Fetch the list of static tables from BPS for Kabupaten Demak (domain 3321)
 * filtered by keyword "penduduk".
 */
export async function fetchStaticTableList(): Promise<
  BpsStaticTableListItem[]
> {
  const apiKey = getApiKey();
  const url = `${BPS_BASE_URL}/api/list/model/statictable/domain/3321/keyword/penduduk/key/${apiKey}/`;

  const response = await fetch(url, { next: { revalidate: 86400 } });

  if (!response.ok) {
    throw new Error(`BPS API list request failed: ${response.status}`);
  }

  const data: BpsListResponse = await response.json();

  if (data.status === "Error" || data["data-availability"] === "not-available") {
    return [];
  }

  return data.data[1] ?? [];
}

/**
 * Fetch a specific static table view by its ID.
 * Returns the raw data including the HTML table string.
 */
export async function fetchStaticTableView(
  tableId: number
): Promise<BpsStaticTableView["data"] | null> {
  const apiKey = getApiKey();
  const url = `${BPS_BASE_URL}/api/view/model/statictable/domain/3321/id/${tableId}/key/${apiKey}/`;

  const response = await fetch(url, { next: { revalidate: 86400 } });

  if (!response.ok) {
    throw new Error(`BPS API view request failed: ${response.status}`);
  }

  const result: BpsStaticTableView = await response.json();

  if (
    result.status === "Error" ||
    result["data-availability"] === "not-available"
  ) {
    return null;
  }

  return result.data;
}

/**
 * Normalize kecamatan name for consistent matching.
 * Converts to lowercase, removes extra whitespace, trims.
 */
export function normalizeKecamatanName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "").trim();
}

/**
 * Parse the raw HTML table string from BPS into structured KecamatanData.
 * Uses Cheerio to extract rows containing kecamatan names and population numbers.
 */
export function parsePopulationTable(htmlString: string): KecamatanData[] {
  const $ = cheerio.load(htmlString);
  const results: KecamatanData[] = [];

  // BPS tables vary in structure -- iterate all rows
  $("tr").each((_index, row) => {
    const cells = $(row).find("td");

    if (cells.length < 2) return;

    // Try to find kecamatan name + population number in each row
    const firstCell = $(cells[0]).text().trim();
    const lastCell = $(cells[cells.length - 1]).text().trim();

    // Skip header rows, total rows, or rows with non-data content
    if (!firstCell || firstCell.toLowerCase().includes("kecamatan")) return;
    if (firstCell.toLowerCase().includes("jumlah")) return;
    if (firstCell.toLowerCase().includes("total")) return;
    if (firstCell.toLowerCase().includes("kabupaten")) return;

    // Parse the population number (remove dots/commas used as thousand separators)
    const populationStr = lastCell.replace(/[.\s]/g, "").replace(",", ".");
    const population = parseInt(populationStr, 10);

    if (!isNaN(population) && population > 0) {
      results.push({
        kecamatan: firstCell,
        jumlahPenduduk: population,
      });
    }
  });

  return results;
}
