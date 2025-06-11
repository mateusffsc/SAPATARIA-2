/*
  # Fix ambiguous payment_method column reference

  1. Database Functions
    - Update trigger functions to resolve payment_method column ambiguity
    - Use proper variable naming and column qualification
    
  2. Changes Made
    - Rename function parameters to avoid conflicts with column names
    - Explicitly qualify column references where needed
    - Ensure all financial transaction creation functions work properly
*/

-- Drop existing trigger functions to recreate them with fixes
DROP FUNCTION IF EXISTS create_financial_transaction_from_payment() CASCADE;
DROP FUNCTION IF EXISTS update_financial_transaction_for_payment() CASCADE;

-- Recreate the function to create financial transactions from order payments
CREATE OR REPLACE FUNCTION create_financial_transaction_from_payment()
RETURNS TRIGGER AS $$
DECLARE
    payment_record jsonb;
    v_payment_method text;
    v_amount numeric;
    v_date date;
BEGIN
    -- Only process if payments array was updated and order status changed to 'finalizada'
    IF NEW.payments IS DISTINCT FROM OLD.payments AND NEW.status = 'finalizada' THEN
        -- Process each payment in the payments array
        FOR payment_record IN SELECT * FROM jsonb_array_elements(NEW.payments)
        LOOP
            -- Extract payment details
            v_payment_method := payment_record->>'method';
            v_amount := (payment_record->>'amount')::numeric;
            v_date := COALESCE((payment_record->>'date')::date, CURRENT_DATE);
            
            -- Only create transaction if amount > 0
            IF v_amount > 0 THEN
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
                    v_amount,
                    'Pagamento da OS #' || NEW.number || ' - ' || NEW.client_name,
                    'Serviços',
                    'order',
                    NEW.id,
                    NEW.number,
                    v_payment_method,
                    v_date,
                    COALESCE(NEW.last_modified_by, 'Sistema')
                );
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the function to update financial transactions when payments change
CREATE OR REPLACE FUNCTION update_financial_transaction_for_payment()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete existing financial transactions for this order if payments are being modified
    IF NEW.payments IS DISTINCT FROM OLD.payments THEN
        DELETE FROM financial_transactions 
        WHERE reference_type = 'order' 
        AND reference_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers
CREATE TRIGGER update_financial_for_payment_change
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_financial_transaction_for_payment();

CREATE TRIGGER create_financial_from_order_payment
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION create_financial_transaction_from_payment();

-- Also fix the bill payment function if it has similar issues
DROP FUNCTION IF EXISTS create_financial_transaction_from_bill() CASCADE;

CREATE OR REPLACE FUNCTION create_financial_transaction_from_bill()
RETURNS TRIGGER AS $$
DECLARE
    v_payment_method text;
BEGIN
    -- Only create financial transaction when bill status changes to 'paid'
    IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
        -- Use the payment_method from the bills table
        v_payment_method := NEW.payment_method;
        
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
            NEW.amount,
            'Pagamento de conta: ' || NEW.description,
            NEW.category,
            'bill',
            NEW.id,
            v_payment_method,
            COALESCE(NEW.paid_at::date, CURRENT_DATE),
            COALESCE(NEW.paid_by, 'Sistema')
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the bill trigger
CREATE TRIGGER create_financial_from_bill_payment
    AFTER UPDATE ON bills
    FOR EACH ROW
    EXECUTE FUNCTION create_financial_transaction_from_bill();

-- Also fix the product sale function if needed
DROP FUNCTION IF EXISTS create_financial_transaction_from_sale() CASCADE;

CREATE OR REPLACE FUNCTION create_financial_transaction_from_sale()
RETURNS TRIGGER AS $$
DECLARE
    v_payment_method text;
BEGIN
    -- Use the payment_method from the product_sales table
    v_payment_method := NEW.payment_method;
    
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
        'Venda de produtos #' || NEW.sale_number || ' - ' || NEW.client_name,
        'Vendas',
        'sale',
        NEW.id,
        NEW.sale_number,
        v_payment_method,
        NEW.date,
        NEW.created_by
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the product sale trigger
CREATE TRIGGER create_financial_from_sale
    AFTER INSERT ON product_sales
    FOR EACH ROW
    EXECUTE FUNCTION create_financial_transaction_from_sale();