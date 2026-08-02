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
}

// Function to calculate color based on population
function getColor(population: number | null): string {
  if (population === null) return "#e2e8f0"; // Gray for no data
  // Using Demak's approximate population range for scale
  if (population > 100000) return "var(--choropleth-4)";
  if (population > 75000) return "var(--choropleth-3)";
  if (population > 50000) return "var(--choropleth-2)";
  return "var(--choropleth-1)";
}

// Style function for GeoJSON features
function getFeatureStyle(feature: any, granularity: Granularity): PathOptions {
  const pop = feature?.properties?.jumlahPenduduk ?? null;
  return {
    fillColor: getColor(pop),
    weight: granularity === "Kecamatan" ? 2 : 1,
    opacity: 1,
    color: granularity === "Kecamatan" ? "white" : "white", // Border color
    dashArray: granularity === "Kecamatan" ? "" : "3",
    fillOpacity: 0.8,
  };
}

export default function MapCanvas({ geojson, onRegionClick, granularity, year }: MapCanvasProps) {
  const mapRef = useRef<LeafletMap | null>(null);

  // We just use the passed geojson directly since it's now perfectly pre-processed by the API
  const displayGeojson = geojson;

  // Helper component to adjust map bounds to fit GeoJSON
  function FitBounds({ data }: { data: DemakFeatureCollection | null }) {
    const map = useMap();
    useEffect(() => {
      if (data && data.features.length > 0 && mapRef.current) {
        // Leaflet GeoJSON layer bounds calculation workaround without direct layer ref
        // We'll let it stay at Demak center, no strict auto-fit needed for V1 since center/zoom are set
      }
    }, [data, map]);
    return null;
  }

  // Handle interaction for each polygon
  const onEachFeature = (feature: any, layer: Layer) => {
    const demakFeature = feature as DemakFeature;
    const name = demakFeature.properties.district;
    const village = granularity === "Desa" ? demakFeature.properties.village : null;
    const pop = demakFeature.properties.jumlahPenduduk;
    
    // Format population number
    const popText = pop ? new Intl.NumberFormat("id-ID").format(pop) : "Data Tidak Tersedia";

    // Bind popup
    layer.bindPopup(`
      <div class="font-semibold text-primary mb-1">Kec. ${name}</div>
      ${village ? `<div class="text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Desa ${village}</div>` : ''}
      <div class="text-muted-foreground text-sm">Penduduk Kec: <span class="font-medium text-foreground">${popText}</span></div>
    `);

    // Click event
    layer.on({
      click: () => {
        onRegionClick(demakFeature);
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
      },
      mouseout: (e) => {
        const layer = e.target;
        // Reset style
        layer.setStyle(getFeatureStyle(feature, granularity));
      },
    });
  };

  return (
    <div className="relative h-full w-full bg-slate-50">
      <MapContainer
        center={[-6.89, 110.64]} // Approximate center of Demak
        zoom={11}
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
            key={`${granularity}-${year}`} // Paksa react-leaflet render ulang saat tahun/granularity berubah
            data={displayGeojson}
            style={(feature) => getFeatureStyle(feature, granularity)}
            onEachFeature={onEachFeature}
          />
        )}
        <FitBounds data={displayGeojson} />
      </MapContainer>
    </div>
  );
}
