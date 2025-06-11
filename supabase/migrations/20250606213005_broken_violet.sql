/*
  # Financial Transactions System

  1. New Tables
    - `financial_transactions`
      - `id` (uuid, primary key)
      - `type` (text: 'income' or 'expense')
      - `amount` (decimal: positive for income, negative for expense)
      - `description` (text)
      - `category` (text)
      - `reference_type` (text: 'order', 'bill', 'manual', etc.)
      - `reference_id` (bigint: ID of related record)
      - `payment_method` (text)
      - `date` (date)
      - `created_by` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `financial_transactions` table
    - Add policy for all operations (adjust as needed)

  3. Functions
    - Trigger function to automatically create financial records from order payments
    - Function to calculate running balance
*/

-- Create financial_transactions table
CREATE TABLE IF NOT EXISTS financial_transactions (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(12,2) NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  reference_type TEXT DEFAULT 'manual',
  reference_id BIGINT,
  payment_method TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by TEXT DEFAULT 'Sistema',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow all operations on financial_transactions" 
ON financial_transactions FOR ALL USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_financial_transactions_updated_at 
BEFORE UPDATE ON financial_transactions 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create financial transaction from order payment
CREATE OR REPLACE FUNCTION create_financial_transaction_from_payment()
RETURNS TRIGGER AS $$
DECLARE
  payment_record JSONB;
  transaction_amount DECIMAL(12,2);
BEGIN
  -- Only process if payments array has changed
  IF OLD.payments IS DISTINCT FROM NEW.payments THEN
    -- Process each payment in the new payments array
    FOR payment_record IN SELECT * FROM jsonb_array_elements(NEW.payments)
    LOOP
      -- Check if this payment already has a financial transaction
      IF NOT EXISTS (
        SELECT 1 FROM financial_transactions 
        WHERE reference_type = 'order' 
        AND reference_id = NEW.id 
        AND description LIKE '%' || (payment_record->>'date') || '%'
        AND amount = (payment_record->>'value')::DECIMAL
      ) THEN
        -- Create positive financial transaction for order payment
        transaction_amount := (payment_record->>'value')::DECIMAL;
        
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
          transaction_amount, -- Always positive for income
          'Pagamento OS ' || NEW.number || ' - ' || NEW.client_name || ' (' || (payment_record->>'type') || ')',
          'Serviços',
          'order',
          NEW.id,
          payment_record->>'method',
          (payment_record->>'date')::DATE,
          COALESCE(NEW.last_modified_by, 'Sistema')
        );
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order payments
DROP TRIGGER IF EXISTS create_financial_from_order_payment ON orders;
CREATE TRIGGER create_financial_from_order_payment
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_financial_transaction_from_payment();

-- Function to create financial transaction when bill is paid
CREATE OR REPLACE FUNCTION create_financial_transaction_from_bill()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create transaction when bill status changes to 'paid'
  IF OLD.status = 'pending' AND NEW.status = 'paid' THEN
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
      'expense',
      -NEW.amount, -- Negative for expense
      'Pagamento conta - ' || NEW.supplier || ': ' || NEW.description,
      NEW.category,
      'bill',
      NEW.id,
      'Transferência', -- Default payment method for bills
      COALESCE(NEW.paid_at::DATE, CURRENT_DATE),
      COALESCE(NEW.paid_by, 'Sistema')
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for bill payments
DROP TRIGGER IF EXISTS create_financial_from_bill_payment ON bills;
CREATE TRIGGER create_financial_from_bill_payment
  AFTER UPDATE ON bills
  FOR EACH ROW
  EXECUTE FUNCTION create_financial_transaction_from_bill();

-- Insert some sample financial transactions for existing data
INSERT INTO financial_transactions (type, amount, description, category, reference_type, payment_method, date, created_by) VALUES
-- Sample income transactions
('income', 1250.00, 'Serviços realizados - Semana 1', 'Serviços', 'manual', 'PIX', '2025-06-01', 'Admin'),
('income', 890.50, 'Venda de produtos', 'Produtos', 'manual', 'Dinheiro', '2025-06-02', 'Admin'),
('income', 2100.00, 'Serviços realizados - Semana 2', 'Serviços', 'manual', 'Cartão Crédito', '2025-06-03', 'Admin'),

-- Sample expense transactions  
('expense', -450.00, 'Compra de materiais', 'Materiais e Insumos', 'manual', 'Transferência', '2025-06-01', 'Admin'),
('expense', -320.50, 'Conta de energia elétrica', 'Energia Elétrica', 'manual', 'Débito Automático', '2025-06-02', 'Admin'),
('expense', -180.00, 'Manutenção equipamentos', 'Equipamentos', 'manual', 'Dinheiro', '2025-06-03', 'Admin'),
('expense', -89.90, 'Conta de telefone', 'Telefone/Internet', 'manual', 'Débito Automático', '2025-06-04', 'Admin')
ON CONFLICT DO NOTHING;