-- This migration fixes issues with expense transactions and improves financial reporting

-- First, ensure the amount is properly stored for expenses (negative values)
UPDATE financial_transactions
SET amount = -ABS(amount)
WHERE type = 'expense' AND amount > 0;

-- Create a function to handle bill payments properly
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
      -ABS(NEW.amount), -- Ensure negative for expense
      'Pagamento conta - ' || NEW.supplier || ': ' || NEW.description,
      NEW.category,
      'bill',
      NEW.id,
      'BILL-' || NEW.id,
      COALESCE(NEW.payment_method, 'Transferência'),
      COALESCE(NEW.paid_at::DATE, CURRENT_DATE),
      COALESCE(NEW.paid_by, 'Sistema')
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS create_financial_from_bill_payment ON bills;
CREATE TRIGGER create_financial_from_bill_payment
  AFTER UPDATE ON bills
  FOR EACH ROW
  EXECUTE FUNCTION create_financial_transaction_from_bill();

-- Add index to improve query performance for financial reports
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type_date
ON financial_transactions(type, date);

-- Add index for category filtering
CREATE INDEX IF NOT EXISTS idx_financial_transactions_category
ON financial_transactions(category);

-- Fix any existing bill transactions that might have positive amounts
UPDATE financial_transactions
SET amount = -ABS(amount)
WHERE reference_type = 'bill' AND amount > 0;

-- Ensure all expense transactions have negative amounts
UPDATE financial_transactions
SET amount = -ABS(amount)
WHERE type = 'expense';