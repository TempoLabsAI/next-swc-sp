-- Create webhook_events table if it doesn't exist
create table if not exists webhook_events (
    id uuid default gen_random_uuid() primary key,
    event_type text not null,
    raw_event jsonb not null,
    status text not null check (status in ('pending', 'success', 'error')),
    error_message text,
    processed_at timestamp with time zone not null,
    created_at timestamp with time zone default now() not null
);

-- Add new columns if they don't exist
DO $$ 
BEGIN
    -- Add event_type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'webhook_events' 
        AND column_name = 'event_type'
    ) THEN
        ALTER TABLE webhook_events ADD COLUMN event_type text;
        -- Copy data from 'type' to 'event_type' if 'type' exists
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'webhook_events' 
            AND column_name = 'type'
        ) THEN
            UPDATE webhook_events SET event_type = type;
            ALTER TABLE webhook_events DROP COLUMN type;
        END IF;
    END IF;

    -- Add status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'webhook_events' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE webhook_events ADD COLUMN status text;
    END IF;
END $$;

-- Create indexes if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'webhook_events' 
        AND indexname = 'webhook_events_event_type_idx'
    ) THEN
        CREATE INDEX webhook_events_event_type_idx ON webhook_events(event_type);
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'webhook_events' 
        AND indexname = 'webhook_events_status_idx'
    ) THEN
        CREATE INDEX webhook_events_status_idx ON webhook_events(status);
    END IF;
END $$;

-- Enable RLS
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
