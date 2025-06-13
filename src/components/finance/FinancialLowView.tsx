import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, ArrowUpCircle, ArrowDownCircle, RefreshCw } from 'lucide-react';
import { FinancialService, FinancialTransaction } from '../../services/financialService';
import { CashService } from '../../services/cashService';
import { formatCurrency } from '../../utils/currencyUtils';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../shared/ToastContainer';
import { getCurrentDate } from '../../utils/formatters';

const FinancialLowView: React.FC = () => {
  const { showError } = useToast();
  
  // Today's date only with correct timezone
  const today = getCurrentDate();
  
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayStats, setTodayStats] = useState({
    income: 0,
    expenses: 0,
    balance: 0
  });

  const loadData = async () => {
    try {
      setLoading(true);
      
      const todayTransactions = await FinancialService.getTransactionsByDateRange(today, today);
      setTransactions(todayTransactions);
      
      // Calculate today's stats
      const income = todayTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      const expenses = todayTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      setTodayStats({
        income,
        expenses,
        balance: income - expenses
      });
    } catch (error) {
      console.error('Error loading financial data:', error);
      showError('Erro ao carregar dados financeiros', 'Não foi possível carregar os dados financeiros do dia.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [today]);

  // Prepare chart data - hourly breakdown of today's transactions
  const getHourlyChartData = () => {
    const hourlyData: Record<string, { hour: string, income: number, expenses: number, balance: number }> = {};
    
    // Initialize hours
    for (let i = 0; i < 24; i++) {
      const hourStr = i.toString().padStart(2, '0');
      hourlyData[hourStr] = { 
        hour: `${hourStr}:00`, 
        income: 0, 
        expenses: 0, 
        balance: 0 
      };
    }
    
    // Aggregate transactions by hour
    transactions.forEach(transaction => {
      const date = new Date(transaction.created_at);
      const hour = date.getHours().toString().padStart(2, '0');
      
      if (transaction.type === 'income') {
        hourlyData[hour].income += Math.abs(transaction.amount);
      } else if (transaction.type === 'expense') {
        hourlyData[hour].expenses += Math.abs(transaction.amount);
      }
    });
    
    // Calculate balance for each hour
    Object.values(hourlyData).forEach(hourData => {
      hourData.balance = hourData.income - hourData.expenses;
    });
    
    // Convert to array and filter only hours with transactions
    return Object.values(hourlyData)
      .filter(hour => hour.income > 0 || hour.expenses > 0);
  };

  const chartData = getHourlyChartData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Fluxo de Caixa - Hoje</h1>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={loadData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-green-100">
              <ArrowUpCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Receitas Hoje</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(todayStats.income)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-red-100">
              <ArrowDownCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Despesas Hoje</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(todayStats.expenses)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${todayStats.balance >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
              <TrendingUp className={`w-6 h-6 ${todayStats.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Saldo do Dia</p>
              <p className={`text-2xl font-bold ${todayStats.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                {formatCurrency(todayStats.balance)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Transactions Chart */}
      {chartData.length > 0 ? (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Movimentações por Hora - Hoje</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) => `Hora: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="income" 
                stroke="#10B981" 
                name="Receitas"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="expenses" 
                stroke="#EF4444" 
                name="Despesas"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="balance" 
                stroke="#3B82F6" 
                name="Saldo"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700">Sem movimentações hoje</h3>
          <p className="text-gray-500 mt-2">Não foram registradas transações financeiras no dia de hoje.</p>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Transações de Hoje</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hora</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Forma Pagamento</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(transaction.created_at).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      transaction.type === 'income' ? 'bg-green-100 text-green-800' : 
                      transaction.type === 'expense' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {transaction.type === 'income' ? 'Receita' : 
                       transaction.type === 'expense' ? 'Despesa' : 
                       'Transferência'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                    <div className="truncate" title={transaction.description}>
                      {transaction.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                      {transaction.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.payment_method || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <span className={
                      transaction.type === 'income' ? 'text-green-600' : 
                      transaction.type === 'expense' ? 'text-red-600' : 
                      'text-blue-600'
                    }>
                      {transaction.type === 'income' ? '+' : 
                       transaction.type === 'expense' ? '-' : 
                       '↔'} {formatCurrency(Math.abs(transaction.amount))}
                    </span>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Nenhuma transação encontrada para hoje
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinancialLowView;