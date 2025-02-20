-- Create users table
create table if not exists users (
    id uuid references auth.users on delete cascade not null primary key,
    email text,
    full_name text,
    avatar_url text,
    updated_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Update existing users table with new columns if they don't exist
do $$ 
begin
    if not exists (select 1 from information_schema.columns where table_name = 'users' and column_name = 'full_name') then
        alter table users add column full_name text;
    end if;

    if not exists (select 1 from information_schema.columns where table_name = 'users' and column_name = 'avatar_url') then
        alter table users add column avatar_url text;
    end if;

    if not exists (select 1 from information_schema.columns where table_name = 'users' and column_name = 'updated_at') then
        alter table users add column updated_at timestamp with time zone;
    end if;
end $$;

-- Set up Row Level Security (RLS)
alter table users enable row level security;

-- Create policies if they don't exist
do $$ 
begin
    if not exists (select 1 from pg_policies where tablename = 'users' and policyname = 'Users can view their own data') then
        create policy "Users can view their own data" 
            on users for select 
            using ( auth.uid() = id );
    end if;

    if not exists (select 1 from pg_policies where tablename = 'users' and policyname = 'Users can update their own data') then
        create policy "Users can update their own data"
            on users for update
            using ( auth.uid() = id );
    end if;
end $$;

-- Create trigger function if it doesn't exist
create or replace function public.handle_new_user() 
returns trigger as $$
begin
    insert into public.users (id, email, created_at, updated_at)
    values (new.id, new.email, new.created_at, new.updated_at);
    return new;
end;
$$ language plpgsql security definer;

-- Create trigger if it doesn't exist
do $$ 
begin
    if not exists (select 1 from pg_trigger where tgname = 'on_auth_user_created') then
        create trigger on_auth_user_created
            after insert on auth.users
            for each row execute procedure public.handle_new_user();
    end if;
end $$;
