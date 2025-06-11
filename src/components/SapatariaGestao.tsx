import React, { useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import Header from './layout/Header';
import Sidebar from './layout/Sidebar';
import Dashboard from './dashboard/Dashboard';
import OrdersList from './orders/OrdersList';
import ClientsView from './clients/ClientsView';
import TechniciansView from './technicians/TechniciansView';
import CadastrosView from './cadastros/CadastrosView';
import ServicesView from './services/ServicesView';
import ProductsView from './cadastros/products/ProductsView';
import EmployeesView from './cadastros/employees/EmployeesView';
import BanksView from './banks/BanksView';
import PaymentMethodsView from './cadastros/payments/PaymentMethodsView';
import SuppliersView from './cadastros/suppliers/SuppliersView';
import FinanceView from './finance/FinanceView';
import SettingsView from './settings/SettingsView';
import OrderViewModal from './orders/OrderViewModal';
import ClientViewModal from './clients/ClientViewModal';
import PaymentModal from './payments/PaymentModal';
import WhatsAppModal from './shared/WhatsAppModal';
import LoginScreen from './auth/LoginScreen';
import AIAssistant from './shared/AIAssistant';
import StockView from './stock/StockView';
import CreditView from './credit/CreditView';
import RefundModal from './orders/RefundModal';
import OrderModal from './orders/OrderModal';
import ClientModal from './clients/ClientModal';
import TransactionModal from './finance/cashflow/TransactionModal';
import ProductSalesView from './sales/ProductSalesView';
import ProductSaleViewModal from './sales/ProductSaleViewModal';
import ProductSaleModal from './orders/ProductSaleModal';
import { OrderService } from '../services/orderService';
import { ProductSaleService } from '../services/productSaleService';
import BillsView from './bills/BillsView';
import BillViewModal from './bills/BillViewModal';
import AccessDeniedView from './shared/AccessDeniedView';
import FinancialLowView from './finance/FinancialLowView';

const SapatariaGestao: React.FC = () => {
  const { 
    currentView, 
    showModal, 
    setShowModal,
    modalType,
    formData,
    setFormData,
    loading,
    error,
    setOrders,
    setProductSales,
    bills,
    setBills
  } = useAppContext();

  const { isAuthenticated, hasPermission } = useAuth();

  // Load order data when viewing an order from a financial transaction
  useEffect(() => {
    if (showModal && modalType === 'view-order' && formData && formData.id) {
      const loadOrderData = async () => {
        try {
          // First try to find by number if it's a string
          if (typeof formData.id === 'string' && formData.id.startsWith('OS-')) {
            const order = await OrderService.getByNumber(formData.id);
            if (order) {
              setFormData(order);
              return;
            }
          }
          
          // Otherwise try to find by ID
          const order = await OrderService.getById(formData.id);
          if (order) {
            setFormData(order);
          }
        } catch (error) {
          console.error('Error loading order data:', error);
        }
      };
      
      loadOrderData();
    }
  }, [showModal, modalType, formData?.id]);

  // Load sale data when viewing a sale from a financial transaction
  useEffect(() => {
    if (showModal && modalType === 'view-sale' && formData && formData.id) {
      const loadSaleData = async () => {
        try {
          // First try to find by number if it's a string
          if (typeof formData.id === 'string' && formData.id.startsWith('VD-')) {
            // This would need a getByNumber method in ProductSaleService
            const sales = await ProductSaleService.getAll();
            const sale = sales.find(s => s.saleNumber === formData.id);
            if (sale) {
              setFormData(sale);
              return;
            }
          }
          
          // Otherwise try to find by ID
          const sale = await ProductSaleService.getById(formData.id);
          if (sale) {
            setFormData(sale);
          }
        } catch (error) {
          console.error('Error loading sale data:', error);
        }
      };
      
      loadSaleData();
    }
  }, [showModal, modalType, formData?.id]);

  // Load bill data when viewing a bill from a financial transaction
  useEffect(() => {
    if (showModal && modalType === 'view-bill' && formData && formData.id) {
      // Find bill by ID
      const bill = bills.find(b => b.id === formData.id);
      if (bill) {
        setFormData(bill);
      } else {
        console.log('Bill not found, ID:', formData.id);
      }
    }
  }, [showModal, modalType, formData?.id, bills]);

  // Check permissions for each view
  const canAccessView = (view: string): boolean => {
    switch (view) {
      case 'dashboard':
        return hasPermission('dashboard.view');
      case 'orders':
        return hasPermission('orders.view');
      case 'product-sales':
        return hasPermission('products.view');
      case 'credit':
        return true; // Allow all users to access credit view
      case 'clients':
        return hasPermission('clients.view');
      case 'technicians':
        return hasPermission('technicians.view');
      case 'cadastros':
        return true; // This is just a menu, individual items will be checked
      case 'services':
        return hasPermission('services.view');
      case 'products':
        return hasPermission('products.view');
      case 'employees':
        return hasPermission('employees.view');
      case 'banks':
        return hasPermission('banks.view');
      case 'payment-methods':
        return hasPermission('payment-methods.view');
      case 'suppliers':
        return hasPermission('suppliers.view');
      case 'financial':
        return hasPermission('financial.view') || hasPermission('financial.daily');
      case 'financial-low':
        return hasPermission('financial.daily');
      case 'bills':
        return hasPermission('financial.bills');
      case 'stock':
        return hasPermission('products.view');
      case 'settings':
        return hasPermission('settings.view');
      default:
        return false;
    }
  };

  const renderCurrentView = () => {
    // Check if user has permission to access the current view
    if (!canAccessView(currentView)) {
      return <AccessDeniedView requiredPermission={currentView} />;
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'orders':
        return <OrdersList />;
      case 'product-sales':
        return <ProductSalesView />;
      case 'credit':
        return <CreditView />;
      case 'clients':
        return <ClientsView />;
      case 'technicians':
        return <TechniciansView />;
      case 'cadastros':
        return <CadastrosView />;
      case 'services':
        return <ServicesView />;
      case 'products':
        return <ProductsView />;
      case 'employees':
        return <EmployeesView />;
      case 'banks':
        return <BanksView />;
      case 'payment-methods':
        return <PaymentMethodsView />;
      case 'suppliers':
        return <SuppliersView />;
      case 'financial':
        return <FinanceView />;
      case 'financial-low':
        return <FinancialLowView />;
      case 'bills':
        return <BillsView />;
      case 'stock':
        return <StockView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <Dashboard />;
    }
  };

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dados do Supabase...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro de Conexão com Supabase</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex flex-col lg:flex-row min-h-screen relative">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen lg:min-h-0 transition-all duration-300">
          <Header />
          <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
            {renderCurrentView()}
          </main>
        </div>
      </div>

      {/* Modals */}
      {showModal && modalType === 'order' && hasPermission('orders.edit') && <OrderModal />}
      {showModal && modalType === 'view-order' && <OrderViewModal />}
      {showModal && modalType === 'client' && hasPermission('clients.edit') && <ClientModal />}
      {showModal && modalType === 'view-client' && <ClientViewModal />}
      {showModal && modalType === 'payment' && hasPermission('financial.payments') && <PaymentModal />}
      {showModal && modalType === 'whatsapp' && <WhatsAppModal />}
      {/* Allow all users to create transactions */}
      {showModal && modalType === 'transaction' && <TransactionModal />}
      {showModal && modalType === 'product-sale' && hasPermission('products.manage') && <ProductSaleModal onClose={() => setShowModal(false)} onSave={() => {}} />}
      {showModal && modalType === 'view-sale' && <ProductSaleViewModal />}
      {showModal && modalType === 'view-bill' && <BillViewModal />}

      {/* AI Assistant */}
      {isAuthenticated && <AIAssistant />}
    </div>
  );
};

export default SapatariaGestao;