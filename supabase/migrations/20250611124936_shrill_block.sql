-- First, remove duplicate financial transactions for orders
-- Keep only the most recent transaction for each unique combination
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY reference_id, reference_type, payment_method, date, amount 
      ORDER BY created_at DESC
    ) as rn
  FROM financial_transactions 
  WHERE reference_type = 'order'
)
DELETE FROM financial_transactions 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Add reference_number column if it doesn't exist
ALTER TABLE financial_transactions 
ADD COLUMN IF NOT EXISTS reference_number TEXT;

-- Create index on reference_number for better performance
CREATE INDEX IF NOT EXISTS idx_financial_transactions_reference_number 
ON financial_transactions (reference_number);

-- Update existing financial transactions to include reference_number from orders
UPDATE financial_transactions 
SET reference_number = orders.number
FROM orders 
WHERE financial_transactions.reference_type = 'order' 
AND financial_transactions.reference_id = orders.id 
AND financial_transactions.reference_number IS NULL;

-- Update trigger function for order payments to avoid duplicates
CREATE OR REPLACE FUNCTION create_financial_transaction_from_payment()
RETURNS TRIGGER AS $$
DECLARE
  payment_record JSONB;
  transaction_amount DECIMAL(12,2);
  payment_date DATE;
  payment_method TEXT;
  payment_type TEXT;
  payment_description TEXT;
BEGIN
  -- Only process if payments array has changed
  IF OLD.payments IS DISTINCT FROM NEW.payments THEN
    -- Process each payment in the new payments array
    FOR payment_record IN SELECT * FROM jsonb_array_elements(NEW.payments)
    LOOP
      -- Extract payment details
      payment_date := (payment_record->>'date')::DATE;
      payment_method := payment_record->>'method';
      payment_type := payment_record->>'type';
      transaction_amount := (payment_record->>'value')::DECIMAL;
      
      -- Create a unique description for this payment
      payment_description := 'Pagamento OS ' || NEW.number || ' - ' || NEW.client_name ||
                             ' (' || payment_type || ')';
      
      -- Check if this payment already has a financial transaction
      -- We use a more comprehensive check to avoid duplicates
      IF NOT EXISTS (
        SELECT 1 FROM financial_transactions 
        WHERE reference_type = 'order' 
        AND reference_id = NEW.id 
        AND reference_number = NEW.number
        AND payment_method = payment_method
        AND date = payment_date
        AND ABS(amount - transaction_amount) < 0.01  -- Use approximate comparison for decimals
      ) THEN
        -- Create positive financial transaction for order payment
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
          payment_description,
          'Serviços',
          'order',
          NEW.id,
          NEW.number,
          payment_method,
          payment_date,
          COALESCE(NEW.last_modified_by, 'Sistema')
        );
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a function to handle updates to existing financial transactions
CREATE OR REPLACE FUNCTION update_financial_transaction_for_payment()
RETURNS TRIGGER AS $$
DECLARE
  payment_record JSONB;
  old_payment_record JSONB;
  found BOOLEAN := FALSE;
BEGIN
  -- Only process if payments array has changed
  IF OLD.payments IS DISTINCT FROM NEW.payments THEN
    -- For each payment in the new array
    FOR payment_record IN SELECT * FROM jsonb_array_elements(NEW.payments)
    LOOP
      -- Try to find a matching payment in the old array
      found := FALSE;
      
      -- If old payments exist, check for matches
      IF OLD.payments IS NOT NULL AND jsonb_array_length(OLD.payments) > 0 THEN
        FOR old_payment_record IN SELECT * FROM jsonb_array_elements(OLD.payments)
        LOOP
          -- If we find a payment with the same date and value but different method
          IF (payment_record->>'date') = (old_payment_record->>'date') AND
             (payment_record->>'value')::DECIMAL = (old_payment_record->>'value')::DECIMAL AND
             (payment_record->>'method') != (old_payment_record->>'method') THEN
            
            -- Update the existing financial transaction
            UPDATE financial_transactions
            SET payment_method = payment_record->>'method',
                updated_at = NOW()
            WHERE reference_type = 'order'
            AND reference_id = NEW.id
            AND date = (payment_record->>'date')::DATE
            AND ABS(amount - (payment_record->>'value')::DECIMAL) < 0.01;
            
            found := TRUE;
            EXIT; -- Exit the inner loop once we've found a match
          END IF;
        END LOOP;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating financial transactions
DROP TRIGGER IF EXISTS update_financial_for_payment_change ON orders;
CREATE TRIGGER update_financial_for_payment_change
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_financial_transaction_for_payment();

-- Create a partial index to help prevent duplicates
-- This is a non-unique index that will be used by the trigger function
CREATE INDEX IF NOT EXISTS idx_financial_transactions_order_payment
ON financial_transactions (reference_id, reference_type, payment_method, date, amount)
WHERE reference_type = 'order';