// File: app/owner/bookings/[id]/page.tsx

"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Layout from '@/app/components/layout/Layout';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { useParking } from '@/app/providers/ParkingProvider';

export default function BookingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { bookings, updateBookingStatus } = useParking();
  const [loading, setLoading] = useState(false);

  const booking = bookings.find(b => b.id === id);

  if (!booking) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-600">Booking not found.</p>
        </div>
      </Layout>
    );
  }

  const handleDecision = async (decision: 'confirmed' | 'cancelled') => {
    setLoading(true);
    await updateBookingStatus(booking.id, decision);
    setLoading(false);
    router.push('/owner/bookings');
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-3xl px-6">
          <Card className="p-6">
            <h1 className="text-2xl font-bold text-gray-900">Booking Details</h1>
            <p className="mt-4"><strong>Renter:</strong> {booking.renterName}</p>
            <p><strong>Date & Time:</strong> {new Date(booking.startTime).toLocaleString()}</p>
            <p><strong>Duration:</strong> {booking.duration} hours</p>
            <p><strong>Total Price:</strong> ${booking.price.toFixed(2)}</p>
            <p><strong>Status:</strong> {booking.status}</p>

            <div className="mt-6 flex gap-4">
              <Button
                variant="outline"
                onClick={() => handleDecision('cancelled')}
                disabled={loading || booking.status !== 'pending'}
              >
                Decline
              </Button>
              <Button
                onClick={() => handleDecision('confirmed')}
                disabled={loading || booking.status !== 'pending'}
              >
                Accept
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
