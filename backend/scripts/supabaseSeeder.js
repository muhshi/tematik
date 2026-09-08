const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Skrip ini dirancang untuk membaca master_data.json 
// dan mem-push seluruh isinya ke Supabase jika sewaktu-waktu dibutuhkan.

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Gagal: Kredensial Supabase tidak ditemukan di .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// SQL Migration (Bisa dijalankan di SQL Editor Supabase):
/*
  CREATE TABLE bps_demografi_kecamatan (
    id SERIAL PRIMARY KEY,
    domain_bps INT NOT NULL,
    nama_kabupaten TEXT NOT NULL,
    id_kecamatan INT NOT NULL,
    nama_kecamatan TEXT NOT NULL,
    tahun INT NOT NULL,
    laki_laki INT,
    perempuan INT,
    total INT,
    UNIQUE(domain_bps, id_kecamatan, tahun)
  );

  CREATE TABLE bps_indikator_provinsi (
    id SERIAL PRIMARY KEY,
    id_kabupaten INT NOT NULL,
    nama_kabupaten TEXT NOT NULL,
    tahun INT NOT NULL,
    kependudukan_total INT,
    kependudukan_l INT,
    kependudukan_p INT,
    kependudukan_0_14 INT,
    kependudukan_15_64 INT,
    kependudukan_65_plus INT,
    kependudukan_0_14_l INT,
    kependudukan_15_64_l INT,
    kependudukan_65_plus_l INT,
    kependudukan_0_14_p INT,
    kependudukan_15_64_p INT,
    kependudukan_65_plus_p INT,
    ipm FLOAT,
    ipm_usia_harapan_hidup FLOAT,
    ipm_harapan_lama_sekolah FLOAT,
    ipm_rata_rata_lama_sekolah FLOAT,
    ipm_pengeluaran_per_kapita FLOAT,
    tpt FLOAT,
    tpak FLOAT,
    kemiskinan FLOAT,
    UNIQUE(id_kabupaten, tahun)
  );
*/

async function pushToSupabase() {
  console.log("Membaca master_data.json...");
  const masterPath = path.join(__dirname, '../data/db/master_data.json');
  if (!fs.existsSync(masterPath)) {
    console.error("master_data.json tidak ditemukan!");
    return;
  }

  const data = JSON.parse(fs.readFileSync(masterPath, 'utf8'));

  console.log("Mempersiapkan data Provinsi...");
  const provRows = [];
  
  // Mengumpulkan data per tahun untuk provinsi
  // (Karena datanya terpisah per indikator, kita gabung berdasarkan id_kabupaten dan tahun)
  const tempProv = {}; 
  const indicators = ['kependudukan', 'ipm', 'tpt', 'tpak', 'kemiskinan'];
  
  indicators.forEach(ind => {
    const indData = data.provinsi[ind];
    if (!indData) return;
    
    for (const [yearStr, kabList] of Object.entries(indData)) {
      const year = parseInt(yearStr);
      kabList.forEach(kab => {
        const id = kab.id_bps;
        const key = `${id}_${year}`;
        if (!tempProv[key]) {
          tempProv[key] = { id_kabupaten: id, nama_kabupaten: kab.nama_kabupaten || '', tahun: year };
        }
        
        if (ind === 'kependudukan') {
          tempProv[key].kependudukan_total = kab.total_penduduk?.Total;
          tempProv[key].kependudukan_l = kab.total_penduduk?.["Laki-laki"];
          tempProv[key].kependudukan_p = kab.total_penduduk?.["Perempuan"];
          
          tempProv[key].kependudukan_0_14 = kab.kelompok_umur_total?.["0-14"];
          tempProv[key].kependudukan_15_64 = kab.kelompok_umur_total?.["15-64"];
          tempProv[key].kependudukan_65_plus = kab.kelompok_umur_total?.["65+"];
          
          tempProv[key].kependudukan_0_14_l = kab.kelompok_umur_L?.["0-14"];
          tempProv[key].kependudukan_15_64_l = kab.kelompok_umur_L?.["15-64"];
          tempProv[key].kependudukan_65_plus_l = kab.kelompok_umur_L?.["65+"];
          
          tempProv[key].kependudukan_0_14_p = kab.kelompok_umur_P?.["0-14"];
          tempProv[key].kependudukan_15_64_p = kab.kelompok_umur_P?.["15-64"];
          tempProv[key].kependudukan_65_plus_p = kab.kelompok_umur_P?.["65+"];
          
        } else if (ind === 'ipm') {
          tempProv[key].ipm = kab.ipm;
          tempProv[key].ipm_usia_harapan_hidup = kab.usia_harapan_hidup;
          tempProv[key].ipm_harapan_lama_sekolah = kab.harapan_lama_sekolah;
          tempProv[key].ipm_rata_rata_lama_sekolah = kab.rata_rata_lama_sekolah;
          tempProv[key].ipm_pengeluaran_per_kapita = kab.pengeluaran_per_kapita;
        } else if (ind === 'tpt') {
          // BPS returns TPT as object { "Laki-laki": x, "Perempuan": y, "Total": z } or number
          tempProv[key].tpt = typeof kab.tpt === 'object' ? kab.tpt.Total : kab.tpt;
        } else if (ind === 'tpak') {
          tempProv[key].tpak = typeof kab.tpak === 'object' ? kab.tpak.Total : kab.tpak;
        } else if (ind === 'kemiskinan') {
          tempProv[key].kemiskinan = kab.kemiskinan;
        }
      });
    }
  });

  Object.values(tempProv).forEach(row => provRows.push(row));

  console.log("Mempersiapkan data Drilldown Kecamatan...");
  const kecRows = [];
  const drilldown = data.kabupaten_drilldown;
  const seenKec = new Set();
  
  for (const [domain, kabData] of Object.entries(drilldown)) {
    const namaKab = kabData.nama_kabupaten;
    for (const [yearStr, kecList] of Object.entries(kabData.data_per_tahun)) {
      const year = parseInt(yearStr);
      kecList.forEach(kec => {
        const id_k = parseInt(kec.id_bps);
        const key = `${domain}_${id_k}_${year}`;
        if (seenKec.has(key)) return;
        seenKec.add(key);

        kecRows.push({
          domain_bps: parseInt(domain),
          nama_kabupaten: namaKab,
          id_kecamatan: id_k,
          nama_kecamatan: kec.nama_kecamatan,
          tahun: year,
          laki_laki: kec.total_penduduk?.["Laki-laki"] ? Math.round(kec.total_penduduk["Laki-laki"]) : null,
          perempuan: kec.total_penduduk?.["Perempuan"] ? Math.round(kec.total_penduduk["Perempuan"]) : null,
          total: kec.total_penduduk?.Total ? Math.round(kec.total_penduduk.Total) : null
        });
      });
    }
  }

  console.log(`Siap mem-push ${provRows.length} baris Provinsi dan ${kecRows.length} baris Kecamatan.`);
  console.log(`[Estimasi Ukuran Supabase PostgreSQL]: ~1.5 MB s.d 2 MB (Termasuk Index). Sangat aman untuk free tier 500MB.`);
  
  console.log("Memasukkan data ke tabel bps_indikator_provinsi...");
  const { error: errProv } = await supabase.from('bps_indikator_provinsi').upsert(provRows, { onConflict: 'id_kabupaten,tahun' });
  if (errProv) console.error("Error Prov:", errProv);
  
  console.log("Memasukkan data ke tabel bps_demografi_kecamatan...");
  // Split data kecamatan ke dalam chunk 500 baris agar tidak timeout
  const chunkSize = 500;
  for (let i = 0; i < kecRows.length; i += chunkSize) {
    const chunk = kecRows.slice(i, i + chunkSize);
    const { error: errKec } = await supabase.from('bps_demografi_kecamatan').upsert(chunk, { onConflict: 'domain_bps,id_kecamatan,tahun' });
    if (errKec) console.error("Error Kec:", errKec);
  }
  
  console.log("Migrasi ke Supabase selesai!");
}

pushToSupabase();
