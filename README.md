# WebGIS Tematik BPS Kabupaten Demak

Aplikasi Sistem Informasi Geografis (GIS) Tematik Interaktif untuk visualisasi data statistik resmi BPS Kabupaten Demak dan Jawa Tengah.

## Struktur Monorepo (2 Folder)

```
tematik/
├── backend/                  # Standalone Express.js API Server (Port 5000)
│   ├── assets/               # File batas spasial GeoJSON (Demak, Kecamatan, Jawa Tengah)
│   ├── config/               # Konfigurasi BPS API, Supabase PostGIS, Redis
│   ├── data/                 # Penyimpanan snapshot data offline & katalog indikator
│   ├── db/                   # DatabaseManager & supabase_schema.sql
│   ├── routes/               # REST API Endpoints (/api/map-data, /api/indicators, dll.)
│   ├── services/             # Logika spasial Turf.js, Parallel BPS API Client & Scheduler
│   ├── utils/                # In-Memory CacheManager & String Similarity
│   ├── server.js             # Entry point Express API Server
│   └── package.json
│
├── frontend/                 # Next.js Fullstack Web Client (Port 3000)
│   ├── public/               # Static assets & logo BPS
│   ├── src/
│   │   ├── app/              # Halaman Dashboard, Admin, Docs, Help, Login
│   │   ├── components/       # Elements (shadcn/ui), Fragments (MapCanvas, FilterBar, ExportButton)
│   │   ├── services/         # MapData & BPS API Fetcher
│   │   └── lib/              # Supabase Client, Redis Cache, DatabaseManager
│   └── package.json
│
├── supabase_schema.sql       # Skema SQL PostGIS lengkap untuk Supabase
└── package.json              # Script runner monorepo
```

## Fitur Utama & Keunggulan

1. **Integritas Data Murni**: Seluruh data statistik bersumber resmi dari API BPS (Domain 3300 Jawa Tengah dan 3321 Demak). Wilayah tanpa publikasi BPS ditandai dengan status null netral ("Data Tidak Tersedia") tanpa data fiktif acak.
2. **Deterministic Multi-Layer Caching**: Caching berjenjang (RAM 0ms + Redis) dengan key komprehensif (`map:v2:level:var:year:kab`) yang menjamin tidak ada tabrakan atau tercampurnya data antarkategori.
3. **Paralelisasi Fetching (`Promise.all`)**: Pemanggilan BPS Provinsi dan BPS Kabupaten dijalankan simultan, mempercepat waktu respon hingga 50%.
4. **Standar UI shadcn/ui**: Seluruh kontrol filter peta menggunakan komponen `<Select>` berbasis standar shadcn/ui dengan badge kejelasan cakupan wilayah.
5. **Multi-Format Export**: Mendukung unduhan data tabular (CSV), data spasial poligon (GeoJSON) yang siap dibuka di QGIS/ArcGIS, serta data terstruktur (JSON).
6. **Strict Security**: API Key BPS dan kredensial aman di file environment tanpa ekspos hardcoded pada repositori.

## Cara Menjalankan

### 1. Menjalankan Backend (Port 5000)
```bash
cd backend
npm install
npm run dev
```

### 2. Menjalankan Frontend (Port 3000)
```bash
cd frontend
npm install
npm run dev
```

Buka peramban di [http://localhost:3000](http://localhost:3000).

---

## Dokumentasi Detail Sub-Projek

Untuk panduan mendalam arsitektur, daftar endpoint API, dan konfigurasi environment:
* [Dokumentasi Frontend Client (Next.js)](./frontend/README.md)
* [Dokumentasi Backend Engine (Express.js & BPS API)](./backend/README.md)

