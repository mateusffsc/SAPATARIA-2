/*
  # Schema completo para Sistema de Gestão de Sapataria

  1. Tabelas principais
    - clients: Clientes da sapataria
    - orders: Ordens de serviço
    - technicians: Técnicos que executam os serviços
    - services: Catálogo de serviços oferecidos
    - payment_methods: Formas de pagamento aceitas
    - banks: Bancos para processamento de pagamentos
    - employees: Funcionários do sistema
    - products: Produtos em estoque
    - suppliers: Fornecedores
    - bills: Contas a pagar
    - order_images: Imagens das ordens de serviço

  2. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas básicas de acesso
*/

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS clients (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  email TEXT DEFAULT '',
  street TEXT DEFAULT '',
  number TEXT DEFAULT '',
  complement TEXT DEFAULT '',
  neighborhood TEXT DEFAULT '',
  city TEXT DEFAULT '',
  state TEXT DEFAULT '',
  zip_code TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de técnicos
CREATE TABLE IF NOT EXISTS technicians (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT DEFAULT '',
  start_date DATE DEFAULT CURRENT_DATE,
  total_services INTEGER DEFAULT 0,
  avg_rating DECIMAL(3,2) DEFAULT 5.0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de serviços
CREATE TABLE IF NOT EXISTS services (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  default_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  group_name TEXT DEFAULT '',
  description TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de bancos
CREATE TABLE IF NOT EXISTS banks (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  agency TEXT NOT NULL,
  account TEXT NOT NULL,
  fee DECIMAL(5,2) DEFAULT 0,
  settlement_days INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de formas de pagamento
CREATE TABLE IF NOT EXISTS payment_methods (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  bank_id BIGINT REFERENCES banks(id),
  fee DECIMAL(5,2) DEFAULT 0,
  settlement_days INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de funcionários
CREATE TABLE IF NOT EXISTS employees (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'attendant',
  is_active BOOLEAN DEFAULT true,
  custom_permissions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- Tabela de fornecedores
CREATE TABLE IF NOT EXISTS suppliers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  cnpj TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  email TEXT DEFAULT '',
  address TEXT DEFAULT '',
  contact TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT DEFAULT '',
  model TEXT DEFAULT '',
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  supplier TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de ordens de serviço
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  article TEXT NOT NULL,
  brand TEXT DEFAULT '',
  model TEXT DEFAULT '',
  color TEXT DEFAULT '',
  size TEXT DEFAULT '',
  serial_number TEXT DEFAULT '',
  description TEXT DEFAULT '',
  services JSONB DEFAULT '[]',
  delivery_date DATE NOT NULL,
  payment_method_entry TEXT DEFAULT '',
  total_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  entry_value DECIMAL(10,2) DEFAULT 0,
  remaining_value DECIMAL(10,2) DEFAULT 0,
  payment_method_remaining TEXT DEFAULT '',
  observations TEXT DEFAULT '',
  status TEXT DEFAULT 'aberta',
  payments JSONB DEFAULT '[]',
  created_by TEXT DEFAULT 'Sistema',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_modified_by TEXT DEFAULT 'Sistema'
);

-- Tabela de contas a pagar
CREATE TABLE IF NOT EXISTS bills (
  id BIGSERIAL PRIMARY KEY,
  supplier TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending',
  created_by TEXT DEFAULT 'Sistema',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  paid_by TEXT
);

-- Tabela de imagens das ordens
CREATE TABLE IF NOT EXISTS order_images (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_images ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (permitir tudo por enquanto - ajustar conforme necessário)
CREATE POLICY "Allow all operations on clients" ON clients FOR ALL USING (true);
CREATE POLICY "Allow all operations on technicians" ON technicians FOR ALL USING (true);
CREATE POLICY "Allow all operations on services" ON services FOR ALL USING (true);
CREATE POLICY "Allow all operations on banks" ON banks FOR ALL USING (true);
CREATE POLICY "Allow all operations on payment_methods" ON payment_methods FOR ALL USING (true);
CREATE POLICY "Allow all operations on employees" ON employees FOR ALL USING (true);
CREATE POLICY "Allow all operations on suppliers" ON suppliers FOR ALL USING (true);
CREATE POLICY "Allow all operations on products" ON products FOR ALL USING (true);
CREATE POLICY "Allow all operations on orders" ON orders FOR ALL USING (true);
CREATE POLICY "Allow all operations on bills" ON bills FOR ALL USING (true);
CREATE POLICY "Allow all operations on order_images" ON order_images FOR ALL USING (true);

-- Triggers para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_technicians_updated_at BEFORE UPDATE ON technicians FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_banks_updated_at BEFORE UPDATE ON banks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON bills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir dados iniciais

-- Bancos
INSERT INTO banks (code, name, agency, account, fee, settlement_days) VALUES
('001', 'Banco do Brasil', '1234-5', '12345-6', 2.5, 1),
('341', 'Itaú', '5678-9', '67890-1', 2.8, 2),
('237', 'Bradesco', '9012-3', '34567-8', 2.6, 1),
('104', 'Caixa Econômica', '4567-8', '90123-4', 2.4, 1)
ON CONFLICT (code) DO NOTHING;

-- Formas de pagamento
INSERT INTO payment_methods (name, bank_id, fee, settlement_days) VALUES
('Dinheiro', NULL, 0, 0),
('PIX', 1, 1.0, 0),
('Cartão Débito', 1, 2.0, 1),
('Cartão Crédito', 1, 3.5, 30),
('Transferência', 1, 1.5, 1)
ON CONFLICT DO NOTHING;

-- Serviços
INSERT INTO services (name, default_price, group_name, description) VALUES
('Troca de sola', 35.00, 'Reparos', 'Substituição completa da sola do calçado'),
('Reparo de salto', 25.00, 'Reparos', 'Conserto ou substituição de salto'),
('Costura', 20.00, 'Reparos', 'Costura de rasgos e reparos em geral'),
('Limpeza', 15.00, 'Manutenção', 'Limpeza profunda do calçado'),
('Tingimento', 40.00, 'Estética', 'Mudança de cor do calçado'),
('Palmilha ortopédica', 50.00, 'Conforto', 'Confecção de palmilha personalizada'),
('Alongamento', 30.00, 'Ajustes', 'Alongamento do calçado'),
('Estreitamento', 25.00, 'Ajustes', 'Ajuste para calçado largo')
ON CONFLICT DO NOTHING;

-- Técnicos
INSERT INTO technicians (name, specialty, phone, email, start_date, total_services, avg_rating) VALUES
('João Silva', 'Solas e saltos', '(31) 99888-1234', 'joao@sapataria.com', '2023-01-15', 45, 4.8),
('Maria Santos', 'Costura e reparos', '(31) 99777-5678', 'maria@sapataria.com', '2022-08-10', 38, 4.9),
('Pedro Costa', 'Limpeza e tingimento', '(31) 99666-9012', 'pedro@sapataria.com', '2023-05-20', 22, 4.7),
('Ana Oliveira', 'Palmilhas e ajustes', '(31) 99555-3456', 'ana@sapataria.com', '2023-03-01', 31, 4.6)
ON CONFLICT DO NOTHING;

-- Funcionários (usuários do sistema)
INSERT INTO employees (name, email, username, password, role) VALUES
('Administrador', 'admin@sapataria.com', 'admin', 'admin123', 'admin'),
('Gerente', 'gerente@sapataria.com', 'gerente', 'gerente123', 'manager'),
('Atendente', 'atendente@sapataria.com', 'atendente', 'atend123', 'attendant'),
('Técnico Sistema', 'tecnico@sapataria.com', 'tecnico', 'tec123', 'technician')
ON CONFLICT (username) DO NOTHING;

-- Fornecedores
INSERT INTO suppliers (name, cnpj, phone, email, address, contact) VALUES
('Fornecedor ABC Ltda', '12.345.678/0001-90', '(31) 3333-4444', 'contato@fornecedorabc.com', 'Rua dos Fornecedores, 123', 'João da Silva'),
('Materiais XYZ', '98.765.432/0001-10', '(31) 5555-6666', 'contato@materiaisxyz.com', 'Avenida do Comércio, 456', 'Maria Santos'),
('Couro Premium', '11.222.333/0001-44', '(31) 7777-8888', 'vendas@couropremium.com', 'Rua do Couro, 789', 'Carlos Oliveira')
ON CONFLICT (cnpj) DO NOTHING;

-- Produtos
INSERT INTO products (name, category, brand, model, price, cost, stock, min_stock, supplier) VALUES
('Palmilha de Couro', 'Materiais', 'CouroFlex', 'Premium', 29.90, 15.00, 50, 20, 'Fornecedor ABC Ltda'),
('Cola para Sapatos', 'Materiais', 'SuperCola', 'Profissional', 45.90, 25.00, 15, 10, 'Materiais XYZ'),
('Sola de Borracha', 'Materiais', 'FlexSole', 'Antiderrapante', 35.00, 18.00, 30, 15, 'Fornecedor ABC Ltda'),
('Linha de Costura', 'Materiais', 'ResistLine', 'Extra Forte', 12.50, 6.00, 25, 10, 'Materiais XYZ'),
('Tinta para Couro', 'Materiais', 'ColorMax', 'Preta', 28.00, 14.00, 20, 8, 'Couro Premium')
ON CONFLICT DO NOTHING;

-- Clientes de exemplo
INSERT INTO clients (name, cpf, phone, email, street, number, complement, neighborhood, city, state, zip_code) VALUES
('Ana Maria Silva', '123.456.789-00', '(31) 99999-1234', 'ana@email.com', 'Rua das Flores', '123', 'Apto 101', 'Centro', 'Belo Horizonte', 'MG', '30130-110'),
('Carlos Silva Santos', '987.654.321-00', '(31) 98888-5678', 'carlos@email.com', 'Avenida Amazonas', '1500', '', 'Santo Agostinho', 'Belo Horizonte', 'MG', '30180-001'),
('Mariana Costa Lima', '456.789.123-00', '(31) 97777-9012', 'mariana@email.com', 'Rua dos Tupis', '750', 'Sala 304', 'Centro', 'Belo Horizonte', 'MG', '30190-060'),
('Roberto Lima Souza', '321.654.987-00', '(31) 96666-3456', 'roberto@email.com', 'Rua Rio de Janeiro', '1000', '', 'Lourdes', 'Belo Horizonte', 'MG', '30160-041'),
('Julia Oliveira Costa', '789.123.456-00', '(31) 95555-7890', 'julia@email.com', 'Rua da Bahia', '2500', 'Bloco B', 'Funcionários', 'Belo Horizonte', 'MG', '30112-011')
ON CONFLICT (cpf) DO NOTHING;

-- Ordens de serviço de exemplo
INSERT INTO orders (number, date, client_id, client_name, article, brand, model, color, size, serial_number, description, services, delivery_date, payment_method_entry, total_value, entry_value, remaining_value, payment_method_remaining, observations, status, payments, created_by, last_modified_by) VALUES
('OS-001', '2025-06-01', 1, 'Ana Maria Silva', 'Sapato social', 'Nike', 'Air Max 90', 'Preto', '37', 'NK37492021', 'Sapato social feminino', '[{"serviceId": 1, "name": "Troca de sola", "details": "Sola de borracha", "price": 35.00, "technicianId": 1}]', '2025-06-10', 'PIX', 35.00, 15.00, 20.00, 'Dinheiro', 'Cliente preferiu sola mais resistente', 'em-andamento', '[{"date": "2025-06-01", "value": 15.00, "method": "PIX", "type": "entrada"}]', 'Admin', 'Admin'),
('OS-002', '2025-05-28', 2, 'Carlos Silva Santos', 'Tênis esportivo', 'Adidas', 'Ultraboost', 'Branco', '42', 'AD42785022', 'Tênis para corrida', '[{"serviceId": 4, "name": "Limpeza", "details": "Limpeza profunda", "price": 15.00, "technicianId": 3}, {"serviceId": 2, "name": "Reparo de salto", "details": "Troca da borracha", "price": 25.00, "technicianId": 1}]', '2025-06-05', 'Cartão Crédito', 40.00, 40.00, 0.00, '', '', 'finalizada', '[{"date": "2025-05-28", "value": 40.00, "method": "Cartão Crédito", "type": "total"}]', 'Admin', 'Admin'),
('OS-003', '2025-05-25', 3, 'Mariana Costa Lima', 'Sandália', 'Melissa', 'Beach Slide', 'Rosa', '38', 'ML38123023', 'Sandália de festa', '[{"serviceId": 3, "name": "Costura", "details": "Reparo na alça", "price": 20.00, "technicianId": 2}]', '2025-06-02', 'PIX', 20.00, 10.00, 10.00, 'Dinheiro', 'Urgente para evento', 'finalizada', '[{"date": "2025-05-25", "value": 10.00, "method": "PIX", "type": "entrada"}, {"date": "2025-06-02", "value": 10.00, "method": "Dinheiro", "type": "restante"}]', 'Admin', 'Admin')
ON CONFLICT (number) DO NOTHING;

-- Contas a pagar de exemplo
INSERT INTO bills (supplier, description, category, amount, due_date, status, created_by) VALUES
('Fornecedor de Couro Ltda', 'Couro para sapatos', 'Materiais e Insumos', 850.00, '2025-06-10', 'pending', 'Admin'),
('Energia Elétrica SA', 'Conta de luz - Maio/2025', 'Energia Elétrica', 320.50, '2025-06-08', 'pending', 'Admin'),
('Telefonia Móvel', 'Conta de telefone - Maio/2025', 'Telefone/Internet', 89.90, '2025-06-15', 'pending', 'Admin')
ON CONFLICT DO NOTHING;