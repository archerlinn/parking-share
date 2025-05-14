"use client";

import { useCallback, useEffect, useState } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api';
import type { ParkingLot } from '@/app/providers/ParkingProvider';

const containerStyle = {
  width: '100%',
  height: '100%'
};

interface MapViewProps {
  parkingLots: ParkingLot[];
  center?: [number, number];
  zoomLevel?: number;
}

export default function MapView({ parkingLots, center, zoomLevel = 13 }: MapViewProps) {
  const [selectedMarker, setSelectedMarker] = useState<ParkingLot | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  });

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Update center when it changes
  useEffect(() => {
    if (map && center) {
      map.panTo({ lat: center[0], lng: center[1] });
      map.setZoom(zoomLevel);
    }
  }, [map, center, zoomLevel]);

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center ? { lat: center[0], lng: center[1] } : { lat: 40.7128, lng: -74.0060 }}
      zoom={zoomLevel}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={{
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ],
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: true,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: true
      }}
    >
      {parkingLots.map((lot) => (
        <MarkerF
          key={lot.id}
          position={{
            lat: lot.address.coordinates.latitude,
            lng: lot.address.coordinates.longitude
          }}
          onClick={() => setSelectedMarker(lot)}
        />
      ))}

      {selectedMarker && (
        <InfoWindowF
          position={{
            lat: selectedMarker.address.coordinates.latitude,
            lng: selectedMarker.address.coordinates.longitude
          }}
          onCloseClick={() => setSelectedMarker(null)}
        >
          <div className="p-2 min-w-[200px]">
            <h3 className="font-semibold text-lg mb-1">{selectedMarker.address.street}</h3>
            <p className="text-gray-600 text-sm mb-2">
              {selectedMarker.address.city}, {selectedMarker.address.state}
            </p>
            <p className="text-rose-600 font-medium text-lg mb-3">
              ${selectedMarker.pricePerHour}/hour
            </p>
            <button 
              onClick={() => window.location.href = `/renter/parking-lot/${selectedMarker.id}`}
              className="w-full px-4 py-2 bg-rose-600 text-white rounded-md text-sm font-medium hover:bg-rose-700 transition-colors"
            >
              View Details
            </button>
          </div>
        </InfoWindowF>
      )}
    </GoogleMap>
  );
}
