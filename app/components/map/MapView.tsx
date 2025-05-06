"use client";

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { ParkingLot } from '@/app/providers/ParkingProvider';

// Fix Leaflet icon paths
const fixLeafletIcon = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/leaflet/marker-icon-2x.png',
    iconUrl: '/leaflet/marker-icon.png',
    shadowUrl: '/leaflet/marker-shadow.png',
  });
};

// Custom marker icon
const customIcon = L.icon({
  iconUrl: '/leaflet/marker-icon.png',
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  shadowUrl: '/leaflet/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'custom-marker-icon'
});

interface MapViewProps {
  parkingLots: ParkingLot[];
  center?: [number, number];
  zoomLevel?: number;
}

export default function MapView({ parkingLots, center, zoomLevel = 13 }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);

  // 1) Initialize map once
  useEffect(() => {
    fixLeafletIcon();

    if (!mapRef.current) {
      mapRef.current = L.map('map', {
        zoomControl: true,
        zoomAnimation: true,
        fadeAnimation: true,
      }).setView(center ?? [40.7128, -74.0060], zoomLevel);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        opacity: 0.8,
        className: 'map-tiles'
      }).addTo(mapRef.current);
    }
  }, []); // only on mount

  // 2) Update markers & recenter when parkingLots or center changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old markers
    map.eachLayer(layer => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Add new markers
    parkingLots.forEach(lot => {
      const { latitude, longitude } = lot.address.coordinates;
      L.marker([latitude, longitude], { icon: customIcon })
        .addTo(map)
        .bindPopup(`
          <div class="p-3">
            <h3 class="font-semibold text-lg mb-1">${lot.address.street}</h3>
            <p class="text-gray-600 text-sm mb-2">
              ${lot.address.city}, ${lot.address.state}
            </p>
            <p class="text-rose-600 font-medium text-lg mb-3">
              $${lot.pricePerHour}/hour
            </p>
            <button 
              onclick="window.location.href='/renter/parking-lot/${lot.id}'"
              class="w-full px-4 py-2 bg-rose-600 text-white rounded-md text-sm font-medium hover:bg-rose-700 transition-colors"
            >
              View Details
            </button>
          </div>
        `, { className: 'custom-popup' });
    });

    // Recenter if requested
    if (center) {
      map.flyTo(center, zoomLevel, { duration: 1 });
    }
  }, [parkingLots, center, zoomLevel]);

  return (
    <>
      <div id="map" className="w-full h-full z-0" />
      <style jsx global>{`
        .map-tiles {
          filter: saturate(0.8) brightness(0.95);
        }
        .custom-marker-icon {
          filter: drop-shadow(0 1px 4px rgba(0, 0, 0, 0.2));
        }
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1),
                      0 2px 4px -1px rgba(0,0,0,0.06);
        }
        .custom-popup .leaflet-popup-content {
          margin: 0;
          min-width: 240px;
        }
        .custom-popup .leaflet-popup-tip-container {
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
        }
      `}</style>
    </>
  );
}
