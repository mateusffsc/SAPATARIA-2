-- Adicionar coluna auth_id à tabela employees
ALTER TABLE employees ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id);

-- Criar índice para melhorar performance de buscas por auth_id
CREATE INDEX IF NOT EXISTS idx_employees_auth_id ON employees(auth_id);

-- Adicionar política RLS para permitir que usuários vejam apenas seus próprios dados
CREATE POLICY "Users can view own employee record"
ON employees FOR SELECT
USING (auth.uid() = auth_id);

-- Adicionar política RLS para permitir que admins vejam todos os registros
CREATE POLICY "Admins can view all employee records"
ON employees FOR SELECT
USING (
  auth.jwt() ->> 'role' = 'admin'
);

-- Adicionar política RLS para permitir que admins modifiquem todos os registros
CREATE POLICY "Admins can modify all employee records"
ON employees FOR ALL
USING (
  auth.jwt() ->> 'role' = 'admin'
); 