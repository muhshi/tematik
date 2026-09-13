const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '../data/db');

/**
 * Mendapatkan data demografi provinsi dari DB statis JSON
 */
async function getProvinsiDemographicsFromDB(year) {
  const filePath = path.join(DB_DIR, `provinsi_3300_${year}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Data Provinsi Jateng tahun ${year} belum di-seed/tidak tersedia di Database.`);
  }
  const rawData = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(rawData);
}

/**
 * Mendapatkan data demografi kabupaten dari DB statis JSON
 */
async function getKabupatenDemographicsFromDB(kabName, yearStr) {
  const { getDomainForKabupaten } = require('../utils/domainMap');
  const domainCode = getDomainForKabupaten(kabName);
  
  if (!domainCode) {
    throw new Error(`Kabupaten/Kota "${kabName}" tidak ditemukan di database.`);
  }

  // Jika tahun tidak ditentukan, kembalikan semua data tahun yang tersedia
  if (!yearStr) {
    const availableYears = await getAvailableYears('kabupaten', kabName);
    if (availableYears.length === 0) {
      throw new Error(`Data Kabupaten ${domainCode} belum di-seed/tidak tersedia di Database.`);
    }
    
    const allYearsData = [];
    for (const y of availableYears) {
      allYearsData.push(await getKabupatenDemographicsFromDB(kabName, y));
    }
    
    return {
      level: "kabupaten",
      wilayah: kabName,
      domain_bps: domainCode,
      available_years: availableYears,
      data_per_tahun: allYearsData
    };
  }

  const requestedYear = yearStr || "2024";
  let filePath = path.join(DB_DIR, `kabupaten_${domainCode}_${requestedYear}.json`);
  
  // Cek apakah file tahun yang diminta ada di Database
  if (!fs.existsSync(filePath)) {
    // Fallback HANYA ke sistem lama unversioned jika ada (legacy support)
    const legacyPath = path.join(DB_DIR, `kabupaten_${domainCode}.json`);
    if (fs.existsSync(legacyPath)) {
      filePath = legacyPath;
    } else {
      throw new Error(`Data Kabupaten ${kabName} (${domainCode}) tahun ${requestedYear} belum di-seed/tidak tersedia di Database.`);
    }
  }

  const rawData = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(rawData);
  const actualYear = requestedYear;

  // Hitung indikator gabungan (Total Kabupaten) dari data kecamatan
  let totalLaki = 0, totalPerempuan = 0, totalSemua = 0;
  if (data.kecamatan_data) {
    data.kecamatan_data.forEach(k => {
      totalLaki += k.total_penduduk?.["Laki-laki"] || 0;
      totalPerempuan += k.total_penduduk?.["Perempuan"] || 0;
      totalSemua += k.total_penduduk?.["Total"] || 0;
    });
  }

  // Format response seperti API asli
  return {
    level: "kabupaten",
    wilayah: kabName,
    domain_bps: domainCode,
    tahun: actualYear,
    sumber: "Database Internal (Cached from BPS Web API)",
    indikator_gabungan: {
      total_penduduk: {
        "Laki-laki": totalLaki,
        "Perempuan": totalPerempuan,
        "Total": totalSemua || (totalLaki + totalPerempuan)
      },
      kelompok_umur_total: { "0-14": 0, "15-64": 0, "65+": 0 },
      kelompok_umur_L: { "0-14": 0, "15-64": 0, "65+": 0 },
      kelompok_umur_P: { "0-14": 0, "15-64": 0, "65+": 0 },
      kelompok_umur_note: "Data umur tidak dilacak dalam seeder spesifik ini."
    },
    kecamatan_data: data.kecamatan_data || []
  };
}

/**
 * Mendapatkan daftar tahun yang tersedia di DB untuk suatu wilayah
 */
async function getAvailableYears(level, kabName) {
  const years = [];
  
  if (level === 'provinsi') {
    const files = fs.readdirSync(DB_DIR);
    const provFiles = files.filter(f => f.startsWith('provinsi_3300_') && f.endsWith('.json'));
    provFiles.forEach(f => {
      const match = f.match(/_(\d{4})\.json$/);
      if (match) years.push(match[1]);
    });
  } else if (level === 'kabupaten') {
    if (!kabName) throw new Error("Nama kabupaten wajib diisi");
    
    const { getDomainForKabupaten } = require('../utils/domainMap');
    const domainCode = getDomainForKabupaten(kabName);
    
    if (!domainCode) {
      throw new Error(`Kabupaten/Kota "${kabName}" tidak ditemukan.`);
    }

    const files = fs.readdirSync(DB_DIR);
    const kabFiles = files.filter(f => f.startsWith(`kabupaten_${domainCode}_`) && f.endsWith('.json'));
    
    kabFiles.forEach(f => {
      const match = f.match(/_(\d{4})\.json$/);
      if (match) years.push(match[1]);
    });
    
    // Jika masih pakai format lama (tanpa tahun)
    if (years.length === 0 && fs.existsSync(path.join(DB_DIR, `kabupaten_${domainCode}.json`))) {
      years.push("2024"); 
    }
  } else if (['ipm', 'tpt', 'tpak', 'kemiskinan'].includes(level)) {
    const files = fs.readdirSync(DB_DIR);
    const prefix = `${level}_3300_`;
    const targetFiles = files.filter(f => f.startsWith(prefix) && f.endsWith('.json'));
    targetFiles.forEach(f => {
      const match = f.match(/_(\d{4})\.json$/);
      if (match) years.push(match[1]);
    });
  }
  
  return years.sort((a, b) => b.localeCompare(a)); // Sort descending
}

/**
 * Mendapatkan data indikator gabungan (Total) dari semua kabupaten/kota di DB
 */
async function getAllKabupatenDemographicsFromDB(yearStr) {
  const { KAB_DOMAIN_MAP } = require('../utils/domainMap');
  
  const allData = [];
  
  for (const kabName of Object.keys(KAB_DOMAIN_MAP)) {
    try {
      // Kita fetch data detail dari tiap kabupaten
      const data = await getKabupatenDemographicsFromDB(kabName, yearStr);
      // Untuk peta keseluruhan (choropleth Jateng), kita cuma butuh data agregat/gabungannya, 
      // tidak butuh detail per kecamatan agar payload tidak berat
      allData.push({
        level: data.level,
        wilayah: data.wilayah,
        domain_bps: data.domain_bps,
        tahun: data.tahun,
        sumber: data.sumber,
        indikator_gabungan: data.indikator_gabungan
      });
    } catch (e) {
      // Jika error (misal data kabupaten tertentu belum di-seed), skip saja
      console.warn(`[getAllKabupatenDemographicsFromDB] Skip ${kabName}: ${e.message}`);
    }
  }
  
  return allData;
}

/**
 * Mendapatkan data IPM dari DB statis JSON
 */
async function getIpmDataFromDB(year) {
  // Jika tahun tidak ditentukan, kembalikan semua data tahun yang tersedia
  if (!year) {
    const availableYears = await getAvailableYears('ipm', null);
    if (availableYears.length === 0) {
      throw new Error(`Data IPM Provinsi Jateng belum di-seed/tidak tersedia di Database.`);
    }
    
    const allYearsData = [];
    for (const y of availableYears) {
      const data = await getIpmDataFromDB(y);
      allYearsData.push({ tahun: y, data: data.kabupaten_data });
    }
    
    return {
      level: "provinsi_ipm",
      wilayah: "JAWA TENGAH",
      available_years: availableYears,
      data_per_tahun: allYearsData
    };
  }

  let filePath = path.join(DB_DIR, `ipm_3300_${year}.json`);
  if (!fs.existsSync(filePath)) {
    const files = fs.readdirSync(DB_DIR);
    const ipmFiles = files
      .filter(f => f.startsWith('ipm_3300_'))
      .sort((a, b) => b.localeCompare(a)); // Sort descending
    
    if (ipmFiles.length > 0) {
      filePath = path.join(DB_DIR, ipmFiles[0]);
    } else {
      throw new Error(`Data IPM Jateng belum di-seed sama sekali di Database.`);
    }
  }
  const rawData = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(rawData);
}

/**
 * Mendapatkan data TPT dari DB statis JSON
 */
async function getTptDataFromDB(year) {
  if (!year) {
    const availableYears = await getAvailableYears('tpt', null);
    if (availableYears.length === 0) throw new Error(`Data TPT belum di-seed.`);
    const allYearsData = [];
    for (const y of availableYears) {
      const data = await getTptDataFromDB(y);
      allYearsData.push({ tahun: y, data: data.kabupaten_data });
    }
    return { level: "provinsi_tpt", wilayah: "JAWA TENGAH", available_years: availableYears, data_per_tahun: allYearsData };
  }
  const filePath = path.join(DB_DIR, `tpt_3300_${year}.json`);
  if (!fs.existsSync(filePath)) throw new Error(`Data TPT tahun ${year} belum di-seed.`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/**
 * Mendapatkan data TPAK dari DB statis JSON
 */
async function getTpakDataFromDB(year) {
  if (!year) {
    const availableYears = await getAvailableYears('tpak', null);
    if (availableYears.length === 0) throw new Error(`Data TPAK belum di-seed.`);
    const allYearsData = [];
    for (const y of availableYears) {
      const data = await getTpakDataFromDB(y);
      allYearsData.push({ tahun: y, data: data.kabupaten_data });
    }
    return { level: "provinsi_tpak", wilayah: "JAWA TENGAH", available_years: availableYears, data_per_tahun: allYearsData };
  }
  const filePath = path.join(DB_DIR, `tpak_3300_${year}.json`);
  if (!fs.existsSync(filePath)) throw new Error(`Data TPAK tahun ${year} belum di-seed.`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/**
 * Mendapatkan data Kemiskinan dari DB statis JSON
 */
async function getKemiskinanDataFromDB(year) {
  if (!year) {
    const availableYears = await getAvailableYears('kemiskinan', null);
    if (availableYears.length === 0) throw new Error(`Data Kemiskinan belum di-seed.`);
    const allYearsData = [];
    for (const y of availableYears) {
      const data = await getKemiskinanDataFromDB(y);
      allYearsData.push({ tahun: y, data: data.kabupaten_data });
    }
    return { level: "provinsi_kemiskinan", wilayah: "JAWA TENGAH", available_years: availableYears, data_per_tahun: allYearsData };
  }
  const filePath = path.join(DB_DIR, `kemiskinan_3300_${year}.json`);
  if (!fs.existsSync(filePath)) throw new Error(`Data Kemiskinan tahun ${year} belum di-seed.`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

module.exports = {
  getProvinsiDemographicsFromDB,
  getKabupatenDemographicsFromDB,
  getAllKabupatenDemographicsFromDB,
  getAvailableYears,
  getIpmDataFromDB,
  getTptDataFromDB,
  getTpakDataFromDB,
  getKemiskinanDataFromDB
};
