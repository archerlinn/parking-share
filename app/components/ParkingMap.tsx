"use client";

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useRouter } from 'next/navigation';
import type { ParkingLot } from '../providers/ParkingProvider';

// Fix Leaflet icon issue in Next.js
const fixLeafletIcon = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/leaflet/marker-icon-2x.png',
    iconUrl: '/leaflet/marker-icon.png',
    shadowUrl: '/leaflet/marker-shadow.png',
  });
};

interface ParkingMapProps {
  parkingLots: ParkingLot[];
}

export default function ParkingMap({ parkingLots }: ParkingMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Fix Leaflet icon paths
    fixLeafletIcon();

    // Initialize map if not already initialized
    if (!mapRef.current) {
      mapRef.current = L.map('map').setView([40.7128, -74.0060], 13); // Default to NYC coordinates

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);
    }

    // Clear existing markers
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        layer.remove();
      }
    });

    // Add markers for parking lots
    parkingLots.forEach((lot) => {
      const { latitude, longitude } = lot.address.coordinates;
      const marker = L.marker([latitude, longitude])
        .addTo(mapRef.current!)
        .bindPopup(`
          <div class="p-2">
            <h3 class="font-semibold">${lot.address.street}</h3>
            <p>${lot.address.city}, ${lot.address.state}</p>
            <p class="text-rose-600">$${lot.pricePerHour}/hour</p>
            <button 
              class="mt-2 px-4 py-2 bg-rose-600 text-white rounded-md text-sm hover:bg-rose-700"
              onclick="window.location.href='/renter/parking-lot/${lot.id}'"
            >
              View Details
            </button>
          </div>
        `);

      // Center map on first parking lot
      if (parkingLots.length > 0 && parkingLots[0].id === lot.id) {
        mapRef.current!.setView([latitude, longitude], 13);
      }
    });

    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [parkingLots, router]);

  return (
    <div id="map" className="w-full h-full z-0" />
  );
} 