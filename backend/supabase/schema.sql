-- Create a table for user profiles
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  name text,
  email text unique not null,
  avatar_url text,
  terms_accepted boolean default false,
  terms_accepted_at timestamptz,
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

-- Create function to handle new user profiles
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, new.raw_user_meta_data->>'name');
  return new;
end;
$$;

-- Trigger to create profile on user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create table for user preferences
create table public.user_preferences (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  theme text default 'light',
  email_notifications boolean default true,
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

-- Function to handle user preferences on profile creation
create or replace function public.handle_new_user_preferences()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.user_preferences (user_id)
  values (new.id);
  return new;
end;
$$;

-- Trigger to create user preferences on profile creation
create trigger on_profile_created
  after insert on public.profiles
  for each row execute procedure public.handle_new_user_preferences(); 