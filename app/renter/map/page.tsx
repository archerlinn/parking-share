"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Layout from '@/app/components/layout/Layout';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';
import { useAuth } from '@/app/providers/AuthProvider';
import { useParking } from '@/app/providers/ParkingProvider';
import LocationSearch from '@/app/components/ui/LocationSearch';

const DynamicMapWithNoSSR = dynamic(
  () => import('@/app/components/map/MapView'),
  { ssr: false }
);

export default function RenterMapPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { parkingLots, loading } = useParking();

  // store as [lat, lng]
  const [center, setCenter] = useState<[number, number] | null>(null);

  const handleLocationSelect = (loc: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    latitude: number;
    longitude: number;
  }) => {
    setCenter([loc.latitude, loc.longitude]);
  };

  if (!user) {
    return (
      <Layout>{/* …sign-in prompt… */}</Layout>
    );
  }
  if (profile?.user_type !== 'renter') {
    return (
      <Layout>{/* …owner-block prompt… */}</Layout>
    );
  }
  if (loading) {
    return (
      <Layout>{/* …spinner… */}</Layout>
    );
  }

  return (
    <Layout>
      <div className="relative h-[calc(100vh-4rem)]">
        {/* Frosted search panel */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 w-full max-w-md px-4">
          <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-lg p-4">
            <LocationSearch
              defaultValue=""
              error={undefined}
              onLocationSelect={handleLocationSelect}
            />
          </div>
        </div>

        {/* Map */}
        <div className="absolute inset-0">
          <DynamicMapWithNoSSR
            parkingLots={parkingLots}
            center={center}
          />
        </div>
      </div>
    </Layout>
  );
}
