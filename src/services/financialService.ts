import { supabase } from '../lib/supabase';

export interface FinancialTransaction {
  id: number;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string;
  category: string;
  reference_type: string;
  reference_id?: number;
  reference_number?: string;
  payment_method?: string;
  date: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  source_account_id?: number;
  destination_account_id?: number;
}

export interface CashFlowData {
  date: string;
  income: number;
  expenses: number;
  balance: number;
  running_balance: number;
}

interface FinancialSummary {
  total_income: number;
  total_expenses: number;
  net_balance: number;
  period_start: string;
  period_end: string;
}

export class FinancialService {
  static async getAllTransactions(): Promise<FinancialTransaction[]> {
    const { data, error } = await supabase
      .from('financial_transactions')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;

    return data.map(this.mapFromDatabase);
  }

  static async getTransactionsByDateRange(startDate: string, endDate: string): Promise<FinancialTransaction[]> {
    const { data, error } = await supabase
      .from('financial_transactions')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) throw error;

    return data.map(this.mapFromDatabase);
  }

  static async createTransaction(transaction: Omit<FinancialTransaction, 'id' | 'created_at' | 'updated_at'>): Promise<FinancialTransaction> {
    // Ensure proper amount sign based on type
    const amount = transaction.type === 'income' 
      ? Math.abs(transaction.amount) 
      : -Math.abs(transaction.amount);

    const { data, error } = await supabase
      .from('financial_transactions')
      .insert({
        type: transaction.type,
        amount: amount,
        description: transaction.description,
        category: transaction.category,
        reference_type: transaction.reference_type,
        reference_id: transaction.reference_id,
        reference_number: transaction.reference_number,
        payment_method: transaction.payment_method,
        date: transaction.date,
        created_by: transaction.created_by,
        source_account_id: transaction.source_account_id,
        destination_account_id: transaction.destination_account_id
      })
      .select()
      .single();

    if (error) throw error;

    return this.mapFromDatabase(data);
  }

  static async updateTransaction(id: number, updates: Partial<FinancialTransaction>): Promise<FinancialTransaction> {
    // Ensure proper amount sign if amount is being updated
    if (updates.amount !== undefined && updates.type) {
      updates.amount = updates.type === 'income' 
        ? Math.abs(updates.amount) 
        : -Math.abs(updates.amount);
    }

    const { data, error } = await supabase
      .from('financial_transactions')
      .update(this.mapToDatabase(updates))
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return this.mapFromDatabase(data);
  }

  static async deleteTransaction(id: number): Promise<void> {
    const { error } = await supabase
      .from('financial_transactions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async getCashFlowData(startDate: string, endDate: string): Promise<CashFlowData[]> {
    const transactions = await this.getTransactionsByDateRange(startDate, endDate);
    
    // Group transactions by date
    const dailyData = new Map<string, { income: number; expenses: number }>();
    
    // Initialize all dates in range
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      dailyData.set(dateStr, { income: 0, expenses: 0 });
    }
    
    // Aggregate transactions by date
    transactions.forEach(transaction => {
      const existing = dailyData.get(transaction.date) || { income: 0, expenses: 0 };
      
      if (transaction.type === 'income') {
        existing.income += Math.abs(transaction.amount);
      } else if (transaction.type === 'expense') {
        existing.expenses += Math.abs(transaction.amount);
      } else if (transaction.type === 'transfer') {
        // Transfers don't affect the cash flow directly
      }
      
      dailyData.set(transaction.date, existing);
    });
    
    // Convert to array with running balance
    let runningBalance = 0;
    const result: CashFlowData[] = [];
    
    for (const [date, data] of Array.from(dailyData.entries()).sort()) {
      const dailyBalance = data.income - data.expenses;
      runningBalance += dailyBalance;
      
      result.push({
        date,
        income: data.income,
        expenses: data.expenses,
        balance: dailyBalance,
        running_balance: runningBalance
      });
    }
    
    return result;
  }

  static async getFinancialSummary(startDate: string, endDate: string): Promise<FinancialSummary> {
    const transactions = await this.getTransactionsByDateRange(startDate, endDate);
    
    const summary = transactions.reduce(
      (acc, transaction) => {
        if (transaction.type === 'income') {
          acc.total_income += Math.abs(transaction.amount);
        } else if (transaction.type === 'expense') {
          acc.total_expenses += Math.abs(transaction.amount);
        }
        return acc;
      },
      { total_income: 0, total_expenses: 0 }
    );
    
    return {
      ...summary,
      net_balance: summary.total_income - summary.total_expenses,
      period_start: startDate,
      period_end: endDate
    };
  }

  static async getCategorySummary(startDate: string, endDate: string): Promise<{ category: string; amount: number; type: string }[]> {
    const { data, error } = await supabase
      .from('financial_transactions')
      .select('category, type, amount')
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;

    const categoryMap = new Map<string, { income: number; expense: number }>();
    
    data.forEach(transaction => {
      const key = transaction.category;
      const existing = categoryMap.get(key) || { income: 0, expense: 0 };
      
      if (transaction.type === 'income') {
        existing.income += Math.abs(transaction.amount);
      } else if (transaction.type === 'expense') {
        existing.expense += Math.abs(transaction.amount);
      }
      
      categoryMap.set(key, existing);
    });
    
    const result: { category: string; amount: number; type: string }[] = [];
    
    categoryMap.forEach((amounts, category) => {
      if (amounts.income > 0) {
        result.push({ category, amount: amounts.income, type: 'income' });
      }
      if (amounts.expense > 0) {
        result.push({ category, amount: amounts.expense, type: 'expense' });
      }
    });
    
    return result.sort((a, b) => b.amount - a.amount);
  }

  private static mapFromDatabase(data: any): FinancialTransaction {
    return {
      id: data.id,
      type: data.type,
      amount: parseFloat(data.amount),
      description: data.description,
      category: data.category,
      reference_type: data.reference_type,
      reference_id: data.reference_id,
      reference_number: data.reference_number,
      payment_method: data.payment_method,
      date: data.date,
      created_by: data.created_by,
      created_at: data.created_at,
      updated_at: data.updated_at,
      source_account_id: data.source_account_id,
      destination_account_id: data.destination_account_id
    };
  }

  private static mapToDatabase(transaction: Partial<FinancialTransaction>): any {
    const dbData: any = {};
    
    if (transaction.type !== undefined) dbData.type = transaction.type;
    if (transaction.amount !== undefined) dbData.amount = transaction.amount;
    if (transaction.description !== undefined) dbData.description = transaction.description;
    if (transaction.category !== undefined) dbData.category = transaction.category;
    if (transaction.reference_type !== undefined) dbData.reference_type = transaction.reference_type;
    if (transaction.reference_id !== undefined) dbData.reference_id = transaction.reference_id;
    if (transaction.reference_number !== undefined) dbData.reference_number = transaction.reference_number;
    if (transaction.payment_method !== undefined) dbData.payment_method = transaction.payment_method;
    if (transaction.date !== undefined) dbData.date = transaction.date;
    if (transaction.created_by !== undefined) dbData.created_by = transaction.created_by;
    if (transaction.source_account_id !== undefined) dbData.source_account_id = transaction.source_account_id;
    if (transaction.destination_account_id !== undefined) dbData.destination_account_id = transaction.destination_account_id;
    
    return dbData;
  }
}