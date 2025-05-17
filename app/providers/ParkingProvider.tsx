"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/supabase";
import { useAuth } from "./AuthProvider";
import { ParkingProvider as ParkingProviderType } from "@/lib/types/parking";

interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface ParkingLot {
  id: string;
  owner_id: string;
  street: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  latitude: number;
  longitude: number;
  photo_url: string | null;
  is_available: boolean;
  price_per_hour: number;
  amenities: string[];
  notes: string | null;
  created_at: string;
  floor: string | null;
  number: string | null;
  restriction: string | null;
  // Additional fields for UI
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
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
  addParkingLot: (parkingLotData: Omit<ParkingLot, "id" | "created_at" | "ownerName" | "ownerEmail" | "ownerPhone">) => Promise<ParkingLot | null>;
  updateParkingLot: (id: string, parkingLotData: Partial<Omit<ParkingLot, "id" | "created_at" | "ownerName" | "ownerEmail" | "ownerPhone">>) => Promise<ParkingLot | null>;
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
  uploadPhoto: (file: File) => Promise<string>;
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
        owner_id: lot.owner_id,
        street: lot.street,
        city: lot.city,
        state: lot.state,
        zip_code: lot.zip_code,
        country: lot.country,
        latitude: lot.latitude,
        longitude: lot.longitude,
        photo_url: lot.photo_url,
        is_available: lot.is_available,
        price_per_hour: lot.price_per_hour,
        amenities: lot.amenities,
        notes: lot.notes,
        created_at: lot.created_at,
        floor: lot.floor,
        number: lot.number,
        restriction: lot.restriction,
        // Additional UI fields
        ownerName: lot.users.name,
        ownerEmail: lot.users.email,
        ownerPhone: lot.users.phone || '',
      }));

      setParkingLots(formattedParkingLots);
    } catch (error) {
      console.error('Error fetching parking lots:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadPhoto = async (file: File): Promise<string> => {
    try {
      console.log('Starting upload in ParkingProvider...');
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;
      console.log('Generated file path:', filePath);

      console.log('Attempting to upload to Supabase storage...');
      const { data, error } = await supabase.storage
        .from('parking-lots')
        .upload(filePath, file);

      if (error) {
        console.error('Supabase storage upload error:', error);
        throw error;
      }

      console.log('Upload successful, getting public URL...');
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('parking-lots')
        .getPublicUrl(filePath);

      console.log('Got public URL:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Detailed error in uploadPhoto:', error);
      throw error;
    }
  };

  const addParkingLot = async (
    parkingLotData: Omit<ParkingLot, "id" | "created_at" | "ownerName" | "ownerEmail" | "ownerPhone">
  ): Promise<ParkingLot | null> => {
    try {
      setLoading(true);
      
      if (!user) {
        throw new Error("User must be authenticated to add a parking lot");
      }

      const { data, error } = await supabase
        .from('parking_lots')
        .insert({
          owner_id: user.id,
          street: parkingLotData.street,
          city: parkingLotData.city,
          state: parkingLotData.state,
          zip_code: parkingLotData.zip_code,
          country: parkingLotData.country,
          latitude: parkingLotData.latitude,
          longitude: parkingLotData.longitude,
          photo_url: parkingLotData.photo_url,
          is_available: parkingLotData.is_available,
          price_per_hour: parkingLotData.price_per_hour,
          amenities: parkingLotData.amenities,
          notes: parkingLotData.notes,
          floor: parkingLotData.floor,
          number: parkingLotData.number,
          restriction: parkingLotData.restriction,
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

      if (error) throw error;

      if (!data) {
        throw new Error("No data returned from insert");
      }

      const newParkingLot: ParkingLot = {
        id: data.id,
        owner_id: data.owner_id,
        street: data.street,
        city: data.city,
        state: data.state,
        zip_code: data.zip_code,
        country: data.country,
        latitude: data.latitude,
        longitude: data.longitude,
        photo_url: data.photo_url,
        is_available: data.is_available,
        price_per_hour: data.price_per_hour,
        amenities: data.amenities,
        notes: data.notes,
        created_at: data.created_at,
        floor: data.floor,
        number: data.number,
        restriction: data.restriction,
        // Additional UI fields
        ownerName: data.users.name,
        ownerEmail: data.users.email,
        ownerPhone: data.users.phone || '',
      };
      
      setParkingLots(prev => [...prev, newParkingLot]);
      return newParkingLot;
    } catch (error: any) {
      console.error("Add parking lot error:", error?.message || error || "Unknown error");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateParkingLot = async (
    id: string,
    parkingLotData: Partial<Omit<ParkingLot, "id" | "created_at" | "ownerName" | "ownerEmail" | "ownerPhone">>
  ): Promise<ParkingLot | null> => {
    try {
      setLoading(true);
      
      if (!user) {
        throw new Error("User must be authenticated to update a parking lot");
      }

      const existingLot = getParkingLotById(id);
      if (!existingLot) {
        throw new Error("Parking lot not found");
      }

      if (existingLot.owner_id !== user.id) {
        throw new Error("You can only update your own parking lots");
      }

      const { data, error } = await supabase
        .from('parking_lots')
        .update(parkingLotData)
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

      if (error) throw error;

      if (!data) {
        throw new Error("No data returned from update");
      }

      const updatedParkingLot: ParkingLot = {
        id: data.id,
        owner_id: data.owner_id,
        street: data.street,
        city: data.city,
        state: data.state,
        zip_code: data.zip_code,
        country: data.country,
        latitude: data.latitude,
        longitude: data.longitude,
        photo_url: data.photo_url,
        is_available: data.is_available,
        price_per_hour: data.price_per_hour,
        amenities: data.amenities,
        notes: data.notes,
        created_at: data.created_at,
        floor: data.floor,
        number: data.number,
        restriction: data.restriction,
        // Additional UI fields
        ownerName: data.users.name,
        ownerEmail: data.users.email,
        ownerPhone: data.users.phone || '',
      };

      setParkingLots(prev =>
        prev.map(lot => (lot.id === id ? updatedParkingLot : lot))
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
          lot.id === id ? { ...lot, is_available: isAvailable } : lot
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
    endTime: Date
  ): Promise<Booking | null> => {
    if (!user) {
      console.error("Must be logged in to book");
      return null;
    }
    setLoading(true);
    try {
      // calculate duration & price
      const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      const parkingLot = getParkingLotById(parkingLotId);
      if (!parkingLot) throw new Error("Parking lot not found");
  
      const totalPrice = parkingLot.price_per_hour * hours;
  
      // ** Minimal insert + simple select('*') **
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          parking_lot_id: parkingLotId,
          renter_id:      user.id,
          start_time:     startTime.toISOString(),
          duration:       hours,
          price:          totalPrice,
          status:         'pending'
        })
        .select('*')
        .single();
  
      if (error) {
        console.error("Supabase insert error:", error.message);
        throw error;
      }
      if (!data) {
        throw new Error("No booking returned");
      }
  
      // Build your Booking object from what you know
      const newBooking: Booking = {
        id:                data.id,
        parkingLotId:      data.parking_lot_id,
        parkingLotAddress: `${parkingLot.street}, ${parkingLot.city}, ${parkingLot.state}`,
        renterId:          data.renter_id,
        renterName:        profile?.name || '—',
        ownerId:           parkingLot.owner_id,
        ownerName:         parkingLot.ownerName,
        startTime:         data.start_time,
        duration:          data.duration,
        price:             data.price,
        status:            data.status as Booking['status'],
      };
  
      setBookings(prev => [...prev, newBooking]);
      return newBooking;
    } catch (err: any) {
      console.error("Request booking error:", err);
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
            owner_id,
            users (
              name
            )
          ),
          renters:users!bookings_renter_id (
            name
          )
        `)
        .or(`renter_id.eq.${userId},parking_lots.owner_id.eq.${userId}`);


      if (error) throw error;

      const formattedBookings: Booking[] = data.map(booking => ({
        id:               booking.id,
        parkingLotId:     booking.parking_lot_id,
        parkingLotAddress:`${booking.parking_lots.street}, ${booking.parking_lots.city}, ${booking.parking_lots.state}`,
        renterId:         booking.renter_id,
        renterName:       booking.renters.name,
        ownerId:          booking.parking_lots.owner_id,
        ownerName:        booking.parking_lots.users.name,
        startTime:        booking.start_time,
        duration:         booking.duration,
        price:            booking.price,
        status:           booking.status as Booking['status'],
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
        owner_id: lot.owner_id,
        street: lot.street,
        city: lot.city,
        state: lot.state,
        zip_code: lot.zip_code,
        country: lot.country,
        latitude: lot.latitude,
        longitude: lot.longitude,
        photo_url: lot.photo_url,
        is_available: lot.is_available,
        price_per_hour: lot.price_per_hour,
        amenities: lot.amenities,
        notes: lot.notes,
        created_at: lot.created_at,
        floor: lot.floor,
        number: lot.number,
        restriction: lot.restriction,
        // Additional UI fields
        ownerName: lot.users.name,
        ownerEmail: lot.users.email,
        ownerPhone: lot.users.phone || '',
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
    return parkingLots.filter((lot) => lot.owner_id === userId);
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
        myParkingLots: parkingLots.filter(lot => lot.owner_id === user?.id),
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
        updateBookingStatus,
        uploadPhoto
      }}
    >
      {children}
    </ParkingContext.Provider>
  );
}; 