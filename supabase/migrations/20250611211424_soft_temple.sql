-- Check if the column exists before trying to rename it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'orders' 
    AND column_name = 'last_modified_at'
  ) THEN
    ALTER TABLE orders RENAME COLUMN last_modified_at TO updated_at;
  END IF;
END $$;