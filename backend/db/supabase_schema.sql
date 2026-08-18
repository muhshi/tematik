-- ========================================================
-- WebGIS Demak - Supabase Database Schema (PostGIS)
-- Run this in your Supabase SQL Editor (https://app.supabase.com)
-- ========================================================

-- 1. Enable PostGIS Extension for Spatial/GIS Queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Table: BPS Indicators Catalog
CREATE TABLE IF NOT EXISTS bps_indicators (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    var_id INTEGER,
    unit TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table: Spatial Polygon Boundaries for Demak Districts (Kecamatan)
CREATE TABLE IF NOT EXISTS demak_kecamatan (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    area_km2 NUMERIC(10, 2),
    geom GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Table: BPS Statistical Data Points (Timeseries per District)
CREATE TABLE IF NOT EXISTS bps_datapoints (
    id SERIAL PRIMARY KEY,
    var_id INTEGER NOT NULL,
    year INTEGER NOT NULL,
    kecamatan TEXT NOT NULL,
    value NUMERIC(15, 4) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(var_id, year, kecamatan)
);

-- Index for ultra-fast time series & spatial lookup queries
CREATE INDEX IF NOT EXISTS idx_bps_datapoints_lookup ON bps_datapoints(var_id, year);
CREATE INDEX IF NOT EXISTS idx_demak_kecamatan_geom ON demak_kecamatan USING GIST(geom);

-- 5. Disable RLS or Allow Public Access for API Server (Anon Key Writes)
ALTER TABLE bps_indicators DISABLE ROW LEVEL SECURITY;
ALTER TABLE demak_kecamatan DISABLE ROW LEVEL SECURITY;
ALTER TABLE bps_datapoints DISABLE ROW LEVEL SECURITY;
