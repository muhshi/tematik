/**
 * Modul Unified Data Transformer & Normalizer
 * Mengonversi respons Dynamic Table API BPS mentah ke format JSON terstandar untuk konsumsi frontend peta
 */

/**
 * Normalisasi label wilayah BPS
 * Mengeluarkan kode wilayah (misal 3301 atau 3321010) dan nama wilayah bersih (misal "Cilacap" atau "Mranggen")
 * @param {string} label 
 * @returns {{ code: string|null, name: string }}
 */
function normalizeRegionLabel(label) {
  if (!label || typeof label !== "string") {
    return { code: null, name: "" };
  }

  const trimmed = label.trim();
  // Tangkap kode BPS jika tertera di awal string label (contoh: "3321010 MRANGGEN" atau "3301 CILACAP")
  const codeMatch = trimmed.match(/^(\d{4,7})\s*(.*)$/);
  if (codeMatch) {
    const rawName = codeMatch[2];
    const cleanName = rawName
      .replace(/^(kabupaten|kab\.?|kota|kecamatan|kec\.?)\s+/i, "")
      .trim();
    return {
      code: codeMatch[1],
      name: cleanName || rawName,
    };
  }

  const cleanName = trimmed
    .replace(/^(kabupaten|kab\.?|kota|kecamatan|kec\.?)\s+/i, "")
    .trim();

  return {
    code: null,
    name: cleanName || trimmed,
  };
}

/**
 * Fungsional 3: Unified Data Transformer & Normalizer
 * 
 * Mengonversi respons JSON mentah dari BPS menjadi format yang seragam:
 * {
 *   granularity: "kabupaten" | "kecamatan",
 *   year: 2024,
 *   indicator: { id, name, unit },
 *   data: [
 *     { bpsRegionId, regionCode, regionName, value, formattedValue }
 *   ],
 *   metadata: { source, recordCount, generatedAt }
 * }
 * 
 * @param {Object} rawBpsResponse - Respons JSON Dynamic Table dari BPS
 * @param {string} granularity - "kabupaten" | "kecamatan"
 * @param {number|string} year - Tahun data
 * @param {Object} indicatorInfo - Metadata indikator (id, name, unit, matchedJatengVarId, dll.)
 * @returns {Object} Normalized JSON
 */
function transformBpsDynamicResponse(rawBpsResponse, granularity = "kecamatan", year = 2024, indicatorInfo = {}) {
  const numericYear = parseInt(year, 10) || 2024;
  const thId = numericYear - 1900;

  if (
    !rawBpsResponse ||
    rawBpsResponse.status !== "OK" ||
    rawBpsResponse["data-availability"] === "not-available"
  ) {
    return {
      granularity,
      year: numericYear,
      indicator: {
        id: indicatorInfo.id || "var-unknown",
        name: indicatorInfo.name || "Indikator Tidak Ditemukan",
        unit: indicatorInfo.unit || "",
        matchedJatengVarId: indicatorInfo.matchedJatengVarId || null,
        matchedJatengTitle: indicatorInfo.matchedJatengTitle || null,
      },
      data: [],
      metadata: {
        source: granularity === "kabupaten" ? "BPS Provinsi Jawa Tengah (Domain 3300)" : "BPS Kabupaten Demak (Domain 3321)",
        recordCount: 0,
        status: "DATA_NOT_AVAILABLE",
        generatedAt: new Date().toISOString(),
      },
    };
  }

  const vervarList = rawBpsResponse.vervar || [];
  const datacontent = rawBpsResponse.datacontent || {};
  const turvarList = rawBpsResponse.turvar || [];
  const turtahunList = rawBpsResponse.turtahun || [];
  const varList = rawBpsResponse.var || [];

  const varId = varList.length > 0 ? varList[0].val : "";
  const turvarId = turvarList.length > 0 ? turvarList[turvarList.length - 1].val : 0;
  const turtahunId = turtahunList.length > 0 ? turtahunList[turtahunList.length - 1].val : 0;

  const normalizedData = [];

  for (const vervar of vervarList) {
    const regionId = vervar.val;
    const regionLabel = vervar.label || "";

    // Pada level kecamatan (Demak), abaikan agregat total "Kabupaten Demak" jika terdapat rincian kecamatan
    if (
      granularity === "kecamatan" &&
      vervarList.length > 1 &&
      (regionLabel.toLowerCase().includes("kab. demak") || regionLabel.toLowerCase().includes("kabupaten demak"))
    ) {
      continue;
    }

    // Resolusi composite key BPS: {vervar}{var}{turvar}{th}{turtahun}
    const primaryKey = `${regionId}${varId}${turvarId}${thId}${turtahunId}`;
    let rawValue = datacontent[primaryKey];

    // Fallback pencarian dengan turvar lain jika turvar default bernilai undefined
    if ((rawValue === undefined || rawValue === null) && turvarList.length > 1) {
      for (const tv of turvarList) {
        const fallbackKey = `${regionId}${varId}${tv.val}${thId}${turtahunId}`;
        if (datacontent[fallbackKey] !== undefined && datacontent[fallbackKey] !== null) {
          rawValue = datacontent[fallbackKey];
          break;
        }
      }
    }

    // Sanitasi dan parsing angka numerik murni
    let parsedValue = null;
    if (rawValue !== undefined && rawValue !== null && rawValue !== "-" && rawValue !== "...") {
      parsedValue = typeof rawValue === "number" ? rawValue : parseFloat(rawValue);
      if (isNaN(parsedValue)) parsedValue = null;
    }

    const { code, name } = normalizeRegionLabel(regionLabel);

    normalizedData.push({
      bpsRegionId: regionId.toString(),
      regionCode: code || regionId.toString(),
      regionName: name || regionLabel,
      value: parsedValue,
      formattedValue: parsedValue !== null ? parsedValue.toLocaleString("id-ID") : "N/A",
    });
  }

  return {
    granularity,
    year: numericYear,
    indicator: {
      id: indicatorInfo.id || `var-${varId}`,
      name: indicatorInfo.name || (varList[0]?.label ?? "Indikator"),
      unit: indicatorInfo.unit || (varList[0]?.unit ?? ""),
      matchedJatengVarId: indicatorInfo.matchedJatengVarId || null,
      matchedJatengTitle: indicatorInfo.matchedJatengTitle || null,
    },
    data: normalizedData,
    metadata: {
      source: granularity === "kabupaten" ? "BPS Provinsi Jawa Tengah (Domain 3300)" : "BPS Kabupaten Demak (Domain 3321)",
      recordCount: normalizedData.length,
      status: "SUCCESS",
      generatedAt: new Date().toISOString(),
    },
  };
}

module.exports = {
  transformBpsDynamicResponse,
  normalizeRegionLabel,
};
