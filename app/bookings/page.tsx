"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/app/components/layout/Layout';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';
import { useAuth } from '@/app/providers/AuthProvider';
import { useParking } from '@/app/providers/ParkingProvider';

export default function BookingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { myBookings = [], updateBookingStatus } = useParking();
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});

  // Handle payment
  const handlePayment = async (bookingId: string) => {
    setLoading(prev => ({ ...prev, [bookingId]: true }));
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update booking status to paid
      await updateBookingStatus(bookingId, 'paid');
      
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      setLoading(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'confirmed':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'paid':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'completed':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      case 'cancelled':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <Card className="p-6 text-center">
              <h2 className="text-lg font-semibold text-gray-900">You need to be logged in to view your bookings</h2>
              <p className="mt-2 text-sm text-gray-600">Please sign in or create an account to continue.</p>
              <div className="mt-6">
                <Button onClick={() => router.push('/auth/login?next=/bookings')}>
                  Sign In
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-2xl font-semibold text-gray-900">My Bookings</h1>
              <p className="mt-2 text-sm text-gray-700">
                View and manage your parking space bookings
              </p>
            </div>
          </div>
          
          {myBookings.length === 0 ? (
            <Card className="mt-8 p-6 text-center">
              <p className="text-gray-600">You don't have any bookings yet.</p>
              <div className="mt-4">
                {user.userType === 'owner' ? (
                  <Button onClick={() => router.push('/owner/dashboard')}>
                    Manage Your Parking Lots
                  </Button>
                ) : (
                  <Button onClick={() => router.push('/renter/map')}>
                    Find Parking
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <div className="mt-8 flex flex-col">
              <div className="overflow-x-auto">
                <div className="inline-block min-w-full py-2 align-middle">
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                            Parking Lot
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            {user.userType === 'owner' ? 'Renter' : 'Owner'}
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Date & Time
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Duration
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Price
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Status
                          </th>
                          <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {myBookings.map((booking) => (
                          <tr key={booking.id}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                              {booking.parkingLotAddress}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {user.userType === 'owner' ? booking.renterName : booking.ownerName}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {new Date(booking.startTime).toLocaleString()}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {booking.duration} hours
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              ${booking.price}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              <span className={getStatusBadge(booking.status)}>
                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                              </span>
                            </td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                              {booking.status === 'confirmed' && user.userType === 'renter' && (
                                <Button
                                  size="sm"
                                  onClick={() => handlePayment(booking.id)}
                                  isLoading={loading[booking.id]}
                                  disabled={loading[booking.id]}
                                >
                                  {loading[booking.id] ? 'Processing...' : 'Pay Now'}
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 