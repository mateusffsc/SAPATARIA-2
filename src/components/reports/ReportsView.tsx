import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import BillsView from '../bills/BillsView';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
  Calendar, DollarSign, FileText, Clock, TrendingUp, Users, 
  AlertCircle, AlertTriangle, Plus, CreditCard, TrendingDown
} from 'lucide-react';

const ReportsView: React.FC = () => {
  const { orders, technicians, bills } = useAppContext();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [reportPeriod, setReportPeriod] = useState({
    startDate: '2025-05-01',
    endDate: '2025-06-04'
  });

  // Filter orders by date range
  const filteredOrders = orders.filter(order => {
    const orderDate = order.date;
    return orderDate >= reportPeriod.startDate && orderDate <= reportPeriod.endDate;
  });

  // Filter bills by date range (paid bills)
  const paidBillsInPeriod = bills.filter(bill => {
    if (bill.status !== 'paid' || !bill.paidAt) return false;
    const paidDate = new Date(bill.paidAt).toISOString().split('T')[0];
    return paidDate >= reportPeriod.startDate && paidDate <= reportPeriod.endDate;
  });

  // Calculate statistics
  const stats = {
    totalOrders: filteredOrders.length,
    totalRevenue: filteredOrders.reduce((sum, order) => sum + (order.totalValue || 0), 0),
    paidRevenue: filteredOrders.reduce((sum, order) => sum + ((order.totalValue || 0) - (order.remainingValue || 0)), 0),
    pendingRevenue: filteredOrders.reduce((sum, order) => sum + (order.remainingValue || 0), 0),
    totalExpenses: paidBillsInPeriod.reduce((sum, bill) => sum + bill.amount, 0),
    averageOrderValue: filteredOrders.length > 0 
      ? filteredOrders.reduce((sum, order) => sum + (order.totalValue || 0), 0) / filteredOrders.length 
      : 0
  };

  // Financial calculations
  const cashFlow = stats.paidRevenue - stats.totalExpenses;
  const netProfit = stats.totalRevenue - stats.totalExpenses;
  const pendingBills = bills.filter(bill => bill.status === 'pending');
  const totalPendingBills = pendingBills.reduce((sum, bill) => sum + bill.amount, 0);
  const overdueBills = pendingBills.filter(bill => new Date(bill.dueDate) < new Date());

  // Daily financial data for chart
  const dailyFinancialData = (() => {
    const dateMap = new Map();
    
    // Initialize all dates in period
    const start = new Date(reportPeriod.startDate);
    const end = new Date(reportPeriod.endDate);
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      dateMap.set(dateStr, {
        date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        fullDate: dateStr,
        revenue: 0,
        expenses: 0,
        cashFlow: 0,
        orders: 0
      });
    }
    
    // Add revenue data
    filteredOrders.forEach(order => {
      const orderDate = order.date;
      if (dateMap.has(orderDate)) {
        const existing = dateMap.get(orderDate);
        const totalValue = order.totalValue || 0;
        const remainingValue = order.remainingValue || 0;
        existing.revenue += totalValue - remainingValue;
        existing.orders += 1;
      }
    });

    // Add expenses data
    paidBillsInPeriod.forEach(bill => {
      const paidDate = new Date(bill.paidAt).toISOString().split('T')[0];
      if (dateMap.has(paidDate)) {
        const existing = dateMap.get(paidDate);
        existing.expenses += bill.amount;
      }
    });

    // Calculate cash flow
    const dataArray = Array.from(dateMap.values());
    dataArray.forEach(day => {
      day.cashFlow = day.revenue - day.expenses;
    });
    
    return dataArray.sort((a, b) => a.fullDate.localeCompare(b.fullDate));
  })();

  // Expenses by category
  const expensesByCategory = (() => {
    const categoryMap = {};
    paidBillsInPeriod.forEach(bill => {
      categoryMap[bill.category] = (categoryMap[bill.category] || 0) + bill.amount;
    });
    
    return Object.entries(categoryMap).map(([category, amount]) => ({
      name: category,
      value: amount
    }));
  })();

  // Services data for pie chart
  const servicesData = (() => {
    const serviceCount = {};
    filteredOrders.forEach(order => {
      order.services?.forEach(service => {
        serviceCount[service.name] = (serviceCount[service.name] || 0) + 1;
      });
    });
    
    return Object.entries(serviceCount).map(([name, count]) => ({
      name,
      value: count
    }));
  })();

  // Technician performance data
  const techPerformanceData = technicians.map(tech => {
    const techOrders = filteredOrders.filter(order => order.technicianId === tech.id);
    return {
      name: tech.name,
      orders: techOrders.length,
      revenue: techOrders.reduce((sum, order) => sum + (order.totalValue || 0), 0)
    };
  });

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#ff0000'];

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'dashboard'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Dashboard Financeiro
          </button>
          <button
            onClick={() => setActiveTab('bills')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'bills'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Contas a Pagar
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reports'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Relatórios Detalhados
          </button>
        </nav>
      </div>

      {/* Bills Tab */}
      {activeTab === 'bills' && <BillsView />}
      
      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Header with Date Filter */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Financeiro</h1>
            
            <div className="flex space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
                <input
                  type="date"
                  value={reportPeriod.startDate}
                  onChange={(e) => setReportPeriod(prev => ({ ...prev, startDate: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
                <input
                  type="date"
                  value={reportPeriod.endDate}
                  onChange={(e) => setReportPeriod(prev => ({ ...prev, endDate: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Financial Overview Cards - Now with 5 cards including Ticket Médio */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Receitas Recebidas</p>
                  <p className="text-2xl font-bold text-green-600">R$ {stats.paidRevenue.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Ticket Médio</p>
                  <p className="text-2xl font-bold text-purple-600">
                    R$ {stats.averageOrderValue.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <CreditCard className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Despesas Pagas</p>
                  <p className="text-2xl font-bold text-red-600">R$ {stats.totalExpenses.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${cashFlow >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
                  <TrendingUp className={`w-6 h-6 ${cashFlow >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Fluxo de Caixa</p>
                  <p className={`text-2xl font-bold ${cashFlow >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                    R$ {cashFlow.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Contas Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-600">R$ {totalPendingBills.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Alerts */}
          {(overdueBills.length > 0 || stats.pendingRevenue > 0 || cashFlow < 0) && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" />
                Alertas Financeiros
              </h3>
              <div className="space-y-3">
                {overdueBills.length > 0 && (
                  <div className="p-3 bg-red-50 border-l-4 border-red-400">
                    <div className="flex">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <div className="ml-3">
                        <p className="text-sm text-red-700">
                          {overdueBills.length} contas vencidas totalizando R$ {overdueBills.reduce((sum, bill) => sum + bill.amount, 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {stats.pendingRevenue > 0 && (
                  <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400">
                    <div className="flex">
                      <Clock className="w-5 h-5 text-yellow-400" />
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                          R$ {stats.pendingRevenue.toFixed(2)} em receitas pendentes de OS
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {cashFlow < 0 && (
                  <div className="p-3 bg-orange-50 border-l-4 border-orange-400">
                    <div className="flex">
                      <DollarSign className="w-5 h-5 text-orange-400" />
                      <div className="ml-3">
                        <p className="text-sm text-orange-700">
                          Fluxo de caixa negativo no período selecionado
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Financial Flow */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Fluxo Financeiro Diário</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyFinancialData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      `R$ ${value.toFixed(2)}`, 
                      name === 'revenue' ? 'Receitas' : name === 'expenses' ? 'Despesas' : 'Fluxo'
                    ]}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="revenue" />
                  <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="expenses" />
                  <Line type="monotone" dataKey="cashFlow" stroke="#3b82f6" strokeWidth={2} name="cashFlow" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Expenses by Category */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Despesas por Categoria</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expensesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Resumo Financeiro Completo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Receitas</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total de OS:</span>
                    <span className="font-medium">{stats.totalOrders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Receita Total:</span>
                    <span className="font-medium text-gray-900">R$ {stats.totalRevenue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Receita Recebida:</span>
                    <span className="font-medium text-green-600">R$ {stats.paidRevenue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Receita Pendente:</span>
                    <span className="font-medium text-orange-600">R$ {stats.pendingRevenue.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Despesas e Resultado</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Despesas Pagas:</span>
                    <span className="font-medium text-red-600">R$ {stats.totalExpenses.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Contas Pendentes:</span>
                    <span className="font-medium text-yellow-600">R$ {totalPendingBills.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fluxo de Caixa:</span>
                    <span className={`font-medium ${cashFlow >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                      R$ {cashFlow.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="text-gray-900 font-medium">Resultado Líquido:</span>
                    <span className={`font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      R$ {netProfit.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Relatórios Detalhados</h1>
          
          {/* Date Filter */}
          <div className="flex space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
              <input
                type="date"
                value={reportPeriod.startDate}
                onChange={(e) => setReportPeriod(prev => ({ ...prev, startDate: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
              <input
                type="date"
                value={reportPeriod.endDate}
                onChange={(e) => setReportPeriod(prev => ({ ...prev, endDate: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Services Distribution */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Distribuição de Serviços</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={servicesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {servicesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Technician Performance */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Performance dos Técnicos</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={techPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'orders' ? value : `R$ ${value.toFixed(2)}`,
                    name === 'orders' ? 'OS Realizadas' : 'Receita'
                  ]}
                />
                <Bar dataKey="orders" fill="#8884d8" name="orders" />
                <Bar dataKey="revenue" fill="#82ca9d" name="revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsView;