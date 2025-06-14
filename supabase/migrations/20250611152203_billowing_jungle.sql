/*
  # Fix Bank Accounts and Financial Transactions

  This migration fixes the previous migrations by:
  1. Checking if tables and columns already exist before creating them
  2. Dropping and recreating the process_account_transfer function
  3. Ensuring all necessary indexes and constraints are created
*/

-- Create bank_accounts table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bank_accounts') THEN
    CREATE TABLE bank_accounts (
      id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
      name text NOT NULL,
      balance numeric(12,2) NOT NULL DEFAULT 0,
      bank_id bigint REFERENCES banks(id),
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    -- Enable RLS
    ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

    -- Create policy for public access
    CREATE POLICY "Allow all operations on bank_accounts"
      ON bank_accounts
      FOR ALL
      TO public
      USING (true);

    -- Create updated_at trigger
    CREATE TRIGGER update_bank_accounts_updated_at
      BEFORE UPDATE ON bank_accounts
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;

-- Add columns to financial_transactions table for account transfers if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'financial_transactions' AND column_name = 'source_account_id'
  ) THEN
    ALTER TABLE financial_transactions ADD COLUMN source_account_id bigint REFERENCES bank_accounts(id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'financial_transactions' AND column_name = 'destination_account_id'
  ) THEN
    ALTER TABLE financial_transactions ADD COLUMN destination_account_id bigint REFERENCES bank_accounts(id);
  END IF;
END
$$;

-- Update the type check constraint to include 'transfer'
DO $$
BEGIN
  -- Drop the existing constraint if it exists
  BEGIN
    ALTER TABLE financial_transactions DROP CONSTRAINT IF EXISTS financial_transactions_type_check;
  EXCEPTION
    WHEN undefined_object THEN
      NULL;
  END;
  
  -- Create the new constraint
  ALTER TABLE financial_transactions 
    ADD CONSTRAINT financial_transactions_type_check 
    CHECK (type IN ('income', 'expense', 'transfer'));
END
$$;

-- Create function to update account balances based on financial transactions
CREATE OR REPLACE FUNCTION update_account_balances()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Handle INSERT
  IF TG_OP = 'INSERT' THEN
    -- Update source account (subtract amount)
    IF NEW.source_account_id IS NOT NULL THEN
      UPDATE bank_accounts 
      SET balance = balance - ABS(NEW.amount), updated_at = now()
      WHERE id = NEW.source_account_id;
    END IF;
    
    -- Update destination account (add amount)
    IF NEW.destination_account_id IS NOT NULL THEN
      UPDATE bank_accounts 
      SET balance = balance + ABS(NEW.amount), updated_at = now()
      WHERE id = NEW.destination_account_id;
    END IF;
    
    RETURN NEW;
  END IF;
  
  -- Handle UPDATE
  IF TG_OP = 'UPDATE' THEN
    -- Reverse old transaction effects
    IF OLD.source_account_id IS NOT NULL THEN
      UPDATE bank_accounts 
      SET balance = balance + ABS(OLD.amount), updated_at = now()
      WHERE id = OLD.source_account_id;
    END IF;
    
    IF OLD.destination_account_id IS NOT NULL THEN
      UPDATE bank_accounts 
      SET balance = balance - ABS(OLD.amount), updated_at = now()
      WHERE id = OLD.destination_account_id;
    END IF;
    
    -- Apply new transaction effects
    IF NEW.source_account_id IS NOT NULL THEN
      UPDATE bank_accounts 
      SET balance = balance - ABS(NEW.amount), updated_at = now()
      WHERE id = NEW.source_account_id;
    END IF;
    
    IF NEW.destination_account_id IS NOT NULL THEN
      UPDATE bank_accounts 
      SET balance = balance + ABS(NEW.amount), updated_at = now()
      WHERE id = NEW.destination_account_id;
    END IF;
    
    RETURN NEW;
  END IF;
  
  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    -- Reverse transaction effects
    IF OLD.source_account_id IS NOT NULL THEN
      UPDATE bank_accounts 
      SET balance = balance + ABS(OLD.amount), updated_at = now()
      WHERE id = OLD.source_account_id;
    END IF;
    
    IF OLD.destination_account_id IS NOT NULL THEN
      UPDATE bank_accounts 
      SET balance = balance - ABS(OLD.amount), updated_at = now()
      WHERE id = OLD.destination_account_id;
    END IF;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create trigger to automatically update account balances (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_account_balances_trigger'
  ) THEN
    CREATE TRIGGER update_account_balances_trigger
      AFTER INSERT OR UPDATE OR DELETE ON financial_transactions
      FOR EACH ROW
      EXECUTE FUNCTION update_account_balances();
  END IF;
END
$$;

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS process_account_transfer(bigint, bigint, numeric, text, text, date, text);

-- Create process_account_transfer function
CREATE FUNCTION process_account_transfer(
  p_source_id bigint,
  p_destination_id bigint,
  p_amount numeric,
  p_description text,
  p_payment_method text,
  p_date date,
  p_created_by text
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_source_balance numeric;
  v_destination_balance numeric;
BEGIN
  -- Check if source account exists and has sufficient balance
  SELECT balance INTO v_source_balance 
  FROM bank_accounts 
  WHERE id = p_source_id AND is_active = true;
  
  IF v_source_balance IS NULL THEN
    RAISE EXCEPTION 'Source account with ID % not found or inactive.', p_source_id;
  END IF;

  IF v_source_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance in source account (ID: %). Available: %, Attempted transfer: %', 
      p_source_id, v_source_balance, p_amount;
  END IF;

  -- Check if destination account exists
  SELECT balance INTO v_destination_balance 
  FROM bank_accounts 
  WHERE id = p_destination_id AND is_active = true;
  
  IF v_destination_balance IS NULL THEN
    RAISE EXCEPTION 'Destination account with ID % not found or inactive.', p_destination_id;
  END IF;

  -- Create transfer transaction
  INSERT INTO financial_transactions (
    type, 
    amount, 
    description, 
    category, 
    reference_type, 
    payment_method, 
    date, 
    created_by, 
    source_account_id, 
    destination_account_id
  ) VALUES (
    'transfer', 
    p_amount, 
    p_description, 
    'Transferência Interna', 
    'transfer', 
    p_payment_method, 
    p_date, 
    p_created_by, 
    p_source_id, 
    p_destination_id
  );
END;
$$;

-- Insert default accounts (only if they don't exist)
INSERT INTO bank_accounts (name, balance, is_active)
SELECT 'Caixa', 0, true
WHERE NOT EXISTS (SELECT 1 FROM bank_accounts WHERE name = 'Caixa');

INSERT INTO bank_accounts (name, balance, is_active)
SELECT 'Cofre', 0, true
WHERE NOT EXISTS (SELECT 1 FROM bank_accounts WHERE name = 'Cofre');

-- Add indexes for better performance (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_bank_accounts_bank_id'
  ) THEN
    CREATE INDEX idx_bank_accounts_bank_id ON bank_accounts(bank_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_bank_accounts_is_active'
  ) THEN
    CREATE INDEX idx_bank_accounts_is_active ON bank_accounts(is_active);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_financial_transactions_accounts'
  ) THEN
    CREATE INDEX idx_financial_transactions_accounts 
    ON financial_transactions(source_account_id, destination_account_id);
  END IF;
END
$$;