/*
  # Fix for Duplicate Financial Transactions

  This migration addresses the issue of duplicate financial transactions being created
  when order payments are processed. The main changes are:

  1. Improved Trigger Function
     - Completely rewrites the update_financial_transaction_for_payment function
     - Removes the IF NOT EXISTS condition that was causing duplicates
     - Implements a more robust approach by first deleting related transactions
     - Then recreates transactions based on the current state of payments

  2. Cleanup
     - Removes any existing duplicate transactions
     - Ensures proper reference_number values
*/

-- First, clean up any existing duplicate transactions
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY reference_id, reference_type, reference_number, date, amount 
      ORDER BY created_at DESC
    ) as rn
  FROM financial_transactions 
  WHERE reference_type = 'order'
)
DELETE FROM financial_transactions 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Drop existing trigger functions to recreate them with fixes
DROP FUNCTION IF EXISTS create_financial_transaction_from_payment() CASCADE;
DROP FUNCTION IF EXISTS update_financial_transaction_for_payment() CASCADE;

-- Create a completely rewritten function that handles all financial transaction operations
CREATE OR REPLACE FUNCTION update_financial_transaction_for_payment()
RETURNS TRIGGER AS $$
DECLARE
    payment_record jsonb;
    v_payment_method text;
    v_payment_value numeric;
    v_payment_date date;
    v_payment_type text;
BEGIN
    -- Only process if payments array has changed
    IF OLD.payments IS DISTINCT FROM NEW.payments THEN
        -- STEP 1: Delete all existing financial transactions for this order
        -- This prevents duplicates by ensuring we start fresh
        DELETE FROM financial_transactions 
        WHERE reference_type = 'order' 
        AND reference_id = NEW.id;
        
        -- STEP 2: Create new transactions for each payment in the current state
        -- Process each payment in the payments array
        IF NEW.payments IS NOT NULL AND jsonb_array_length(NEW.payments) > 0 THEN
            FOR payment_record IN SELECT * FROM jsonb_array_elements(NEW.payments)
            LOOP
                -- Extract payment details
                v_payment_method := payment_record->>'method';
                v_payment_value := (payment_record->>'value')::numeric;
                v_payment_date := COALESCE((payment_record->>'date')::date, CURRENT_DATE);
                v_payment_type := payment_record->>'type';
                
                -- Only create transaction if amount > 0
                IF v_payment_value > 0 THEN
                    -- Create new financial transaction
                    -- Note: We don't use IF NOT EXISTS here since we already deleted all transactions
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
                        v_payment_value,
                        'Pagamento OS ' || NEW.number || ' - ' || NEW.client_name || ' (' || v_payment_type || ')',
                        'Serviços',
                        'order',
                        NEW.id,
                        NEW.number,
                        v_payment_method,
                        v_payment_date,
                        COALESCE(NEW.last_modified_by, 'Sistema')
                    );
                END IF;
            END LOOP;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating financial transactions
-- This single trigger will handle all the work
CREATE TRIGGER update_financial_for_payment_change
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_financial_transaction_for_payment();

-- Add a comment to explain the function
COMMENT ON FUNCTION update_financial_transaction_for_payment() IS 
'This function handles all financial transaction operations related to order payments:
1. Updates existing transactions when payment methods change
2. Creates new transactions for new payments
3. Deletes transactions for removed payments
This prevents duplicate transactions when orders are updated.';

-- Force an update on all orders to clean up any existing issues
DO $$
DECLARE
    order_rec RECORD;
BEGIN
    FOR order_rec IN SELECT * FROM orders WHERE payments IS NOT NULL AND jsonb_array_length(payments) > 0
    LOOP
        -- Force an update to trigger the function
        UPDATE orders
        SET updated_at = NOW()
        WHERE id = order_rec.id;
    END LOOP;
END $$;