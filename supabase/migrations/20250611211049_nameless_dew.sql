/*
  # Fix Order Column Names

  This migration ensures the orders table has consistent column naming.
  It checks if last_modified_at exists and renames it to updated_at,
  or adds updated_at if neither column exists.
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
    ALTER TABLE orders ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;