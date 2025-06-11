import { UserRole } from '../types';

// Define all available permissions
export const permissions = {
  // Dashboard
  'dashboard.view': 'Ver dashboard',
  'dashboard.stats': 'Ver estatísticas',
  
  // Clients
  'clients.view': 'Ver clientes',
  'clients.create': 'Criar clientes',
  'clients.edit': 'Editar clientes',
  'clients.delete': 'Excluir clientes',
  
  // Orders
  'orders.view': 'Ver ordens de serviço',
  'orders.create': 'Criar ordens de serviço',
  'orders.edit': 'Editar ordens de serviço',
  'orders.delete': 'Excluir ordens de serviço',
  'orders.finish': 'Finalizar ordens de serviço',
  'orders.cancel': 'Cancelar ordens de serviço',
  
  // Technicians
  'technicians.view': 'Ver técnicos',
  'technicians.manage': 'Gerenciar técnicos',
  
  // Financial
  'financial.view': 'Ver financeiro',
  'financial.reports': 'Ver relatórios',
  'financial.bills': 'Gerenciar contas',
  'financial.payments': 'Gerenciar pagamentos',
  'financial.cashflow': 'Ver fluxo de caixa',
  'financial.daily': 'Ver movimentações do dia',
  'cash_register.manage': 'Gerenciar caixa',
  
  // Products
  'products.view': 'Ver produtos',
  'products.manage': 'Gerenciar produtos',
  
  // Services
  'services.view': 'Ver serviços',
  'services.manage': 'Gerenciar serviços',
  
  // Employees
  'employees.view': 'Ver funcionários',
  'employees.manage': 'Gerenciar funcionários',
  
  // Settings
  'settings.view': 'Ver configurações',
  'settings.manage': 'Gerenciar configurações',
  
  // Banks
  'banks.view': 'Ver bancos',
  'banks.manage': 'Gerenciar bancos',
  
  // Payment Methods
  'payment-methods.view': 'Ver formas de pagamento',
  'payment-methods.manage': 'Gerenciar formas de pagamento',
  
  // Suppliers
  'suppliers.view': 'Ver fornecedores',
  'suppliers.manage': 'Gerenciar fornecedores'
} as const;

// Define default permissions for each role
export const defaultPermissions: Record<UserRole, string[]> = {
  // Admin has all permissions
  admin: Object.keys(permissions),
  
  // Manager permissions
  manager: [
    'dashboard.view',
    'dashboard.stats',
    'clients.view',
    'clients.create',
    'clients.edit',
    'orders.view',
    'orders.create',
    'orders.edit',
    'orders.finish',
    'orders.cancel',
    'technicians.view',
    'financial.view',
    'financial.reports',
    'financial.payments',
    'financial.cashflow',
    'financial.daily',
    'cash_register.manage',
    'products.view',
    'services.view',
    'employees.view'
  ],
  
  // Technician permissions
  technician: [
    'dashboard.view',
    'orders.view',
    'orders.edit',
    'clients.view',
    'products.view',
    'services.view'
  ],
  
  // Attendant permissions
  attendant: [
    'dashboard.view',
    'clients.view',
    'clients.create',
    'orders.view',
    'orders.create',
    'products.view',
    'services.view',
    'financial.daily',
    'cash_register.manage'
  ],
  
  // Financial Low Level permissions
  financial_low: [
    'dashboard.view',
    'financial.daily',
    'financial.cashflow',
    'cash_register.manage'
  ]
};

// Group permissions by module for UI organization
export const permissionGroups = {
  dashboard: {
    name: 'Dashboard',
    permissions: ['dashboard.view', 'dashboard.stats']
  },
  clients: {
    name: 'Clientes',
    permissions: ['clients.view', 'clients.create', 'clients.edit', 'clients.delete']
  },
  orders: {
    name: 'Ordens de Serviço',
    permissions: ['orders.view', 'orders.create', 'orders.edit', 'orders.delete', 'orders.finish', 'orders.cancel']
  },
  technicians: {
    name: 'Técnicos',
    permissions: ['technicians.view', 'technicians.manage']
  },
  financial: {
    name: 'Financeiro',
    permissions: ['financial.view', 'financial.reports', 'financial.bills', 'financial.payments', 'financial.cashflow', 'financial.daily', 'cash_register.manage']
  },
  products: {
    name: 'Produtos',
    permissions: ['products.view', 'products.manage']
  },
  services: {
    name: 'Serviços',
    permissions: ['services.view', 'services.manage']
  },
  employees: {
    name: 'Funcionários',
    permissions: ['employees.view', 'employees.manage']
  },
  settings: {
    name: 'Configurações',
    permissions: ['settings.view', 'settings.manage']
  },
  banks: {
    name: 'Bancos',
    permissions: ['banks.view', 'banks.manage']
  },
  paymentMethods: {
    name: 'Formas de Pagamento',
    permissions: ['payment-methods.view', 'payment-methods.manage']
  },
  suppliers: {
    name: 'Fornecedores',
    permissions: ['suppliers.view', 'suppliers.manage']
  }
};