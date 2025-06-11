-- Add payment options to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_option TEXT DEFAULT 'normal';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cash_discount DECIMAL(5,2) DEFAULT 5.0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS installments INTEGER DEFAULT 2;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS installment_fee DECIMAL(5,2) DEFAULT 3.0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS original_total_value DECIMAL(10,2);

-- Add payment options to product_sales table
ALTER TABLE product_sales ADD COLUMN IF NOT EXISTS payment_option TEXT DEFAULT 'normal';
ALTER TABLE product_sales ADD COLUMN IF NOT EXISTS cash_discount DECIMAL(5,2) DEFAULT 5.0;
ALTER TABLE product_sales ADD COLUMN IF NOT EXISTS installments INTEGER DEFAULT 2;
ALTER TABLE product_sales ADD COLUMN IF NOT EXISTS installment_fee DECIMAL(5,2) DEFAULT 3.0;
ALTER TABLE product_sales ADD COLUMN IF NOT EXISTS original_amount DECIMAL(10,2);

-- Update financial transaction function to include payment option details
CREATE OR REPLACE FUNCTION create_financial_transaction_from_sale()
RETURNS TRIGGER AS $$
DECLARE
    v_payment_method text;
    v_payment_details text;
BEGIN
    -- Use the payment_method from the product_sales table
    v_payment_method := NEW.payment_method;
    
    -- Create payment details description based on payment option
    IF NEW.payment_option = 'cash' THEN
        v_payment_details := ' (Desconto à vista ' || NEW.cash_discount || '%)';
    ELSIF NEW.payment_option = 'installment' THEN
        v_payment_details := ' (Parcelado em ' || NEW.installments || 'x)';
    ELSE
        v_payment_details := '';
    END IF;
    
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
        'Venda de produtos #' || NEW.sale_number || ' - ' || NEW.client_name || v_payment_details,
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

-- Update the function to handle order payments with payment options
CREATE OR REPLACE FUNCTION update_financial_transaction_for_payment()
RETURNS TRIGGER AS $$
DECLARE
    payment_record jsonb;
    v_payment_method text;
    v_payment_value numeric;
    v_payment_date date;
    v_payment_type text;
    v_transaction_id bigint;
    v_payment_details text;
BEGIN
    -- Only process if payments array has changed
    IF OLD.payments IS DISTINCT FROM NEW.payments THEN
        -- Delete existing financial transactions for this order
        DELETE FROM financial_transactions 
        WHERE reference_type = 'order' 
        AND reference_id = NEW.id;
        
        -- Create payment details description based on payment option
        IF NEW.payment_option = 'cash' THEN
            v_payment_details := ' (Desconto à vista ' || NEW.cash_discount || '%)';
        ELSIF NEW.payment_option = 'installment' THEN
            v_payment_details := ' (Parcelado em ' || NEW.installments || 'x)';
        ELSE
            v_payment_details := '';
        END IF;
        
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
                        'Pagamento OS ' || NEW.number || ' - ' || NEW.client_name || ' (' || v_payment_type || ')' || v_payment_details,
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