# WebGIS Demak - Standalone Backend API (No Prisma)

API server standalone berbasis Node.js dan Express untuk melayani data statistik BPS Kabupaten Demak, sinkronisasi Supabase PostGIS, dan cache Redis.

## Endpoint API

- `GET /health` - Cek status kesehatan server
- `GET /api/map-data?year=2024&var=var-31` - Mengambil GeoJSON spasial lengkap dengan nilai statistik
- `GET /api/available-years?var=var-31` - Mengambil daftar tahun survei yang tersedia
- `GET /api/indicators/active` - Mengambil daftar indikator yang sedang aktif
- `GET /api/indicators` - Mengambil seluruh katalog indikator BPS
- `POST /api/indicators/active` - Mengupdate status aktif indikator (Admin)
- `POST /api/indicators/sync` - Memicu sinkronisasi katalog dari API BPS

## Menjalankan Backend

```bash
cd backend
npm install
npm run dev
```
