"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
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
    const valText = (val !== null && val !== undefined && !isNaN(val)) ? new Intl.NumberFormat("id-ID").format(val) : "Data Tidak Tersedia";

    // Calculate percentage for the mini CSS bar
    const percent = (val !== null && range > 0) ? Math.max(5, Math.min(100, ((val - minVal) / range) * 100)) : 0;
    
    // Generate Gender HTML if demographics exist
    const demographics = demakFeature.properties.demographics;
    let genderHtml = "";
    if (demographics && demographics.gender && val !== null) {
      const { L, P } = demographics.gender;
      const total = L + P;
      if (total > 0) {
        const pctL = Math.round((L / total) * 100);
        const pctP = Math.round((P / total) * 100);
        genderHtml = `
          <div class="mt-2.5 pt-2.5 border-t border-slate-200/60">
            <div class="flex justify-between text-[9px] font-bold mb-1 uppercase tracking-wider">
              <span class="text-sky-600">Laki-laki ${pctL}%</span>
              <span class="text-rose-500">${pctP}% Perempuan</span>
            </div>
            <div class="h-1.5 w-full rounded-full flex overflow-hidden">
              <div class="h-full bg-sky-500" style="width: ${pctL}%"></div>
              <div class="h-full bg-rose-500" style="width: ${pctP}%"></div>
            </div>
            <div class="flex justify-between text-[10px] text-slate-500 mt-1 font-semibold">
              <span>${new Intl.NumberFormat("id-ID").format(L)}</span>
              <span>${new Intl.NumberFormat("id-ID").format(P)}</span>
            </div>
          </div>
        `;
      }
    }

    // Bind Custom Glassmorphism Tooltip
    const regionLabel = granularity === "Kabupaten" || granularity === "Provinsi" ? "Kabupaten/Kota" : "Kecamatan";
    layer.bindTooltip(`
      <div class="p-3 w-56">
        <div class="font-bold text-slate-800 text-sm mb-0.5 tracking-tight break-words">${regionLabel} ${name}</div>
        <div class="text-[10px] text-slate-500 font-medium mb-2.5 leading-tight line-clamp-2">${indicatorName}</div>
        <div class="flex flex-col gap-1.5">
           <div class="flex justify-between items-end">
              <span class="text-[10px] uppercase font-bold text-slate-400">Total</span>
              <span class="font-black text-primary text-sm">${valText}</span>
           </div>
           ${val !== null ? `
           <div class="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
             <div class="h-full bg-primary transition-all duration-500" style="width: ${percent}%"></div>
           </div>
           ` : ''}
        </div>
        ${genderHtml}
      </div>
    `, {
      sticky: true,
      className: 'glass-tooltip',
      opacity: 1,
      direction: 'top',
      offset: [0, -10]
    });

    // Click event
    layer.on({
      click: () => {
        onRegionClick(demakFeature);
        if ('bringToFront' in layer) (layer as any).bringToFront();
        if ('openPopup' in layer) (layer as any).openPopup();
      },
      mouseover: (e) => {
        const targetLayer = e.target as any;
        targetLayer.setStyle({
          weight: 3,
          color: "var(--accent)",
          dashArray: "",
          fillOpacity: 0.95,
        });
        if (targetLayer.bringToFront) targetLayer.bringToFront();
      },
      mouseout: (e) => {
        const targetLayer = e.target as any;
        // Reset style
        targetLayer.setStyle(getFeatureStyle(feature, granularity));
      },
    });
  };

  // Determine center & zoom based on granularity
  const center: [number, number] = granularity === "Kabupaten" || granularity === "Provinsi" ? [-7.15, 110.14] : [-6.89, 110.64];
  const zoom = granularity === "Kabupaten" || granularity === "Provinsi" ? 8 : 11;
  // Dapatkan identitas unik wilayah aktif untuk memastikan Leaflet selalu unmount/mount layer baru saat wilayah berganti
  const activeRegionId = useMemo(() => {
    if (!displayGeojson || displayGeojson.features.length === 0) return "empty";
    if (granularity === "Kabupaten" || granularity === "Provinsi") return "jateng_all";
    const firstFeature = displayGeojson.features[0]?.properties;
    return (firstFeature?.regency || firstFeature?.district || "kecamatan").toLowerCase().replace(/\s+/g, "_");
  }, [displayGeojson, granularity]);

  return (
    <div className="relative h-full w-full bg-slate-50">
      <MapContainer
        center={center}
        zoom={zoom}
        zoomControl={true}
        scrollWheelZoom={true}
        className="h-full w-full"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>, HERE, Garmin, NGA, USGS'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        />
        
        {displayGeojson && displayGeojson.features.length > 0 && (
          <GeoJSON
            key={`${granularity}-${activeRegionId}-${year}-${indicatorName}-${displayGeojson.features.length}-${dataKey || ''}`}
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
