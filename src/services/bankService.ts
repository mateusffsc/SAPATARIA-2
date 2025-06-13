import { supabase } from '../lib/supabase';
import { BankAccount } from '../types';

export class BankService {
  static async getAccounts(): Promise<BankAccount[]> {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .order('name');

      if (error) throw error;

      return data.map(this.mapFromDatabase);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      throw error;
    }
  }

  static async getAccountById(id: number): Promise<BankAccount | null> {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return this.mapFromDatabase(data);
    } catch (error) {
      console.error('Error fetching bank account:', error);
      throw error;
    }
  }

  static async createAccount(account: Omit<BankAccount, 'id' | 'createdAt'>): Promise<BankAccount> {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .insert({
          name: account.name,
          bank_id: account.bankId,
          balance: account.balance,
          is_active: account.isActive
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapFromDatabase(data);
    } catch (error) {
      console.error('Error creating bank account:', error);
      throw error;
    }
  }

  static async updateAccount(id: number, account: Partial<BankAccount>): Promise<BankAccount> {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .update({
          name: account.name,
          bank_id: account.bankId,
          is_active: account.isActive
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return this.mapFromDatabase(data);
    } catch (error) {
      console.error('Error updating bank account:', error);
      throw error;
    }
  }

  static async deleteAccount(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('bank_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting bank account:', error);
      throw error;
    }
  }

  static async transferBetweenAccounts(
    sourceId: number,
    destinationId: number,
    amount: number,
    description: string,
    paymentMethod: string,
    date: string,
    createdBy: string
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc('process_account_transfer', {
        p_source_id: sourceId,
        p_destination_id: destinationId,
        p_amount: amount,
        p_description: description,
        p_payment_method: paymentMethod,
        p_date: date,
        p_created_by: createdBy
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error transferring between accounts:', error);
      throw error;
    }
  }

  // Find or create the "Caixa Loja" account
  static async findOrCreateCashAccount(): Promise<BankAccount> {
    try {
      // Try to find the account first
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('name', 'Caixa Loja')
        .single();
      
      if (!error && data) {
        return this.mapFromDatabase(data);
      }
      
      // If not found, create it
      const { data: newAccount, error: createError } = await supabase
        .from('bank_accounts')
        .insert({
          name: 'Caixa Loja',
          balance: 0,
          is_active: true
        })
        .select()
        .single();
        
      if (createError) throw createError;
      
      return this.mapFromDatabase(newAccount);
    } catch (error) {
      console.error('Error finding or creating cash account:', error);
      throw error;
    }
  }

  private static mapFromDatabase(data: any): BankAccount {
    return {
      id: data.id,
      name: data.name,
      bankId: data.bank_id,
      balance: parseFloat(data.balance),
      isActive: data.is_active,
      createdAt: data.created_at
    };
  }
}