/*
  # Product Sales System

  1. New Tables
    - `product_sales` - Main sales records
    - `product_sale_items` - Individual items in each sale

  2. Features
    - Automatic stock reduction when products are sold
    - Financial transaction creation for sales
    - RLS policies for security

  3. Security
    - Enable RLS on both tables
    - Allow all operations (adjust as needed)
*/

-- Create product_sales table
CREATE TABLE IF NOT EXISTS product_sales (
  id BIGSERIAL PRIMARY KEY,
  sale_number TEXT NOT NULL UNIQUE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  client_id BIGINT REFERENCES clients(id),
  client_name TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  created_by TEXT NOT NULL DEFAULT 'System',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create product_sale_items table
CREATE TABLE IF NOT EXISTS product_sale_items (
  id BIGSERIAL PRIMARY KEY,
  sale_id BIGINT NOT NULL REFERENCES product_sales(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE product_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_sale_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all operations on product_sales" ON product_sales FOR ALL USING (true);
CREATE POLICY "Allow all operations on product_sale_items" ON product_sale_items FOR ALL USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_product_sales_updated_at 
BEFORE UPDATE ON product_sales 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update product stock when a sale is made
CREATE OR REPLACE FUNCTION update_product_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrease product stock
  UPDATE products
  SET stock = stock - NEW.quantity
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for stock update
CREATE TRIGGER update_stock_on_sale
AFTER INSERT ON product_sale_items
FOR EACH ROW
EXECUTE FUNCTION update_product_stock_on_sale();

-- Function to create financial transaction from product sale
CREATE OR REPLACE FUNCTION create_financial_transaction_from_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- Create income transaction for the sale
  INSERT INTO financial_transactions (
    type,
    amount,
    description,
    category,
    reference_type,
    reference_id,
    payment_method,
    date,
    created_by
  ) VALUES (
    'income',
    NEW.total_amount,
    'Venda de produtos - ' || NEW.sale_number || ' - ' || NEW.client_name,
    'Produtos',
    'sale',
    NEW.id,
    NEW.payment_method,
    NEW.date,
    NEW.created_by
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for financial transaction
CREATE TRIGGER create_financial_from_sale
AFTER INSERT ON product_sales
FOR EACH ROW
EXECUTE FUNCTION create_financial_transaction_from_sale();

-- Insert sample data using existing client IDs from the clients table
DO $$
DECLARE
    client_1_id BIGINT;
    client_2_id BIGINT;
    client_3_id BIGINT;
    sale_1_id BIGINT;
    sale_2_id BIGINT;
    sale_3_id BIGINT;
BEGIN
    -- Get existing client IDs
    SELECT id INTO client_1_id FROM clients WHERE cpf = '123.456.789-00' LIMIT 1;
    SELECT id INTO client_2_id FROM clients WHERE cpf = '987.654.321-00' LIMIT 1;
    SELECT id INTO client_3_id FROM clients WHERE cpf = '456.789.123-00' LIMIT 1;
    
    -- Only insert if we have valid client IDs
    IF client_1_id IS NOT NULL AND client_2_id IS NOT NULL AND client_3_id IS NOT NULL THEN
        -- Insert sample sales
        INSERT INTO product_sales (sale_number, date, client_id, client_name, total_amount, payment_method, created_by)
        VALUES 
        ('VD-001', '2025-06-04', client_1_id, 'Ana Maria Silva', 59.80, 'PIX', 'Admin'),
        ('VD-002', '2025-06-03', client_2_id, 'Carlos Silva Santos', 83.40, 'Cartão Crédito', 'Admin'),
        ('VD-003', '2025-06-02', client_3_id, 'Mariana Costa Lima', 28.00, 'Dinheiro', 'Admin')
        ON CONFLICT (sale_number) DO NOTHING;
        
        -- Get the sale IDs
        SELECT id INTO sale_1_id FROM product_sales WHERE sale_number = 'VD-001';
        SELECT id INTO sale_2_id FROM product_sales WHERE sale_number = 'VD-002';
        SELECT id INTO sale_3_id FROM product_sales WHERE sale_number = 'VD-003';
        
        -- Insert sample items only if sales were created
        IF sale_1_id IS NOT NULL AND sale_2_id IS NOT NULL AND sale_3_id IS NOT NULL THEN
            INSERT INTO product_sale_items (sale_id, product_id, product_name, quantity, unit_price, total_price)
            VALUES
            (sale_1_id, 1, 'Palmilha de Couro', 2, 29.90, 59.80),
            (sale_2_id, 2, 'Cola para Sapatos', 1, 45.90, 45.90),
            (sale_2_id, 4, 'Linha de Costura', 3, 12.50, 37.50),
            (sale_3_id, 5, 'Tinta para Couro', 1, 28.00, 28.00)
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;
END $$;