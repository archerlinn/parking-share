"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/supabase";
import { useAuth } from "./AuthProvider";

interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface ParkingLot {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    coordinates: Coordinates;
  };
  instructions: string;
  photoUrl?: string;
  isAvailable: boolean;
  pricePerHour: number;
  amenities: string[];
  accessInstructions?: string;
  notes?: string;
}

export interface Booking {
  id: string;
  parkingLotId: string;
  parkingLotAddress: string;
  renterId: string;
  renterName: string;
  ownerId: string;
  ownerName: string;
  startTime: string;
  duration: number;
  price: number;
  status: 'pending' | 'confirmed' | 'paid' | 'completed' | 'cancelled';
}

interface ParkingContextType {
  parkingLots: ParkingLot[];
  myParkingLots: ParkingLot[];
  bookings: Booking[];
  loading: boolean;
  userType: 'owner' | 'renter' | null;
  addParkingLot: (parkingLotData: Omit<ParkingLot, "id">) => Promise<ParkingLot | null>;
  updateParkingLot: (id: string, parkingLotData: Partial<ParkingLot>) => Promise<ParkingLot | null>;
  updateParkingLotAvailability: (id: string, isAvailable: boolean) => Promise<boolean>;
  getParkingLotById: (id: string) => ParkingLot | null;
  requestBooking: (parkingLotId: string, startTime: Date, endTime: Date, renterId: string) => Promise<Booking | null>;
  confirmBooking: (id: string) => Promise<void>;
  declineBooking: (id: string) => Promise<void>;
  payBooking: (id: string) => Promise<void>;
  getMyBookings: (userId: string) => Promise<Booking[]>;
  getBookingById: (id: string) => Booking | null;
  searchParkingLots: (location: string) => Promise<ParkingLot[]>;
  myBookings: Booking[];
  updateBookingStatus: (bookingId: string, status: Booking['status']) => Promise<void>;
}

const ParkingContext = createContext<ParkingContextType | null>(null);

export const useParking = () => {
  const context = useContext(ParkingContext);
  if (!context) {
    throw new Error("useParking must be used within a ParkingProvider");
  }
  return context;
};

interface ParkingProviderProps {
  children: ReactNode;
}

export const ParkingProvider: React.FC<ParkingProviderProps> = ({ children }) => {
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState<'owner' | 'renter' | null>(null);
  const { user, profile } = useAuth();
  const router = useRouter();

  // Set user type when profile changes
  useEffect(() => {
    if (profile) {
      setUserType(profile.user_type);
    } else {
      setUserType(null);
    }
  }, [profile]);

  // Fetch parking lots on mount
  useEffect(() => {
    fetchParkingLots();
  }, []);

  const fetchParkingLots = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('parking_lots')
        .select(`
          *,
          users:owner_id (
            name,
            email,
            phone
          )
        `);

      if (error) throw error;

      const formattedParkingLots: ParkingLot[] = data.map(lot => ({
        id: lot.id,
        ownerId: lot.owner_id,
        ownerName: lot.users.name,
        ownerEmail: lot.users.email,
        ownerPhone: lot.users.phone || '',
        address: {
          street: lot.street,
          city: lot.city,
          state: lot.state,
          zipCode: lot.zip_code,
          country: lot.country,
          coordinates: {
            latitude: lot.latitude,
            longitude: lot.longitude,
          },
        },
        instructions: lot.instructions,
        photoUrl: lot.photo_url || undefined,
        isAvailable: lot.is_available,
        pricePerHour: lot.price_per_hour,
        amenities: lot.amenities,
        accessInstructions: lot.access_instructions || undefined,
        notes: lot.notes || undefined,
      }));

      setParkingLots(formattedParkingLots);
    } catch (error) {
      console.error('Error fetching parking lots:', error);
    } finally {
      setLoading(false);
    }
  };

  const addParkingLot = async (
    parkingLotData: Omit<ParkingLot, "id">
  ): Promise<ParkingLot | null> => {
    try {
      setLoading(true);
      
      // Check if user is authenticated
      if (!user) {
        throw new Error("User must be authenticated to add a parking lot");
      }

      // Validate required fields
      if (!parkingLotData.address) {
        throw new Error("Missing required fields");
      }

      const { data, error } = await supabase
        .from('parking_lots')
        .insert({
          owner_id: user.id, // Use the authenticated user's ID
          street: parkingLotData.address.street,
          city: parkingLotData.address.city,
          state: parkingLotData.address.state,
          zip_code: parkingLotData.address.zipCode,
          country: parkingLotData.address.country,
          latitude: parkingLotData.address.coordinates.latitude,
          longitude: parkingLotData.address.coordinates.longitude,
          instructions: parkingLotData.instructions,
          photo_url: parkingLotData.photoUrl || null,
          is_available: parkingLotData.isAvailable,
          price_per_hour: parkingLotData.pricePerHour,
          amenities: parkingLotData.amenities || [],
          access_instructions: parkingLotData.accessInstructions || null,
          notes: parkingLotData.notes || null,
        })
        .select(`
          *,
          users:owner_id (
            name,
            email,
            phone
          )
        `)
        .single();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      if (!data) {
        throw new Error("No data returned from insert");
      }

      const newParkingLot: ParkingLot = {
        id: data.id,
        ownerId: data.owner_id,
        ownerName: data.users.name,
        ownerEmail: data.users.email,
        ownerPhone: data.users.phone || '',
        address: {
          street: data.street,
          city: data.city,
          state: data.state,
          zipCode: data.zip_code,
          country: data.country,
          coordinates: {
            latitude: data.latitude,
            longitude: data.longitude,
          },
        },
        instructions: data.instructions,
        photoUrl: data.photo_url || undefined,
        isAvailable: data.is_available,
        pricePerHour: data.price_per_hour,
        amenities: data.amenities,
        accessInstructions: data.access_instructions || undefined,
        notes: data.notes || undefined,
      };
      
      setParkingLots(prev => [...prev, newParkingLot]);
      return newParkingLot;
    } catch (error) {
      console.error("Add parking lot error:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateParkingLot = async (
    id: string,
    parkingLotData: Partial<ParkingLot>
  ): Promise<ParkingLot | null> => {
    try {
      setLoading(true);
      
      // Check if user is authenticated
      if (!user) {
        throw new Error("User must be authenticated to update a parking lot");
      }

      // Get the existing parking lot
      const existingLot = getParkingLotById(id);
      if (!existingLot) {
        throw new Error("Parking lot not found");
      }

      // Ensure user owns the parking lot
      if (existingLot.ownerId !== user.id) {
        throw new Error("You can only update your own parking lots");
      }

      // Prepare update data
      const updateData: any = {};
      
      // Only include fields that are provided in the parkingLotData
      if (parkingLotData.address) {
        if (parkingLotData.address.street) updateData.street = parkingLotData.address.street;
        if (parkingLotData.address.city) updateData.city = parkingLotData.address.city;
        if (parkingLotData.address.state) updateData.state = parkingLotData.address.state;
        if (parkingLotData.address.zipCode) updateData.zip_code = parkingLotData.address.zipCode;
        if (parkingLotData.address.country) updateData.country = parkingLotData.address.country;
        if (parkingLotData.address.coordinates) {
          updateData.latitude = parkingLotData.address.coordinates.latitude;
          updateData.longitude = parkingLotData.address.coordinates.longitude;
        }
      }
      
      if (parkingLotData.instructions !== undefined) updateData.instructions = parkingLotData.instructions;
      if (parkingLotData.photoUrl !== undefined) updateData.photo_url = parkingLotData.photoUrl;
      if (parkingLotData.isAvailable !== undefined) updateData.is_available = parkingLotData.isAvailable;
      if (parkingLotData.pricePerHour !== undefined) updateData.price_per_hour = parkingLotData.pricePerHour;
      if (parkingLotData.amenities !== undefined) updateData.amenities = parkingLotData.amenities;
      if (parkingLotData.accessInstructions !== undefined) updateData.access_instructions = parkingLotData.accessInstructions;
      if (parkingLotData.notes !== undefined) updateData.notes = parkingLotData.notes;

      // Update the parking lot in the database
      const { data, error } = await supabase
        .from('parking_lots')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          users:owner_id (
            name,
            email,
            phone
          )
        `)
        .single();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      if (!data) {
        throw new Error("No data returned from update");
      }

      // Format the updated parking lot
      const updatedParkingLot: ParkingLot = {
        id: data.id,
        ownerId: data.owner_id,
        ownerName: data.users.name,
        ownerEmail: data.users.email,
        ownerPhone: data.users.phone || '',
        address: {
          street: data.street,
          city: data.city,
          state: data.state,
          zipCode: data.zip_code,
          country: data.country,
          coordinates: {
            latitude: data.latitude,
            longitude: data.longitude,
          },
        },
        instructions: data.instructions,
        photoUrl: data.photo_url || undefined,
        isAvailable: data.is_available,
        pricePerHour: data.price_per_hour,
        amenities: data.amenities,
        accessInstructions: data.access_instructions || undefined,
        notes: data.notes || undefined,
      };
      
      // Update the parking lot in the state
      setParkingLots(prev => 
        prev.map(lot => lot.id === id ? updatedParkingLot : lot)
      );
      
      return updatedParkingLot;
    } catch (error) {
      console.error("Update parking lot error:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateParkingLotAvailability = async (
    id: string,
    isAvailable: boolean
  ): Promise<boolean> => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('parking_lots')
        .update({ is_available: isAvailable })
        .eq('id', id);

      if (error) throw error;
      
      setParkingLots(prev =>
        prev.map(lot =>
          lot.id === id ? { ...lot, isAvailable } : lot
        )
      );
      return true;
    } catch (error) {
      console.error("Update parking lot error:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getParkingLotById = (id: string): ParkingLot | null => {
    return parkingLots.find((lot) => lot.id === id) || null;
  };

  const requestBooking = async (
    parkingLotId: string,
    startTime: Date,
    endTime: Date,
    renterId: string
  ): Promise<Booking | null> => {
    try {
      setLoading(true);
      
      const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      const parkingLot = getParkingLotById(parkingLotId);
      if (!parkingLot) return null;
      
      const totalPrice = parkingLot.pricePerHour * hours;

      const { data, error } = await supabase
        .from('bookings')
        .insert([{
          parking_lot_id: parkingLotId,
          renter_id: renterId,
          start_time: startTime.toISOString(),
          duration: hours,
          price: totalPrice,
          status: 'pending'
        }])
        .select(`
          *,
          parking_lots (
            street,
            city,
            state
          ),
          renters:users!renter_id (
            name
          ),
          owners:users!parking_lots.owner_id (
            name
          )
        `)
        .single();

      if (error) throw error;

      const newBooking: Booking = {
        id: data.id,
        parkingLotId: data.parking_lot_id,
        parkingLotAddress: `${data.parking_lots.street}, ${data.parking_lots.city}, ${data.parking_lots.state}`,
        renterId: data.renter_id,
        renterName: data.renters.name,
        ownerId: data.owners.id,
        ownerName: data.owners.name,
        startTime: data.start_time,
        duration: data.duration,
        price: data.price,
        status: data.status
      };
      
      setBookings(prev => [...prev, newBooking]);
      return newBooking;
    } catch (error) {
      console.error("Request booking error:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const confirmBooking = async (bookingId: string): Promise<void> => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', bookingId);

      if (error) throw error;
      
      setBookings(prevBookings =>
        prevBookings.map(booking =>
          booking.id === bookingId ? { ...booking, status: 'confirmed' } : booking
        )
      );
    } catch (error) {
      console.error("Confirm booking error:", error);
    } finally {
      setLoading(false);
    }
  };

  const declineBooking = async (bookingId: string): Promise<void> => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;
      
      setBookings(prevBookings =>
        prevBookings.map(booking =>
          booking.id === bookingId ? { ...booking, status: 'cancelled' } : booking
        )
      );
    } catch (error) {
      console.error("Decline booking error:", error);
    } finally {
      setLoading(false);
    }
  };

  const payBooking = async (bookingId: string): Promise<void> => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'paid' })
        .eq('id', bookingId);

      if (error) throw error;
      
      setBookings(prevBookings =>
        prevBookings.map(booking =>
          booking.id === bookingId ? { ...booking, status: 'paid' } : booking
        )
      );
    } catch (error) {
      console.error("Pay booking error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMyBookings = async (userId: string): Promise<Booking[]> => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          parking_lots (
            street,
            city,
            state,
            owner_id
          ),
          renters:users!renter_id (
            name
          ),
          owners:users!parking_lots.owner_id (
            name
          )
        `)
        .or(`renter_id.eq.${userId},parking_lots.owner_id.eq.${userId}`);

      if (error) throw error;

      const formattedBookings: Booking[] = data.map(booking => ({
        id: booking.id,
        parkingLotId: booking.parking_lot_id,
        parkingLotAddress: `${booking.parking_lots.street}, ${booking.parking_lots.city}, ${booking.parking_lots.state}`,
        renterId: booking.renter_id,
        renterName: booking.renters.name,
        ownerId: booking.parking_lots.owner_id,
        ownerName: booking.owners.name,
        startTime: booking.start_time,
        duration: booking.duration,
        price: booking.price,
        status: booking.status
      }));

      setBookings(formattedBookings);
      return formattedBookings;
    } catch (error) {
      console.error("Get my bookings error:", error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getBookingById = (id: string): Booking | null => {
    return bookings.find((booking) => booking.id === id) || null;
  };

  const searchParkingLots = async (location: string): Promise<ParkingLot[]> => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('parking_lots')
        .select(`
          *,
          users:owner_id (
            name,
            email,
            phone
          )
        `)
        .or(`city.ilike.%${location}%,state.ilike.%${location}%,zip_code.eq.${location}`)
        .eq('is_available', true);

      if (error) throw error;

      const formattedParkingLots: ParkingLot[] = data.map(lot => ({
        id: lot.id,
        ownerId: lot.owner_id,
        ownerName: lot.users.name,
        ownerEmail: lot.users.email,
        ownerPhone: lot.users.phone,
        address: {
          street: lot.street,
          city: lot.city,
          state: lot.state,
          zipCode: lot.zip_code,
          country: lot.country,
          coordinates: {
            latitude: lot.latitude,
            longitude: lot.longitude,
          },
        },
        instructions: lot.instructions,
        photoUrl: lot.photo_url,
        isAvailable: lot.is_available,
        pricePerHour: lot.price_per_hour,
        amenities: lot.amenities,
        accessInstructions: lot.access_instructions,
        notes: lot.notes,
      }));

      return formattedParkingLots;
    } catch (error) {
      console.error("Search parking lots error:", error);
      return [];
    } finally {
      setLoading(false);
    }
  };
  
  // Filter parking lots owned by a specific user
  const myParkingLots = (userId: string) => {
    return parkingLots.filter((lot) => lot.ownerId === userId);
  };

  const updateBookingStatus = async (bookingId: string, status: Booking['status']) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('bookings')
        .update({ status: status })
        .eq('id', bookingId);

      if (error) throw error;
      
      setBookings(prevBookings =>
        prevBookings.map(booking =>
          booking.id === bookingId
            ? { ...booking, status: status }
            : booking
        )
      );
    } catch (error) {
      console.error("Update booking status error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ParkingContext.Provider
      value={{
        parkingLots,
        myParkingLots: parkingLots.filter(lot => lot.ownerId === user?.id),
        bookings,
        loading,
        userType,
        addParkingLot,
        updateParkingLot,
        updateParkingLotAvailability,
        getParkingLotById,
        requestBooking,
        confirmBooking: (id: string) => updateBookingStatus(id, 'confirmed'),
        declineBooking: (id: string) => updateBookingStatus(id, 'cancelled'),
        payBooking: (id: string) => updateBookingStatus(id, 'paid'),
        getMyBookings,
        getBookingById,
        searchParkingLots,
        myBookings: bookings,
        updateBookingStatus
      }}
    >
      {children}
    </ParkingContext.Provider>
  );
}; 