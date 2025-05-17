"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/app/components/layout/Layout';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';
import { useAuth } from '@/app/providers/AuthProvider';
import { useParking } from '@/app/providers/ParkingProvider';

export default function ParkingLotDetailsPage() {
  const params = useParams();
  const parkingLotId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  const router = useRouter();
  const { user } = useAuth();
  const { getParkingLotById, updateParkingLotAvailability, loading } = useParking();
  
  const parkingLot = getParkingLotById(parkingLotId);
  
  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <Card className="p-6 text-center">
              <h2 className="text-lg font-semibold text-gray-900">You need to be logged in to view this parking lot</h2>
              <p className="mt-2 text-sm text-gray-600">Please sign in or create an account to continue.</p>
              <div className="mt-6">
                <Button onClick={() => router.push(`/auth/login?next=/owner/parking-lot/${parkingLotId}`)}>
                  Sign In
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (!parkingLot) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <Card className="p-6 text-center">
              <h2 className="text-lg font-semibold text-gray-900">Parking lot not found</h2>
              <p className="mt-2 text-sm text-gray-600">The parking lot you're looking for doesn't exist or has been removed.</p>
              <div className="mt-6">
                <Button onClick={() => router.push('/owner/dashboard')}>
                  Return to Dashboard
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }
  
  const toggleAvailability = async () => {
    await updateParkingLotAvailability(parkingLot.id, !parkingLot.is_available);
  };
  
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Parking Lot Details
            </h1>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={() => router.push('/owner/dashboard')}
              >
                Back to Dashboard
              </Button>
              <Button 
                variant="primary" 
                onClick={() => router.push(`/owner/parking-lot/${parkingLot.id}/edit`)}
              >
                Edit Parking Lot
              </Button>
            </div>
          </div>
          
          <div className="overflow-hidden rounded-lg bg-white shadow">
            {parkingLot.photo_url && (
              <div className="relative h-64 w-full">
                <img
                  src={parkingLot.photo_url}
                  alt={`Parking lot at ${parkingLot.address}`}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/placeholder-parking.jpg';
                  }}
                />
                <div className="absolute top-4 right-4">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                      parkingLot.is_available
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {parkingLot.is_available ? 'Available' : 'Occupied'}
                  </span>
                </div>
              </div>
            )}
            
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Location Information</h2>
                  <div className="mt-4 space-y-3">
                    <div>
                      <div className="text-sm font-medium text-gray-500">Address</div>
                      <div className="mt-1 text-base text-gray-900">
                        {parkingLot.address}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Coordinates</div>
                      <div className="mt-1 text-base text-gray-900">
                        {parkingLot.latitude}, {parkingLot.longitude}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Pricing</h2>
                  <div className="mt-4 space-y-3">
                    <div>
                      <div className="text-sm font-medium text-gray-500">Price per Hour</div>
                      <div className="mt-1 text-2xl font-semibold text-gray-900">${parkingLot.pricePerHour.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-gray-900">Availability</h2>
                <div className="mt-4">
                  <Button
                    variant={parkingLot.is_available ? 'danger' : 'primary'}
                    onClick={toggleAvailability}
                    isLoading={loading}
                    className="w-full sm:w-auto"
                  >
                    {parkingLot.is_available ? 'Mark as Occupied' : 'Mark as Available'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 