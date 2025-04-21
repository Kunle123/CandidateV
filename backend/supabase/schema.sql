-- Create a table for user profiles
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  name text,
  email text unique not null,
  avatar_url text,
  role text default 'user',
  status text default 'active',
  phone_number text,
  address text,
  city text,
  country text,
  terms_accepted boolean default false,
  terms_accepted_at timestamptz,
  email_verified boolean default false,
  last_login timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  constraint profiles_email_matches_auth check (auth.jwt()->>'email' = email)
);

-- Enable RLS (Row Level Security)
alter table public.profiles enable row level security;

-- Create policies for profiles table
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update using (
    auth.uid() = id
  );

-- Create table for user preferences
create table public.user_preferences (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  theme text default 'light',
  language text default 'en',
  timezone text default 'UTC',
  email_notifications boolean default true,
  push_notifications boolean default true,
  marketing_emails boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS on user_preferences
alter table public.user_preferences enable row level security;

-- Create policies for user_preferences
create policy "Users can view own preferences"
  on user_preferences for select
  using ( auth.uid() = user_id );

create policy "Users can update own preferences"
  on user_preferences for update
  using ( auth.uid() = user_id );

create policy "Users can insert own preferences"
  on user_preferences for insert
  with check ( auth.uid() = user_id );

-- Create table for user activity logs
create table public.user_activity_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  activity_type text not null,
  description text,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

-- Enable RLS on activity logs
alter table public.user_activity_logs enable row level security;

-- Create policies for activity logs
create policy "Users can view own activity logs"
  on user_activity_logs for select
  using ( auth.uid() = user_id );

create policy "System can insert activity logs"
  on user_activity_logs for insert
  with check ( true );

-- Function to handle new user profiles
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (
    id, 
    email, 
    name,
    email_verified,
    role
  )
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'name',
    new.email_confirmed_at is not null,
    'user'
  );
  return new;
end;
$$;

-- Trigger to create profile on user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to handle user preferences on profile creation
create or replace function public.handle_new_user_preferences()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.user_preferences (user_id)
  values (new.id);
  
  -- Log the new user creation
  insert into public.user_activity_logs (
    user_id,
    activity_type,
    description
  ) values (
    new.id,
    'account_created',
    'New user account created'
  );
  
  return new;
end;
$$;

-- Trigger to create user preferences on profile creation
create trigger on_profile_created
  after insert on public.profiles
  for each row execute procedure public.handle_new_user_preferences();

-- Function to log user activity
create or replace function public.log_user_activity(
  user_id uuid,
  activity_type text,
  description text,
  ip_address text default null,
  user_agent text default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  log_id uuid;
begin
  insert into public.user_activity_logs (
    user_id,
    activity_type,
    description,
    ip_address,
    user_agent
  ) values (
    user_id,
    activity_type,
    description,
    ip_address,
    user_agent
  )
  returning id into log_id;
  
  return log_id;
end;
$$; 