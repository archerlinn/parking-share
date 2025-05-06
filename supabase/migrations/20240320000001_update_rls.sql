-- Drop existing policies for users table
drop policy if exists "Users can read own data" on users;

-- Create new policies for users table
create policy "Enable insert for authenticated users" on users
  for insert
  with check (auth.uid() = id);

create policy "Enable read access for authenticated users" on users
  for select
  using (true);

create policy "Enable update for users based on id" on users
  for update
  using (auth.uid() = id);

-- Make sure RLS is enabled
alter table users enable row level security; 