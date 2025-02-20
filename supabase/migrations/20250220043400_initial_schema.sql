-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for intervals if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'interval_type') THEN
        CREATE TYPE interval_type AS ENUM ('month', 'year');
    END IF;
END $$;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    email TEXT NOT NULL,
    name TEXT,
    image TEXT,
    user_id TEXT NOT NULL UNIQUE,
    subscription TEXT,
    credits TEXT,
    token_identifier TEXT NOT NULL UNIQUE,
    CONSTRAINT users_token_identifier_key UNIQUE (token_identifier)
);

-- Create index on token_identifier
CREATE INDEX IF NOT EXISTS users_token_identifier_idx ON users(token_identifier);

-- Create type for price structure if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'price_object') THEN
        CREATE TYPE price_object AS (
            amount DECIMAL,
            polar_id TEXT
        );
    END IF;
END $$;

-- Create type for interval prices if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'interval_prices') THEN
        CREATE TYPE interval_prices AS (
            usd price_object
        );
    END IF;
END $$;

-- Create plans table
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    polar_product_id TEXT NOT NULL,
    prices JSONB NOT NULL,
    CONSTRAINT plans_key_key UNIQUE (key),
    CONSTRAINT plans_polar_product_id_key UNIQUE (polar_product_id)
);

-- Create indexes for plans
CREATE INDEX IF NOT EXISTS plans_key_idx ON plans(key);
CREATE INDEX IF NOT EXISTS plans_polar_product_id_idx ON plans(polar_product_id);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT,
    polar_id TEXT,
    polar_price_id TEXT,
    currency TEXT,
    interval interval_type,
    status TEXT,
    current_period_start BIGINT,
    current_period_end BIGINT,
    cancel_at_period_end BOOLEAN,
    amount DECIMAL,
    started_at BIGINT,
    ends_at BIGINT,
    ended_at BIGINT,
    canceled_at BIGINT,
    customer_cancellation_reason TEXT,
    customer_cancellation_comment TEXT,
    metadata JSONB,
    custom_field_data JSONB,
    customer_id TEXT
);

-- Create indexes for subscriptions
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id);

-- Add polar_id column and index if they don't exist
DO $$ 
BEGIN 
    -- First check if the column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'subscriptions' 
        AND column_name = 'polar_id'
    ) THEN
        -- Add the column if it doesn't exist
        ALTER TABLE subscriptions ADD COLUMN polar_id TEXT;
    END IF;

    -- Then create the index if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'subscriptions' 
        AND indexname = 'subscriptions_polar_id_idx'
    ) THEN
        CREATE INDEX subscriptions_polar_id_idx ON subscriptions(polar_id);
    END IF;
END $$;

-- Create webhook_events table
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    modified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data JSONB NOT NULL
);

-- Add polar_event_id column and constraints if they don't exist
DO $$ 
BEGIN 
    -- First check if the column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'webhook_events' 
        AND column_name = 'polar_event_id'
    ) THEN
        -- Add the column if it doesn't exist
        ALTER TABLE webhook_events ADD COLUMN polar_event_id TEXT;
        -- Add unique constraint
        ALTER TABLE webhook_events ADD CONSTRAINT webhook_events_polar_event_id_key UNIQUE (polar_event_id);
    END IF;
END $$;

-- Create indexes for webhook_events
CREATE INDEX IF NOT EXISTS webhook_events_type_idx ON webhook_events(type);

-- Create polar_event_id index if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'webhook_events' 
        AND indexname = 'webhook_events_polar_event_id_idx'
    ) THEN
        CREATE INDEX webhook_events_polar_event_id_idx ON webhook_events(polar_event_id);
    END IF;
END $$;
