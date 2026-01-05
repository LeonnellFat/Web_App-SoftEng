-- 002_update_drivers_table.sql
-- Updates drivers table to remove address field and add username
-- Add other necessary driver fields

-- Step 1: Add new columns
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS username text UNIQUE,
  ADD COLUMN IF NOT EXISTS license_number text,
  ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true;

-- Step 2: Remove address column (data loss warning - backup first!)
ALTER TABLE public.drivers
  DROP COLUMN IF EXISTS address;

-- Step 3: Add updated_at for tracking last status change
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Create an index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_drivers_username ON public.drivers(username);
CREATE INDEX IF NOT EXISTS idx_drivers_profile_id ON public.drivers(profile_id);
