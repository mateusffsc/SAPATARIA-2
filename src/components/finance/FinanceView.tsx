import React, { useState } from 'react';
import ReportsView from '../../components/reports/ReportsView';
import BillsView from '../../components/bills/BillsView';
import CashFlowView from './cashflow/CashFlowView';
import FinancialReportsView from './reports/FinancialReportsView';
import StockView from '../stock/StockView';
import BankAccountsView from './BankAccountsView';
import FinancialLowView from './FinancialLowView';
import { BarChart3, CreditCard, TrendingUp, Package, FileText, Building2, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const FinanceView: React.FC = () => {
  const [activeTab, setActiveTab] = useState('reports');
  const { hasPermission } = useAuth();

  // Define tabs with permissions
  const tabs = [
    { id: 'reports', name: 'Relatórios Financeiros', icon: FileText, permission: 'financial.reports' },
    { id: 'cashflow', name: 'Fluxo de Caixa', icon: TrendingUp, permission: 'financial.cashflow' },
    { id: 'daily', name: 'Movimentações do Dia', icon: Calendar, permission: 'financial.daily' },
    { id: 'bills', name: 'Contas a Pagar', icon: CreditCard, permission: 'financial.bills' },
    { id: 'bank-accounts', name: 'Contas Bancárias', icon: Building2, permission: 'financial.view' },
    { id: 'stock', name: 'Estoque', icon: Package, permission: 'products.view' },
    { id: 'analytics', name: 'Análises', icon: BarChart3, permission: 'financial.reports' }
  ];

  // Filter tabs based on permissions
  const filteredTabs = tabs.filter(tab => hasPermission(tab.permission));

  // If the active tab is not in the filtered tabs, set it to the first available tab
  if (filteredTabs.length > 0 && !filteredTabs.some(tab => tab.id === activeTab)) {
    setActiveTab(filteredTabs[0].id);
  }

  const renderContent = () => {
    // Check if user has permission for the active tab
    const activeTabItem = tabs.find(tab => tab.id === activeTab);
    if (activeTabItem && !hasPermission(activeTabItem.permission)) {
      return (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500">Você não tem permissão para acessar esta área.</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'reports':
        return <FinancialReportsView />;
      case 'cashflow':
        return <CashFlowView />;
      case 'daily':
        return <FinancialLowView />;
      case 'bills':
        return <BillsView />;
      case 'bank-accounts':
        return <BankAccountsView />;
      case 'stock':
        return <StockView />;
      case 'analytics':
        return <ReportsView />;
      default:
        return <FinancialReportsView />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {filteredTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {filteredTabs.length > 0 ? (
        renderContent()
      ) : (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500">Você não tem permissão para acessar nenhuma área financeira.</p>
        </div>
      )}
    </div>
  );
};

export default FinanceView;