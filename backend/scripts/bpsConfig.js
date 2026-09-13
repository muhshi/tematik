const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const DOMAIN_MAP = {
  "Cilacap": 3301, "Banyumas": 3302, "Purbalingga": 3303, "Banjarnegara": 3304,
  "Kebumen": 3305, "Purworejo": 3306, "Wonosobo": 3307, "Magelang": 3308,
  "Boyolali": 3309, "Klaten": 3310, "Sukoharjo": 3311, "Wonogiri": 3312,
  "Karanganyar": 3313, "Sragen": 3314, "Grobogan": 3315, "Blora": 3316,
  "Rembang": 3317, "Pati": 3318, "Kudus": 3319, "Jepara": 3320,
  "Demak": 3321, "Semarang": 3322, "Temanggung": 3323, "Kendal": 3324,
  "Batang": 3325, "Pekalongan": 3326, "Pemalang": 3327, "Tegal": 3328,
  "Brebes": 3329,
  "Kota Magelang": 3371, "Kota Surakarta": 3372, "Kota Salatiga": 3373,
  "Kota Semarang": 3374, "Kota Pekalongan": 3375, "Kota Tegal": 3376
};

const STRATEGIC_VAR_IDS = {
  IPM: [83, 2412, 2413, 2414, 2415], // Indeks Pembangunan Manusia
  TPT: 64,                           // Tingkat Pengangguran Terbuka
  KEMISKINAN: 34,                    // Penduduk Miskin
  TPAK_LP: 1888,                     // TPAK (Laki-laki / Perempuan)
  TPAK_TOTAL: 63,                    // TPAK (Total)
};

const RAW_DEMOGRAPHIC_MAPPINGS = `
Kabupaten Banjarnegara
	indicator:
	Proyeksi Penduduk Menurut Jenis Kelamin
Kabupaten Banyumas
	indicator:
	Jumlah Penduduk Menurut Kecamatan dan Jenis Kelamin
Kabupaten Batang
	indicator:
	Jumlah Penduduk menurut Jenis Kelamin dan Kecamatan di Kabupaten Batang
Kabupaten Blora
	indicator:
	Jumlah Penduduk Kecamatan Jati Menurut Desa/Kelurahan dan Jenis Kelamin
	Jumlah Penduduk Kecamatan Randublatung Menurut Desa/Kelurahan dan Jenis Kelamin
	Jumlah Penduduk Kecamatan Kradenan Menurut Desa/Kelurahan dan Jenis Kelamin
	Jumlah Penduduk Kecamatan Kedungtuban Menurut Desa/Kelurahan dan Jenis Kelamin
	Jumlah Penduduk Kecamatan Cepu Menurut Desa/Kelurahan dan Jenis Kelamin	
	Jumlah Penduduk Kecamatan Sambong Menurut Desa/Kelurahan dan Jenis Kelamin
	Jumlah Penduduk Kecamatan Jiken Menurut Desa/Kelurahan dan Jenis Kelamin
	Jumlah Penduduk Kecamatan Bogorejo Menurut Desa/Kelurahan dan Jenis Kelamin
	Jumlah Penduduk Kecamatan Jepon Menurut Desa/Kelurahan dan Jenis Kelamin
	Jumlah Penduduk Kecamatan Blora Menurut Desa/Kelurahan dan Jenis Kelamin
	Jumlah Penduduk Kecamatan Banjarejo Menurut Desa/Kelurahan dan Jenis Kelamin
	Jumlah Penduduk Kecamatan Tunjungan Menurut Desa/Kelurahan dan Jenis Kelamin
	Jumlah Penduduk Kecamatan Japah Menurut Desa/Kelurahan dan Jenis Kelamin
	Jumlah Penduduk Kecamatan Ngawen Menurut Desa/Kelurahan dan Jenis Kelamin
	Jumlah Penduduk Kecamatan Kunduran Menurut Desa/Kelurahan dan Jenis Kelamin
	Jumlah Penduduk Kecamatan Todanan Menurut Desa/Kelurahan dan Jenis Kelamin
Kabupaten Boyolali
	indicator:
	Jumlah, Laju Pertumbuhan, dan Kepadatan Penduduk: Karakteristik = Jumlah Penduduk (Jiwa)
Kabupaten Brebes
	indicator:
	Jumlah Penduduk Kabupaten Brebes Berdasarkan Kecamatan dan Jenis Kelamin
Kabupaten Cilacap
	indicator:
	Jumlah Penduduk Menurut Kecamatan dan Jenis Kelamin di Kabupaten Cilacap
Kabupaten Demak
	indicator:
	[Proyeksi Hasil LFSP2020] Penduduk Kabupaten Demak Menurut Kecamatan dan Jenis Kelamin
Kabupaten Grobogan
	indicator:
	Jumlah Penduduk Menurut Kelompok Umur dan Jenis Kelamin Berdasarkan Catatan Registrasi Kependudukan di Kecamatan Kedungjati
	Jumlah Penduduk Menurut Kelompok Umur dan Jenis Kelamin Berdasarkan Catatan Registrasi Kependudukan di Kecamatan Karangrayung
	Jumlah Penduduk Menurut Kelompok Umur dan Jenis Kelamin Berdasarkan Catatan Registrasi Kependudukan di Kecamatan Penawangan
	Jumlah Penduduk Menurut Kelompok Umur dan Jenis Kelamin Berdasarkan Catatan Registrasi Kependudukan di Kecamatan Toroh
	Jumlah Penduduk Menurut Kelompok Umur dan Jenis Kelamin Berdasarkan Catatan Registrasi Kependudukan di Kecamatan Geyer
	Jumlah Penduduk Menurut Kelompok Umur dan Jenis Kelamin Berdasarkan Catatan Registrasi Kependudukan di Kecamatan Pulokulon
	Jumlah Penduduk Menurut Kelompok Umur dan Jenis Kelamin Berdasarkan Catatan Registrasi Kependudukan di Kecamatan Kradenan
	Jumlah Penduduk Menurut Kelompok Umur dan Jenis Kelamin Berdasarkan Catatan Registrasi Kependudukan di Kecamatan Gabus
	Jumlah Penduduk Menurut Kelompok Umur dan Jenis Kelamin Berdasarkan Catatan Registrasi Kependudukan di Kecamatan Ngaringan
	Jumlah Penduduk Menurut Kelompok Umur dan Jenis Kelamin Berdasarkan Catatan Registrasi Kependudukan di Kecamatan Wirosari
	Jumlah Penduduk Menurut Kelompok Umur dan Jenis Kelamin Berdasarkan Catatan Registrasi Kependudukan di Kecamatan Tawangharjo
	Jumlah Penduduk Menurut Kelompok Umur dan Jenis Kelamin Berdasarkan Catatan Registrasi Kependudukan di Kecamatan Grobogan
	Jumlah Penduduk Menurut Kelompok Umur dan Jenis Kelamin Berdasarkan Catatan Registrasi Kependudukan di Kecamatan Purwodadi
	Jumlah Penduduk Menurut Kelompok Umur dan Jenis Kelamin Berdasarkan Catatan Registrasi Kependudukan di Kecamatan Brati
	Jumlah Penduduk Menurut Kelompok Umur dan Jenis Kelamin Berdasarkan Catatan Registrasi Kependudukan di Kecamatan Klambu
	Jumlah Penduduk Menurut Kelompok Umur dan Jenis Kelamin Berdasarkan Catatan Registrasi Kependudukan di Kecamatan Godong
	Jumlah Penduduk Menurut Kelompok Umur dan Jenis Kelamin Berdasarkan Catatan Registrasi Kependudukan di Kecamatan Gubug
	Jumlah Penduduk Menurut Kelompok Umur dan Jenis Kelamin Berdasarkan Catatan Registrasi Kependudukan di Kecamatan Tegowanu
	Jumlah Penduduk Menurut Kelompok Umur dan Jenis Kelamin Berdasarkan Catatan Registrasi Kependudukan di Kecamatan Tanggungharjo
Kabupaten Jepara
	indicator:
	Penduduk Menurut Kecamatan di Kabupaten Jepara
Kabupaten Karanganyar
	indicator:
	Jumlah Penduduk Menurut Kecamatan dan Jenis Kelamin
Kabupaten Kebumen
	indicator:
	Jumlah Penduduk Kabupaten Kebumen Menurut Jenis Kelamin dan Kecamatan
Kabupaten Kendal
	indicator:
	Penduduk Menurut Jenis Kelamin
Kabupaten Klaten
	indicator:
	Penduduk Menurut Jenis Kelamin
Kabupaten Kudus
	indicator:
	Jumlah Penduduk Menurut Jenis Kelamin di Kabupaten Kudus
Kabupaten Magelang
	indicator:
	Hasil Proyeksi SP2020 : Jumlah Penduduk Menurut Jenis Kelamin dan Kecamatan di Kabupaten Magelang
Kabupaten Pati
	indicator:
	Jumlah Penduduk Menurut Jenis Kelamin
Kabupaten Pekalongan
	indicator:
	Jumlah Penduduk (Total) Menurut Kecamatan di Kabupaten Pekalongan
	Jumlah Penduduk Laki-Laki Menurut Kecamatan di Kabupaten Pekalongan
	Jumlah Penduduk Perempuan Menurut Kecamatan di Kabupaten Pekalongan
Kabupaten Pemalang
	indicator:
	Jumlah Penduduk menurut Kecamatan
Kabupaten Purbalingga
	indicator:
	Jumlah Penduduk Menurut Kecamatan dan Jenis Kelamin di Kabupaten Purbalingga
Kabupaten Purworejo
	indicator:
	Penduduk Kecamatan Grabag
	Penduduk Kecamatan Ngombol
	Penduduk Kecamatan Purwodadi
	Penduduk Kecamatan Bagelen
	Penduduk Kecamatan Purworejo
	Penduduk Kecamatan Kaligesing
	Penduduk Kecamatan Banyuurip
	Penduduk Kecamatan Bayan
	Penduduk Kecamatan Kutoarjo
	Penduduk Kecamatan Butuh
	Penduduk Kecamatan Pituruh
	Penduduk Kecamatan Kemiri
	Penduduk Kecamatan Bruno
	Penduduk Kecamatan Gebang
	Penduduk Kecamatan Loano
	Penduduk Kecamatan Bener
Kabupaten Rembang
	indicator:
	Penduduk Menurut Kecamatan dan Jenis Kelamin
Kabupaten Semarang
	indicator:
	[Sidukcapil] Jumlah Penduduk Kecamatan Getasan Menurut Jenis Kelamin
	[Sidukcapil] Jumlah Penduduk Kecamatan Tengaran Menurut Jenis Kelamin
	[Sidukcapil] Jumlah Penduduk Kecamatan Susukan Menurut Jenis Kelamin
	[Sidukcapil] Jumlah Penduduk Kecamatan Kaliwungu Menurut Jenis Kelamin
	[Sidukcapil] Jumlah Penduduk Kecamatan Suruh Menurut Jenis Kelamin
	[Sidukcapil] Jumlah Penduduk Kecamatan Pabelan Menurut Jenis Kelamin
	[Sidukcapil] Jumlah Penduduk Kecamatan Tuntang Menurut Jenis Kelamin
	[Sidukcapil] Jumlah Penduduk Kecamatan Banyubiru Menurut Jenis Kelamin
	[Sidukcapil] Jumlah Penduduk Kecamatan Jambu Menurut Jenis Kelamin
	[Sidukcapil] Jumlah Penduduk Kecamatan Sumowono Menurut Jenis Kelamin
	[Sidukcapil] Jumlah Penduduk Kecamatan Ambarawa Menurut Jenis Kelamin
	[Sidukcapil] Jumlah Penduduk Kecamatan Bandungan Menurut Jenis Kelamin
	[Sidukcapil] Jumlah Penduduk Kecamatan Bawen Menurut Jenis Kelamin
	[Sidukcapil] Jumlah Penduduk Kecamatan Bringin Menurut Jenis Kelamin
	[Sidukcapil] Jumlah Penduduk Kecamatan Bancak Menurut Jenis Kelamin
	[Sidukcapil] Jumlah Penduduk Kecamatan Pringapus Menurut Jenis Kelamin
	[Sidukcapil] Jumlah Penduduk Kecamatan Bergas Menurut Jenis Kelamin
	[Sidukcapil] Jumlah Penduduk Kecamatan Ungaran Barat Menurut Jenis Kelamin
	[Sidukcapil] Jumlah Penduduk Kecamatan Ungaran Timur Menurut Jenis Kelamin
Kabupaten Sragen
	indicator:
	Jumlah Penduduk Kabupaten Sragen
Kabupaten Sukoharjo
	indicator:
	Proyeksi Penduduk 2020-2025 Kecamatan Weru
	Proyeksi Penduduk 2020-2025 Kecamatan Bulu
	Proyeksi Penduduk 2020-2025 Kecamatan Tawangsari
	Proyeksi Penduduk 2020-2025 Kecamatan Sukoharjo
	Proyeksi Penduduk 2020-2025 Kecamatan Nguter
	Proyeksi Penduduk 2020-2025 Kecamatan Bendosari
	Proyeksi Penduduk 2020-2025 Kecamatan Polokarto
	Proyeksi Penduduk 2020-2025 Kecamatan Mojolaban
	Proyeksi Penduduk 2020-2025 Kecamatan Grogol
	Proyeksi Penduduk 2020-2025 Kecamatan Baki
	Proyeksi Penduduk 2020-2025 Kecamatan Gatak
	Proyeksi Penduduk 2020-2025 Kecamatan Kartasura
Kabupaten Tegal
	indicator:
	Jumlah Penduduk dan Rasio Jenis Kelamin menurut Kecamatan dan Jenis Kelamin
Kabupaten Temanggung
	indicator:
	Distribusi Kepadatan Penduduk:karakteristik = jumlah penduduk
Kabupaten Wonogiri
	indicator:
	Jumlah Penduduk per Kecamatan
Kabupaten Wonosobo
	indicator:
	Proyeksi Penduduk Desa di Kecamatan Wadaslintang
	Proyeksi Penduduk Desa di Kecamatan Kepil
	Proyeksi Penduduk Desa di Kecamatan Sapuran
	Proyeksi Penduduk Desa di Kecamatan Kalibawang
	Proyeksi Penduduk Desa di Kecamatan Kaliwiro
	Proyeksi Penduduk Desa di Kecamatan Leksono
	Proyeksi Penduduk Desa di Kecamatan Sukoharjo
	Proyeksi Penduduk Desa di Kecamatan Selomerto
	Proyeksi Penduduk Desa di Kecamatan Kalikajar
	Proyeksi Penduduk Desa di Kecamatan Kertek
	Proyeksi Penduduk Desa di Kecamatan Wonosobo
	Proyeksi Penduduk Desa di Kecamatan Watumalang
	Proyeksi Penduduk Desa di Kecamatan Mojotengah
	Proyeksi Penduduk Desa di Kecamatan Garung
	Proyeksi Penduduk Desa di Kecamatan Kejajar
Kota Magelang
	indicator:
	Jumlah Penduduk Menurut Kelompok Umur dan Jenis Kelamin di Kecamatan Magelang Utara
	Jumlah Penduduk Menurut Kelompok Umur dan Jenis Kelamin di Kecamatan Magelang Selatan
	Jumlah Penduduk Menurut Kelompok Umur dan Jenis Kelamin di Kecamatan Magelang Tengah
Kota Pekalongan
	indicator:
	Jumlah Penduduk Menurut Kecamatan dan Jenis Kelamin di Kota Pekalongan
Kota Salatiga
	indicator:
	Penduduk Menurut Jenis Kelamin
Kota Semarang
	indicator:
	Jumlah Penduduk Menurut Kecamatan dan Jenis Kelamin
Kota Surakarta
	indicator:
	Jumlah Penduduk Menurut Kecamatan
Kota Tegal
	indicator:
	Proyeksi Penduduk menurut Wilayah 2010 - 2020
`;

const parseDemographicMappings = () => {
  const lines = RAW_DEMOGRAPHIC_MAPPINGS.split('\n');
  const result = {};
  let currentKab = null;

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    if (line.startsWith('Kabupaten ') || line.startsWith('Kota ')) {
      let kabName = line.replace('Kabupaten ', '').replace('Kota ', '');
      if (kabName === 'Surakarta (Solo)') kabName = 'Surakarta';
      if (kabName === 'Semarang (Ibu kota provinsi)') kabName = 'Semarang';
      let searchKey = line.startsWith('Kota ') ? `Kota ${kabName}` : kabName;
      const key = Object.keys(DOMAIN_MAP).find(k => k.toLowerCase() === searchKey.toLowerCase());
      if (key) {
        currentKab = DOMAIN_MAP[key];
        result[currentKab] = [];
      } else {
        currentKab = null;
      }
    } else if (line.toLowerCase().startsWith('indicator:')) {
      continue;
    } else if (currentKab) {
      let karakteristik = null;
      if (line.includes(': karakteristik =') || line.includes(':karakteristik =') || line.includes(': Karakteristik =')) {
        const parts = line.split(/:\s*karakteristik\s*=/i);
        line = parts[0].trim();
        karakteristik = parts[1].trim().toLowerCase();
      }
      result[currentKab].push({ title: line, karakteristik });
    }
  }
  return result;
};

module.exports = {
  DOMAIN_MAP,
  STRATEGIC_VAR_IDS,
  getDemographicMappings: parseDemographicMappings,
  BPS_API_KEY: process.env.BPS_API_KEY || ""
};
