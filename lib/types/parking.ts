export interface ParkingProvider {
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
}

export type ParkingProviderInsert = Omit<ParkingProvider, 'id' | 'created_at'>; 