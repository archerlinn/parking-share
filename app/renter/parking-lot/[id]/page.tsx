"use client";

import React, { useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Layout from '@/app/components/layout/Layout';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';
import { useAuth } from '@/app/providers/AuthProvider';
import { useParking } from '@/app/providers/ParkingProvider';

export default function ParkingLotDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { getParkingLotById, requestBooking, loading } = useParking();
  
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [hours, setHours] = useState(1);
  const [error, setError] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  
  // Get parking lot ID from URL
  const id = params?.id as string;
  
  // Get parking lot details
  const parkingLot = getParkingLotById(id);
  
  // Calculate end time based on start time and hours
  const calculateEndTime = (start: Date, hoursToAdd: number) => {
    const end = new Date(start);
    end.setHours(end.getHours() + hoursToAdd);
    return end;
  };
  
  // Calculate price
  const calculatePrice = (hoursToAdd: number) => {
    if (parkingLot) {
      return parkingLot.pricePerHour * hoursToAdd;
    }
    return 0;
  };
  
  // Format time for display (12-hour format with AM/PM)
  const formatTimeLabel = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };
  
  // Generate time slots from 00:00 to 23:30 in 30-minute intervals
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        const time = `${formattedHour}:${formattedMinute}`;
        const label = formatTimeLabel(time);
        slots.push({ value: time, label });
      }
    }
    return slots;
  }, []);
  
  // Handle booking request
  const handleBookingRequest = async () => {
    if (!user) {
      router.push(`/auth/login?next=/renter/parking-lot/${id}`);
      return;
    }
    
    if (!startDate || !startTime) {
      setError('Please select a date and time');
      return;
    }
    
    try {
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = calculateEndTime(startDateTime, hours);
      
      // Check if start date is in the past
      if (startDateTime < new Date()) {
        setError('Start time cannot be in the past');
        return;
      }
      
      const booking = await requestBooking(
        id,
        startDateTime,
        endDateTime,
        user.id
      );
      
      if (booking) {
        setRequestSent(true);
        setError('');
      } else {
        setError('Failed to request booking. Please try again.');
      }
    } catch (err) {
      setError('Invalid date or time format');
    }
  };
  
  // Handle hours change
  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHours = parseInt(e.target.value);
    if (newHours >= 1) {
      setHours(newHours);
      setEstimatedPrice(calculatePrice(newHours));
    }
  };
  
  if (!parkingLot) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <Card className="p-6 text-center">
              <h2 className="text-lg font-semibold text-gray-900">Parking lot not found</h2>
              <p className="mt-2 text-sm text-gray-600">The parking lot you are looking for does not exist or has been removed.</p>
              <div className="mt-6">
                <Button onClick={() => router.push('/renter/map')}>
                  Back to Map
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (!parkingLot.isAvailable) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <Card className="p-6 text-center">
              <h2 className="text-lg font-semibold text-gray-900">This parking lot is currently occupied</h2>
              <p className="mt-2 text-sm text-gray-600">Please check back later or look for other available parking lots.</p>
              <div className="mt-6">
                <Button onClick={() => router.push('/renter/map')}>
                  Back to Map
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
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left Column - Parking Lot Details */}
            <div className="md:w-2/3">
              <Card className="overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1590674899484-d5640e854abe?ixlib=rb-4.0.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2340&q=80"
                  alt={`Parking lot at ${parkingLot.address.street}`}
                  className="w-full h-64 object-cover"
                />
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {parkingLot.address.street}
                    </h1>
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      Available
                    </span>
                  </div>
                  
                  <p className="mt-2 text-gray-600">
                    {parkingLot.address.city}, {parkingLot.address.state} {parkingLot.address.zipCode}
                  </p>
                  
                  <div className="mt-6">
                    <h2 className="text-lg font-semibold text-gray-900">Details</h2>
                    <div className="mt-2 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Price per Hour</p>
                        <p className="text-lg font-semibold text-gray-900">${parkingLot.pricePerHour}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Owner</p>
                        <p className="text-lg text-gray-900">{parkingLot.ownerName}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h2 className="text-lg font-semibold text-gray-900">Amenities</h2>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {parkingLot.amenities.map((amenity, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h2 className="text-lg font-semibold text-gray-900">Access Instructions</h2>
                    <div className="mt-2 bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-600">
                        {parkingLot.accessInstructions || "Access instructions will be provided after booking confirmation."}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h2 className="text-lg font-semibold text-gray-900">Notes from Owner</h2>
                    <div className="mt-2 bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-600">
                        {parkingLot.notes || "No additional notes from the owner."}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
            
            {/* Right Column - Booking Form */}
            <div className="md:w-1/3">
              <Card className="p-6">
                {requestSent ? (
                  <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-900">Request Sent!</h2>
                    <p className="mt-2 text-gray-600">
                      Your booking request has been sent to the owner. You will be notified once they confirm.
                    </p>
                    <div className="mt-6">
                      <Button onClick={() => router.push('/bookings')} fullWidth>
                        View My Bookings
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-semibold text-gray-900">Request to Book</h2>
                    <p className="mt-2 text-gray-600">
                      Select your desired parking date and time to send a booking request to the owner.
                    </p>
                    
                    <div className="mt-6 space-y-4">
                      <div>
                        <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">
                          Date
                        </label>
                        <input
                          type="date"
                          id="start-date"
                          name="start-date"
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-rose-500 focus:outline-none focus:ring-rose-500 sm:text-sm"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="start-time" className="block text-sm font-medium text-gray-700">
                          Start Time
                        </label>
                        <select
                          id="start-time"
                          name="start-time"
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-rose-500 focus:outline-none focus:ring-rose-500 sm:text-sm"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                        >
                          <option value="">Select a time</option>
                          {timeSlots.map(({ value, label }) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                          Duration (Hours)
                        </label>
                        <div className="mt-1 flex items-center">
                          <input
                            type="number"
                            id="duration"
                            name="duration"
                            min="1"
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-rose-500 focus:outline-none focus:ring-rose-500 sm:text-sm"
                            value={hours}
                            onChange={handleHoursChange}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <p className="block text-sm font-medium text-gray-700">
                          Estimated Price
                        </p>
                        <p className="mt-1 text-xl font-semibold text-gray-900">
                          ${(parkingLot.pricePerHour * hours).toFixed(2)}
                        </p>
                      </div>
                      
                      {error && (
                        <div className="text-sm text-red-600">{error}</div>
                      )}
                      
                      <Button onClick={handleBookingRequest} isLoading={loading} fullWidth>
                        Request to Rent
                      </Button>
                    </div>
                  </>
                )}
              </Card>
              
              <Card className="p-6 mt-6">
                <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
                <p className="mt-2 text-gray-600">
                  <strong>Name:</strong> {parkingLot.ownerName}<br />
                  <strong>Email:</strong> {parkingLot.ownerEmail}<br />
                  <strong>Phone:</strong> {parkingLot.ownerPhone} (visible after booking confirmation)
                </p>
              </Card>

              <div className="mt-6 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/renter/map')}
                >
                  Back to Map
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 