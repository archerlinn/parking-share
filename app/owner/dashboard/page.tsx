"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../../components/layout/Layout';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { useAuth } from '../../providers/AuthProvider';
import { useParking } from '../../providers/ParkingProvider';

export default function OwnerDashboardPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const {
    myParkingLots,
    updateParkingLotAvailability,
  } = useParking();
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  // Toggle availability
  const handleAvailabilityToggle = async (id: string, current: boolean) => {
    setLoadingStates(prev => ({ ...prev, [id]: true }));
    await updateParkingLotAvailability(id, !current);
    setLoadingStates(prev => ({ ...prev, [id]: false }));
  };

  // 1) not signed in:
  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <Card className="p-6 text-center">
              <h2 className="text-lg font-semibold text-gray-900">
                You need to be logged in to access your dashboard
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Please sign in or create an account to continue.
              </p>
              <div className="mt-6">
                <Button onClick={() => router.push('/auth/login?next=/owner/dashboard')}>
                  Sign In
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  // 2) only owners allowed:
  if (profile?.user_type !== 'owner') {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <Card className="p-6 text-center">
              <h2 className="text-lg font-semibold text-gray-900">
                This page is for parking lot owners only
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                You are currently logged in as a renter.
              </p>
              <div className="mt-6">
                <Button onClick={() => router.push('/renter/map')}>
                  Go to Renter Dashboard
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  // 3) owner content: no in-line pending requests any more
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Parking Lots</h1>
              <p className="mt-2 text-lg text-gray-600">
                Manage your parking spaces.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={() => router.push('/owner/parking-lot/register')}>
                Add New Parking Lot
              </Button>
              <Button variant="outline" onClick={() => router.push('/owner/bookings')}>
                View Booking Requests
              </Button>
            </div>
          </div>

          {/* Parking Lots List */}
          <div className="mt-8">
            {myParkingLots.length === 0 ? (
              <Card className="mt-4 p-6 text-center">
                <p className="text-gray-600">You haven't registered any parking lots yet.</p>
                <div className="mt-4">
                  <Button onClick={() => router.push('/owner/parking-lot/register')}>
                    Register a Parking Lot
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {myParkingLots.map(lot => (
                  <Card key={lot.id} className="overflow-hidden" hover>
                    {lot.photoUrl ? (
                      <div className="relative h-48 w-full bg-gray-100">
                        <img
                          src={lot.photoUrl}
                          alt={`Parking lot at ${lot.address.street}`}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/placeholder-parking.jpg';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="h-48 w-full bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-400">No image available</span>
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {lot.address.street}
                        </h3>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            lot.isAvailable
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {lot.isAvailable ? 'Available' : 'Occupied'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        {lot.address.city}, {lot.address.state} {lot.address.zipCode}
                      </p>
                      <p className="mt-1 text-sm font-semibold">${lot.pricePerHour}/hour</p>

                      {lot.amenities.length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs text-gray-500">Amenities:</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {lot.amenities.map((amenity, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800"
                              >
                                {amenity}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-6 flex justify-between items-center">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => router.push(`/owner/parking-lot/${lot.id}/page`)}
                        >
                          View Details
                        </Button>
                        <div className="flex space-x-2">
                          <Button
                            variant={lot.isAvailable ? 'danger' : 'primary'}
                            size="sm"
                            onClick={() => handleAvailabilityToggle(lot.id, lot.isAvailable)}
                            isLoading={loadingStates[lot.id]}
                          >
                            {lot.isAvailable ? 'Mark Occupied' : 'Mark Available'}
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={() => router.push(`/owner/parking-lot/${lot.id}/edit`)}
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
