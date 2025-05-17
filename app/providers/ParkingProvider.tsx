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
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  totalSpaces: number;
  availableSpaces: number;
  pricePerHour: number;
  photo_url?: string;
  is_available: boolean;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  isFriendOrGroupMember: boolean;
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

interface ParkingLotResponse {
  id: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  latitude: number;
  longitude: number;
  total_spaces: number;
  available_spaces: number;
  price_per_hour: number;
  photo_url: string | undefined;
  is_available: boolean;
  users: {
    id: string;
    name: string;
    email: string;
  };
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
    if (user) {
      console.log('User is available, fetching parking lots...');
      fetchParkingLots();
    } else {
      console.log('No user available yet, waiting...');
    }
  }, [user]);

  const fetchParkingLots = async () => {
    if (!user) {
      console.log('No user found, skipping parking lot fetch');
      return;
    }

    try {
      console.log('Starting to fetch parking lots for user:', user.id);
      
      // First get all friends and group members
      const { data: friendsData, error: friendsError } = await supabase
        .from('friendships')
        .select(`
          friend:users!friendships_receiver_id_fkey (
            id
          )
        `)
        .eq('sender_id', user.id)
        .eq('status', 'ACCEPTED');

      if (friendsError) {
        console.error('Error fetching friends:', friendsError);
        throw friendsError;
      }
      console.log('Friends data:', friendsData);

      const { data: receivedFriendsData, error: receivedFriendsError } = await supabase
        .from('friendships')
        .select(`
          friend:users!friendships_sender_id_fkey (
            id
          )
        `)
        .eq('receiver_id', user.id)
        .eq('status', 'ACCEPTED');

      if (receivedFriendsError) {
        console.error('Error fetching received friends:', receivedFriendsError);
        throw receivedFriendsError;
      }
      console.log('Received friends data:', receivedFriendsData);

      // Get groups where user is a member or creator
      const { data: userGroups, error: groupsError } = await supabase
        .from('lucky_groups')
        .select('id')
        .eq('created_by', user.id);

      if (groupsError) {
        console.error('Error fetching groups:', groupsError);
        throw groupsError;
      }
      console.log('User groups:', userGroups);

      // Get groups where user is a member
      const { data: memberGroups, error: memberGroupsError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id)
        .eq('status', 'ACCEPTED');

      if (memberGroupsError) {
        console.error('Error fetching member groups:', memberGroupsError);
        throw memberGroupsError;
      }
      console.log('Member groups:', memberGroups);

      // Combine group IDs
      const allGroupIds = [
        ...(userGroups?.map(g => g.id) || []),
        ...(memberGroups?.map(g => g.group_id) || [])
      ];

      // Get members from these groups
      const { data: groupMembersData, error: groupMembersError } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('status', 'ACCEPTED')
        .in('group_id', allGroupIds);

      if (groupMembersError) {
        console.error('Error fetching group members:', groupMembersError);
        throw groupMembersError;
      }
      console.log('Group members data:', groupMembersData);

      // Combine all user IDs (friends and group members)
      const friendIds = [
        ...(friendsData?.map(f => f.friend?.[0]?.id).filter(Boolean) || []),
        ...(receivedFriendsData?.map(f => f.friend?.[0]?.id).filter(Boolean) || []),
        ...(groupMembersData?.map(m => m.user_id).filter(Boolean) || []),
        user.id // Include own lots
      ];

      // Remove duplicates and undefined values
      const uniqueUserIds = [...new Set(friendIds)].filter(Boolean);
      console.log('Unique user IDs to fetch parking lots for:', uniqueUserIds);

      // Fetch parking lots for all users
      const { data: lots, error: lotsError } = await supabase
        .from('parking_lots')
        .select(`
          id,
          street,
          city,
          state,
          zip_code,
          country,
          latitude,
          longitude,
          price_per_hour,
          is_available,
          photo_url,
          owner:users!parking_lots_owner_id_fkey (
            id,
            name,
            email
          )
        `)
        .in('owner_id', uniqueUserIds);

      if (lotsError) {
        console.error('Error fetching parking lots:', lotsError);
        throw lotsError;
      }
      console.log('Raw parking lots data:', lots);

      const formattedLots: ParkingLot[] = lots.map(lot => {
        const owner = Array.isArray(lot.owner) ? lot.owner[0] : lot.owner;
        return {
          id: lot.id,
          name: `${lot.street}, ${lot.city}`,
          address: `${lot.street}, ${lot.city}, ${lot.state} ${lot.zip_code}, ${lot.country}`,
          latitude: lot.latitude,
          longitude: lot.longitude,
          totalSpaces: 1, // Default to 1 space per lot
          availableSpaces: lot.is_available ? 1 : 0,
          pricePerHour: lot.price_per_hour,
          photo_url: lot.photo_url,
          is_available: lot.is_available,
          owner: {
            id: owner?.id ?? "",
            name: owner?.name ?? "",
            email: owner?.email ?? ""
          },
          isFriendOrGroupMember: owner?.id !== user.id
        };
      });

      console.log('Formatted parking lots:', formattedLots);
      setParkingLots(formattedLots);
    } catch (error: any) {
      console.error('Error in fetchParkingLots:', error?.message || 'Unknown error');
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
          street: parkingLotData.address.split(',')[0].trim(),
          city: parkingLotData.address.split(',')[1].trim(),
          state: parkingLotData.address.split(',')[2].trim(),
          zip_code: parkingLotData.address.split(',')[2].trim().split(' ')[1],
          country: parkingLotData.address.split(',')[3].trim(),
          latitude: parkingLotData.latitude,
          longitude: parkingLotData.longitude,
          photo_url: parkingLotData.photo_url,
          is_available: parkingLotData.is_available,
          price_per_hour: parkingLotData.pricePerHour,
        })
        .select(`
          *,
          users:owner_id (
            id,
            name,
            email
          )
        `)
        .single();

      if (error) throw error;

      if (!data) {
        throw new Error("No data returned from insert");
      }

      const responseData = data as ParkingLotResponse;
      const owner = responseData.users;
      if (!owner) {
        throw new Error("No owner data found");
      }

      const newParkingLot: ParkingLot = {
        id: responseData.id,
        name: `${responseData.street}, ${responseData.city}`,
        address: `${responseData.street}, ${responseData.city}, ${responseData.state} ${responseData.zip_code}, ${responseData.country}`,
        latitude: responseData.latitude,
        longitude: responseData.longitude,
        totalSpaces: responseData.total_spaces || 1,
        availableSpaces: responseData.available_spaces || 1,
        pricePerHour: responseData.price_per_hour,
        photo_url: responseData.photo_url || undefined,
        is_available: responseData.is_available,
        owner: {
          id: owner.id,
          name: owner.name,
          email: owner.email
        },
        isFriendOrGroupMember: owner.id !== user.id
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

      if (existingLot.owner.id !== user.id) {
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
        name: data.name,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        totalSpaces: data.total_spaces,
        availableSpaces: data.available_spaces,
        pricePerHour: data.price_per_hour,
        photo_url: data.photo_url,
        is_available: data.is_available,
        owner: {
          id: data.owner.id,
          name: data.owner.name,
          email: data.owner.email
        },
        isFriendOrGroupMember: data.owner.id !== user.id
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
  
      const totalPrice = parkingLot.pricePerHour * hours;
  
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
        parkingLotAddress: `${parkingLot.address}`,
        renterId:          data.renter_id,
        renterName:        profile?.name || '—',
        ownerId:           parkingLot.owner.id,
        ownerName:         parkingLot.owner.name,
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
        name: lot.name,
        address: lot.address,
        latitude: lot.latitude,
        longitude: lot.longitude,
        totalSpaces: lot.total_spaces,
        availableSpaces: lot.available_spaces,
        pricePerHour: lot.price_per_hour,
        photo_url: lot.photo_url,
        is_available: lot.is_available,
        owner: {
          id: lot.owner.id,
          name: lot.owner.name,
          email: lot.owner.email
        },
        isFriendOrGroupMember: lot.owner.id !== user.id
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
    return parkingLots.filter((lot) => lot.owner.id === userId);
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
        myParkingLots: parkingLots.filter(lot => lot.owner.id === user?.id),
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