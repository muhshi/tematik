# WebGIS Tematik Demak & Jawa Tengah - Backend API Engine

Server REST API mandiri (*standalone*) berbasis Node.js dan Express untuk melayani kalkulasi data geospasial, integrasi Web API BPS (Badan Pusat Statistik), pembacaan database historis wilayah, dan manajemen *caching* multi-layer.

---

## 1. Arsitektur & Modul Utama

* **Runtime & Framework**: Node.js v20+ / Express.js
* **Mesin Geospasial**: `@turf/area` untuk kalkulasi luas area poligon dan kepadatan penduduk dinamis.
* **Integrasi Data BPS**:
  * **Domain 3300 (Jawa Tengah)**: Mengambil data agregat 35 Kabupaten/Kota secara *live* dari Web API BPS.
  * **Domain 3321 (Kabupaten Demak)**: Mengambil data indikator strategis spesifik Demak.
  * **Database Statis JSON**: Menyimpan data detail demografi (gender, kelompok umur) per-kecamatan untuk seluruh 35 kabupaten/kota.
* **Cache Manager Mandiri**:
  * Penyimpanan memori berbasis RAM untuk respon 0ms.
  * *Debounced Asynchronous Persistence* ke disk (`data/bps-cache-store.json`) untuk mencegah *event loop starvation*.
* **Otomasi Scheduler**:
  * Sinkronisasi katalog BPS otomatis setiap 24 jam.
  * Node-cron scheduler mingguan untuk pembaruan data rolling window.

---

## 2. Struktur Direktori Backend

```
backend/
├── assets/                   # Batas wilayah spasial GeoJSON resmi
│   ├── demak.geojson
│   ├── demak_kecamatan.geojson
│   ├── jateng_kecamatan_merged.geojson  # 576 batas kecamatan se-Jateng
│   └── jawa_tengah_kabupaten.geojson    # 35 batas kabupaten/kota se-Jateng
├── config/                   # Konfigurasi BPS API, Supabase, Redis
├── data/
│   ├── db/                   # Dataset JSON historis per-kabupaten (3301 - 3376)
│   ├── bps-cache-store.json  # Snapshot cache offline terkompresi
│   └── master_data.json      # Katalog indikator & metadata
├── routes/
│   ├── api.js                # Router utama (/api/map-data, /api/indicators, dll.)
│   └── bpsRoutes.js          # Router semantic matcher terpadu (/api/bps/*)
├── services/
│   ├── bpsService.js         # Client Web API BPS & normalisasi nama wilayah
│   ├── dbService.js          # Akses data lokal historis kabupaten & provinsi
│   ├── indicatorService.js   # Sinkronisasi & manajemen status indikator aktif
│   ├── mapService.js         # Penggabungan GeoJSON + Turf.js kalkulasi nilai
│   └── unifiedBpsService.js  # Semantic matcher variabel Demak <-> Jateng
├── utils/
│   ├── cacheManager.js       # In-Memory Cache dengan disk backup asinkron
│   └── domainMap.js          # Pemetaan kode domain BPS 35 Kab/Kota
├── server.js                 # Entry point server Express
└── package.json
```

---

## 3. Dokumentasi REST API

### Layanan Geospasial & Peta

#### `GET /api/map-data`
Mengambil data GeoJSON level Provinsi (35 Kabupaten/Kota se-Jawa Tengah).
* **Query Params**:
  * `year` (opsional, default: `"2024"`): Tahun data survei.
  * `var` (opsional, default: `"var-248"`): ID variabel indikator.
* **Contoh Request**:
  ```http
  GET /api/map-data?year=2024&var=var-248
  ```

#### `GET /api/map-data/kecamatan`
Mengambil data GeoJSON level Kecamatan untuk kabupaten yang dipilih (fitur Drill-Down).
* **Query Params**:
  * `kabupaten` (**wajib**): Nama Kabupaten/Kota (contoh: `Demak`, `Kudus`, `Semarang`).
  * `year` (opsional, default: `"2024"`): Tahun data survei.
  * `var` (opsional, default: `"var-248"`): ID variabel.
* **Contoh Request**:
  ```http
  GET /api/map-data/kecamatan?kabupaten=Demak&year=2024&var=var-248
  ```

---

### Layanan Filter & Indikator

#### `GET /api/available-years`
Mengembalikan daftar tahun yang tersedia untuk indikator dan kabupaten tertentu.
* **Query Params**:
  * `var` (**wajib**): ID variabel.
  * `kabupaten` (opsional): Nama kabupaten untuk memeriksa ketersediaan data lokal.
* **Contoh Request**:
  ```http
  GET /api/available-years?var=var-248&kabupaten=Demak
  ```

#### `GET /api/indicators/active`
Mengambil daftar indikator yang aktif untuk ditampilkan pada antarmuka publik.

#### `GET /api/indicators`
Mengambil seluruh katalog indikator BPS di database lokal.

#### `POST /api/indicators/active`
Memperbarui daftar indikator aktif (memerlukan hak akses Admin).
* **Body (JSON)**:
  ```json
  {
    "activeIds": ["var-248", "var-178", "var-213"]
  }
  ```

#### `POST /api/indicators/sync`
Memicu pembaruan dan sinkronisasi katalog langsung dari API BPS.

---

### Layanan Pemantauan Sistem

#### `GET /health`
Memeriksa status kesehatan server backend dan modul scheduler yang sedang aktif.
* **Format Response**:
  ```json
  {
    "status": "OK",
    "server": "WebGIS Demak Standalone Backend API (No Prisma)",
    "time": "2026-09-12T11:40:00.000Z",
    "scheduler": "24-Hour Automated BPS Sync Active"
  }
  ```

---

## 4. Konfigurasi Environment Variables

Buat file `.env` di dalam folder `backend/`:

```env
PORT=5000
BPS_API_KEY=your_bps_api_key_here
BPS_BASE_URL=https://webapi.bps.go.id/v1/api
BPS_DOMAIN=3300
BPS_DOMAIN_DEMAK=3321

# Konfigurasi Supabase PostGIS (Opsional)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Konfigurasi Redis Upstash (Opsional)
UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

---

## 5. Cara Menjalankan Backend

```bash
# Masuk ke direktori backend
cd backend

# Instal dependensi
npm install

# Menjalankan server dalam mode development dengan isolasi watch path:
# (Tidak akan restart saat file data atau cache berubah)
npm run dev

# Menjalankan server dalam mode produksi
npm start
```

Server backend akan berjalan di `http://localhost:5000`.
