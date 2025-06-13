import { supabase } from '../lib/supabase';
import { ProductSale, ProductSaleItem } from '../types';

export class ProductSaleService {
  static async getAll(): Promise<ProductSale[]> {
    try {
      const { data: salesData, error: salesError } = await supabase
        .from('product_sales')
        .select('*')
        .order('created_at', { ascending: false });

      if (salesError) throw salesError;

      const sales: ProductSale[] = [];

      for (const sale of salesData) {
        const { data: itemsData, error: itemsError } = await supabase
          .from('product_sale_items')
          .select('*')
          .eq('sale_id', sale.id);

        if (itemsError) throw itemsError;

        const items: ProductSaleItem[] = itemsData.map(item => ({
          productId: item.product_id,
          productName: item.product_name,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          totalPrice: item.total_price
        }));

        sales.push({
          id: sale.id,
          saleNumber: sale.sale_number,
          date: sale.date,
          clientId: sale.client_id,
          clientName: sale.client_name,
          items,
          totalAmount: sale.total_amount,
          paymentMethod: sale.payment_method,
          status: sale.status as 'completed' | 'cancelled',
          createdBy: sale.created_by,
          createdAt: sale.created_at,
          paymentOption: sale.payment_option,
          cashDiscount: sale.cash_discount,
          installments: sale.installments,
          installmentFee: sale.installment_fee,
          originalAmount: sale.original_amount
        });
      }

      return sales;
    } catch (error) {
      console.error('Error fetching product sales:', error);
      throw error;
    }
  }

  static async getById(id: number): Promise<ProductSale | null> {
    try {
      const { data: sale, error: saleError } = await supabase
        .from('product_sales')
        .select('*')
        .eq('id', id)
        .single();

      if (saleError) {
        if (saleError.code === 'PGRST116') return null;
        throw saleError;
      }

      const { data: itemsData, error: itemsError } = await supabase
        .from('product_sale_items')
        .select('*')
        .eq('sale_id', id);

      if (itemsError) throw itemsError;

      const items: ProductSaleItem[] = itemsData.map(item => ({
        productId: item.product_id,
        productName: item.product_name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        totalPrice: item.total_price
      }));

      return {
        id: sale.id,
        saleNumber: sale.sale_number,
        date: sale.date,
        clientId: sale.client_id,
        clientName: sale.client_name,
        items,
        totalAmount: sale.total_amount,
        paymentMethod: sale.payment_method,
        status: sale.status as 'completed' | 'cancelled',
        createdBy: sale.created_by,
        createdAt: sale.created_at,
        paymentOption: sale.payment_option,
        cashDiscount: sale.cash_discount,
        installments: sale.installments,
        installmentFee: sale.installment_fee,
        originalAmount: sale.original_amount
      };
    } catch (error) {
      console.error('Error fetching product sale:', error);
      throw error;
    }
  }
  
  static async getByNumber(saleNumber: string): Promise<ProductSale | null> {
    try {
      const { data: sale, error: saleError } = await supabase
        .from('product_sales')
        .select('*')
        .eq('sale_number', saleNumber)
        .single();

      if (saleError) {
        if (saleError.code === 'PGRST116') return null;
        throw saleError;
      }

      const { data: itemsData, error: itemsError } = await supabase
        .from('product_sale_items')
        .select('*')
        .eq('sale_id', sale.id);

      if (itemsError) throw itemsError;

      const items: ProductSaleItem[] = itemsData.map(item => ({
        productId: item.product_id,
        productName: item.product_name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        totalPrice: item.total_price
      }));

      return {
        id: sale.id,
        saleNumber: sale.sale_number,
        date: sale.date,
        clientId: sale.client_id,
        clientName: sale.client_name,
        items,
        totalAmount: sale.total_amount,
        paymentMethod: sale.payment_method,
        status: sale.status as 'completed' | 'cancelled',
        createdBy: sale.created_by,
        createdAt: sale.created_at,
        paymentOption: sale.payment_option,
        cashDiscount: sale.cash_discount,
        installments: sale.installments,
        installmentFee: sale.installment_fee,
        originalAmount: sale.original_amount
      };
    } catch (error) {
      console.error('Error fetching product sale by number:', error);
      throw error;
    }
  }

  static async create(
    saleData: {
      saleNumber: string;
      date: string;
      clientId: number;
      clientName: string;
      totalAmount: number;
      paymentMethod: string;
      createdBy: string;
      paymentOption?: 'normal' | 'cash' | 'installment';
      cashDiscount?: number;
      installments?: number;
      installmentFee?: number;
      originalAmount?: number;
    },
    items: {
      productId: number;
      productName: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }[]
  ): Promise<ProductSale> {
    try {
      // Insert sale
      const { data: sale, error: saleError } = await supabase
        .from('product_sales')
        .insert({
          sale_number: saleData.saleNumber,
          date: saleData.date,
          client_id: saleData.clientId,
          client_name: saleData.clientName,
          total_amount: saleData.totalAmount,
          payment_method: saleData.paymentMethod,
          created_by: saleData.createdBy,
          payment_option: saleData.paymentOption,
          cash_discount: saleData.cashDiscount,
          installments: saleData.installments,
          installment_fee: saleData.installmentFee,
          original_amount: saleData.originalAmount
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Insert items
      const saleItems = items.map(item => ({
        sale_id: sale.id,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice
      }));

      const { error: itemsError } = await supabase
        .from('product_sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Return the created sale with items
      return {
        id: sale.id,
        saleNumber: sale.sale_number,
        date: sale.date,
        clientId: sale.client_id,
        clientName: sale.client_name,
        items: items,
        totalAmount: sale.total_amount,
        paymentMethod: sale.payment_method,
        status: sale.status,
        createdBy: sale.created_by,
        createdAt: sale.created_at,
        paymentOption: sale.payment_option,
        cashDiscount: sale.cash_discount,
        installments: sale.installments,
        installmentFee: sale.installment_fee,
        originalAmount: sale.original_amount
      };
    } catch (error) {
      console.error('Error creating product sale:', error);
      throw error;
    }
  }

  static async generateSaleNumber(): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('product_sales')
        .select('sale_number')
        .order('id', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data.length === 0) {
        return 'VD-001';
      }

      const lastNumber = data[0].sale_number;
      const numberPart = parseInt(lastNumber.split('-')[1]);
      return `VD-${String(numberPart + 1).padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating sale number:', error);
      return `VD-${Date.now()}`;
    }
  }

  static async cancelSale(id: number, reason: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('product_sales')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // TODO: Handle stock return and financial transaction for cancellation
    } catch (error) {
      console.error('Error cancelling product sale:', error);
      throw error;
    }
  }
}