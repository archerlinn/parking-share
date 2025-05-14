// File: app/owner/bookings/page.tsx

"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/app/components/layout/Layout';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';
import { useAuth } from '@/app/providers/AuthProvider';
import { useParking } from '@/app/providers/ParkingProvider';

export default function OwnerBookingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { bookings, getMyBookings, updateBookingStatus } = useParking();
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (user) {
      getMyBookings(user.id);
    }
  }, [user]);

  const handleDecision = async (id: string, decision: 'confirmed' | 'cancelled') => {
    setLoadingMap(prev => ({ ...prev, [id]: true }));
    await updateBookingStatus(id, decision);
    setLoadingMap(prev => ({ ...prev, [id]: false }));
  };

  const ownerBookings = bookings.filter(booking => booking.ownerId === user?.id);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Booking Requests</h1>
          {ownerBookings.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-gray-600">No booking requests at the moment.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {ownerBookings.map(booking => (
                <Card key={booking.id} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{booking.renterName}</p>
                    <p className="text-gray-500 text-sm">
                      {new Date(booking.startTime).toLocaleString()} • {booking.duration} hrs • ${booking.price.toFixed(2)}
                    </p>
                    <p className="text-sm mt-1 text-gray-600">Status: {booking.status}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => router.push(`/owner/bookings/${booking.id}`)}>
                      View Details
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}