import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Order, Client, Technician, Service, PaymentMethod, Bill, Employee, Product, Supplier, Bank, BankAccount } from '../types';
import { supabase } from '../lib/supabase';
import { ClientService } from '../services/clientService';
import { OrderService } from '../services/orderService';
import { FinancialService, FinancialTransaction } from '../services/financialService';
import { CashService } from '../services/cashService';
import { BankService } from '../services/bankService';
import { ProductSaleService, ProductSale } from '../services/productSaleService';
import { getCurrentDate } from '../utils/formatters';

interface AppContextType {
  currentView: string;
  setCurrentView: (view: string) => void;
  orders: Order[];
  setOrders: (orders: Order[]) => void;
  clients: Client[];
  setClients: (clients: Client[]) => void;
  technicians: Technician[];
  setTechnicians: (technicians: Technician[]) => void;
  services: Service[];
  setServices: (services: Service[]) => void;
  paymentMethods: PaymentMethod[];
  setPaymentMethods: (methods: PaymentMethod[]) => void;
  selectedOrder: Order | null;
  setSelectedOrder: (order: Order | null) => void;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  modalType: string;
  setModalType: (type: string) => void;
  formData: any;
  setFormData: (data: any) => void;
  generateOrderNumber: () => Promise<string>;
  generateSaleNumber: () => Promise<string>;
  bills: Bill[];
  setBills: (bills: Bill[]) => void;
  currentUser: { name: string } | null;
  employees: Employee[];
  setEmployees: (employees: Employee[]) => void;
  products: Product[];
  setProducts: (products: Product[]) => void;
  suppliers: Supplier[];
  setSuppliers: (suppliers: Supplier[]) => void;
  banks: Bank[];
  setBanks: (banks: Bank[]) => void;
  bankAccounts: BankAccount[];
  setBankAccounts: (accounts: BankAccount[]) => void;
  productSales: ProductSale[];
  setProductSales: (sales: ProductSale[]) => void;
  loading: boolean;
  error: string | null;
  // Financial state
  financialTransactions: FinancialTransaction[];
  setFinancialTransactions: (transactions: FinancialTransaction[]) => void;
  todayCashFlow: {
    income: number;
    expenses: number;
    balance: number;
    cash: number;
  };
  createFinancialTransaction: (transaction: Omit<FinancialTransaction, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  loadFinancialData: () => Promise<void>;
  loadProducts: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [formData, setFormData] = useState({});
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [productSales, setProductSales] = useState<ProductSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Financial state
  const [financialTransactions, setFinancialTransactions] = useState<FinancialTransaction[]>([]);
  const [todayCashFlow, setTodayCashFlow] = useState({
    income: 0,
    expenses: 0,
    balance: 0,
    cash: 0
  });

  // Load functions
  const loadOrders = async () => {
    try {
      const data = await OrderService.getAll();
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const loadClients = async () => {
    try {
      const data = await ClientService.getAll();
      setClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadTechnicians = async () => {
    try {
      const { data, error } = await supabase
        .from('technicians')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (data) {
        setTechnicians(data.map(t => ({
          id: t.id,
          name: t.name,
          specialty: t.specialty,
          phone: t.phone,
          email: t.email,
          startDate: t.start_date,
          totalServices: t.total_services,
          avgRating: t.avg_rating
        })));
      }
    } catch (error) {
      console.error('Error loading technicians:', error);
    }
  };

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (data) {
        setServices(data.map(s => ({
          id: s.id,
          name: s.name,
          defaultPrice: s.default_price
        })));
      }
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (data) {
        setPaymentMethods(data.map(pm => ({
          id: pm.id,
          name: pm.name,
          bankId: pm.bank_id,
          fee: pm.fee,
          settlementDays: pm.settlement_days,
          isActive: pm.is_active,
          createdAt: pm.created_at
        })));
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
    }
  };

  const loadBanks = async () => {
    try {
      const { data, error } = await supabase
        .from('banks')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (data) {
        setBanks(data.map(b => ({
          id: b.id,
          code: b.code,
          name: b.name,
          agency: b.agency,
          account: b.account,
          fee: b.fee,
          settlementDays: b.settlement_days,
          isActive: b.is_active,
          createdAt: b.created_at
        })));
      }
    } catch (error) {
      console.error('Error loading banks:', error);
    }
  };

  const loadBankAccounts = async () => {
    try {
      const accounts = await BankService.getAccounts();
      setBankAccounts(accounts);
      
      // Check if "Caixa Loja" account exists, if not create it
      const caixaLojaAccount = accounts.find(a => a.name === 'Caixa Loja');
      if (!caixaLojaAccount) {
        try {
          const newAccount = await BankService.createAccount({
            name: 'Caixa Loja',
            bankId: null,
            balance: 0,
            isActive: true
          });
          setBankAccounts(prev => [...prev, newAccount]);
        } catch (error) {
          console.error('Error creating Caixa Loja account:', error);
        }
      }
    } catch (error) {
      console.error('Error loading bank accounts:', error);
      // Initialize with default accounts if there's an error
      setBankAccounts([
        {
          id: 1,
          name: 'Caixa Loja',
          bankId: null,
          balance: 0,
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          name: 'Cofre',
          bankId: null,
          balance: 0,
          isActive: true,
          createdAt: new Date().toISOString()
        }
      ]);
    }
  };

  const loadBills = async () => {
    try {
      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) {
        setBills(data.map(b => ({
          id: b.id,
          supplier: b.supplier,
          description: b.description,
          category: b.category,
          amount: b.amount,
          dueDate: b.due_date,
          status: b.status as 'pending' | 'paid',
          createdBy: b.created_by,
          createdAt: b.created_at,
          updatedAt: b.updated_at,
          paidAt: b.paid_at,
          paidBy: b.paid_by
        })));
      }
    } catch (error) {
      console.error('Error loading bills:', error);
    }
  };

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (data) {
        setEmployees(data.map(e => ({
          id: e.id,
          name: e.name,
          email: e.email,
          username: e.username,
          password: e.password,
          role: e.role as any,
          isActive: e.is_active,
          createdAt: e.created_at,
          lastLogin: e.last_login,
          customPermissions: e.custom_permissions
        })));
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const loadProducts = async () => {
    try {
      console.log('Loading products...');
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) {
        console.error('Error in Supabase query:', error);
        throw error;
      }
      
      if (data) {
        console.log(`Loaded ${data.length} products`);
        setProducts(data.map(p => ({
          id: p.id,
          name: p.name,
          category: p.category,
          brand: p.brand,
          model: p.model,
          price: p.price,
          cost: p.cost,
          stock: p.stock,
          minStock: p.min_stock,
          supplier: p.supplier,
          isActive: p.is_active,
          createdAt: p.created_at
        })));
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (data) {
        setSuppliers(data.map(s => ({
          id: s.id,
          name: s.name,
          cnpj: s.cnpj,
          phone: s.phone,
          email: s.email,
          address: s.address,
          contact: s.contact,
          isActive: s.is_active,
          createdAt: s.created_at
        })));
      }
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const loadProductSales = async () => {
    try {
      const data = await ProductSaleService.getAll();
      setProductSales(data);
    } catch (error) {
      console.error('Error loading product sales:', error);
    }
  };

  // Load financial data
  const loadFinancialData = async () => {
    try {
      const today = getCurrentDate();
      const [allTransactions, todayTransactions, balance] = await Promise.all([
        FinancialService.getAllTransactions(),
        FinancialService.getTransactionsByDateRange(today, today),
        CashService.getBalance(today)
      ]);

      setFinancialTransactions(allTransactions);

      // Calculate today's cash flow
      const todayIncome = todayTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      const todayExpenses = todayTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      setTodayCashFlow({
        income: todayIncome,
        expenses: todayExpenses,
        balance: todayIncome - todayExpenses,
        cash: balance.cash
      });
    } catch (error) {
      console.error('Error loading financial data:', error);
    }
  };

  // Create financial transaction
  const createFinancialTransaction = async (transaction: Omit<FinancialTransaction, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Find the "Caixa Loja" account if not specified
      if (!transaction.destination_account_id && transaction.type === 'income') {
        const caixaLoja = bankAccounts.find(acc => acc.name === 'Caixa Loja');
        if (caixaLoja) {
          transaction.destination_account_id = caixaLoja.id;
        }
      }
      
      if (!transaction.source_account_id && transaction.type === 'expense') {
        const caixaLoja = bankAccounts.find(acc => acc.name === 'Caixa Loja');
        if (caixaLoja) {
          transaction.source_account_id = caixaLoja.id;
        }
      }
      
      if (transaction.type === 'transfer') {
        // Use the process_account_transfer function for transfers
        await BankService.transferBetweenAccounts(
          transaction.source_account_id!,
          transaction.destination_account_id!,
          transaction.amount,
          transaction.description,
          transaction.payment_method || 'Transferência',
          transaction.date,
          transaction.created_by
        );
      } else {
        // Use the regular transaction creation for income/expense
        await FinancialService.createTransaction(transaction);
      }
      
      // Reload financial data and bank accounts
      await Promise.all([
        loadFinancialData(),
        loadBankAccounts()
      ]);
    } catch (error) {
      console.error('Error creating financial transaction:', error);
      throw error;
    }
  };

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          loadOrders(),
          loadClients(),
          loadTechnicians(),
          loadServices(),
          loadPaymentMethods(),
          loadBanks(),
          loadBankAccounts(),
          loadBills(),
          loadEmployees(),
          loadProducts(),
          loadSuppliers(),
          loadProductSales(),
          loadFinancialData()
        ]);
      } catch (error) {
        console.error('Error loading initial data:', error);
        setError('Erro ao carregar dados iniciais. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const value = {
    currentView,
    setCurrentView,
    orders,
    setOrders,
    clients,
    setClients,
    technicians,
    setTechnicians,
    services,
    setServices,
    paymentMethods,
    setPaymentMethods,
    selectedOrder,
    setSelectedOrder,
    showModal,
    setShowModal,
    modalType,
    setModalType,
    formData,
    setFormData,
    banks,
    setBanks,
    bankAccounts,
    setBankAccounts,
    bills,
    setBills,
    employees,
    setEmployees,
    products,
    setProducts,
    suppliers,
    setSuppliers,
    productSales,
    setProductSales,
    loading,
    error,
    financialTransactions,
    setFinancialTransactions,
    todayCashFlow,
    loadFinancialData,
    createFinancialTransaction,
    loadProducts,
    currentUser: { name: 'Admin' },
    generateOrderNumber: async () => {
      try {
        return await OrderService.generateOrderNumber();
      } catch (error) {
        console.error('Error generating order number:', error);
        return `OS-${Date.now()}`;
      }
    },
    generateSaleNumber: async () => {
      try {
        return await ProductSaleService.generateSaleNumber();
      } catch (error) {
        console.error('Error generating sale number:', error);
        return `VD-${Date.now()}`;
      }
    }
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};