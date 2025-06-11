/*
  # Add auth_id column to employees table

  1. New Columns
    - `auth_id` (uuid, foreign key to auth.users)
  
  2. Indexes
    - Add index on auth_id for performance
  
  3. Security
    - Add RLS policies for user access control
    - Users can view their own employee record
    - Admins can view and modify all employee records
*/

-- Adicionar coluna auth_id à tabela employees
ALTER TABLE employees ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id);

-- Criar índice para melhorar performance de buscas por auth_id
CREATE INDEX IF NOT EXISTS idx_employees_auth_id ON employees(auth_id);

-- Remover políticas existentes se existirem e recriar
DO $$
BEGIN
  -- Remover política se existir
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'employees' 
    AND policyname = 'Users can view own employee record'
  ) THEN
    DROP POLICY "Users can view own employee record" ON employees;
  END IF;
END $$;

DO $$
BEGIN
  -- Remover política se existir
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'employees' 
    AND policyname = 'Admins can view all employee records'
  ) THEN
    DROP POLICY "Admins can view all employee records" ON employees;
  END IF;
END $$;

DO $$
BEGIN
  -- Remover política se existir
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'employees' 
    AND policyname = 'Admins can modify all employee records'
  ) THEN
    DROP POLICY "Admins can modify all employee records" ON employees;
  END IF;
END $$;

-- Criar políticas RLS
CREATE POLICY "Users can view own employee record"
ON employees FOR SELECT
TO public
USING (auth.uid() = auth_id);

CREATE POLICY "Admins can view all employee records"
ON employees FOR SELECT
TO public
USING (
  (auth.jwt() ->> 'role'::text) = 'admin'::text
);

CREATE POLICY "Admins can modify all employee records"
ON employees FOR ALL
TO public
USING (
  (auth.jwt() ->> 'role'::text) = 'admin'::text
);