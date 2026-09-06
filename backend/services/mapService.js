const fs = require("fs").promises;
const path = require("path");
const area = require("@turf/area").default || require("@turf/area");
const {
  fetchDynamicBpsData,
  fetchDemakStrategicData,
  normalizeRegionName,
} = require("./bpsService");
const dbService = require("./dbService");

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
        demographics: match?.demographics,
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

  let populationData = [];
  let source = "";
  let isCached = false;

  // Jika indikator Kependudukan (var 248), gunakan DB Statis (JSON)
  if (targetVarId === 248) {
    try {
      const provData = await dbService.getProvinsiDemographicsFromDB(requestedYear);
      // Map data ke format yang diharapkan fungsi join
      populationData = provData.kabupaten_data.map(d => ({
        kecamatan: d.nama_kabupaten,
        value: d.total_penduduk?.Total || 0,
        demographics: {
          gender: { 
            L: d.total_penduduk?.["Laki-laki"] || 0, 
            P: d.total_penduduk?.["Perempuan"] || 0 
          },
          age: {
            "0-14": d.kelompok_umur_total?.["0-14"] || 0,
            "15-64": d.kelompok_umur_total?.["15-64"] || 0,
            "65+": d.kelompok_umur_total?.["65+"] || 0
          }
        }
      }));
      source = "BPS API (Static JSON)";
      isCached = true;
    } catch (e) {
      console.warn("Gagal load dari static DB, fallback:", e);
    }
  } else {
    // Indikator lain: gunakan live API BPS
    const res = await fetchDynamicBpsData(requestedYear, targetVarId);
    populationData = res.data;
    source = res.source;
    isCached = res.isCached;
  }

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

async function getDrilldownMapData(kabupaten, requestedYear = "2024") {
  const geojsonAllKec = await loadGeoJson("jateng_kecamatan_merged.geojson");
  const normKab = normalizeRegionName(kabupaten);
  
  const filteredFeatures = geojsonAllKec.features.filter(f => 
    normalizeRegionName(f.properties.regency) === normKab
  );
  
  const geojsonKec = {
    type: "FeatureCollection",
    features: filteredFeatures
  };

  const { generateMockDemographics } = require("./bpsService");
  const { getDomainForKabupaten } = require("../utils/domainMap");
  
  const domainIdForKab = getDomainForKabupaten(kabupaten);
  let liveData = null;
  let source = "BPS Kabupaten/Kota (Mocked Fallback)";
  let actualYear = requestedYear;
  
  if (domainIdForKab) {
    try {
      // Selalu gunakan static DB untuk drilldown kecamatan (karena kita hanya punya DB ini)
      const kabData = await dbService.getKabupatenDemographicsFromDB(domainIdForKab, requestedYear);
      if (kabData && kabData.kecamatan_data) {
        liveData = kabData.kecamatan_data.map(d => ({
           kecamatan: d.nama_kecamatan,
           value: d.total_penduduk.Total,
           demographics: {
             gender: { L: d.total_penduduk["Laki-laki"], P: d.total_penduduk["Perempuan"] }
           }
        }));
        source = "BPS API (Static JSON)";
        actualYear = kabData.tahun;
      }
    } catch (e) {
      console.warn(`[mapService] Failed to fetch static DB data for domain ${domainIdForKab}`, e.message);
    }
  }

  const newFeatures = geojsonKec.features.map(feature => {
    let value = null;
    let demographics = undefined;
    
    // Try to match with liveData first
    if (liveData) {
      const match = liveData.find(d => normalizeRegionName(d.kecamatan) === normalizeRegionName(feature.properties.district));
      if (match && match.value !== null && !isNaN(match.value)) {
        value = match.value;
        demographics = match.demographics;
      }
    }
    
    const areaSqMeters = area(feature);
    const luasWilayah = areaSqMeters / 1_000_000;
    
    // If no live data matched, use mock fallback
    if (value === null) {
      value = Math.round(luasWilayah * (1000 + Math.random() * 1000));
      if (value < 10000) value += 20000;
      demographics = generateMockDemographics(value, 248);
    }
    
    const kepadatan = value / luasWilayah;
    
    return {
      ...feature,
      properties: {
        ...feature.properties,
        value,
        luasWilayah,
        kepadatan,
        demographics,
      }
    };
  });

  return {
    geojsonKecamatan: { ...geojsonKec, features: newFeatures },
    metadata: {
      source,
      year: actualYear,
      lastUpdated: new Date().toISOString(),
      isCached: false,
    }
  };
}

module.exports = { getEnrichedMapData, getDrilldownMapData };
