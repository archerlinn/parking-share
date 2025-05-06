"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '../../../../components/layout/Layout';
import Button from '../../../../components/ui/Button';
import Card from '../../../../components/ui/Card';
import { useAuth } from '../../../../providers/AuthProvider';
import { useParking } from '../../../../providers/ParkingProvider';

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
                <Button onClick={() => router.push(`/auth/login?next=/owner/parking-lot/${parkingLotId}/page`)}>
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
    await updateParkingLotAvailability(parkingLot.id, !parkingLot.isAvailable);
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
            {parkingLot.photoUrl ? (
              <div className="relative h-64 w-full bg-gray-100">
                <img
                  src={parkingLot.photoUrl}
                  alt={`Parking lot at ${parkingLot.address.street}`}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/placeholder-parking.jpg';
                  }}
                />
                <div className="absolute top-4 right-4">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                      parkingLot.isAvailable
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {parkingLot.isAvailable ? 'Available' : 'Occupied'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="relative h-64 w-full bg-gray-100 flex items-center justify-center">
                <span className="text-gray-400">No image available</span>
                <div className="absolute top-4 right-4">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                      parkingLot.isAvailable
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {parkingLot.isAvailable ? 'Available' : 'Occupied'}
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
                        {parkingLot.address.street}, {parkingLot.address.city}, {parkingLot.address.state} {parkingLot.address.zipCode}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Coordinates</div>
                      <div className="mt-1 text-base text-gray-900">
                        {parkingLot.address.coordinates.latitude}, {parkingLot.address.coordinates.longitude}
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
                
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Access Instructions</h2>
                  <div className="mt-4">
                    <div className="text-base text-gray-700 whitespace-pre-line">
                      {parkingLot.instructions}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Amenities</h2>
                  <div className="mt-4">
                    {parkingLot.amenities.length > 0 ? (
                      <div className="mt-1 flex flex-wrap gap-2">
                        {parkingLot.amenities.map((amenity, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-base text-gray-500">No amenities listed</div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-gray-900">Availability</h2>
                <div className="mt-4">
                  <Button
                    variant={parkingLot.isAvailable ? 'danger' : 'primary'}
                    onClick={toggleAvailability}
                    isLoading={loading}
                    className="w-full sm:w-auto"
                  >
                    {parkingLot.isAvailable ? 'Mark as Occupied' : 'Mark as Available'}
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