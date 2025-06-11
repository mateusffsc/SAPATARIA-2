import { supabase } from '../lib/supabase';
import { Bill } from '../types';
import { FinancialService } from './financialService';

export class BillService {
  static async getAll(): Promise<Bill[]> {
    try {
      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(this.mapFromDatabase);
    } catch (error) {
      console.error('Error fetching bills:', error);
      throw error;
    }
  }

  static async getById(id: number): Promise<Bill | null> {
    try {
      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return this.mapFromDatabase(data);
    } catch (error) {
      console.error('Error fetching bill:', error);
      throw error;
    }
  }

  static async create(bill: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>): Promise<Bill> {
    try {
      const { data, error } = await supabase
        .from('bills')
        .insert(this.mapToDatabase(bill))
        .select()
        .single();

      if (error) throw error;

      return this.mapFromDatabase(data);
    } catch (error) {
      console.error('Error creating bill:', error);
      throw error;
    }
  }

  static async update(id: number, bill: Partial<Bill>): Promise<Bill> {
    try {
      const { data, error } = await supabase
        .from('bills')
        .update(this.mapToDatabase(bill))
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return this.mapFromDatabase(data);
    } catch (error) {
      console.error('Error updating bill:', error);
      throw error;
    }
  }

  static async delete(id: number): Promise<void> {
    try {
      // First, delete any associated financial transactions
      await FinancialService.deleteTransactionsByReference('bill', id);
      
      // Then delete the bill
      const { error } = await supabase
        .from('bills')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting bill:', error);
      throw error;
    }
  }

  static async markAsPaid(id: number, paymentMethod: string, paidBy: string): Promise<Bill> {
    try {
      // Get the bill first to have all the data
      const { data: billData, error: billError } = await supabase
        .from('bills')
        .select('*')
        .eq('id', id)
        .single();
        
      if (billError) throw billError;
      
      // Update the bill as paid
      const { data, error } = await supabase
        .from('bills')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          paid_by: paidBy,
          payment_method: paymentMethod
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Create financial transaction for the payment
      await FinancialService.createTransaction({
        type: 'expense',
        amount: -billData.amount, // Negative for expense
        description: `Pagamento conta - ${billData.supplier}: ${billData.description}`,
        category: billData.category,
        reference_type: 'bill',
        reference_id: id,
        reference_number: `BILL-${id}`,
        payment_method: paymentMethod,
        date: new Date().toISOString().split('T')[0],
        created_by: paidBy
      });

      return this.mapFromDatabase(data);
    } catch (error) {
      console.error('Error marking bill as paid:', error);
      throw error;
    }
  }

  private static mapFromDatabase(data: any): Bill {
    return {
      id: data.id,
      supplier: data.supplier,
      description: data.description,
      category: data.category,
      amount: data.amount,
      dueDate: data.due_date,
      status: data.status as 'pending' | 'paid',
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      paidAt: data.paid_at,
      paidBy: data.paid_by,
      paymentMethod: data.payment_method
    };
  }

  private static mapToDatabase(bill: Partial<Bill>): any {
    const dbData: any = {};
    
    if (bill.supplier !== undefined) dbData.supplier = bill.supplier;
    if (bill.description !== undefined) dbData.description = bill.description;
    if (bill.category !== undefined) dbData.category = bill.category;
    if (bill.amount !== undefined) dbData.amount = bill.amount;
    if (bill.dueDate !== undefined) dbData.due_date = bill.dueDate;
    if (bill.status !== undefined) dbData.status = bill.status;
    if (bill.createdBy !== undefined) dbData.created_by = bill.createdBy;
    if (bill.paidAt !== undefined) dbData.paid_at = bill.paidAt;
    if (bill.paidBy !== undefined) dbData.paid_by = bill.paidBy;
    if (bill.paymentMethod !== undefined) dbData.payment_method = bill.paymentMethod;
    
    return dbData;
  }
}