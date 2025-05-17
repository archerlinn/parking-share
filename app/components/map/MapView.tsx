"use client";

import { useCallback, useEffect, useState } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api';
import type { ParkingLot } from '@/app/providers/ParkingProvider';

const containerStyle = {
  width: '100%',
  height: '100%'
};

// Default center coordinates for Taipei
const DEFAULT_CENTER = { lat: 25.0330, lng: 121.5654 };

interface MapViewProps {
  parkingLots: ParkingLot[];
  center?: [number, number];
  zoomLevel?: number;
}

export default function MapView({ parkingLots, center, zoomLevel = 13 }: MapViewProps) {
  const [selectedMarker, setSelectedMarker] = useState<ParkingLot | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [initialCenter] = useState(center ? { lat: center[0], lng: center[1] } : DEFAULT_CENTER);

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

  // Custom marker icons
  const getMarkerIcons = () => {
    if (!isLoaded) return { availableIcon: undefined, occupiedIcon: undefined };

    const iconBase = {
      path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
      fillOpacity: 1,
      strokeWeight: 1,
      strokeColor: '#ffffff',
      scale: 2,
      anchor: new google.maps.Point(12, 24),
    };

    return {
      availableIcon: {
        ...iconBase,
        fillColor: '#22c55e',
      },
      occupiedIcon: {
        ...iconBase,
        fillColor: '#6b7280',
      }
    };
  };

  if (!isLoaded) return <div>Loading...</div>;

  const { availableIcon, occupiedIcon } = getMarkerIcons();

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={initialCenter}
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
            lat: lot.latitude,
            lng: lot.longitude
          }}
          icon={lot.is_available ? availableIcon : occupiedIcon}
          onClick={() => setSelectedMarker(lot)}
        />
      ))}

      {selectedMarker && (
        <InfoWindowF
          position={{
            lat: selectedMarker.latitude,
            lng: selectedMarker.longitude
          }}
          onCloseClick={() => setSelectedMarker(null)}
        >
          <div className="p-2 min-w-[200px]">
            {selectedMarker.photo_url && (
              <div className="mb-3">
                <img
                  src={selectedMarker.photo_url}
                  alt={`Parking lot at ${selectedMarker.street}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
              </div>
            )}
            <h3 className="font-semibold text-lg mb-1">{selectedMarker.ownerName}的車位</h3>
            <p className="text-gray-600 text-sm mb-2">
              {selectedMarker.street}, {selectedMarker.state}
            </p>
            <p className={`text-sm font-medium mb-3 ${selectedMarker.is_available ? 'text-green-600' : 'text-red-600'}`}>
              {selectedMarker.is_available ? '可供使用' : '使用中'}
            </p>
            <button 
              onClick={() => window.location.href = `/renter/parking-lot/${selectedMarker.id}`}
              className="w-full px-4 py-2 bg-rose-600 text-white rounded-md text-sm font-medium hover:bg-rose-700 transition-colors"
            >
              查看車位
            </button>
          </div>
        </InfoWindowF>
      )}
    </GoogleMap>
  );
}
