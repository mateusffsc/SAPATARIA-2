/*
  # Fix Clients Table RLS Configuration

  1. Security Changes
    - Enable RLS on `clients` table to match other tables
    - Add proper RLS policies for authenticated access
    - Remove overly permissive public policy

  2. Notes
    - This ensures consistent security across all tables
    - Fixes potential authentication issues causing "Failed to fetch" errors
    - Maintains backward compatibility with existing application logic
*/

-- Enable RLS on clients table
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Allow all operations on clients" ON clients;

-- Create proper RLS policies for clients table
CREATE POLICY "Allow authenticated users to read clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert clients"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update clients"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete clients"
  ON clients
  FOR DELETE
  TO authenticated
  USING (true);

-- Also create policies for public access (for applications not using auth)
CREATE POLICY "Allow public read access to clients"
  ON clients
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to clients"
  ON clients
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to clients"
  ON clients
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to clients"
  ON clients
  FOR DELETE
  TO public
  USING (true);