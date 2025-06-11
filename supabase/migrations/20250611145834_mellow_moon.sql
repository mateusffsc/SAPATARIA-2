/*
  # Bank Transfer System

  1. New Tables
    - `bank_accounts` - Stores bank account balances and details
      - `id` (bigint, primary key)
      - `bank_id` (bigint, references banks)
      - `name` (text) - Account name/description
      - `balance` (decimal) - Current balance
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Modified Financial Transactions
    - Add `source_account_id` and `destination_account_id` columns to financial_transactions
    - Add 'transfer' as a valid transaction type
    - Create functions to handle transfers between accounts

  3. Security
    - Enable RLS on new tables
    - Add appropriate policies
*/

-- Create bank_accounts table
CREATE TABLE IF NOT EXISTS bank_accounts (
  id BIGSERIAL PRIMARY KEY,
  bank_id BIGINT REFERENCES banks(id),
  name TEXT NOT NULL,
  balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create a special "Cash" account
INSERT INTO bank_accounts (name, balance, is_active)
VALUES ('Caixa', 0, true)
ON CONFLICT DO NOTHING;

-- Create a special "Safe" account (Cofre)
INSERT INTO bank_accounts (name, balance, is_active)
VALUES ('Cofre', 0, true)
ON CONFLICT DO NOTHING;

-- Add source and destination account columns to financial_transactions
ALTER TABLE financial_transactions 
ADD COLUMN IF NOT EXISTS source_account_id BIGINT REFERENCES bank_accounts(id),
ADD COLUMN IF NOT EXISTS destination_account_id BIGINT REFERENCES bank_accounts(id);

-- Create trigger to update updated_at on bank_accounts
CREATE TRIGGER update_bank_accounts_updated_at
BEFORE UPDATE ON bank_accounts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on bank_accounts
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

-- Create policy for bank_accounts
CREATE POLICY "Allow all operations on bank_accounts"
ON bank_accounts FOR ALL
USING (true);

-- Create function to handle transfers between accounts
CREATE OR REPLACE FUNCTION process_account_transfer(
  p_source_id BIGINT,
  p_destination_id BIGINT,
  p_amount DECIMAL(12,2),
  p_description TEXT,
  p_payment_method TEXT,
  p_date DATE,
  p_created_by TEXT
)
RETURNS BIGINT AS $$
DECLARE
  v_transaction_id BIGINT;
  v_source_name TEXT;
  v_destination_name TEXT;
BEGIN
  -- Validate inputs
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Transfer amount must be greater than zero';
  END IF;
  
  IF p_source_id = p_destination_id THEN
    RAISE EXCEPTION 'Source and destination accounts cannot be the same';
  END IF;
  
  -- Get account names for the description
  SELECT name INTO v_source_name FROM bank_accounts WHERE id = p_source_id;
  SELECT name INTO v_destination_name FROM bank_accounts WHERE id = p_destination_id;
  
  IF v_source_name IS NULL OR v_destination_name IS NULL THEN
    RAISE EXCEPTION 'One or both accounts do not exist';
  END IF;
  
  -- Create the transfer transaction
  INSERT INTO financial_transactions (
    type,
    amount,
    description,
    category,
    reference_type,
    source_account_id,
    destination_account_id,
    payment_method,
    date,
    created_by
  ) VALUES (
    'transfer',
    p_amount,
    COALESCE(p_description, 'Transferência de ' || v_source_name || ' para ' || v_destination_name),
    'Transferência Interna',
    'transfer',
    p_source_id,
    p_destination_id,
    p_payment_method,
    p_date,
    p_created_by
  ) RETURNING id INTO v_transaction_id;
  
  -- Update source account balance (subtract)
  UPDATE bank_accounts
  SET balance = balance - p_amount
  WHERE id = p_source_id;
  
  -- Update destination account balance (add)
  UPDATE bank_accounts
  SET balance = balance + p_amount
  WHERE id = p_destination_id;
  
  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to update account balances when financial transactions are created/updated/deleted
CREATE OR REPLACE FUNCTION update_account_balances()
RETURNS TRIGGER AS $$
BEGIN
  -- For transfers, the process_account_transfer function handles the balance updates
  IF TG_OP = 'INSERT' AND NEW.type = 'transfer' THEN
    RETURN NEW;
  END IF;
  
  -- For income transactions, add to the destination account
  IF TG_OP = 'INSERT' AND NEW.type = 'income' AND NEW.destination_account_id IS NOT NULL THEN
    UPDATE bank_accounts
    SET balance = balance + ABS(NEW.amount)
    WHERE id = NEW.destination_account_id;
  END IF;
  
  -- For expense transactions, subtract from the source account
  IF TG_OP = 'INSERT' AND NEW.type = 'expense' AND NEW.source_account_id IS NOT NULL THEN
    UPDATE bank_accounts
    SET balance = balance - ABS(NEW.amount)
    WHERE id = NEW.source_account_id;
  END IF;
  
  -- Handle updates to transactions
  IF TG_OP = 'UPDATE' THEN
    -- If the transaction type changed, we need to reverse the old effect
    IF OLD.type != NEW.type OR 
       OLD.amount != NEW.amount OR
       OLD.source_account_id != NEW.source_account_id OR
       OLD.destination_account_id != NEW.destination_account_id THEN
      
      -- Reverse old transaction effects
      IF OLD.type = 'income' AND OLD.destination_account_id IS NOT NULL THEN
        UPDATE bank_accounts
        SET balance = balance - ABS(OLD.amount)
        WHERE id = OLD.destination_account_id;
      ELSIF OLD.type = 'expense' AND OLD.source_account_id IS NOT NULL THEN
        UPDATE bank_accounts
        SET balance = balance + ABS(OLD.amount)
        WHERE id = OLD.source_account_id;
      ELSIF OLD.type = 'transfer' THEN
        -- Reverse transfer: add back to source, subtract from destination
        IF OLD.source_account_id IS NOT NULL THEN
          UPDATE bank_accounts
          SET balance = balance + ABS(OLD.amount)
          WHERE id = OLD.source_account_id;
        END IF;
        
        IF OLD.destination_account_id IS NOT NULL THEN
          UPDATE bank_accounts
          SET balance = balance - ABS(OLD.amount)
          WHERE id = OLD.destination_account_id;
        END IF;
      END IF;
      
      -- Apply new transaction effects
      IF NEW.type = 'income' AND NEW.destination_account_id IS NOT NULL THEN
        UPDATE bank_accounts
        SET balance = balance + ABS(NEW.amount)
        WHERE id = NEW.destination_account_id;
      ELSIF NEW.type = 'expense' AND NEW.source_account_id IS NOT NULL THEN
        UPDATE bank_accounts
        SET balance = balance - ABS(NEW.amount)
        WHERE id = NEW.source_account_id;
      ELSIF NEW.type = 'transfer' THEN
        -- Apply transfer: subtract from source, add to destination
        IF NEW.source_account_id IS NOT NULL THEN
          UPDATE bank_accounts
          SET balance = balance - ABS(NEW.amount)
          WHERE id = NEW.source_account_id;
        END IF;
        
        IF NEW.destination_account_id IS NOT NULL THEN
          UPDATE bank_accounts
          SET balance = balance + ABS(NEW.amount)
          WHERE id = NEW.destination_account_id;
        END IF;
      END IF;
    END IF;
  END IF;
  
  -- Handle deletion of transactions
  IF TG_OP = 'DELETE' THEN
    IF OLD.type = 'income' AND OLD.destination_account_id IS NOT NULL THEN
      UPDATE bank_accounts
      SET balance = balance - ABS(OLD.amount)
      WHERE id = OLD.destination_account_id;
    ELSIF OLD.type = 'expense' AND OLD.source_account_id IS NOT NULL THEN
      UPDATE bank_accounts
      SET balance = balance + ABS(OLD.amount)
      WHERE id = OLD.source_account_id;
    ELSIF OLD.type = 'transfer' THEN
      -- Reverse transfer: add back to source, subtract from destination
      IF OLD.source_account_id IS NOT NULL THEN
        UPDATE bank_accounts
        SET balance = balance + ABS(OLD.amount)
        WHERE id = OLD.source_account_id;
      END IF;
      
      IF OLD.destination_account_id IS NOT NULL THEN
        UPDATE bank_accounts
        SET balance = balance - ABS(OLD.amount)
        WHERE id = OLD.destination_account_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for financial_transactions
CREATE TRIGGER update_account_balances_trigger
AFTER INSERT OR UPDATE OR DELETE ON financial_transactions
FOR EACH ROW
EXECUTE FUNCTION update_account_balances();

-- Modify the financial_transactions type check constraint to include 'transfer'
ALTER TABLE financial_transactions DROP CONSTRAINT IF EXISTS financial_transactions_type_check;
ALTER TABLE financial_transactions ADD CONSTRAINT financial_transactions_type_check 
CHECK (type = ANY (ARRAY['income'::text, 'expense'::text, 'transfer'::text]));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_financial_transactions_accounts
ON financial_transactions(source_account_id, destination_account_id);