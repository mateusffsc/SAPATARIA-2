import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log para debug (remover depois)
console.log('Supabase URL:', supabaseUrl ? 'Configurada' : 'Não configurada');
console.log('Supabase Key:', supabaseAnonKey ? 'Configurada' : 'Não configurada');

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-debug-mode': 'true'
    }
  }
});

// Adicionar listener para debug
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event, session?.user?.email);
});

// Database types
interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: number;
          name: string;
          cpf: string;
          phone: string;
          email: string;
          street: string;
          number: string;
          complement?: string;
          neighborhood: string;
          city: string;
          state: string;
          zip_code: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['clients']['Insert']>;
      };
      orders: {
        Row: {
          id: number;
          number: string;
          date: string;
          client_id: number;
          client_name: string;
          article: string;
          brand: string;
          model: string;
          color: string;
          size: string;
          serial_number?: string;
          description?: string;
          services: any[];
          delivery_date: string;
          payment_method_entry?: string;
          total_value: number;
          entry_value: number;
          remaining_value: number;
          payment_method_remaining?: string;
          observations?: string;
          status: string;
          payments: any[];
          created_by: string;
          created_at: string;
          updated_at: string;
          last_modified_by: string;
        };
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['orders']['Insert']>;
      };
      technicians: {
        Row: {
          id: number;
          name: string;
          specialty: string;
          phone: string;
          email: string;
          start_date: string;
          total_services: number;
          avg_rating: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['technicians']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['technicians']['Insert']>;
      };
      services: {
        Row: {
          id: number;
          name: string;
          default_price: number;
          group?: string;
          description?: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['services']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['services']['Insert']>;
      };
      payment_methods: {
        Row: {
          id: number;
          name: string;
          bank_id?: number;
          fee: number;
          settlement_days: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['payment_methods']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['payment_methods']['Insert']>;
      };
      banks: {
        Row: {
          id: number;
          code: string;
          name: string;
          agency: string;
          account: string;
          fee: number;
          settlement_days: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['banks']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['banks']['Insert']>;
      };
      employees: {
        Row: {
          id: number;
          name: string;
          email: string;
          username: string;
          password: string;
          role: string;
          is_active: boolean;
          custom_permissions?: string[];
          created_at: string;
          updated_at: string;
          last_login?: string;
        };
        Insert: Omit<Database['public']['Tables']['employees']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['employees']['Insert']>;
      };
      products: {
        Row: {
          id: number;
          name: string;
          category: string;
          brand: string;
          model: string;
          price: number;
          cost: number;
          stock: number;
          min_stock: number;
          supplier: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
      };
      suppliers: {
        Row: {
          id: number;
          name: string;
          cnpj: string;
          phone: string;
          email: string;
          address: string;
          contact: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['suppliers']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['suppliers']['Insert']>;
      };
      bills: {
        Row: {
          id: number;
          supplier: string;
          description: string;
          category: string;
          amount: number;
          due_date: string;
          status: string;
          created_by: string;
          created_at: string;
          updated_at: string;
          paid_at?: string;
          paid_by?: string;
        };
        Insert: Omit<Database['public']['Tables']['bills']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['bills']['Insert']>;
      };
      order_images: {
        Row: {
          id: number;
          order_id: number;
          image_url: string;
          image_path: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['order_images']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['order_images']['Insert']>;
      };
    };
  };
}