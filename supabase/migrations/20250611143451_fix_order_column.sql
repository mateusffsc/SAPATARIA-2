-- Renomeia a coluna last_modified_at para updated_at na tabela orders
ALTER TABLE orders RENAME COLUMN last_modified_at TO updated_at; 