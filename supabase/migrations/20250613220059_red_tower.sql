/*
  # Fix order column names

  1. Changes
    - Safely attempts to rename last_modified_at to updated_at in orders table
    - Adds updated_at column if it doesn't exist
*/

-- Check if last_modified_at exists and rename it
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'last_modified_at'
  ) THEN
    ALTER TABLE orders RENAME COLUMN last_modified_at TO updated_at;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'updated_at'
  ) THEN
    -- If neither column exists, add updated_at
    ALTER TABLE orders ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
  END IF;
END $$;