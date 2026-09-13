const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { DOMAIN_MAP, STRATEGIC_VAR_IDS, getDemographicMappings, BPS_API_KEY } = require('./bpsConfig');

// If TEST_MODE is active, use a test directory to avoid corrupting real DB
const isTestMode = process.env.TEST_MODE === 'true';
const dbDir = path.join(__dirname, isTestMode ? '../data/test_db' : '../data/db');
if (isTestMode && !fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const SCRATCH_DIR = path.join(__dirname, '../../scratch');

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchBpsApi(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(15000)
      });
      if (!res.ok) {
        if (i < retries) await sleep(1000);
        continue;
      }
      const data = await res.json();
      if (data && data.status === "Error") return null;
      return data;
    } catch (err) {
      if (i === retries) return null;
      await sleep(1000); // Wait 1 second before retry
    }
  }
  return null;
}

async function getAvailableYears(domain, varId, maxYears = 3) {
  const res = await fetchBpsApi(`https://webapi.bps.go.id/v1/api/list/model/th/domain/${domain}/var/${varId}/key/${BPS_API_KEY}/`);
  if (res && res.data && res.data[1]) {
    const sorted = res.data[1].sort((a, b) => parseInt(b.th) - parseInt(a.th));
    return sorted.slice(0, maxYears);
  }
  return [];
}

async function getThIdForVarAndYear(domain, varId, targetYearStr) {
   const thRes = await fetchBpsApi(`https://webapi.bps.go.id/v1/api/list/model/th/domain/${domain}/var/${varId}/key/${BPS_API_KEY}/`);
   if (!thRes || !thRes.data || !thRes.data[1]) return null;
   const match = thRes.data[1].find(t => t.th.toString() === targetYearStr.toString());
   return match ? match.th_id : null;
}

async function fetchAllVars(domain, subjectId) {
  let allVars = [];
  let maxPages = 1;
  for (let page = 1; page <= maxPages && page <= 10; page++) {
    const listRes = await fetchBpsApi(`https://webapi.bps.go.id/v1/api/list/model/var/domain/${domain}/subject/${subjectId}/page/${page}/key/${BPS_API_KEY}/`);
    if (listRes && listRes.data && listRes.data[1]) {
      allVars = [...allVars, ...listRes.data[1]];
      maxPages = listRes.data[0].pages || 1;
    } else {
      break;
    }
  }
  return allVars;
}

function checkIsFragmented(indicators) {
  if (indicators.length <= 1) return false;
  const titles = indicators.map(i => i.title.toLowerCase());
  const hasLaki = titles.some(t => t.includes('laki-laki') || t.includes('laki - laki'));
  const hasPerempuan = titles.some(t => t.includes('perempuan'));
  if (hasLaki && hasPerempuan && titles.every(t => t.includes('menurut kecamatan'))) {
    return false;
  }
  return true;
}

function extractKecamatanName(title) {
  const lower = title.toLowerCase();
  const idx = lower.indexOf('kecamatan ');
  if (idx !== -1) {
    let raw = title.substring(idx + 10);
    raw = raw.split(/\s+(?:Menurut|Berdasarkan|Desa|Tahun|\d{4})/i)[0].trim();
    return raw.replace(/^[^\w]+|[^\w]+$/g, '').trim();
  }
  return title.trim();
}

async function findVarIdByTitle(domain, targetTitle) {
  const normalizedTarget = targetTitle.toLowerCase().replace(/\s+/g, ' ').trim();

  const performMatch = (allVars) => {
    let bestMatch = allVars.find(v => v.title.toLowerCase().replace(/\s+/g, ' ').trim() === normalizedTarget);
    if (!bestMatch) {
      bestMatch = allVars.find(v => v.title.toLowerCase().includes(normalizedTarget) || normalizedTarget.includes(v.title.toLowerCase()));
    }
    if (!bestMatch) {
      const targetWords = normalizedTarget.replace(/[^\w\s]/gi, '').split(' ').filter(w => w.length > 2);
      let maxOverlap = 0;
      allVars.forEach(v => {
         const vTitle = v.title.toLowerCase().replace(/[^\w\s]/gi, '');
         let matches = targetWords.filter(w => vTitle.includes(w)).length;
         if (matches > maxOverlap && matches >= 3) {
             maxOverlap = matches;
             bestMatch = v;
         }
      });
    }
    return bestMatch;
  };

  // Try Subject 12 (Kependudukan) first
  let allVars = await fetchAllVars(domain, 12);
  let match = performMatch(allVars);
  
  // Fallback to Subject 40 (Gender) for anomalies (e.g. Salatiga 3373)
  if (!match) {
    allVars = await fetchAllVars(domain, 40);
    match = performMatch(allVars);
  }

  // Fallback to all variables without subject filter if still not found
  if (!match) {
    for (let page = 1; page <= 5; page++) {
      const listRes = await fetchBpsApi(`https://webapi.bps.go.id/v1/api/list/model/var/domain/${domain}/page/${page}/key/${BPS_API_KEY}/`);
      if (listRes && listRes.data && listRes.data[1]) {
        match = performMatch(listRes.data[1]);
        if (match) break;
      } else break;
    }
  }
  
  return match ? match.var_id : null;
}

function findDataValue(datacontent, vervarId, varId, turvarId, thId) {
  if (!datacontent || !turvarId) return 0;
  const prefix = `${vervarId}${varId}${turvarId}${thId}`;
  if (datacontent[`${prefix}0`] !== undefined) {
    return Number(datacontent[`${prefix}0`]) || 0;
  }
  if (datacontent[prefix] !== undefined) {
    return Number(datacontent[prefix]) || 0;
  }
  const foundKey = Object.keys(datacontent).find(k => k.startsWith(prefix));
  if (foundKey) {
    return Number(datacontent[foundKey]) || 0;
  }
  return 0;
}

function extractDataFromDatacontent(datacontent, varId, mapTurvar, thId, vervarId) {
  let L = 0, P = 0, Total = 0;
  if (mapTurvar.L) {
    L = findDataValue(datacontent, vervarId, varId, mapTurvar.L, thId);
  }
  if (mapTurvar.P) {
    P = findDataValue(datacontent, vervarId, varId, mapTurvar.P, thId);
  }
  if (mapTurvar.Total) {
    Total = findDataValue(datacontent, vervarId, varId, mapTurvar.Total, thId);
  }
  if (!Total && L && P) {
    Total = L + P;
  }
  return { L, P, Total };
}

// ------------------------------------------------------------------
// 1. STRATEGIC DATA SCRAPER (FAST & LIGHT - RUNS OFTEN)
// ------------------------------------------------------------------
async function scrapeStrategicData() {
  console.log("[AutoUpdater] Mulai scraping Data Strategis (IPM, TPT, TPAK, Kemiskinan)...");
  const domain = 3300; // Provinsi Jateng
  
  // Ambil tahun referensi (misal TPT biasanya paling up-to-date)
  const years = await getAvailableYears(domain, STRATEGIC_VAR_IDS.TPT, 3);
  if (!years.length) {
    console.error("[AutoUpdater] Gagal menarik tahun strategis dari BPS API.");
    return;
  }

  for (const yearObj of years) {
    const yearKey = yearObj.th;
    console.log(`[AutoUpdater] Memproses Data Strategis Tahun ${yearKey}...`);
    
    let baseMap = {};

    // Dapatkan TH_ID untuk tiap variabel di tahun ini
    const tptTh = await getThIdForVarAndYear(domain, STRATEGIC_VAR_IDS.TPT, yearKey);
    const kemiskinanTh = await getThIdForVarAndYear(domain, STRATEGIC_VAR_IDS.KEMISKINAN, yearKey);
    const tpakLpTh = await getThIdForVarAndYear(domain, STRATEGIC_VAR_IDS.TPAK_LP, yearKey);
    const tpakTotalTh = await getThIdForVarAndYear(domain, STRATEGIC_VAR_IDS.TPAK_TOTAL, yearKey);
    const ipmTh = await getThIdForVarAndYear(domain, STRATEGIC_VAR_IDS.IPM[0], yearKey); // IPM Utama

    const fetchData = async (vId, tId) => tId ? fetchBpsApi(`https://webapi.bps.go.id/v1/api/list/model/data/domain/${domain}/var/${vId}/th/${tId}/key/${BPS_API_KEY}/`) : null;

    const [tptData, kemiskinanData, tpakLpData, tpakTotalData] = await Promise.all([
      fetchData(STRATEGIC_VAR_IDS.TPT, tptTh),
      fetchData(STRATEGIC_VAR_IDS.KEMISKINAN, kemiskinanTh),
      fetchData(STRATEGIC_VAR_IDS.TPAK_LP, tpakLpTh),
      fetchData(STRATEGIC_VAR_IDS.TPAK_TOTAL, tpakTotalTh)
    ]);

    // Build base names dari Vervar Kemiskinan atau TPT
    const refData = kemiskinanData || tptData;
    if (refData && refData.vervar) {
      refData.vervar.forEach(v => {
        if (v.val === domain) return;
        baseMap[v.val] = { id_bps: v.val, nama_kabupaten: v.label.replace(/^\d+\s+/, '') };
      });
    }

    // 1. TPT
    if (tptData) {
      let out = { domain_bps: domain, tahun: parseInt(yearKey), kabupaten_data: [] };
      Object.keys(baseMap).forEach(vVal => {
         const keys = Object.keys(tptData.datacontent).filter(k => k.startsWith(`${vVal}${STRATEGIC_VAR_IDS.TPT}`));
         const val = keys.length > 0 ? tptData.datacontent[keys[0]] : 0;
         out.kabupaten_data.push({ ...baseMap[vVal], tpt: val });
      });
      fs.writeFileSync(path.join(dbDir, `tpt_3300_${yearKey}.json`), JSON.stringify(out, null, 2));
    }

    // 2. TPAK
    if (tpakLpData && tpakTotalData) {
      let out = { domain_bps: domain, tahun: parseInt(yearKey), kabupaten_data: [] };
      Object.keys(baseMap).forEach(vVal => {
         const LKey = `${vVal}${STRATEGIC_VAR_IDS.TPAK_LP}145${tpakLpTh}0`;
         const PKey = `${vVal}${STRATEGIC_VAR_IDS.TPAK_LP}146${tpakLpTh}0`;
         const totKeys = Object.keys(tpakTotalData.datacontent).filter(k => k.startsWith(`${vVal}${STRATEGIC_VAR_IDS.TPAK_TOTAL}`));
         
         const l = tpakLpData.datacontent[LKey] || 0;
         const p = tpakLpData.datacontent[PKey] || 0;
         const tot = totKeys.length > 0 ? tpakTotalData.datacontent[totKeys[0]] : 0;
         out.kabupaten_data.push({ ...baseMap[vVal], tpak: { "Laki-laki": l, "Perempuan": p, "Total": tot } });
      });
      fs.writeFileSync(path.join(dbDir, `tpak_3300_${yearKey}.json`), JSON.stringify(out, null, 2));
    }

    // 3. Kemiskinan
    if (kemiskinanData) {
      let out = { domain_bps: domain, tahun: parseInt(yearKey), kabupaten_data: [] };
      Object.keys(baseMap).forEach(vVal => {
         const JmlKey = `${vVal}${STRATEGIC_VAR_IDS.KEMISKINAN}50${kemiskinanTh}0`;
         const PctKey = `${vVal}${STRATEGIC_VAR_IDS.KEMISKINAN}55${kemiskinanTh}0`;
         const GarisKey = `${vVal}${STRATEGIC_VAR_IDS.KEMISKINAN}49${kemiskinanTh}0`;
         
         out.kabupaten_data.push({
           ...baseMap[vVal],
           jumlah_penduduk_miskin_ribu_jiwa: kemiskinanData.datacontent[JmlKey] || 0,
           persentase_penduduk_miskin: kemiskinanData.datacontent[PctKey] || 0,
           garis_kemiskinan_rp: kemiskinanData.datacontent[GarisKey] || 0
         });
      });
      fs.writeFileSync(path.join(dbDir, `kemiskinan_3300_${yearKey}.json`), JSON.stringify(out, null, 2));
    }
    
    // 4. IPM (5 komponen)
    let ipmDataArr = await Promise.all(STRATEGIC_VAR_IDS.IPM.map(async id => {
      const thId = await getThIdForVarAndYear(domain, id, yearKey);
      return fetchData(id, thId);
    }));
    if (ipmDataArr.some(d => d)) {
      let out = { domain_bps: domain, tahun: parseInt(yearKey), kabupaten_data: [] };
      Object.keys(baseMap).forEach(vVal => {
        let kabData = { ...baseMap[vVal] };
        
        // 0: IPM
        if (ipmDataArr[0]) {
           const keys0 = Object.keys(ipmDataArr[0].datacontent || {}).filter(k => k.startsWith(`${vVal}${STRATEGIC_VAR_IDS.IPM[0]}`));
           kabData.ipm = keys0.length > 0 ? ipmDataArr[0].datacontent[keys0[0]] : 0;
        }

        // 1: Usia Harapan Hidup
        if (ipmDataArr[1]) {
           const keys1 = Object.keys(ipmDataArr[1].datacontent || {}).filter(k => k.startsWith(`${vVal}${STRATEGIC_VAR_IDS.IPM[1]}`));
           kabData.usia_harapan_hidup = keys1.length > 0 ? ipmDataArr[1].datacontent[keys1[0]] : 0;
        }

        // 2: Harapan Lama Sekolah
        if (ipmDataArr[2]) {
           const keys2 = Object.keys(ipmDataArr[2].datacontent || {}).filter(k => k.startsWith(`${vVal}${STRATEGIC_VAR_IDS.IPM[2]}`));
           kabData.harapan_lama_sekolah = keys2.length > 0 ? ipmDataArr[2].datacontent[keys2[0]] : 0;
        }

        // 3: Rata-rata Lama Sekolah
        if (ipmDataArr[3]) {
           const keys3 = Object.keys(ipmDataArr[3].datacontent || {}).filter(k => k.startsWith(`${vVal}${STRATEGIC_VAR_IDS.IPM[3]}`));
           kabData.rata_rata_lama_sekolah = keys3.length > 0 ? ipmDataArr[3].datacontent[keys3[0]] : 0;
        }

        // 4: Pengeluaran per Kapita
        if (ipmDataArr[4]) {
           const keys4 = Object.keys(ipmDataArr[4].datacontent || {}).filter(k => k.startsWith(`${vVal}${STRATEGIC_VAR_IDS.IPM[4]}`));
           kabData.pengeluaran_per_kapita = keys4.length > 0 ? ipmDataArr[4].datacontent[keys4[0]] : 0;
        }

        out.kabupaten_data.push(kabData);
      });
      fs.writeFileSync(path.join(dbDir, `ipm_3300_${yearKey}.json`), JSON.stringify(out, null, 2));
    }

    // 5. Demak Strategic (Kecamatan Level IPM/Poverty if any)
    // We could fetch it here, but typically it falls back to empty array if BPS API doesn't have it for Demak 3321.
    // The frontend/backend handles the fallback gracefully.
  }
  
  // Note: Sync to Supabase is ideally done via the Supabase Service
  if (fs.existsSync(path.join(__dirname, 'supabaseSeeder.js')) && !isTestMode) {
     console.log("[AutoUpdater] Menyinkronkan Data Strategis ke Supabase...");
     try {
       execSync(`node ${path.join(__dirname, 'supabaseSeeder.js')}`, { stdio: 'inherit' });
     } catch(e) {
       console.error("[AutoUpdater] Gagal sinkronisasi Supabase", e);
     }
  }
  console.log("[AutoUpdater] Scraping Data Strategis Selesai!");
}

// ------------------------------------------------------------------
// 2. DEMOGRAPHICS SCRAPER (HEAVY - RUNS MONTHLY OR MANUALLY)
// ------------------------------------------------------------------
async function scrapeDemographics(force = false, targetDomain = null) {
  console.log("[AutoUpdater] Mulai scraping Demografi untuk Kabupaten/Kota... (PERINGATAN: PROSES INI BERAT DAN LAMA)");
  const reqMap = getDemographicMappings();
  
  for (const [domainStr, indicators] of Object.entries(reqMap)) {
    const domain = parseInt(domainStr);
    if (targetDomain && domain !== targetDomain) continue;
    
    // Cek jumlah file yang ada
    const existingFiles = fs.readdirSync(dbDir).filter(f => f.startsWith(`kabupaten_${domain}_`));
    if (existingFiles.length >= 3 && !isTestMode && !force) {
      console.log(`[AutoUpdater] Domain ${domain} sudah memiliki ${existingFiles.length} file. Melewati untuk efisiensi...`);
      continue;
    }

    console.log(`\n[AutoUpdater] Memproses Domain ${domain} (${indicators.length} indikator)`);
    let yearResults = {};
    let isFragmented = checkIsFragmented(indicators);

    for (const ind of indicators) {
      const varId = await findVarIdByTitle(domain, ind.title);
      if (!varId) {
        console.warn(`[AutoUpdater] Gagal menemukan varID untuk judul: ${ind.title} di domain ${domain}`);
        continue;
      }
      
      const topYears = await getAvailableYears(domain, varId, 3);
      if (!topYears.length) continue;
      
      for (const yearObj of topYears) {
        const thId = yearObj.th_id;
        const yearKey = yearObj.th;
        
        const dataRes = await fetchBpsApi(`https://webapi.bps.go.id/v1/api/list/model/data/domain/${domain}/var/${varId}/th/${thId}/key/${BPS_API_KEY}/`);
        if (dataRes && dataRes.datacontent && dataRes.vervar) {
          let mapTurvar = {};
          if (ind.karakteristik) {
            if (dataRes.turvar) {
              const match = dataRes.turvar.find(t => t.label.toLowerCase().includes(ind.karakteristik));
              if (match) mapTurvar.Total = match.val;
            }
          }
          
          if (!ind.karakteristik && dataRes.turvar) {
            dataRes.turvar.forEach(t => {
              const lbl = t.label.toLowerCase();
              if (lbl.includes("laki") && lbl.includes("perempuan")) mapTurvar.Total = t.val;
              else if (lbl.includes("laki") || lbl === "laki - laki") mapTurvar.L = t.val;
              else if (lbl.includes("perempuan")) mapTurvar.P = t.val;
              else if (lbl.includes("jumlah") || lbl.includes("total")) mapTurvar.Total = t.val;
            });
          }
          
          if (!mapTurvar.L && !mapTurvar.P && !mapTurvar.Total) {
             if (dataRes.turvar && dataRes.turvar.length > 0) mapTurvar.Total = dataRes.turvar[0].val;
             else mapTurvar.Total = 0; 
          }

          if (!yearResults[yearKey]) {
             yearResults[yearKey] = { tempKecamatanData: {}, kecamatan_data: [] };
          }
          let resYear = yearResults[yearKey];

          if (isFragmented) {
            const kecName = extractKecamatanName(ind.title);
            let sumL = 0, sumP = 0, sumTotal = 0;
            
            dataRes.vervar.forEach(v => {
               const lbl = v.label.toLowerCase();
               if (lbl.includes("jumlah") || lbl === dataRes.var[0].label.toLowerCase()) return;
               const data = extractDataFromDatacontent(dataRes.datacontent, varId, mapTurvar, thId, v.val);
               sumL += data.L; sumP += data.P; sumTotal += data.Total;
            });
            
            if (!sumTotal) sumTotal = sumL + sumP;
            
            const existingIdx = resYear.kecamatan_data.findIndex(k => k.nama_kecamatan.toLowerCase() === kecName.toLowerCase());
            const entry = {
              id_bps: varId, 
              nama_kecamatan: kecName,
              total_penduduk: { "Laki-laki": sumL, "Perempuan": sumP, "Total": sumTotal }
            };
            if (existingIdx >= 0) {
              resYear.kecamatan_data[existingIdx] = entry;
            } else {
              resYear.kecamatan_data.push(entry);
            }
          } else {
            dataRes.vervar.forEach(v => {
              const lbl = v.label.toLowerCase().trim();
              if (v.val === domain || lbl.startsWith("kabupaten ") || lbl.startsWith("kota ") || lbl === "total" || lbl === "jumlah" || lbl === "kabupaten" || lbl === "kota") return; 
              const data = extractDataFromDatacontent(dataRes.datacontent, varId, mapTurvar, thId, v.val);
              const cleanKecName = v.label.replace(/^\d+[\s.]*/, '').trim();
              
              if (indicators.length > 1 && !isFragmented) {
                if (!resYear.tempKecamatanData[v.val]) {
                  resYear.tempKecamatanData[v.val] = { id_bps: v.val, nama_kecamatan: cleanKecName, total_penduduk: { "Laki-laki": 0, "Perempuan": 0, "Total": 0 }};
                }
                if (ind.title.toLowerCase().includes("laki-laki")) resYear.tempKecamatanData[v.val].total_penduduk["Laki-laki"] = data.Total || data.L;
                else if (ind.title.toLowerCase().includes("perempuan")) resYear.tempKecamatanData[v.val].total_penduduk["Perempuan"] = data.Total || data.P;
                else resYear.tempKecamatanData[v.val].total_penduduk["Total"] = data.Total;
              } else {
                resYear.kecamatan_data.push({
                  id_bps: v.val,
                  nama_kecamatan: cleanKecName,
                  total_penduduk: { "Laki-laki": data.L, "Perempuan": data.P, "Total": data.Total || (data.L + data.P) }
                });
              }
            });
          }
        }
        await sleep(300); // Mencegah rate-limit
      }
      await sleep(300);
    }
    
    // Save to files per year
    for (const [yearKey, resYear] of Object.entries(yearResults)) {
      if (Object.keys(resYear.tempKecamatanData).length > 0) {
        resYear.kecamatan_data = Object.values(resYear.tempKecamatanData);
      }
      let kabNameStr = `Kabupaten ${domain}`;
      const foundKey = Object.keys(DOMAIN_MAP).find(k => DOMAIN_MAP[k] === domain);
      if (foundKey) kabNameStr = foundKey;
      
      const finalResult = {
        domain_bps: domain,
        tahun: parseInt(yearKey),
        nama_kabupaten: kabNameStr,
        kecamatan_data: resYear.kecamatan_data
      };
      const folderName = isTestMode ? 'test_db' : 'db';
      fs.writeFileSync(path.join(dbDir, `kabupaten_${domain}_${yearKey}.json`), JSON.stringify(finalResult, null, 2));
      console.log(`  [+] Disimpan ke ${folderName}/kabupaten_${domain}_${yearKey}.json (${resYear.kecamatan_data.length} kecamatan)`);
    }
  }
  console.log("[AutoUpdater] Scraping Demografi Selesai!");
}

/**
 * Membersihkan cache Redis agar Frontend melihat data terbaru
 */
function flushRedisCache() {
  console.log(`[AutoUpdater] Membersihkan Redis Cache...`);
  try {
    const flushScript = `
      require('dotenv').config({path: '${path.join(__dirname, '../.env').replace(/\\/g, '\\\\')}'});
      const { Redis } = require('@upstash/redis');
      const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
      redis.flushdb().then(() => { process.exit(0); }).catch(() => { process.exit(1); });
    `;
    execSync(`node -e "${flushScript}"`);
    console.log(`[AutoUpdater] Redis Cache berhasil dibersihkan.`);
  } catch (e) {
    console.warn(`[AutoUpdater] Gagal membersihkan Redis Cache: (mungkin environment tidak terpasang)`);
  }
}

/**
 * Menjalankan skrip Master JSON Builder untuk meracik ulang master_data.json
 */
function rebuildMasterJson() {
  console.log(`[AutoUpdater] Meracik ulang master_data.json...`);
  try {
    if (fs.existsSync(path.join(SCRATCH_DIR, 'build_master_json.js'))) {
      const execSync = require('child_process').execSync;
      execSync(`node ${path.join(SCRATCH_DIR, 'build_master_json.js')}`, { stdio: 'inherit', env: process.env });
    }
  } catch (err) {
    console.error(`[AutoUpdater] Gagal meracik master json: ${err.message}`);
  }
}

async function scrapeProvinsiJateng() {
  console.log("[AutoUpdater] Mulai scraping Demografi Tingkat Provinsi (Jawa Tengah - 3300)...");
  const domain = "3300";
  const years = { "2023": "123", "2024": "124", "2025": "125" };

  for (const [yearStr, thId] of Object.entries(years)) {
    console.log(`[AutoUpdater] Memproses Provinsi Jateng Tahun ${yearStr}...`);
    try {
      const res860 = await fetchBpsApi(`https://webapi.bps.go.id/v1/api/list/model/data/domain/${domain}/var/860/th/${thId}/key/${BPS_API_KEY}/`);
      const res864 = await fetchBpsApi(`https://webapi.bps.go.id/v1/api/list/model/data/domain/${domain}/var/864/th/${thId}/key/${BPS_API_KEY}/`);
      const res865 = await fetchBpsApi(`https://webapi.bps.go.id/v1/api/list/model/data/domain/${domain}/var/865/th/${thId}/key/${BPS_API_KEY}/`);
      const res866 = await fetchBpsApi(`https://webapi.bps.go.id/v1/api/list/model/data/domain/${domain}/var/866/th/${thId}/key/${BPS_API_KEY}/`);

      if (!res860 || !res860.vervar) continue;

      const kabupatens = res860.vervar.filter(v => v.val !== parseInt(domain));
      
      const result = {
        domain_bps: parseInt(domain),
        tahun: parseInt(yearStr),
        kabupaten_data: []
      };

      kabupatens.forEach(kab => {
        const kabId = kab.val;
        const dataKab = {
          id_bps: kabId,
          nama_kabupaten: kab.label,
          total_penduduk: {
            "Laki-laki": res860.datacontent[`${kabId}86046${thId}0`] || 0,
            "Perempuan": res860.datacontent[`${kabId}86047${thId}0`] || 0,
            "Total": res860.datacontent[`${kabId}86048${thId}0`] || 0
          },
          kelompok_umur_total: {
            "0-14": res864 && res864.datacontent ? (res864.datacontent[`${kabId}8641263${thId}0`] || 0) : 0,
            "15-64": res864 && res864.datacontent ? (res864.datacontent[`${kabId}8641264${thId}0`] || 0) : 0,
            "65+": res864 && res864.datacontent ? (res864.datacontent[`${kabId}8641265${thId}0`] || 0) : 0
          },
          kelompok_umur_L: {
            "0-14": res865 && res865.datacontent ? (res865.datacontent[`${kabId}8651263${thId}0`] || 0) : 0,
            "15-64": res865 && res865.datacontent ? (res865.datacontent[`${kabId}8651264${thId}0`] || 0) : 0,
            "65+": res865 && res865.datacontent ? (res865.datacontent[`${kabId}8651265${thId}0`] || 0) : 0
          },
          kelompok_umur_P: {
            "0-14": res866 && res866.datacontent ? (res866.datacontent[`${kabId}8661263${thId}0`] || 0) : 0,
            "15-64": res866 && res866.datacontent ? (res866.datacontent[`${kabId}8661264${thId}0`] || 0) : 0,
            "65+": res866 && res866.datacontent ? (res866.datacontent[`${kabId}8661265${thId}0`] || 0) : 0
          }
        };
        result.kabupaten_data.push(dataKab);
      });

      const folderName = isTestMode ? 'test_db' : 'db';
      fs.writeFileSync(path.join(dbDir, `provinsi_${domain}_${yearStr}.json`), JSON.stringify(result, null, 2));
      console.log(`  [+] Disimpan ke ${folderName}/provinsi_${domain}_${yearStr}.json`);
    } catch (err) {
      console.error(`[AutoUpdater] Gagal scraping provinsi ${yearStr}:`, err.message);
    }
  }
  console.log("[AutoUpdater] Scraping Provinsi Selesai!");
}

// ------------------------------------------------------------------
// 3. ORCHESTRATOR
// ------------------------------------------------------------------
async function runAutoUpdater(forceDemographics = false, targetDomain = null) {
  console.log("=========================================");
  console.log("[AutoUpdater] Memulai Pengecekan & Scraping Data BPS");
  
  if (isTestMode) {
    console.log("[AutoUpdater] BERJALAN DALAM TEST MODE. Menyimpan JSON ke folder test_db.");
  }

  try {
    if (targetDomain) {
      console.log(`[AutoUpdater] Menargetkan Domain spesifik: ${targetDomain}`);
      await scrapeDemographics(true, targetDomain);
      rebuildMasterJson();
      if (!isTestMode) flushRedisCache();
      console.log("[AutoUpdater] Proses Domain Spesifik Selesai.");
      return;
    }

    // 1. Selalu jalankan Data Strategis (cepat dan sering diupdate)
    await scrapeStrategicData();
    
    // Scrape Level Provinsi
    await scrapeProvinsiJateng();
    
    // 2. Cek apakah ini awal bulan, jika ya jalankan demografi yang berat, 
    // atau jika di-force lewat argumen.
    const today = new Date();
    const isFirstWeekOfMonth = today.getDate() <= 7;
    
    if (forceDemographics || isFirstWeekOfMonth || isTestMode) {
      await scrapeDemographics(forceDemographics);
    } else {
      console.log("[AutoUpdater] Skip Scraping Demografi (Hanya berjalan di minggu pertama setiap bulan).");
    }

    rebuildMasterJson();
    if (!isTestMode) {
      flushRedisCache();
    }

    console.log("[AutoUpdater] Seluruh Proses Berhasil.");
  } catch (err) {
    console.error("[AutoUpdater] FATAL ERROR:", err);
  }
  console.log("=========================================\n");
}

module.exports = {
  runAutoUpdater,
  scrapeDemographics,
  scrapeStrategicData
};

// Jika dijalankan langsung dari terminal
if (require.main === module) {
  const force = process.argv.includes('--force-demographics') || process.argv.includes('--force');
  const onlyDemo = process.argv.includes('--only-demographics');
  const domainIdx = process.argv.indexOf('--domain');
  const targetDomain = domainIdx !== -1 ? parseInt(process.argv[domainIdx + 1]) : null;

  if (onlyDemo) {
    scrapeDemographics(force, targetDomain).then(() => {
      rebuildMasterJson();
      if (!isTestMode) flushRedisCache();
    });
  } else {
    runAutoUpdater(force, targetDomain);
  }
}
