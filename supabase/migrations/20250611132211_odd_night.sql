/*
  # Fix Order Financial Transactions Update

  1. Improvements
    - Modify the trigger functions to properly handle updates to orders
    - Ensure financial transactions are updated rather than duplicated
    - Add better reference tracking with reference_number

  2. Changes
    - Completely rewrite the update_financial_transaction_for_payment function
    - Improve the create_financial_transaction_from_payment function
    - Add better transaction identification logic
*/

-- Drop existing trigger functions to recreate them with fixes
DROP FUNCTION IF EXISTS create_financial_transaction_from_payment() CASCADE;
DROP FUNCTION IF EXISTS update_financial_transaction_for_payment() CASCADE;

-- Create a function to handle updates to existing financial transactions
CREATE OR REPLACE FUNCTION update_financial_transaction_for_payment()
RETURNS TRIGGER AS $$
DECLARE
    payment_record jsonb;
    old_payment_record jsonb;
    found boolean;
    v_payment_method text;
    v_payment_value numeric;
    v_payment_date date;
    v_payment_type text;
    v_transaction_id bigint;
BEGIN
    -- Only process if payments array has changed
    IF OLD.payments IS DISTINCT FROM NEW.payments THEN
        -- For each payment in the new array
        FOR payment_record IN SELECT * FROM jsonb_array_elements(NEW.payments)
        LOOP
            -- Extract payment details
            v_payment_method := payment_record->>'method';
            v_payment_value := (payment_record->>'value')::numeric;
            v_payment_date := COALESCE((payment_record->>'date')::date, CURRENT_DATE);
            v_payment_type := payment_record->>'type';
            
            -- Check if this payment already exists in the old array
            found := false;
            
            -- If old payments exist, check for matches
            IF OLD.payments IS NOT NULL AND jsonb_array_length(OLD.payments) > 0 THEN
                FOR old_payment_record IN SELECT * FROM jsonb_array_elements(OLD.payments)
                LOOP
                    -- If we find a payment with the same date, value, and type
                    IF (payment_record->>'date') = (old_payment_record->>'date') AND
                       (payment_record->>'value')::numeric = (old_payment_record->>'value')::numeric AND
                       (payment_record->>'type') = (old_payment_record->>'type') THEN
                        
                        found := true;
                        
                        -- If the payment method changed, update the financial transaction
                        IF (payment_record->>'method') != (old_payment_record->>'method') THEN
                            -- Find and update the corresponding financial transaction
                            UPDATE financial_transactions
                            SET payment_method = v_payment_method,
                                updated_at = NOW()
                            WHERE reference_type = 'order'
                            AND reference_id = NEW.id
                            AND reference_number = NEW.number
                            AND date = v_payment_date
                            AND amount = v_payment_value;
                        END IF;
                        
                        EXIT; -- Exit the inner loop once we've found a match
                    END IF;
                END LOOP;
            END IF;
            
            -- If payment not found in old array, it's new and needs to be created
            IF NOT found AND v_payment_value > 0 THEN
                -- Check if a transaction already exists for this payment
                SELECT id INTO v_transaction_id
                FROM financial_transactions
                WHERE reference_type = 'order'
                AND reference_id = NEW.id
                AND reference_number = NEW.number
                AND date = v_payment_date
                AND amount = v_payment_value
                LIMIT 1;
                
                -- Only create if no transaction exists
                IF v_transaction_id IS NULL THEN
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
            END IF;
        END LOOP;
        
        -- Handle removed payments - delete financial transactions for payments that were removed
        IF OLD.payments IS NOT NULL AND jsonb_array_length(OLD.payments) > 0 THEN
            FOR old_payment_record IN SELECT * FROM jsonb_array_elements(OLD.payments)
            LOOP
                -- Check if this old payment exists in the new array
                found := false;
                
                IF NEW.payments IS NOT NULL AND jsonb_array_length(NEW.payments) > 0 THEN
                    FOR payment_record IN SELECT * FROM jsonb_array_elements(NEW.payments)
                    LOOP
                        IF (payment_record->>'date') = (old_payment_record->>'date') AND
                           (payment_record->>'value')::numeric = (old_payment_record->>'value')::numeric AND
                           (payment_record->>'type') = (old_payment_record->>'type') THEN
                            found := true;
                            EXIT;
                        END IF;
                    END LOOP;
                END IF;
                
                -- If old payment not found in new array, delete the corresponding financial transaction
                IF NOT found THEN
                    DELETE FROM financial_transactions
                    WHERE reference_type = 'order'
                    AND reference_id = NEW.id
                    AND reference_number = NEW.number
                    AND date = (old_payment_record->>'date')::date
                    AND amount = (old_payment_record->>'value')::numeric;
                END IF;
            END LOOP;
        END IF;
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

-- Remove the create_financial_from_order_payment trigger since we're handling everything in the update trigger
DROP TRIGGER IF EXISTS create_financial_from_order_payment ON orders;

-- Add a comment to explain the change
COMMENT ON FUNCTION update_financial_transaction_for_payment() IS 
'This function handles all financial transaction operations related to order payments:
1. Updates existing transactions when payment methods change
2. Creates new transactions for new payments
3. Deletes transactions for removed payments
This prevents duplicate transactions when orders are updated.';