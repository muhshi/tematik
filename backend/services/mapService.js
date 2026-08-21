const fs = require("fs").promises;
const path = require("path");
const area = require("@turf/area").default || require("@turf/area");
const {
  fetchDynamicBpsData,
  fetchDemakStrategicData,
  normalizeRegionName,
} = require("./bpsService");

async function loadGeoJson(filename) {
  const filePath = path.join(__dirname, "..", "assets", filename);
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw);
}

function matchDistrict(feature, dataList) {
  if (!dataList || dataList.length === 0) return undefined;
  const code = feature.properties?.code;
  const districtName = feature.properties?.district;
  const isKota = feature.properties?.type === "Kota" || districtName?.toLowerCase().startsWith("kota");

  // 1. Cocokkan berdasarkan kode wilayah 4 digit (misal: 3301)
  if (code) {
    const codeMatch = dataList.find((d) => {
      const dCode = (d.kecamatan.match(/^\d{4}/) || [])[0];
      return dCode === code;
    });
    if (codeMatch) return codeMatch;
  }

  // 2. Cocokkan berdasarkan kesamaan nama wilayah / kecamatan
  const normDistrict = normalizeRegionName(districtName);
  const nameMatch = dataList.find((d) => {
    const dIsKota = d.kecamatan.toLowerCase().includes("kota");
    if (code && isKota !== dIsKota) return false;
    return normalizeRegionName(d.kecamatan) === normDistrict;
  });
  if (nameMatch) return nameMatch;

  // 3. Jika hanya ada 1 data tunggal agregat (contoh: angka kemiskinan/IPM/TPT Demak), gunakan untuk kecamatan Demak
  if (dataList.length === 1) {
    return dataList[0];
  }

  return undefined;
}

function joinDataWithGeoJson(geoJson, popData, isKabupatenLevel = false, demakDetailData = []) {
  const newFeatures = geoJson.features.map((feature) => {
    let match = matchDistrict(feature, popData);
    let value = match && match.value !== null && !isNaN(match.value) ? match.value : null;

    const districtName = feature.properties?.district || "";
    const isDemak = normalizeRegionName(districtName) === "demak";

    // Khusus Peta Level Kab/Kota (Jateng): Jika nilai Demak belum terisi atau perlu penjumlahan kecamatan
    if (isKabupatenLevel && isDemak && (value === null || isNaN(value)) && demakDetailData && demakDetailData.length > 0) {
      const numValues = demakDetailData.map((d) => d.value).filter((v) => typeof v === "number" && !isNaN(v));
      if (numValues.length > 1) {
        // Penjumlahan total dari seluruh kecamatan (contoh: Jumlah Penduduk Demak = jumlah 14 kecamatan)
        value = numValues.reduce((a, b) => a + b, 0);
      } else if (numValues.length === 1) {
        value = numValues[0];
      }
    }

    const areaSqMeters = area(feature);
    const luasWilayah = areaSqMeters / 1_000_000;
    const kepadatan = value && luasWilayah > 0 ? value / luasWilayah : null;

    return {
      ...feature,
      properties: {
        ...feature.properties,
        value,
        luasWilayah,
        kepadatan,
      },
    };
  });

  return {
    ...geoJson,
    features: newFeatures,
  };
}

async function getEnrichedMapData(requestedYear = "2024", targetVarId) {
  const geojsonKec = await loadGeoJson("demak_kecamatan.geojson");
  let geojsonJateng = null;
  try {
    geojsonJateng = await loadGeoJson("jawa_tengah_kabupaten.geojson");
  } catch {
    geojsonJateng = geojsonKec;
  }

  const { data: populationData, source, isCached } = await fetchDynamicBpsData(
    requestedYear,
    targetVarId
  );

  const demakStrategicData = await fetchDemakStrategicData(requestedYear, targetVarId);

  // Level Kab/Kota: 35 Kab/Kota di Jawa Tengah dengan Demak teragregasi
  const enrichedGeoJsonKabupaten = joinDataWithGeoJson(geojsonJateng, populationData, true, demakStrategicData);
  // Level Kecamatan: 14 Kecamatan di Kabupaten Demak dengan data per kecamatan
  const enrichedGeoJsonKecamatan = joinDataWithGeoJson(geojsonKec, demakStrategicData, false);

  return {
    geojsonKabupaten: enrichedGeoJsonKabupaten,
    geojsonKecamatan: enrichedGeoJsonKecamatan,
    metadata: {
      source,
      year: requestedYear,
      lastUpdated: new Date().toISOString(),
      isCached,
    },
  };
}

module.exports = { getEnrichedMapData };
