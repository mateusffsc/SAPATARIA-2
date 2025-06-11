import { ReactNode } from 'react';

// User Roles
export type UserRole = 'admin' | 'manager' | 'technician' | 'attendant' | 'financial_low';

// Permission Types
interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
}

// Role Permissions
interface RolePermissions {
  role: UserRole;
  permissions: string[]; // Array of permission IDs
}

export interface User {
  id: number;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  email?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  customPermissions?: string[]; // Optional custom permissions
}

// Service Types
export interface Service {
  id: number;
  name: string;
  defaultPrice: number;
}

export interface PaymentMethod {
  id: number;
  name: string;
  bankId?: number;
  fee: number;
  settlementDays: number;
  isActive: boolean;
  createdAt: string;
}

export interface Bank {
  id: number;
  code: string;
  name: string;
  agency: string;
  account: string;
  fee: number;
  settlementDays: number;
  isActive?: boolean;
  createdAt: string;
}

export interface BankAccount {
  id: number;
  name: string;
  bankId: number | null;
  balance: number;
  isActive: boolean;
  createdAt: string;
}

export interface Technician {
  id: number;
  name: string;
  specialty: string;
  phone: string;
  email: string;
  startDate: string;
  totalServices: number;
  avgRating: number;
}

export interface Client {
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
  zipCode: string;
}

interface NewClient {
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
  zipCode: string;
}

interface OrderService {
  serviceId: number | string;
  name: string;
  details: string;
  price: number;
  technicianId: number | string;
}

interface Payment {
  date: string;
  value: number;
  method: string;
  type: string;
}

export interface Order {
  id: number;
  number: string;
  date: string;
  clientId: number;
  client: string;
  article: string;
  brand: string;
  color: string;
  size: string;
  serialNumber: string;
  model: string;
  description: string;
  services: OrderService[];
  deliveryDate: string;
  paymentMethodEntry: string;
  totalValue: number;
  entryValue: number;
  remainingValue: number;
  paymentMethodRemaining: string;
  observations: string;
  status: string;
  payments: Payment[];
  createdBy: string;
  createdAt: string;
  lastModifiedBy: string;
  lastModifiedAt: string;
  paymentOption?: 'normal' | 'cash' | 'installment';
  cashDiscount?: number;
  installments?: number;
  installmentFee?: number;
  originalTotalValue?: number;
}

interface OrderFormData {
  number: string;
  date: string;
  clientId: number | string;
  newClient: NewClient;
  isNewClient: boolean;
  article: string;
  brand: string;
  color: string;
  size: string;
  serialNumber: string;
  model: string;
  description: string;
  services: OrderService[];
  deliveryDate: string;
  paymentMethodEntry: string;
  totalValue: number;
  entryValue: number;
  remainingValue: number;
  paymentMethodRemaining: string;
  observations: string;
  status: string;
}

interface ChartDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

interface ServiceStat {
  name: string;
  count: number;
  revenue: number;
}

interface PaymentStat {
  method: string;
  value: number;
  percentage: string;
}

interface TechnicianStat {
  name: string;
  count: number;
  revenue: number;
}

interface StatusStat {
  status: string;
  count: number;
  percentage: string;
}

export interface Employee {
  id: number;
  name: string;
  email: string;
  username: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  customPermissions?: string[];
}

export interface Product {
  id: number;
  name: string;
  category: string;
  brand: string;
  model: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  supplier: string;
  isActive: boolean;
  createdAt: string;
}

export interface ProductSaleItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ProductSale {
  id: number;
  saleNumber: string;
  date: string;
  clientId: number;
  clientName: string;
  items: ProductSaleItem[];
  totalAmount: number;
  paymentMethod: string;
  status: 'completed' | 'cancelled';
  createdBy: string;
  createdAt: string;
  paymentOption?: 'normal' | 'cash' | 'installment';
  cashDiscount?: number;
  installments?: number;
  installmentFee?: number;
  originalAmount?: number;
}

export interface Supplier {
  id: number;
  name: string;
  cnpj: string;
  phone: string;
  email: string;
  address: string;
  contact: string;
  category?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Bill {
  id: number;
  supplier: string;
  description: string;
  category: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid';
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  paidAt?: string;
  paidBy?: string;
  paymentMethod?: string;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => User;
  updateUser: (id: number, updates: Partial<User>) => User;
  deleteUser: (id: number) => void;
  users: User[];
  loading: boolean;
}

export interface AuthProviderProps {
  children: ReactNode;
}