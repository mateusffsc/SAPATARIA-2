import { supabase } from '../lib/supabase';
import { FinancialService } from './financialService';
import { CashRegisterService } from '../components/finance/cashregister/CashRegisterService';
import { BankService } from './bankService';

export interface CashOperation {
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string;
  category: string;
  reference_type: string;
  reference_id?: number;
  payment_method: string;
  date: string;
  created_by: string;
  source_account_id?: number;
  destination_account_id?: number;
}

export class CashService {
  static async processOperation(operation: CashOperation) {
    try {
      // Find the "Caixa Loja" account
      const accounts = await BankService.getAccounts();
      const cashAccount = accounts.find(a => a.name === 'Caixa Loja');
      
      if (!cashAccount) {
        console.error('Conta "Caixa Loja" não encontrada');
        throw new Error('Conta "Caixa Loja" não encontrada');
      }
      
      // Set the appropriate account ID based on operation type
      if (operation.type === 'income') {
        // For income, set destination to Caixa Loja
        operation.destination_account_id = cashAccount.id;
      } else if (operation.type === 'expense') {
        // For expense, set source to Caixa Loja
        operation.source_account_id = cashAccount.id;
      }
      
      // 1. Create the financial transaction
      const transaction = await FinancialService.createTransaction({
        ...operation,
        amount: operation.type === 'income' ? Math.abs(operation.amount) : -Math.abs(operation.amount)
      });

      // 2. Update the cash register if it's a cash operation
      if (operation.payment_method.toLowerCase().includes('dinheiro')) {
        const currentSession = await CashRegisterService.getCurrentSession();
        if (currentSession) {
          await CashRegisterService.recordOperation({
            session_id: currentSession.id,
            type: operation.type === 'income' ? 'income' : 'expense',
            amount: operation.amount,
            description: operation.description,
            created_by: operation.created_by
          });
        }
      }

      return transaction;
    } catch (error) {
      console.error('Error processing cash operation:', error);
      throw error;
    }
  }

  static async getBalance(date?: string): Promise<{
    total: number;
    cash: number;
    receivables: number;
    payables: number;
  }> {
    try {
      // 1. Get bank account balances
      const accounts = await BankService.getAccounts();
      const cashAccount = accounts.find(a => a.name === 'Caixa Loja');
      
      // 2. Calculate total balance from all accounts
      const total = accounts.reduce((sum, account) => sum + account.balance, 0);
      
      // 3. Get cash balance (from the "Caixa Loja" account)
      const cash = cashAccount ? cashAccount.balance : 0;

      // 4. Get receivables (pending order payments)
      const { data: receivableOrders } = await supabase
        .from('orders')
        .select('remaining_value')
        .gt('remaining_value', 0)
        .neq('status', 'cancelada');

      const receivables = receivableOrders?.reduce((sum, o) => sum + Number(o.remaining_value), 0) || 0;

      // 5. Get payables (pending bills)
      const { data: unpaidBills } = await supabase
        .from('bills')
        .select('amount')
        .eq('status', 'pending');

      const payables = unpaidBills?.reduce((sum, b) => sum + Number(b.amount), 0) || 0;

      return {
        total,
        cash,
        receivables,
        payables
      };
    } catch (error) {
      console.error('Error getting cash balance:', error);
      throw error;
    }
  }

  static async processTransfer(
    sourceAccountId: number,
    destinationAccountId: number,
    amount: number,
    description: string,
    paymentMethod: string,
    date: string,
    createdBy: string
  ): Promise<void> {
    try {
      await BankService.transferBetweenAccounts(
        sourceAccountId,
        destinationAccountId,
        amount,
        description,
        paymentMethod,
        date,
        createdBy
      );
    } catch (error) {
      console.error('Error processing transfer:', error);
      throw error;
    }
  }
}