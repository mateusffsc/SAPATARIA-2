import { supabase } from '../lib/supabase';
import { Order } from '../types';
import { getCurrentDate } from '../utils/formatters';

export class OrderService {
  static async getAll(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(this.mapFromDatabase);
  }

  static async getById(id: number): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return this.mapFromDatabase(data);
  }

  static async getByNumber(number: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('number', number)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return this.mapFromDatabase(data);
  }

  static async create(order: Omit<Order, 'id'>): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .insert(this.mapToDatabase(order))
      .select()
      .single();

    if (error) throw error;

    // Create financial transaction for entry payment (only for new orders)
    if (data.entry_value > 0) {
      try {
        await supabase
          .from('financial_transactions')
          .insert({
            type: 'income',
            amount: data.entry_value,
            description: `Entrada OS ${data.number} - ${data.client_name}`,
            category: 'Serviços',
            reference_type: 'order',
            reference_id: data.id,
            reference_number: data.number,
            payment_method: data.payment_method_entry,
            date: data.date,
            created_by: data.created_by || 'Admin'
          });
      } catch (error) {
        console.error('Error creating financial transaction for entry payment:', error);
      }
    }

    return this.mapFromDatabase(data);
  }

  static async update(id: number | string, order: Partial<Order>): Promise<Order> {
    console.log('Atualizando ordem:', { id, order }); // Debug

    const { data, error } = await supabase
      .from('orders')
      .update(this.mapToDatabase(order))
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar ordem:', error); // Debug
      throw error;
    }

    console.log('Ordem atualizada com sucesso:', data); // Debug
    return this.mapFromDatabase(data);
  }

  static async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async search(query: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .or(`number.ilike.%${query}%,client_name.ilike.%${query}%,serial_number.ilike.%${query}%,article.ilike.%${query}%,brand.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(this.mapFromDatabase);
  }

  static async getByStatus(status: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(this.mapFromDatabase);
  }

  static async getByClientId(clientId: number): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(this.mapFromDatabase);
  }

  static async generateOrderNumber(): Promise<string> {
    const { data, error } = await supabase
      .from('orders')
      .select('number')
      .order('id', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (data.length === 0) {
      return 'OS-001';
    }

    const lastNumber = data[0].number;
    const numberPart = parseInt(lastNumber.split('-')[1]);
    return `OS-${String(numberPart + 1).padStart(3, '0')}`;
  }

  // Helper method for creating orders with correct date handling
  static async createOrder(orderData: any): Promise<Order> {
    // Ensure date is set to today with correct timezone
    if (!orderData.date) {
      orderData.date = getCurrentDate();
    }
    
    return this.create(orderData);
  }

  private static mapFromDatabase(data: any): Order {
    return {
      id: data.id,
      number: data.number,
      date: data.date,
      clientId: data.client_id,
      client: data.client_name,
      article: data.article,
      brand: data.brand,
      model: data.model,
      color: data.color,
      size: data.size,
      serialNumber: data.serial_number || '',
      description: data.description || '',
      services: data.services || [],
      deliveryDate: data.delivery_date,
      paymentMethodEntry: data.payment_method_entry || '',
      totalValue: data.total_value,
      entryValue: data.entry_value,
      remainingValue: data.remaining_value,
      paymentMethodRemaining: data.payment_method_remaining || '',
      observations: data.observations || '',
      status: data.status,
      payments: data.payments || [],
      createdBy: data.created_by,
      createdAt: data.created_at,
      lastModifiedBy: data.last_modified_by,
      lastModifiedAt: data.updated_at
    };
  }

  private static mapToDatabase(order: Partial<Order>): any {
    const mappedOrder = {
      number: order.number,
      date: order.date,
      client_id: order.clientId,
      client_name: order.client || (order as any).client_name,
      article: order.article,
      brand: order.brand,
      model: order.model,
      color: order.color,
      size: order.size,
      serial_number: order.serialNumber,
      description: order.description,
      services: order.services,
      delivery_date: order.deliveryDate,
      payment_method_entry: order.paymentMethodEntry,
      total_value: order.totalValue,
      entry_value: order.entryValue,
      remaining_value: order.remainingValue,
      payment_method_remaining: order.paymentMethodRemaining,
      observations: order.observations,
      status: order.status,
      payments: order.payments,
      last_modified_by: order.lastModifiedBy,
      updated_at: new Date().toISOString()
    };

    console.log('Ordem mapeada para o banco:', mappedOrder); // Debug
    return mappedOrder;
  }
}