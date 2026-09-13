const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const BPS_API_KEY = process.env.BPS_API_KEY || "";

/**
 * Helper to fetch data from BPS Web API
 */
async function fetchBpsApi(url) {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000), // 10s timeout
    });
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    const data = await response.json();
    if (data && data.status === "Error") throw new Error(data.message || "BPS API Error");
    return data;
  } catch (error) {
    console.error(`[BPS API Error] Fetch failed for ${url}:`, error.message);
    return null;
  }
}

/**
 * Endpoint Provinsi: Menggabungkan 4 indikator demografi Jateng langsung dari API BPS (Domain 3300)
 * Serta merincikan data untuk 35 Kabupaten/Kota (Drill-down ke level Kabupaten)
 */
async function scrapeProvinsiDemographics(yearStr = "2024") {
  const domain = "3300"; // Jateng
  
  // Mapping tahun ke ID tahun BPS
  const yearMap = { "2023": "123", "2024": "124", "2025": "125" };
  const thId = yearMap[yearStr] || "124";
  
  const result = {
    level: "provinsi",
    wilayah: "Jawa Tengah",
    tahun: yearStr,
    sumber: "BPS Web API (Asli)",
    indikator_gabungan: {
      total_penduduk: { "Laki-laki": 0, "Perempuan": 0, "Total": 0 },
      kelompok_umur_total: { "0-14": 0, "15-64": 0, "65+": 0 },
      kelompok_umur_L: { "0-14": 0, "15-64": 0, "65+": 0 },
      kelompok_umur_P: { "0-14": 0, "15-64": 0, "65+": 0 }
    },
    kabupaten_data: [] // Data per kabupaten/kota se-Jawa Tengah
  };

  try {
    // 1. Fetch Var 860 (Gender)
    let res860 = await fetchBpsApi(`https://webapi.bps.go.id/v1/api/list/model/data/domain/${domain}/var/860/th/${thId}/key/${BPS_API_KEY}/`);
    // 2. Fetch Var 864 (Umur Total)
    let res864 = await fetchBpsApi(`https://webapi.bps.go.id/v1/api/list/model/data/domain/${domain}/var/864/th/${thId}/key/${BPS_API_KEY}/`);
    // 3. Fetch Var 865 (Umur Laki-laki)
    let res865 = await fetchBpsApi(`https://webapi.bps.go.id/v1/api/list/model/data/domain/${domain}/var/865/th/${thId}/key/${BPS_API_KEY}/`);
    // 4. Fetch Var 866 (Umur Perempuan)
    let res866 = await fetchBpsApi(`https://webapi.bps.go.id/v1/api/list/model/data/domain/${domain}/var/866/th/${thId}/key/${BPS_API_KEY}/`);

    if (!res860 || !res860.vervar) {
      result.error = "Gagal memuat data dari BPS";
      return result;
    }

    // Ambil list semua Kabupaten (vervar)
    const kabupatens = res860.vervar.filter(v => v.val !== parseInt(domain)); // Kecualikan Jateng itu sendiri
    
    // Isi total Jateng
    if (res860.datacontent) {
      result.indikator_gabungan.total_penduduk["Laki-laki"] = res860.datacontent[`${domain}86046${thId}0`] || 0;
      result.indikator_gabungan.total_penduduk["Perempuan"] = res860.datacontent[`${domain}86047${thId}0`] || 0;
      result.indikator_gabungan.total_penduduk["Total"] = res860.datacontent[`${domain}86048${thId}0`] || 0;
    }
    if (res864 && res864.datacontent) {
      result.indikator_gabungan.kelompok_umur_total["0-14"] = res864.datacontent[`${domain}8641263${thId}0`] || 0;
      result.indikator_gabungan.kelompok_umur_total["15-64"] = res864.datacontent[`${domain}8641264${thId}0`] || 0;
      result.indikator_gabungan.kelompok_umur_total["65+"] = res864.datacontent[`${domain}8641265${thId}0`] || 0;
    }
    if (res865 && res865.datacontent) {
      result.indikator_gabungan.kelompok_umur_L["0-14"] = res865.datacontent[`${domain}8651263${thId}0`] || 0;
      result.indikator_gabungan.kelompok_umur_L["15-64"] = res865.datacontent[`${domain}8651264${thId}0`] || 0;
      result.indikator_gabungan.kelompok_umur_L["65+"] = res865.datacontent[`${domain}8651265${thId}0`] || 0;
    }
    if (res866 && res866.datacontent) {
      result.indikator_gabungan.kelompok_umur_P["0-14"] = res866.datacontent[`${domain}8661263${thId}0`] || 0;
      result.indikator_gabungan.kelompok_umur_P["15-64"] = res866.datacontent[`${domain}8661264${thId}0`] || 0;
      result.indikator_gabungan.kelompok_umur_P["65+"] = res866.datacontent[`${domain}8661265${thId}0`] || 0;
    }

    // Looping data tiap kabupaten
    kabupatens.forEach(kab => {
      const kabId = kab.val;
      
      const dataKab = {
        id_bps: kabId,
        nama_kabupaten: kab.label,
        total_penduduk: { "Laki-laki": 0, "Perempuan": 0, "Total": 0 },
        kelompok_umur_total: { "0-14": 0, "15-64": 0, "65+": 0 },
        kelompok_umur_L: { "0-14": 0, "15-64": 0, "65+": 0 },
        kelompok_umur_P: { "0-14": 0, "15-64": 0, "65+": 0 }
      };

      if (res860.datacontent) {
        dataKab.total_penduduk["Laki-laki"] = res860.datacontent[`${kabId}86046${thId}0`] || 0;
        dataKab.total_penduduk["Perempuan"] = res860.datacontent[`${kabId}86047${thId}0`] || 0;
        dataKab.total_penduduk["Total"] = res860.datacontent[`${kabId}86048${thId}0`] || 0;
      }
      if (res864 && res864.datacontent) {
        dataKab.kelompok_umur_total["0-14"] = res864.datacontent[`${kabId}8641263${thId}0`] || 0;
        dataKab.kelompok_umur_total["15-64"] = res864.datacontent[`${kabId}8641264${thId}0`] || 0;
        dataKab.kelompok_umur_total["65+"] = res864.datacontent[`${kabId}8641265${thId}0`] || 0;
      }
      if (res865 && res865.datacontent) {
        dataKab.kelompok_umur_L["0-14"] = res865.datacontent[`${kabId}8651263${thId}0`] || 0;
        dataKab.kelompok_umur_L["15-64"] = res865.datacontent[`${kabId}8651264${thId}0`] || 0;
        dataKab.kelompok_umur_L["65+"] = res865.datacontent[`${kabId}8651265${thId}0`] || 0;
      }
      if (res866 && res866.datacontent) {
        dataKab.kelompok_umur_P["0-14"] = res866.datacontent[`${kabId}8661263${thId}0`] || 0;
        dataKab.kelompok_umur_P["15-64"] = res866.datacontent[`${kabId}8661264${thId}0`] || 0;
        dataKab.kelompok_umur_P["65+"] = res866.datacontent[`${kabId}8661265${thId}0`] || 0;
      }

      result.kabupaten_data.push(dataKab);
    });

  } catch (err) {
    console.error("Error building Provinsi demographics:", err);
  }

  return result;
}
const fs = require('fs');

/**
 * Endpoint Kabupaten: Mencari var_id dinamis per kabupaten, lalu tarik data level kecamatannya
 */
async function scrapeKabupatenDemographics(kabName, domainCode, yearStr = "2024") {
  // Mapping tahun ke ID tahun BPS
  const yearMap = { "2023": "123", "2024": "124", "2025": "125" };
  const thId = yearMap[yearStr] || "124";

  const result = {
    level: "kabupaten",
    wilayah: kabName,
    domain_bps: domainCode,
    tahun: yearStr,
    sumber: "BPS Web API (Asli)",
    indikator_gabungan: {
      total_penduduk: { "Laki-laki": 0, "Perempuan": 0, "Total": 0 },
      kelompok_umur_total: { "0-14": 0, "15-64": 0, "65+": 0 },
      kelompok_umur_L: { "0-14": 0, "15-64": 0, "65+": 0 },
      kelompok_umur_P: { "0-14": 0, "15-64": 0, "65+": 0 }
    },
    kecamatan_data: [] // Data per kecamatan
  };

  try {
    // 1. Baca mapping dari file JSON hasil scraping script
    const mappingPath = path.join(__dirname, '../data/bps-kabupaten-mapping.json');
    let varGenderId = null;
    let varUmurId = null;

    if (fs.existsSync(mappingPath)) {
      const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
      if (mapping[domainCode]) {
        if (mapping[domainCode].gender_has_kecamatan) varGenderId = mapping[domainCode].gender_var_id;
        if (mapping[domainCode].umur_has_kecamatan) varUmurId = mapping[domainCode].umur_var_id;
      }
    } else {
      result.error = "File mapping bps-kabupaten-mapping.json belum di-generate!";
      return result;
    }

    // 3. Fetch Data per Kecamatan jika var_id ditemukan
    if (varGenderId) {
      const dataGender = await fetchBpsApi(`https://webapi.bps.go.id/v1/api/list/model/data/domain/${domainCode}/var/${varGenderId}/th/${thId}/key/${BPS_API_KEY}/`);
      if (dataGender && dataGender.datacontent && dataGender.vervar) {
        
        // vervar adalah list kecamatan
        const kecamatans = dataGender.vervar.filter(v => v.val !== domainCode);
        const totalKab = dataGender.vervar.find(v => v.val === domainCode);

        // Map turvar untuk laki/perempuan/total
        const mapTurvar = {};
        if (dataGender.turvar) {
          dataGender.turvar.forEach(t => {
            const lbl = t.label.toLowerCase();
            if (lbl.includes("laki") && lbl.includes("perempuan")) {
              mapTurvar.Total = t.val;
            } else if (lbl.includes("laki") || lbl === "laki - laki") {
              mapTurvar.L = t.val;
            } else if (lbl.includes("perempuan")) {
              mapTurvar.P = t.val;
            } else if (lbl.includes("jumlah") || lbl.includes("total")) {
              mapTurvar.Total = t.val;
            }
          });
        }

        if (totalKab) {
          result.indikator_gabungan.total_penduduk["Laki-laki"] = dataGender.datacontent[`${domainCode}${varGenderId}${mapTurvar.L}${thId}0`] || 0;
          result.indikator_gabungan.total_penduduk["Perempuan"] = dataGender.datacontent[`${domainCode}${varGenderId}${mapTurvar.P}${thId}0`] || 0;
          result.indikator_gabungan.total_penduduk["Total"] = dataGender.datacontent[`${domainCode}${varGenderId}${mapTurvar.Total}${thId}0`] || 0;
        }

        kecamatans.forEach(kec => {
          result.kecamatan_data.push({
            id_bps: kec.val,
            nama_kecamatan: kec.label,
            total_penduduk: {
              "Laki-laki": dataGender.datacontent[`${kec.val}${varGenderId}${mapTurvar.L}${thId}0`] || 0,
              "Perempuan": dataGender.datacontent[`${kec.val}${varGenderId}${mapTurvar.P}${thId}0`] || 0,
              "Total": dataGender.datacontent[`${kec.val}${varGenderId}${mapTurvar.Total}${thId}0`] || 0
            }
          });
        });
      }
    } else {
      result.indikator_gabungan.total_penduduk_note = "Variabel Gender tidak ditemukan di API Kabupaten ini.";
    }

    if (varUmurId) {
      result.indikator_gabungan.kelompok_umur_note = `Ditemukan var_id Umur: ${varUmurId}. Perlu pemetaan turvar dinamis berdasar rentang 0-14, 15-64, 65+ untuk data aslinya.`;
    } else {
      result.indikator_gabungan.kelompok_umur_note = "Variabel Umur tidak ditemukan secara otomatis di API Kabupaten ini.";
    }

  } catch (err) {
    console.error(`Error building Kabupaten demographics for ${kabName}:`, err);
  }

  return result;
}

module.exports = {
  fetchBpsApi,
  scrapeProvinsiDemographics,
  scrapeKabupatenDemographics
};
