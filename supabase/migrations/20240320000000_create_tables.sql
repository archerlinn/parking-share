-- Drop existing tables if they exist
drop table if exists public.bookings;
drop table if exists public.parking_lots;
drop table if exists public.users;

-- Drop existing policies if they exist
drop policy if exists "Users can read own data" on public.users;
drop policy if exists "Users can insert own profile" on public.users;
drop policy if exists "Users can update own profile" on public.users;
drop policy if exists "Anyone can read parking lots" on public.parking_lots;
drop policy if exists "Owners can insert own parking lots" on public.parking_lots;
drop policy if exists "Owners can update own parking lots" on public.parking_lots;
drop policy if exists "Users can read own bookings" on public.bookings;
drop policy if exists "Renters can insert bookings" on public.bookings;
drop policy if exists "Users can update own bookings" on public.bookings;

-- Create users table
create table if not exists public.users (
  id uuid primary key references auth.users on delete cascade,
  email text unique not null,
  name text not null,
  phone text,
  user_type text check (user_type in ('owner', 'renter')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create parking lots table
create table if not exists public.parking_lots (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references public.users(id) not null,
  street text not null,
  city text not null,
  state text not null,
  zip_code text not null,
  country text not null,
  latitude double precision not null,
  longitude double precision not null,
  instructions text not null,
  photo_url text,
  is_available boolean default true not null,
  price_per_hour numeric(10,2) not null,
  amenities text[] not null default '{}',
  access_instructions text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create bookings table
create table if not exists public.bookings (
  id uuid default gen_random_uuid() primary key,
  parking_lot_id uuid references public.parking_lots(id) not null,
  renter_id uuid references public.users(id) not null,
  start_time timestamp with time zone not null,
  duration numeric(5,2) not null,
  price numeric(10,2) not null,
  status text check (status in ('pending', 'confirmed', 'paid', 'completed', 'cancelled')) not null default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.users enable row level security;
alter table public.parking_lots enable row level security;
alter table public.bookings enable row level security;

-- Users policies
create policy "Enable read access for own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Enable insert access for own profile"
  on public.users for insert
  with check (auth.uid() = id);

create policy "Enable update access for own profile"
  on public.users for update
  using (auth.uid() = id);

-- Parking lots policies
create policy "Enable read access for all parking lots"
  on public.parking_lots for select
  using (true);

create policy "Enable insert access for owners"
  on public.parking_lots for insert
  with check (auth.uid() = owner_id);

create policy "Enable update access for owners"
  on public.parking_lots for update
  using (auth.uid() = owner_id);

-- Bookings policies
create policy "Enable read access for own bookings"
  on public.bookings for select
  using (
    auth.uid() = renter_id or 
    auth.uid() = (select owner_id from public.parking_lots where id = parking_lot_id)
  );

create policy "Enable insert access for renters"
  on public.bookings for insert
  with check (auth.uid() = renter_id);

create policy "Enable update access for involved users"
  on public.bookings for update
  using (
    auth.uid() = renter_id or 
    auth.uid() = (select owner_id from public.parking_lots where id = parking_lot_id)
  );

-- Create indexes
create index if not exists parking_lots_owner_id_idx on public.parking_lots(owner_id);
create index if not exists parking_lots_location_idx on public.parking_lots(city, state, zip_code);
create index if not exists bookings_parking_lot_id_idx on public.bookings(parking_lot_id);
create index if not exists bookings_renter_id_idx on public.bookings(renter_id);
create index if not exists bookings_status_idx on public.bookings(status); 