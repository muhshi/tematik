"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap, PathOptions, Layer } from "leaflet";
import type { DemakFeatureCollection, DemakFeature, Granularity } from "@/types/map";

interface MapCanvasProps {
  geojson: DemakFeatureCollection;
  onRegionClick: (feature: DemakFeature) => void;
  granularity: Granularity;
  year: string;
  indicatorName: string;
  dataKey?: string;
}

// {*Fungsi Utama: Komponen Visual yang merender Peta menggunakan library Leaflet*}
export default function MapCanvas({ geojson, onRegionClick, granularity, year, indicatorName, dataKey }: MapCanvasProps) {
  const mapRef = useRef<LeafletMap | null>(null);

  // {*Menyimpan GeoJSON yang sudah siap pakai*}
  const displayGeojson = geojson;

  // {*Menghitung Min/Max untuk Skala Warna*}
  const { minVal, range } = useMemo(() => {
    const vals = geojson.features
      .map((f) => f.properties.value)
      .filter((v) => v !== null) as number[];
    if (vals.length === 0) return { minVal: 0, range: 0 };
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    return { minVal: min, range: max - min };
  }, [geojson]);

  // {*Fungsi: Menentukan Warna spesifik untuk suatu nilai (menggunakan rentang min-max)*}
  const getColor = (value: number | null) => {
    if (value === null) return "#e2e8f0"; // {*Abu-abu jika tidak ada data*}
    if (range === 0) return "var(--choropleth-2)"; // {*Satu warna jika nilai sama semua*}
    const percent = (value - minVal) / range;
    if (percent > 0.75) return "var(--choropleth-4)";
    if (percent > 0.5) return "var(--choropleth-3)";
    if (percent > 0.25) return "var(--choropleth-2)";
    return "var(--choropleth-1)";
  };

  // {*Fungsi: Menerapkan styling (warna, ketebalan garis) untuk setiap Poligon/Wilayah Peta*}
  const getFeatureStyle = (feature: any, granularity: Granularity): PathOptions => {
    const val = feature?.properties?.value ?? null;
    return {
      fillColor: getColor(val),
      weight: granularity === "Kecamatan" ? 2 : 1,
      opacity: 1,
      color: "white", // Border color
      dashArray: granularity === "Kecamatan" ? "" : "3",
      fillOpacity: 0.8,
    };
  };

  // Helper component to adjust map bounds to fit GeoJSON
  function FitBounds({ data, currentGranularity }: { data: DemakFeatureCollection | null, currentGranularity: string }) {
    const map = useMap();
    useEffect(() => {
      if (data && data.features.length > 0) {
        import("leaflet").then((L) => {
          try {
            const layer = L.geoJSON(data as any);
            const bounds = layer.getBounds();
            if (bounds.isValid()) {
              if (currentGranularity === "Kecamatan") {
                map.flyToBounds(bounds, { duration: 1.5, padding: [20, 20] });
              } else {
                map.setView([-7.15, 110.14], 8, { animate: true, duration: 1 });
              }
            }
          } catch (e) {
            console.error("Bounds error", e);
          }
        });
      }
    }, [data, map, currentGranularity]);
    return null;
  }

  // Handle interaction for each polygon
  // {*Fungsi: Memastikan interaksi user (hover, klik) berjalan dengan benar di Peta*}
  const onEachFeature = (feature: any, layer: Layer) => {
    const demakFeature = feature as DemakFeature;
    const name = demakFeature.properties.district;
    const val = demakFeature.properties.value;
    
    // Format value number
    const valText = val !== null ? new Intl.NumberFormat("id-ID").format(val) : "Data Tidak Tersedia";

    // Bind popup
    const regionLabel = granularity === "Kabupaten" || granularity === "Provinsi" ? "Kabupaten/Kota" : "Kecamatan";
    layer.bindPopup(`
      <div class="font-semibold text-primary mb-1">${regionLabel} ${name}</div>
      <div class="text-muted-foreground text-sm">${indicatorName}: <span class="font-medium text-foreground">${valText}</span></div>
    `);

    // Click event
    layer.on({
      click: () => {
        onRegionClick(demakFeature);
        layer.bringToFront();
        layer.openPopup(); // Munculkan popup saat di-hover
      },
      mouseover: (e) => {
        const layer = e.target;
        layer.setStyle({
          weight: 3,
          color: "var(--accent)",
          dashArray: "",
          fillOpacity: 0.9,
        });
        layer.bringToFront();
        layer.openPopup(); // Munculkan popup saat di-hover
      },
      mouseout: (e) => {
        const layer = e.target;
        // Reset style
        layer.setStyle(getFeatureStyle(feature, granularity));
        layer.closePopup(); // Tutup popup saat mouse pergi
      },
    });
  };

  // Determine center & zoom based on granularity
  const center: [number, number] = granularity === "Kabupaten" || granularity === "Provinsi" ? [-7.15, 110.14] : [-6.89, 110.64];
  const zoom = granularity === "Kabupaten" || granularity === "Provinsi" ? 8 : 11;

  return (
    <div className="relative h-full w-full bg-slate-50">
      <MapContainer
        center={center}
        zoom={zoom}
        zoomControl={false}
        scrollWheelZoom={true}
        className="h-full w-full"
        ref={mapRef}
      >
        <ZoomControl position="topleft" />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        
        {displayGeojson && displayGeojson.features.length > 0 && (
          <GeoJSON
            key={`${granularity}-${year}-${indicatorName}-${displayGeojson.features.length}-${dataKey || ''}`} // Paksa react-leaflet render ulang
            data={displayGeojson}
            style={(feature) => getFeatureStyle(feature, granularity)}
            onEachFeature={onEachFeature}
          />
        )}
        <FitBounds data={displayGeojson} currentGranularity={granularity} />
      </MapContainer>
    </div>
  );
}
