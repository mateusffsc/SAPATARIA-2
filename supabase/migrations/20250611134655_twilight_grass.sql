/*
  # Corrigir lógica de lançamentos financeiros das contas a pagar

  1. Função atualizada
    - Criar transação financeira APENAS quando conta for marcada como paga
    - Verificar se já existe transação para evitar duplicatas
    - Usar trigger AFTER UPDATE para detectar mudança de status

  2. Segurança
    - Evitar lançamentos duplicados
    - Manter integridade dos dados financeiros
*/

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS create_financial_from_bill_payment ON bills;

-- Função atualizada para criar transação financeira apenas quando conta for paga
CREATE OR REPLACE FUNCTION create_financial_transaction_from_bill()
RETURNS TRIGGER AS $$
BEGIN
  -- Só criar transação quando status mudar de 'pending' para 'paid'
  IF OLD.status = 'pending' AND NEW.status = 'paid' THEN
    
    -- Verificar se já existe transação para esta conta para evitar duplicatas
    IF NOT EXISTS (
      SELECT 1 FROM financial_transactions 
      WHERE reference_type = 'bill' 
      AND reference_id = NEW.id
    ) THEN
      
      -- Criar transação de despesa
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
        -ABS(NEW.amount), -- Sempre negativo para despesa
        'Pagamento conta - ' || NEW.supplier || ': ' || NEW.description,
        NEW.category,
        'bill',
        NEW.id,
        COALESCE(NEW.payment_method, 'Transferência'),
        COALESCE(NEW.paid_at::DATE, CURRENT_DATE),
        COALESCE(NEW.paid_by, 'Sistema')
      );
      
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar trigger
CREATE TRIGGER create_financial_from_bill_payment
  AFTER UPDATE ON bills
  FOR EACH ROW
  EXECUTE FUNCTION create_financial_transaction_from_bill();

-- Limpar transações duplicadas existentes (manter apenas a mais recente de cada conta)
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY reference_type, reference_id 
      ORDER BY created_at DESC
    ) as rn
  FROM financial_transactions 
  WHERE reference_type = 'bill'
)
DELETE FROM financial_transactions 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Remover transações de contas que ainda estão pendentes
DELETE FROM financial_transactions 
WHERE reference_type = 'bill' 
AND reference_id IN (
  SELECT id FROM bills WHERE status = 'pending'
);