/*
  # Add reference_number to financial_transactions

  1. Schema Changes
    - Add reference_number column to financial_transactions table
    - Update trigger functions to store order number and sale number

  2. Data Migration
    - Populate reference_number for existing transactions
*/

-- Add reference_number column to financial_transactions
ALTER TABLE financial_transactions ADD COLUMN IF NOT EXISTS reference_number TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_financial_transactions_reference_number ON financial_transactions(reference_number);

-- Update trigger function for order payments to store order number
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
          reference_number,
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
          NEW.number,
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

-- Update trigger function for bill payments to store bill reference
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
      reference_number,
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
      'BILL-' || NEW.id, -- Using bill ID as reference number for now
      COALESCE(NEW.payment_method, 'Transferência'), -- Use the payment method if available
      COALESCE(NEW.paid_at::DATE, CURRENT_DATE),
      COALESCE(NEW.paid_by, 'Sistema')
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update trigger function for product sales to store sale number
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
    reference_number,
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
    NEW.sale_number,
    NEW.payment_method,
    NEW.date,
    NEW.created_by
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Populate reference_number for existing transactions
DO $$
DECLARE
  order_rec RECORD;
  sale_rec RECORD;
BEGIN
  -- Update order references
  FOR order_rec IN 
    SELECT ft.id, o.number 
    FROM financial_transactions ft
    JOIN orders o ON ft.reference_id = o.id
    WHERE ft.reference_type = 'order' AND ft.reference_number IS NULL
  LOOP
    UPDATE financial_transactions
    SET reference_number = order_rec.number
    WHERE id = order_rec.id;
  END LOOP;
  
  -- Update sale references
  FOR sale_rec IN 
    SELECT ft.id, ps.sale_number 
    FROM financial_transactions ft
    JOIN product_sales ps ON ft.reference_id = ps.id
    WHERE ft.reference_type = 'sale' AND ft.reference_number IS NULL
  LOOP
    UPDATE financial_transactions
    SET reference_number = sale_rec.sale_number
    WHERE id = sale_rec.id;
  END LOOP;
  
  -- Update bill references
  UPDATE financial_transactions
  SET reference_number = 'BILL-' || reference_id
  WHERE reference_type = 'bill' AND reference_number IS NULL;
END $$;