import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { 
  FileText, Clock, CheckCircle, DollarSign, Users, TrendingUp, 
  Calendar, AlertCircle, Filter, Eye, BarChart3, ShoppingBag
} from 'lucide-react';
import { formatCurrency } from '../../utils/currencyUtils';

interface DashboardFilter {
  period: 'today' | 'week' | 'month' | 'year';
  status: 'all' | 'serviço pronto' | 'em-andamento' | 'finalizada' | 'cancelada' | 'orçamento';
  technician: 'all' | string;
}

const InteractiveDashboard: React.FC = () => {
  const { 
    orders, 
    clients, 
    technicians, 
    setCurrentView, 
    setModalType, 
    setFormData, 
    setShowModal,
    productSales
  } = useAppContext();
  
  const { hasPermission } = useAuth();
  
  const [filters, setFilters] = useState<DashboardFilter>({
    period: 'month',
    status: 'all',
    technician: 'all'
  });
  
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  // Filter orders based on current filters
  const getFilteredOrders = () => {
    let filtered = orders;

    // Period filter
    const now = new Date();
    const startDate = new Date();
    
    switch (filters.period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    filtered = filtered.filter(order => new Date(order.date) >= startDate);

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    // Technician filter
    if (filters.technician !== 'all') {
      filtered = filtered.filter(order => 
        order.services.some(service => service.technicianId === filters.technician)
      );
    }

    return filtered;
  };

  // Filter product sales based on current period
  const getFilteredSales = () => {
    let filtered = productSales;

    // Period filter
    const now = new Date();
    const startDate = new Date();
    
    switch (filters.period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    filtered = filtered.filter(sale => new Date(sale.date) >= startDate);
    return filtered;
  };

  const filteredOrders = getFilteredOrders();
  const filteredSales = getFilteredSales();

  // Calculate metrics
  const metrics = {
    totalOrders: filteredOrders.length,
    openOrders: filteredOrders.filter(o => ['serviço pronto', 'em-andamento'].includes(o.status)).length,
    finishedOrders: filteredOrders.filter(o => o.status === 'finalizada').length,
    totalRevenue: filteredOrders.reduce((sum, o) => sum + o.totalValue, 0) + 
                 filteredSales.reduce((sum, s) => sum + s.totalAmount, 0),
    paidRevenue: filteredOrders.reduce((sum, o) => sum + (o.totalValue - o.remainingValue), 0) + 
                filteredSales.reduce((sum, s) => sum + s.totalAmount, 0),
    pendingRevenue: filteredOrders.reduce((sum, o) => sum + o.remainingValue, 0),
    averageOrderTicket: filteredOrders.length > 0 ? 
       filteredOrders.reduce((sum, o) => sum + o.totalValue, 0) / filteredOrders.length : 0,
    averageSaleTicket: filteredSales.length > 0 ?
      filteredSales.reduce((sum, s) => sum + s.totalAmount, 0) / filteredSales.length : 0,
    uniqueClients: new Set([
      ...filteredOrders.map(o => o.clientId),
      ...filteredSales.map(s => s.clientId)
    ]).size,
    totalSales: filteredSales.length,
    productsSold: filteredSales.reduce((sum, s) => sum + s.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)
  };

  // Handle card click
  const handleCardClick = (cardType: string) => {
    // Check if user has permission to navigate to the selected view
    let canNavigate = true;
    
    switch (cardType) {
      case 'orders':
        canNavigate = hasPermission('orders.view');
        break;
      case 'clients':
        canNavigate = hasPermission('clients.view');
        break;
      case 'revenue':
        canNavigate = hasPermission('financial.view');
        break;
      case 'pending':
        canNavigate = true; // Always allow access to credit view
        break;
      case 'sales':
        canNavigate = hasPermission('products.view');
        break;
      default:
        break;
    }
    
    if (!canNavigate) {
      alert('Você não tem permissão para acessar esta área.');
      return;
    }
    
    setSelectedCard(cardType);
    
    switch (cardType) {
      case 'orders':
        setCurrentView('orders');
        break;
      case 'clients':
        setCurrentView('clients');
        break;
      case 'revenue':
        setCurrentView('financial');
        break;
      case 'pending':
        setCurrentView('credit');
        break;
      case 'sales':
        setCurrentView('product-sales');
        break;
      default:
        break;
    }
  };

  // Dashboard cards configuration
  const dashboardCards = [
    {
      id: 'orders',
      title: 'Total de OS',
      value: metrics.totalOrders,
      icon: FileText,
      color: 'blue',
      description: `${metrics.openOrders} em andamento`,
      clickable: true,
      permission: 'orders.view'
    },
    {
      id: 'sales',
      title: 'Vendas de Produtos',
      value: metrics.totalSales,
      icon: ShoppingBag,
      color: 'teal',
      description: `${metrics.productsSold} produtos vendidos`,
      clickable: true,
      permission: 'products.view'
    },
    {
      id: 'clients',
      title: 'Clientes Ativos',
      value: metrics.uniqueClients,
      icon: Users,
      color: 'green',
      description: `${clients.length} total cadastrados`,
      clickable: true,
      permission: 'clients.view'
    },
    {
      id: 'revenue',
      title: 'Receita Total',
      value: formatCurrency(metrics.totalRevenue),
      icon: DollarSign,
      color: 'purple',
      description: `${formatCurrency(metrics.paidRevenue)} recebido`,
      clickable: true,
      permission: 'financial.view'
    },
    {
      id: 'pending',
      title: 'Valores Pendentes',
      value: formatCurrency(metrics.pendingRevenue),
      icon: AlertCircle,
      color: 'orange',
      description: `${filteredOrders.filter(o => o.remainingValue > 0).length} OS pendentes`,
      clickable: true,
      permission: null // No permission required for credit view
    },
    {
      id: 'ticket',
      title: 'Ticket Médio',
      value: formatCurrency((metrics.averageOrderTicket + metrics.averageSaleTicket) / 2),
      icon: TrendingUp,
      color: 'indigo',
      description: 'Por transação',
      clickable: false
    },
    {
      id: 'finished',
      title: 'OS Finalizadas',
      value: metrics.finishedOrders,
      icon: CheckCircle,
      color: 'emerald',
      description: `${((metrics.finishedOrders / metrics.totalOrders) * 100 || 0).toFixed(1)}% do total`,
      clickable: false
    }
  ];

  // Filter cards based on user permissions
  const filteredCards = dashboardCards.filter(card => 
    !card.permission || hasPermission(card.permission)
  );

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    teal: 'bg-teal-50 text-teal-600 border-teal-200'
  };

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Interativo</h1>
          <p className="text-gray-600">Clique nos cards para navegar</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              value={filters.period}
              onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value as any }))}
            >
              <option value="today">Hoje</option>
              <option value="week">Última semana</option>
              <option value="month">Último mês</option>
              <option value="year">Último ano</option>
            </select>
          </div>

          <select
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
          >
            <option value="all">Todos os status</option>
            <option value="serviço pronto">Serviço Pronto</option>
            <option value="em-andamento">Em andamento</option>
            <option value="finalizada">Finalizada</option>
            <option value="cancelada">Cancelada</option>
            <option value="orçamento">Orçamento</option>
          </select>

          <select
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            value={filters.technician}
            onChange={(e) => setFilters(prev => ({ ...prev, technician: e.target.value }))}
          >
            <option value="all">Todos os técnicos</option>
            {technicians.map(tech => (
              <option key={tech.id} value={tech.id}>{tech.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Interactive cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCards.map((card) => {
          const Icon = card.icon;
          const isClickable = card.clickable;
          const isSelected = selectedCard === card.id;
          
          return (
            <div
              key={card.id}
              onClick={() => isClickable && handleCardClick(card.id)}
              className={`
                relative p-6 bg-white rounded-lg shadow-md border-2 transition-all duration-200
                ${isClickable ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1' : ''}
                ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                ${isClickable ? 'hover:border-gray-300' : 'border-gray-200'}
              `}
            >
              {/* Clickable indicator */}
              {isClickable && (
                <div className="absolute top-3 right-3">
                  <Eye className="w-4 h-4 text-gray-400" />
                </div>
              )}

              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`p-2 rounded-lg ${colorClasses[card.color as keyof typeof colorClasses]}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-600">{card.title}</h3>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                    <p className="text-sm text-gray-500">{card.description}</p>
                  </div>
                </div>
              </div>

              {/* Click hint */}
              {isClickable && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400 flex items-center">
                    <Eye className="w-3 h-3 mr-1" />
                    Clique para ver detalhes
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {hasPermission('orders.create') && (
            <button
              onClick={() => {
                setModalType('order');
                setFormData({});
                setShowModal(true);
              }}
              className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <FileText className="w-6 h-6 text-blue-600 mb-2" />
              <p className="font-medium">Nova OS</p>
              <p className="text-sm text-gray-500">Criar ordem de serviço</p>
            </button>
          )}

          {hasPermission('clients.view') && (
            <button
              onClick={() => setCurrentView('clients')}
              className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <Users className="w-6 h-6 text-green-600 mb-2" />
              <p className="font-medium">Clientes</p>
              <p className="text-sm text-gray-500">Gerenciar clientes</p>
            </button>
          )}

          {hasPermission('financial.reports') && (
            <button
              onClick={() => setCurrentView('financial')}
              className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <BarChart3 className="w-6 h-6 text-purple-600 mb-2" />
              <p className="font-medium">Relatórios</p>
              <p className="text-sm text-gray-500">Ver análises</p>
            </button>
          )}

          {/* Credit view is always accessible */}
          <button
            onClick={() => setCurrentView('credit')}
            className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <AlertCircle className="w-6 h-6 text-orange-600 mb-2" />
            <p className="font-medium">Crediário</p>
            <p className="text-sm text-gray-500">Cobranças pendentes</p>
          </button>

          {/* Allow all users to create transactions */}
          <button
            onClick={() => {
              setModalType('transaction');
              setFormData({});
              setShowModal(true);
            }}
            className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <DollarSign className="w-6 h-6 text-emerald-600 mb-2" />
            <p className="font-medium">Nova Transação</p>
            <p className="text-sm text-gray-500">Registrar receita/despesa</p>
          </button>
        </div>
      </div>

      {/* Recent activity summary */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Resumo do Período</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Status das OS</h4>
            <div className="space-y-2">
              {['serviço pronto', 'em-andamento', 'finalizada'].map(status => {
                const count = filteredOrders.filter(o => o.status === status).length;
                const percentage = metrics.totalOrders > 0 ? (count / metrics.totalOrders * 100).toFixed(1) : '0';
                return (
                  <div key={status} className="flex justify-between text-sm">
                    <span className="capitalize">{status.replace('-', ' ')}</span>
                    <span className="font-medium">{count} ({percentage}%)</span>
                  </div>
                );
              })}
            
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveDashboard;