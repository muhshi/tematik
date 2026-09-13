# WebGIS Tematik Demak & Jawa Tengah - Frontend Web Client

Aplikasi web Sistem Informasi Geografis (WebGIS) interaktif berbasis Next.js dan TypeScript untuk visualisasi data statistik resmi BPS (Badan Pusat Statistik) Kabupaten Demak dan Provinsi Jawa Tengah.

---

## 1. Arsitektur & Teknologi

* **Framework**: Next.js (App Router, Turbopack)
* **Bahasa**: TypeScript (Strict Mode)
* **Styling & Komponen**: Tailwind CSS, shadcn/ui
* **Visualisasi Peta**: Leaflet, React-Leaflet, GeoJSON Spasial
* **Manajemen Ikon**: `lucide-react` 
* **Autentikasi**: NextAuth.js (Session & Credentials Provider)
* **State & Fetching**: React Hooks, Native Fetch dengan proteksi AbortSignal & Proxy Handler

---

## 2. Struktur Direktori Komponen

Mengikuti standar modular `Elements`, `Fragments`, dan `Layouts` di dalam folder `src/components/`:

```
frontend/
├── public/
│   ├── geojson/              # Aset file batas geospasial publik
│   └── logoBPS.png           # Identitas resmi BPS
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── admin/            # Dashboard manajemen indikator (Protected)
│   │   ├── api/              # Internal API Proxy ke backend Express
│   │   │   ├── auth/         # NextAuth route handler
│   │   │   ├── available-years/ # Proxy ketersediaan tahun survei
│   │   │   ├── indicators/   # Proxy indikator aktif
│   │   │   ├── map-data/     # Proxy data peta Jateng & Kecamatan
│   │   │   └── master-data/  # Master dataset lokal
│   │   ├── dashboard/        # Halaman Peta Tematik Choropleth interaktif
│   │   ├── docs/             # Panduan dan cara membaca data statistik
│   │   ├── help/             # Pusat bantuan dan informasi metodologi
│   │   ├── login/            # Halaman autentikasi administrator
│   │   └── page.tsx          # Landing page utama publik
│   ├── components/
│   │   ├── Elements/         # Komponen dasar shadcn/ui (Button, Select, Tooltip, dll.)
│   │   ├── Fragments/        # Komponen fungsional (MapCanvas, FilterBar, RegionDetails,
│   │   │                     # MapLegend, ExportButton, Sidebar, LandingNavbar, dll.)
│   │   └── Layouts/          # Struktur kerangka aplikasi (DashboardLayout)
│   ├── services/             # Abstraksi pemanggilan API (mapData.ts, bpsApi.ts)
│   ├── types/                # Definisi tipe data TypeScript geospasial & metadata
│   └── lib/                  # Utilitas Supabase, Redis cache, dan helper function
```

---

## 3. Fitur Utama Frontend

1. **Peta Choropleth 2-Level Interaktif**:
   * **Level Provinsi**: Menampilkan sebaran data 35 Kabupaten/Kota se-Jawa Tengah.
   * **Level Kecamatan (Drill-Down)**: Klik pada kabupaten untuk masuk ke rincian data per-kecamatan (misalnya 14 kecamatan di Demak).
2. **Filter Dinamis & Real-Time**:
   * Pilihan kategori statistik (Sosial & Kependudukan, Ekonomi & Perdagangan, Pertanian).
   * Pilihan variabel indikator BPS aktif.
   * Pilihan tahun data yang secara otomatis menyesuaikan ketersediaan data historis dari database.
3. **Panel Informasi Wilayah (Region Details)**:
   * Menampilkan nilai indikator, peringkat, luas wilayah (km persegi), dan estimasi kepadatan penduduk.
   * Rincian demografi interaktif (proporsi gender dan piramida kelompok usia).
4. **Multi-Format Export Data**:
   * Unduh data tabular format CSV.
   * Unduh data geospasial format GeoJSON berstandar OGC untuk dibuka di QGIS/ArcGIS.
   * Unduh data terstruktur format JSON.
5. **Navigasi Responsif**:
   * Mendukung penuh tampilan desktop, tablet, dan smartphone dengan drawer menu adaptif.
   * Akses cepat kembali ke Landing Page (`/`) dari bilah navigasi atas, logo sidebar, maupun tautan menu.

---

## 4. Konfigurasi Environment Variables

Buat file `.env` atau `.env.local` di dalam folder `frontend/`:

```env
# Backend API Service URL
BACKEND_API_URL="http://127.0.0.1:5000/api"

# URL Publik Frontend
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Kunci API Resmi Web API BPS
BPS_API_KEY=your_bps_api_key_here

# Kredensial & Enkripsi NextAuth
AUTH_SECRET="your_random_secret_string_32_chars"
AUTH_URL="http://localhost:3000"
ADMIN_USERNAME=admin_bps
ADMIN_PASSWORD=your_secure_password

# Integrasi Database Supabase (Opsional)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Cache Redis Upstash (Opsional)
UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

---

## 5. Cara Menjalankan Frontend

Pastikan telah menginstal Node.js versi 18 ke atas (disarankan v20 atau v22):

```bash
# Masuk ke direktori frontend
cd frontend

# Instal dependensi
npm install

# Jalankan development server dengan Turbopack
npm run dev

# Memeriksa kepatuhan tipe TypeScript
npx tsc --noEmit

# Membangun untuk produksi
npm run build

# Menjalankan aplikasi hasil build produksi
npm run start
```

Aplikasi dapat diakses melalui peramban web di `http://localhost:3000`.
