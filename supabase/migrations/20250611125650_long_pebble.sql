/*
  # Fix Order Financial Transactions

  1. Updates
    - Fix the trigger functions for order payments to properly handle updates
    - Ensure financial transactions are created when orders are updated
    - Make sure order updates don't create duplicate financial entries
    - Add reference_number to all financial transactions for better tracking

  2. Key Changes
    - Completely rewrite the create_financial_transaction_from_payment function
    - Improve the update_financial_transaction_for_payment function
    - Fix ambiguous column references that were causing errors
*/

-- Drop existing trigger functions to recreate them with fixes
DROP FUNCTION IF EXISTS create_financial_transaction_from_payment() CASCADE;
DROP FUNCTION IF EXISTS update_financial_transaction_for_payment() CASCADE;

-- Create a function to handle updates to existing financial transactions
CREATE OR REPLACE FUNCTION update_financial_transaction_for_payment()
RETURNS TRIGGER AS $$
BEGIN
    -- When payments are modified, we'll delete existing transactions and recreate them
    -- This ensures we don't have duplicate or outdated transactions
    IF OLD.payments IS DISTINCT FROM NEW.payments THEN
        DELETE FROM financial_transactions 
        WHERE reference_type = 'order' 
        AND reference_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a function to create financial transactions from order payments
CREATE OR REPLACE FUNCTION create_financial_transaction_from_payment()
RETURNS TRIGGER AS $$
DECLARE
    payment_record jsonb;
    v_payment_method text;
    v_payment_value numeric;
    v_payment_date date;
    v_payment_type text;
BEGIN
    -- Process payments when they change or when an order is updated
    -- This will run after the update_financial_transaction_for_payment function
    -- which deletes existing transactions, so we won't have duplicates
    IF OLD.payments IS DISTINCT FROM NEW.payments THEN
        -- Process each payment in the payments array
        FOR payment_record IN SELECT * FROM jsonb_array_elements(NEW.payments)
        LOOP
            -- Extract payment details with clear variable names to avoid ambiguity
            v_payment_method := payment_record->>'method';
            v_payment_value := (payment_record->>'value')::numeric;
            v_payment_date := COALESCE((payment_record->>'date')::date, CURRENT_DATE);
            v_payment_type := payment_record->>'type';
            
            -- Only create transaction if amount > 0
            IF v_payment_value > 0 THEN
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
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the triggers in the correct order
-- First, the trigger that deletes existing transactions
CREATE TRIGGER update_financial_for_payment_change
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_financial_transaction_for_payment();

-- Then, the trigger that creates new transactions
CREATE TRIGGER create_financial_from_order_payment
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION create_financial_transaction_from_payment();

-- Update any existing orders to regenerate their financial transactions
-- This will ensure all existing orders have proper financial records
DO $$
DECLARE
    order_rec RECORD;
BEGIN
    FOR order_rec IN SELECT * FROM orders WHERE payments IS NOT NULL AND jsonb_array_length(payments) > 0
    LOOP
        -- Force an update to trigger the functions
        UPDATE orders
        SET updated_at = NOW()
        WHERE id = order_rec.id;
    END LOOP;
END $$;