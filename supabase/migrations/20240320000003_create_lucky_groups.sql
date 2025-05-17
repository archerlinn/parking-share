-- Drop existing policies
drop policy if exists "Users can read groups they are members of" on public.lucky_groups;
drop policy if exists "Users can create groups" on public.lucky_groups;
drop policy if exists "Group creators can update their groups" on public.lucky_groups;
drop policy if exists "Users can read their own group memberships" on public.group_members;
drop policy if exists "Group creators can add members" on public.group_members;
drop policy if exists "Users can update their own group memberships" on public.group_members;

-- Create lucky_groups table
create table if not exists public.lucky_groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_by uuid references public.users(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create group_members table
create table if not exists public.group_members (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.lucky_groups(id) not null,
  user_id uuid references public.users(id) not null,
  sender_id uuid references public.users(id) not null,
  status text check (status in ('PENDING', 'ACCEPTED', 'REJECTED')) not null default 'PENDING',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(group_id, user_id)
);

-- Enable RLS
alter table public.lucky_groups enable row level security;
alter table public.group_members enable row level security;

-- Create policies for lucky_groups
create policy "Users can read groups they are members of"
  on public.lucky_groups for select
  using (
    auth.uid() = created_by or
    exists (
      select 1 from public.group_members
      where group_id = id
      and user_id = auth.uid()
      and status = 'ACCEPTED'
    )
  );

create policy "Users can create groups"
  on public.lucky_groups for insert
  with check (
    auth.uid() = created_by
  );

create policy "Group creators can update their groups"
  on public.lucky_groups for update
  using (
    auth.uid() = created_by
  );

-- Create policies for group_members
create policy "Users can read their own group memberships"
  on public.group_members for select
  using (
    user_id = auth.uid() or
    sender_id = auth.uid()
  );

create policy "Group creators can add members"
  on public.group_members for insert
  with check (
    sender_id = auth.uid()
  );

create policy "Users can update their own group memberships"
  on public.group_members for update
  using (
    user_id = auth.uid()
  );

-- Create indexes
create index if not exists lucky_groups_created_by_idx on public.lucky_groups(created_by);
create index if not exists group_members_group_id_idx on public.group_members(group_id);
create index if not exists group_members_user_id_idx on public.group_members(user_id);
create index if not exists group_members_status_idx on public.group_members(status); 