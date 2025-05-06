"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
    bookings,
    updateParkingLotAvailability,
    confirmBooking,
    declineBooking,
    loading
  } = useParking();
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  // Toggle availability
  const handleAvailabilityToggle = async (id: string, current: boolean) => {
    setLoadingStates(prev => ({ ...prev, [id]: true }));
    await updateParkingLotAvailability(id, !current);
    setLoadingStates(prev => ({ ...prev, [id]: false }));
  };

  // Confirm / decline booking
  const handleConfirm = async (bookingId: string) => {
    setLoadingStates(prev => ({ ...prev, [bookingId]: true }));
    await confirmBooking(bookingId);
    setLoadingStates(prev => ({ ...prev, [bookingId]: false }));
  };
  const handleDecline = async (bookingId: string) => {
    setLoadingStates(prev => ({ ...prev, [bookingId]: true }));
    await declineBooking(bookingId);
    setLoadingStates(prev => ({ ...prev, [bookingId]: false }));
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

  // 3) owner content
  const pendingBookings = bookings.filter(
    b =>
      b.status === 'pending' &&
      myParkingLots.some(lot => lot.id === b.parkingLotId)
  );

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                My Parking Lots
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                Manage your parking spaces and bookings.
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button onClick={() => router.push('/owner/parking-lot/register')}>
                Add New Parking Lot
              </Button>
            </div>
          </div>

          {/* Pending Requests */}
          {pendingBookings.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900">
                Pending Booking Requests
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {pendingBookings.map(booking => {
                  const lot = myParkingLots.find(l => l.id === booking.parkingLotId);
                  if (!lot) return null;
                  return (
                    <Card key={booking.id} className="overflow-hidden">
                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Booking Request
                        </h3>
                        <p className="text-sm text-gray-500">
                          {new Date(booking.startTime).toLocaleString()} –{' '}
                          {new Date(new Date(booking.startTime).getTime() + booking.duration * 60 * 60 * 1000).toLocaleString()}
                        </p>
                        <div className="mt-4">
                          <p className="text-sm font-medium text-gray-900">Parking Lot:</p>
                          <p className="text-sm text-gray-600">
                            {lot.address.street}, {lot.address.city}
                          </p>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-900">Price:</p>
                          <p className="text-sm text-gray-600">
                            ${booking.price.toFixed(2)}
                          </p>
                        </div>
                        <div className="mt-6 flex space-x-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleDecline(booking.id)}
                            isLoading={loadingStates[booking.id]}
                          >
                            Decline
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => handleConfirm(booking.id)}
                            isLoading={loadingStates[booking.id]}
                          >
                            Accept
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Parking Lots List */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900">
              My Parking Lots ({myParkingLots.length})
            </h2>

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
              <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                      <p className="mt-1 text-sm font-semibold">
                        ${lot.pricePerHour}/hour
                      </p>

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

                      <div className="mt-6 flex items-center justify-between space-x-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => router.push(`/owner/parking-lot/${lot.id}/page`)}
                        >
                          View Details
                        </Button>
                        <div className="flex space-x-4">
                          <Button
                            variant={lot.isAvailable ? 'danger' : 'primary'}
                            size="sm"
                            onClick={() => handleAvailabilityToggle(lot.id, lot.isAvailable)}
                            isLoading={loadingStates[lot.id]}
                          >
                            {lot.isAvailable ? 'Mark as Occupied' : 'Mark as Available'}
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
