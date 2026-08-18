# 🗺️ WebGIS Tematik BPS Kabupaten Demak

Aplikasi Sistem Informasi Geografis (GIS) Tematik Interaktif untuk visualisasi data statistik resmi BPS Kabupaten Demak, Jawa Tengah.

## 📁 Struktur Monorepo (2 Folder)

```
tematik/
├── backend/                  # Standalone Express.js API Server (No Prisma)
│   ├── assets/               # File batas spasial GeoJSON (Demak, Kecamatan, Jawa Tengah)
│   ├── config/               # Konfigurasi BPS API, Supabase PostGIS, Redis
│   ├── data/                 # Penyimpanan snapshot data offline & katalog indikator
│   ├── db/                   # DatabaseManager & supabase_schema.sql
│   ├── routes/               # REST API Endpoints (/api/map-data, /api/indicators, dll.)
│   ├── services/             # Logika spasial Turf.js, BPS API Client & Scheduler
│   ├── server.js             # Entry point Express API Server
│   └── package.json
│
├── frontend/                 # Next.js 15 Fullstack Web Client (App Router)
│   ├── public/               # Static assets & logo BPS
│   ├── src/
│   │   ├── app/              # Halaman Dashboard, Admin, Docs, Help, Login
│   │   ├── components/       # UI Components, MapCanvas (Leaflet), Sidebar, FilterBar
│   │   ├── services/         # MapData & BPS API Fetcher
│   │   └── lib/              # Supabase Client, Redis Cache, DatabaseManager
│   └── package.json
│
├── supabase_schema.sql       # Skema SQL PostGIS lengkap untuk Supabase
└── package.json              # Script runner monorepo
```

## 🚀 Cara Menjalankan

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
