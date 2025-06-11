/*
  # Add Payment Method to Bills Table

  1. New Columns
    - `payment_method` (text): Stores the payment method used for the bill

  2. Updates
    - Modify the financial transaction creation trigger to include payment method
*/

-- Add payment_method column to bills table
ALTER TABLE bills ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Update the create_financial_transaction_from_bill function to include payment_method
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
      COALESCE(NEW.payment_method, 'Transferência'), -- Use the payment method if available
      COALESCE(NEW.paid_at::DATE, CURRENT_DATE),
      COALESCE(NEW.paid_by, 'Sistema')
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- No need to recreate the trigger as we're just updating the function