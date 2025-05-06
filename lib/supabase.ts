import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Type definitions for our database tables
export type Database = {
  public: {
    tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          phone: string | null;
          user_type: 'owner' | 'renter';
          created_at: string;
        };
        Insert: Omit<Database['public']['tables']['users']['Row'], 'id' | 'created_at'>;
      };
      parking_lots: {
        Row: {
          id: string;
          owner_id: string;
          street: string;
          city: string;
          state: string;
          zip_code: string;
          country: string;
          latitude: number;
          longitude: number;
          instructions: string;
          photo_url: string | null;
          is_available: boolean;
          price_per_hour: number;
          amenities: string[];
          access_instructions: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['tables']['parking_lots']['Row'], 'id' | 'created_at'>;
      };
      bookings: {
        Row: {
          id: string;
          parking_lot_id: string;
          renter_id: string;
          start_time: string;
          duration: number;
          price: number;
          status: 'pending' | 'confirmed' | 'paid' | 'completed' | 'cancelled';
          created_at: string;
        };
        Insert: Omit<Database['public']['tables']['bookings']['Row'], 'id' | 'created_at'>;
      };
    };
  };
}; 